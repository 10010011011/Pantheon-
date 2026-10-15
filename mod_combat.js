// ---------------------------------------------------------------------------
// SECTION: COMBAT -- Primary twin plasma autocannons, high-energy phase laser,
// 3D proportional-navigation seeker missiles, countermeasures, enemy squad AI
// (fighter, gunship, corvette, dreadnought carrier) with banking & V-formation
// choreography, swept relative-motion CCD, Auto-Target Lock, and wave director.
// ---------------------------------------------------------------------------
Game.Combat = (function () {
  const V = Game.Vec3, Q = Game.Quat, FC = Game.FlightController;
  const DEG = Math.PI / 180;

  function segSphereTime(px, py, pz, wx, wy, wz, R, dt) {
    const c = px * px + py * py + pz * pz - R * R;
    if (c <= 0) return 0;
    const a = wx * wx + wy * wy + wz * wz;
    if (a < 1e-12) return -1;
    const b = px * wx + py * wy + pz * wz;
    const disc = b * b - a * c;
    if (disc < 0) return -1;
    const t = (-b - Math.sqrt(disc)) / a;
    return t >= 0 && t <= dt ? t : -1;
  }

  function interceptTime(rel, vrel, s) {
    const a = V.dot(vrel, vrel) - s * s, b = 2 * V.dot(rel, vrel), c = V.dot(rel, rel);
    if (Math.abs(a) < 1e-9) return b < 0 ? -c / b : -1;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return -1;
    const sq = Math.sqrt(disc), t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
    const lo = Math.min(t1, t2), hi = Math.max(t1, t2);
    return lo > 0 ? lo : hi > 0 ? hi : -1;
  }

  const CORVETTE_PROFILE = {
    accelFwd: 420, accelRev: 260, accelLat: 260, accelVert: 260, softMaxSpeed: 230,
    maxPitchRate: Game.Constants.SHIP_MAX_PITCH_RATE_RAD * 0.38,
    maxYawRate: Game.Constants.SHIP_MAX_YAW_RATE_RAD * 0.38,
    maxRollRate: Game.Constants.SHIP_MAX_ROLL_RATE_RAD * 0.32, angularTau: 0.34,
  };
  const CARRIER_PROFILE = {
    accelFwd: 160, accelRev: 100, accelLat: 90, accelVert: 90, softMaxSpeed: 110,
    maxPitchRate: Game.Constants.SHIP_MAX_PITCH_RATE_RAD * 0.18,
    maxYawRate: Game.Constants.SHIP_MAX_YAW_RATE_RAD * 0.18,
    maxRollRate: Game.Constants.SHIP_MAX_ROLL_RATE_RAD * 0.15, angularTau: 0.55,
  };

  const KINDS = {
    player: { radius: 6, hull: 120, shield: 150, team: 0 },
    fighter: { radius: 7.5, hull: 45, shield: 35, team: 1, profile: FC.FIGHTER_PROFILE, boltSpeed: 900, boltDmg: 8, interval: 0.45, spread: 2.2, range: 950, cone: 5.5, hold: 330, score: 100 },
    gunship: { radius: 11, hull: 160, shield: 120, team: 1, profile: FC.GUNSHIP_PROFILE, boltSpeed: 800, boltDmg: 14, interval: 0.9, spread: 1.6, range: 1200, cone: 4.5, hold: 560, score: 300 },
    corvette: { radius: 15, hull: 240, shield: 180, team: 1, profile: CORVETTE_PROFILE, boltSpeed: 860, boltDmg: 18, interval: 0.75, spread: 1.4, range: 1350, cone: 5.0, hold: 640, score: 500 },
    carrier: { radius: 36, hull: 680, shield: 520, team: 1, profile: CARRIER_PROFILE, boltSpeed: 820, boltDmg: 22, interval: 0.55, spread: 2.0, range: 1500, cone: 8.0, hold: 780, score: 1500 },
  };
  const WAVES = [
    { fighter: 3 }, { fighter: 4 }, { fighter: 3, gunship: 1 }, { fighter: 5, gunship: 1 }, { fighter: 4, gunship: 2 },
  ];
  const PLAYER_GUN = { boltSpeed: 1400, boltDmg: 14, interval: 1 / 7, life: 1.1, heatPer: 0.055, cool: 0.30, lockCool: 0.45, assistCone: 6 * DEG, assist: 0.65 };
  const PLAYER_LASER = { range: 1450, dmg: 44, cooldown: 2.2, cone: 18 * DEG };
  const PLAYER_MISSILE = { speed: 460, turnRate: 2.8, dmg: 72, life: 4.2, cooldown: 1.2, maxAmmo: 8 };

  function create(hooks, opts) {
    hooks = hooks || {};
    opts = opts || {};
    const rng = Game.Rng.createRng(opts.seed || 20260825);
    const MAXB = 240;
    const B = {
      x: new Float32Array(MAXB), y: new Float32Array(MAXB), z: new Float32Array(MAXB),
      vx: new Float32Array(MAXB), vy: new Float32Array(MAXB), vz: new Float32Array(MAXB),
      life: new Float32Array(MAXB), team: new Uint8Array(MAXB), dmg: new Float32Array(MAXB),
      active: new Uint8Array(MAXB), cursor: 0, MAX: MAXB
    };

    function fireBolt(origin, vel, team, dmg, life) {
      for (let k = 0; k < MAXB; k++) {
        const i = (B.cursor + k) % MAXB;
        if (!B.active[i]) {
          B.cursor = (i + 1) % MAXB;
          B.x[i] = origin.x; B.y[i] = origin.y; B.z[i] = origin.z;
          B.vx[i] = vel.x; B.vy[i] = vel.y; B.vz[i] = vel.z;
          B.life[i] = life; B.team[i] = team; B.dmg[i] = dmg; B.active[i] = 1;
          return i;
        }
      }
      return -1;
    }

    const MAXM = 24;
    const M = [];
    for (let i = 0; i < MAXM; i++) {
      M.push({ active: false, pos: V.v3(), vel: V.v3(), dir: V.v3(0, 0, 1), team: 0, target: null, life: 0, dmg: 72 });
    }

    let activeWaves = WAVES.slice();

    const S = {
      bodies: [], enemies: [], player: null, bolts: B, missiles: M, time: 0,
      mode: 'idle', wave: 0, maxWaves: activeWaves.length, timer: 0, score: 0, credits: 600, kills: 0,
      heat: 0, overheated: false, muzzle: 0, nextShot: 0, fireHeld: false, assist: true, target: null,
      laserReadyAt: 0, missileReadyAt: 0, missileAmmo: PLAYER_MISSILE.maxAmmo, flares: 6, flareActiveUntil: 0,
      shieldSectors: { fore: 100, aft: 100, port: 100, starboard: 100 },
      upgrades: {
        ndFilter: true,
        spectralFilter: false,
        coronagraphFilter: false,
        gimbalMk2: false,
        cryoCooler: false,
        heavyArmor: false
      },
      settings: {
        assist: opts.assist !== false,
        autoFire: !!opts.autoFire,
        autoLock: !!opts.autoLock
      },
    };
    const _fwd = V.v3(), _right = V.v3(), _up = V.v3(), _a = V.v3(), _rel = V.v3(), _vrel = V.v3(), _aLoc = V.v3(), _o = V.v3(), _v = V.v3();
    const _qc = { x: 0, y: 0, z: 0, w: 1 };

    function axes(e) {
      Q.qRotateVector(_fwd, e.orientation, { x: 0, y: 0, z: 1 });
      Q.qRotateVector(_right, e.orientation, { x: 1, y: 0, z: 0 });
      Q.qRotateVector(_up, e.orientation, { x: 0, y: 1, z: 0 });
    }

    function makeEntity(kind, pos, vel, q) {
      const K = KINDS[kind] || KINDS.fighter;
      const e = Game.PhysicsWorld.createBody(kind + '_' + (S.bodies.length + Math.floor(S.time * 1000)), pos, vel, q);
      e.kind = kind; e.team = K.team; e.radius = K.radius; e.hullMax = K.hull; e.hull = K.hull; e.shieldMax = K.shield; e.shield = K.shield;
      e.alive = true; e.lastHitT = -99; e.controlState = FC.createShipControlState(); e.profile = K.profile || FC.PLAYER_PROFILE;
      e.thrust = 0;
      if (K.team === 1) {
        e.ai = {
          state: 'engage', until: 0, phase: rng.next() * 6.28,
          nextFire: S.time + 0.8 + rng.next(), breakDir: V.v3(),
          nextBreak: S.time + 5 + rng.next() * 4, burst: 0, K,
          nextSpawn: S.time + 14
        };
      }
      return e;
    }

    function setPlayer(e) { S.player = e; S.bodies.length = 0; S.bodies.push(e); S.enemies.length = 0; }

    function applyDamage(e, dmg, t, hitPos) {
      if (!e.alive) return;
      e.lastHitT = t;
      let shieldHit = false;
      if (e.shield >= dmg) { e.shield -= dmg; shieldHit = true; }
      else { const rem = dmg - e.shield; e.shield = 0; e.hull -= rem; }
      if (e === S.player) {
        const pct = Math.max(0, Math.round((e.shield / Math.max(1, e.shieldMax)) * 100));
        S.shieldSectors.fore = pct;
        S.shieldSectors.aft = Math.min(100, pct + 4);
        S.shieldSectors.port = pct;
        S.shieldSectors.starboard = pct;
      }
      if (hooks.onHit) hooks.onHit(e, hitPos, shieldHit, dmg);
      if (e.hull <= 0) { e.alive = false; if (hooks.onKill) hooks.onKill(e); }
    }

    function bestTarget(maxAngle) {
      const p = S.player; if (!p) return null;
      axes(p);
      let best = null, bestAng = maxAngle;
      for (const e of S.enemies) {
        if (!e.alive) continue;
        V.sub(_rel, e.positionMeters, p.positionMeters);
        const d = V.length(_rel); if (d < 1) continue;
        const ang = Math.acos(Math.max(-1, Math.min(1, V.dot(_rel, _fwd) / d)));
        if (ang < bestAng) { bestAng = ang; best = e; }
      }
      return best ? { enemy: best, angle: bestAng } : null;
    }

    function leadDir(out, shooter, target, speed) {
      V.sub(_rel, target.positionMeters, shooter.positionMeters);
      V.sub(_vrel, target.velocityMps, shooter.velocityMps);
      const t = interceptTime(_rel, vrelOrZero(_vrel), speed);
      const tt = t > 0 ? Math.min(t, 3) : V.length(_rel) / speed;
      out.x = _rel.x + _vrel.x * tt; out.y = _rel.y + _vrel.y * tt; out.z = _rel.z + _vrel.z * tt;
      V.normalize(out, out);
      return out;
    }
    function vrelOrZero(v) { return v; }

    function playerFire() {
      const p = S.player, G = PLAYER_GUN;
      axes(p);
      const side = (S.muzzle++ & 1) ? 1 : -1;
      _o.x = p.positionMeters.x + _fwd.x * 8 + _right.x * 3.4 * side - _up.x * 0.3;
      _o.y = p.positionMeters.y + _fwd.y * 8 + _right.y * 3.4 * side - _up.y * 0.3;
      _o.z = p.positionMeters.z + _fwd.z * 8 + _right.z * 3.4 * side - _up.z * 0.3;
      _a.x = _fwd.x; _a.y = _fwd.y; _a.z = _fwd.z;
      if (S.settings.assist || S.settings.autoLock) {
        const cone = S.settings.autoLock ? ((S.upgrades.gimbalMk2 ? 28 : 19) * DEG) : G.assistCone;
        const blend = S.settings.autoLock ? 0.92 : G.assist;
        const tg = bestTarget(cone);
        if (tg) {
          const ld = V.v3(); leadDir(ld, p, tg.enemy, G.boltSpeed);
          _a.x = _fwd.x + (ld.x - _fwd.x) * blend;
          _a.y = _fwd.y + (ld.y - _fwd.y) * blend;
          _a.z = _fwd.z + (ld.z - _fwd.z) * blend;
          V.normalize(_a, _a);
        }
      }
      _v.x = p.velocityMps.x + _a.x * G.boltSpeed;
      _v.y = p.velocityMps.y + _a.y * G.boltSpeed;
      _v.z = p.velocityMps.z + _a.z * G.boltSpeed;
      fireBolt(_o, _v, 0, G.boltDmg, G.life);
      const heatMul = S.upgrades.cryoCooler ? 0.65 : 1.0;
      S.heat += G.heatPer * heatMul;
      if (S.heat >= 1) { S.heat = 1; S.overheated = true; if (hooks.onOverheat) hooks.onOverheat(); }
      if (hooks.onFire) hooks.onFire(p, true, _o);
    }

    function fireLaser() {
      const p = S.player;
      if (!p || !p.alive || S.time < S.laserReadyAt) return false;
      S.laserReadyAt = S.time + PLAYER_LASER.cooldown;
      axes(p);
      const start = V.v3(p.positionMeters.x + _fwd.x * 9, p.positionMeters.y + _fwd.y * 9, p.positionMeters.z + _fwd.z * 9);
      const tg = bestTarget(S.settings.autoLock ? 26 * DEG : PLAYER_LASER.cone);
      let end = V.v3(start.x + _fwd.x * PLAYER_LASER.range, start.y + _fwd.y * PLAYER_LASER.range, start.z + _fwd.z * PLAYER_LASER.range);
      let hitE = null;
      if (tg && V.length(V.sub(V.v3(), tg.enemy.positionMeters, p.positionMeters)) <= PLAYER_LASER.range) {
        hitE = tg.enemy;
        end = V.v3(hitE.positionMeters.x, hitE.positionMeters.y, hitE.positionMeters.z);
        applyDamage(hitE, PLAYER_LASER.dmg, S.time, end);
      }
      S.heat = Math.min(1, S.heat + (S.upgrades.cryoCooler ? 0.11 : 0.18));
      if (hooks.onLaser) hooks.onLaser(start, end, hitE);
      return true;
    }

    function fireMissile() {
      const p = S.player;
      if (!p || !p.alive || S.missileAmmo <= 0 || S.time < S.missileReadyAt) return false;
      let tgt = S.target && S.target.alive ? S.target : null;
      if (!tgt) {
        const bt = bestTarget(35 * DEG) || bestTarget(Math.PI);
        if (bt) tgt = bt.enemy;
      }
      for (let i = 0; i < MAXM; i++) {
        const m = M[i];
        if (!m.active) {
          axes(p);
          m.active = true;
          m.team = 0;
          m.target = tgt;
          m.life = PLAYER_MISSILE.life;
          m.dmg = PLAYER_MISSILE.dmg;
          V.set(m.pos, p.positionMeters.x + _fwd.x * 7 - _up.x * 1.2, p.positionMeters.y + _fwd.y * 7 - _up.y * 1.2, p.positionMeters.z + _fwd.z * 7 - _up.z * 1.2);
          V.copy(m.dir, _fwd);
          V.set(m.vel, p.velocityMps.x + _fwd.x * PLAYER_MISSILE.speed, p.velocityMps.y + _fwd.y * PLAYER_MISSILE.speed, p.velocityMps.z + _fwd.z * PLAYER_MISSILE.speed);
          S.missileAmmo--;
          S.missileReadyAt = S.time + PLAYER_MISSILE.cooldown;
          if (hooks.onMissile) hooks.onMissile(m);
          return true;
        }
      }
      return false;
    }

    function deployFlare() {
      const p = S.player;
      if (!p || !p.alive || S.flares <= 0) return false;
      S.flares--;
      S.flareActiveUntil = S.time + 3.2;
      if (hooks.onFlare) hooks.onFlare(p.positionMeters, p.velocityMps);
      return true;
    }

    const _intent = { thrust: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0, roll: 0 };
    function steer(e, dir, gain) {
      Q.qConjugate(_qc, e.orientation); Q.qRotateVector(_aLoc, _qc, dir);
      const yawErr = Math.atan2(_aLoc.x, _aLoc.z), pitchErr = Math.atan2(_aLoc.y, Math.hypot(_aLoc.x, _aLoc.z));
      _intent.yaw = Math.max(-1, Math.min(1, yawErr * gain));
      _intent.pitch = Math.max(-1, Math.min(1, pitchErr * gain));
      // Dynamic fighter banking roll into turns for realistic dogfight choreography
      _intent.roll = Math.max(-1, Math.min(1, -_intent.yaw * 0.72));
      return Math.abs(yawErr) + Math.abs(pitchErr);
    }

    function enemyThink(e, dt) {
      const p = S.player, ai = e.ai, K = ai.K, t = S.time;
      _intent.thrust = 0; _intent.strafe = 0; _intent.vertical = 0; _intent.yaw = 0; _intent.pitch = 0; _intent.roll = 0;
      V.sub(_rel, p.positionMeters, e.positionMeters);
      const dist = V.length(_rel);
      axes(e);
      const dir = V.v3(); leadDir(dir, e, p, K.boltSpeed);
      const cosA = V.dot(_fwd, dir);
      const ang = Math.acos(Math.max(-1, Math.min(1, cosA)));

      if (e.kind === 'carrier' && t >= ai.nextSpawn && S.enemies.length < 6) {
        ai.nextSpawn = t + 16;
        spawnEnemy('fighter');
      }

      if (ai.state === 'engage') {
        steer(e, dir, 3.2);
        const fSpd = V.dot(e.velocityMps, _fwd);
        const desSpd = dist > K.hold * 1.6 ? 420 : dist > K.hold * 0.85 ? 165 : -90;
        _intent.thrust = Math.max(-1, Math.min(1, (desSpd - fSpd) * 0.015));
        if (Math.abs(_intent.thrust) < 0.05) _intent.thrust = 0;
        const wv = Math.sin(t * 0.9 + ai.phase) > 0.3 ? (K === KINDS.fighter ? 0.18 : 0.08) * Math.sin(t * 1.5 + ai.phase) : 0;
        _intent.strafe = wv;
        _intent.vertical = 0;
        const underFire = t - e.lastHitT < 0.25;
        if (e.kind !== 'carrier' && (t > ai.nextBreak || (underFire && rng.next() < 0.02) || dist < 70)) {
          ai.state = 'break'; ai.until = t + 1.1 + rng.next() * 0.9; ai.nextBreak = t + 5 + rng.next() * 5;
          const th = rng.next() * 6.283, u = rng.next() * 2 - 1, s = Math.sqrt(1 - u * u);
          ai.breakDir.x = s * Math.cos(th); ai.breakDir.y = u * 0.6; ai.breakDir.z = s * Math.sin(th);
          ai.breakDir.x -= _rel.x / dist * 0.8; ai.breakDir.y -= _rel.y / dist * 0.8; ai.breakDir.z -= _rel.z / dist * 0.8;
          V.normalize(ai.breakDir, ai.breakDir);
        }
        if (ang < K.cone * DEG && dist < K.range && t >= ai.nextFire && t > S.flareActiveUntil) {
          ai.nextFire = t + K.interval * (0.85 + 0.3 * rng.next());
          enemyFire(e, K);
        }
      } else {
        steer(e, ai.breakDir, 3.0);
        _intent.thrust = 1;
        _intent.strafe = Math.sin(t * 3 + ai.phase) * 0.5;
        _intent.roll = Math.sin(t * 4.2 + ai.phase) * 0.85;
        if (t > ai.until) ai.state = 'engage';
      }
      FC.update(e, _intent, dt);
      e.thrust = _intent.thrust;
    }

    function enemyFire(e, K) {
      axes(e);
      const sp = K.spread * DEG;
      const ax = (rng.next() * 2 - 1) * sp, ay = (rng.next() * 2 - 1) * sp;
      _a.x = _fwd.x + _right.x * ax + _up.x * ay;
      _a.y = _fwd.y + _right.y * ax + _up.y * ay;
      _a.z = _fwd.z + _right.z * ax + _up.z * ay;
      V.normalize(_a, _a);
      const side = (e.kind === 'gunship' || e.kind === 'corvette' || e.kind === 'carrier') ? ((e.ai.burst++ & 1) ? 1 : -1) : 0;
      _o.x = e.positionMeters.x + _fwd.x * (e.radius + 3) + _right.x * 5 * side;
      _o.y = e.positionMeters.y + _fwd.y * (e.radius + 3) + _right.y * 5 * side;
      _o.z = e.positionMeters.z + _fwd.z * (e.radius + 3) + _right.z * 5 * side;
      _v.x = e.velocityMps.x + _a.x * K.boltSpeed;
      _v.y = e.velocityMps.y + _a.y * K.boltSpeed;
      _v.z = e.velocityMps.z + _a.z * K.boltSpeed;
      fireBolt(_o, _v, 1, K.boltDmg, 1.7);
      if (hooks.onFire) hooks.onFire(e, false, _o);
    }

    function spawnEnemy(kind, formationSlot) {
      const p = S.player; axes(p);
      let pos;
      if (formationSlot !== undefined) {
        // Cohesive V-echelon squadron formation ahead of the player
        const wingSide = (formationSlot % 2 === 0) ? 1 : -1;
        const rank = Math.ceil(formationSlot * 0.5);
        const fwdDist = (kind === 'carrier' ? 1180 : 920) + rank * 55;
        const latSpread = wingSide * rank * 68;
        const vertSpread = ((formationSlot % 3) - 1) * 28;
        pos = V.v3(
          p.positionMeters.x + _fwd.x * fwdDist + _right.x * latSpread + _up.x * vertSpread,
          p.positionMeters.y + _fwd.y * fwdDist + _right.y * latSpread + _up.y * vertSpread,
          p.positionMeters.z + _fwd.z * fwdDist + _right.z * latSpread + _up.z * vertSpread
        );
      } else {
        const th = rng.next() * 6.283, u = (rng.next() * 2 - 1), s = Math.sqrt(1 - u * u);
        let dx = s * Math.cos(th), dy = u * 0.7, dz = s * Math.sin(th);
        const bias = 0.6;
        const wx = dx + _fwd.x * bias * 1.4, wy = dy + _fwd.y * bias * 1.4, wz = dz + _fwd.z * bias * 1.4;
        const dist = kind === 'carrier' ? 1150 : (850 + rng.next() * 400);
        const d = V.v3(wx, wy, wz); V.normalize(d, d);
        pos = V.v3(p.positionMeters.x + d.x * dist, p.positionMeters.y + d.y * dist, p.positionMeters.z + d.z * dist);
      }
      const vel = V.v3(p.velocityMps.x, p.velocityMps.y, p.velocityMps.z);
      const f = V.v3(p.positionMeters.x - pos.x, p.positionMeters.y - pos.y, p.positionMeters.z - pos.z); V.normalize(f, f);
      const up0 = Math.abs(f.y) > 0.95 ? V.v3(1, 0, 0) : V.v3(0, 1, 0);
      const right = V.v3(); V.cross(right, up0, f); V.normalize(right, right);
      const up = V.v3(); V.cross(up, f, right);
      const q = { x: 0, y: 0, z: 0, w: 1 }; Q.qFromBasis(q, right, up, f);
      const e = makeEntity(kind, pos, vel, q);
      S.bodies.push(e); S.enemies.push(e);
      if (hooks.onSpawn) hooks.onSpawn(e);
      return e;
    }

    function setSectorWaves(waveList) {
      if (Array.isArray(waveList) && waveList.length > 0) {
        activeWaves = waveList.slice();
        S.maxWaves = activeWaves.length;
      }
    }

    function startWave(n) {
      S.wave = n; S.mode = 'fight';
      const spec = activeWaves[(n - 1) % activeWaves.length] || WAVES[0];
      let slot = 0;
      for (const kind in spec) {
        for (let i = 0; i < spec[kind]; i++) {
          spawnEnemy(kind, slot++);
        }
      }
      if (hooks.onWave) hooks.onWave(n, S.maxWaves);
      if (hooks.onState) hooks.onState(S.mode);
    }

    function reset(player, customWaves) {
      if (customWaves) setSectorWaves(customWaves);
      for (const e of S.enemies) if (hooks.onRemove) hooks.onRemove(e);
      S.enemies.length = 0; B.active.fill(0);
      for (const m of M) m.active = false;
      setPlayer(player);
      player.hull = player.hullMax; player.shield = player.shieldMax; player.alive = true;
      S.shieldSectors.fore = 100; S.shieldSectors.aft = 100; S.shieldSectors.port = 100; S.shieldSectors.starboard = 100;
      S.missileAmmo = PLAYER_MISSILE.maxAmmo; S.flares = 6;
      S.wave = 0; S.heat = 0; S.overheated = false; S.mode = 'intro'; S.timer = 2.2;
      if (hooks.onState) hooks.onState(S.mode);
    }

    function preStep(dt) {
      S.time += dt;
      const p = S.player; if (!p) return;
      if (p.alive && S.time - p.lastHitT > 3.5 && p.shield < p.shieldMax) {
        p.shield = Math.min(p.shieldMax, p.shield + 22 * dt);
        const pct = Math.round((p.shield / Math.max(1, p.shieldMax)) * 100);
        S.shieldSectors.fore = pct; S.shieldSectors.aft = pct; S.shieldSectors.port = pct; S.shieldSectors.starboard = pct;
      }
      for (const e of S.enemies) if (e.alive && S.time - e.lastHitT > 6 && e.shield < e.shieldMax) e.shield = Math.min(e.shieldMax, e.shield + 6 * dt);

      const bt = bestTarget(Math.PI);
      S.target = bt ? bt.enemy : null;

      S.heat = Math.max(0, S.heat - PLAYER_GUN.cool * dt);
      if (S.overheated && S.heat < PLAYER_GUN.lockCool) S.overheated = false;

      let wantFire = S.fireHeld;
      const autoCone = S.settings.autoLock ? ((S.upgrades.gimbalMk2 ? 24 : 16) * DEG) : (7.5 * DEG);
      if (!wantFire && S.settings.autoFire && bt && bt.angle < autoCone) {
        const dist = V.length(V.sub(_rel, bt.enemy.positionMeters, p.positionMeters));
        if (dist < 1100) wantFire = true;
      }
      if (p.alive && wantFire && !S.overheated && S.time >= S.nextShot && (S.mode === 'fight' || S.mode === 'intro' || S.mode === 'between')) {
        S.nextShot = S.time + PLAYER_GUN.interval;
        playerFire();
      }

      if (S.mode === 'fight' || S.mode === 'between') {
        for (const e of S.enemies) if (e.alive) enemyThink(e, dt);
      }

      for (let i = 0; i < MAXM; i++) {
        const m = M[i];
        if (!m.active) continue;
        m.life -= dt;
        if (m.life <= 0) { m.active = false; continue; }
        if (m.target && m.target.alive) {
          const toT = V.v3();
          V.sub(toT, m.target.positionMeters, m.pos);
          const d = V.length(toT);
          if (d < m.target.radius + 10) {
            m.active = false;
            applyDamage(m.target, m.dmg, S.time, m.pos);
            continue;
          }
          V.normalize(toT, toT);
          const rate = PLAYER_MISSILE.turnRate * dt;
          m.dir.x += (toT.x - m.dir.x) * Math.min(1, rate * 3.5);
          m.dir.y += (toT.y - m.dir.y) * Math.min(1, rate * 3.5);
          m.dir.z += (toT.z - m.dir.z) * Math.min(1, rate * 3.5);
          V.normalize(m.dir, m.dir);
          V.set(m.vel, m.dir.x * PLAYER_MISSILE.speed, m.dir.y * PLAYER_MISSILE.speed, m.dir.z * PLAYER_MISSILE.speed);
        }
        m.pos.x += m.vel.x * dt; m.pos.y += m.vel.y * dt; m.pos.z += m.vel.z * dt;
      }

      for (let i = 0; i < MAXB; i++) {
        if (!B.active[i]) continue;
        let hitT = -1, hitE = null;
        for (let k = 0; k < S.bodies.length; k++) {
          const e = S.bodies[k];
          if (!e.alive || e.team === B.team[i]) continue;
          const t = segSphereTime(
            B.x[i] - e.positionMeters.x, B.y[i] - e.positionMeters.y, B.z[i] - e.positionMeters.z,
            B.vx[i] - e.velocityMps.x, B.vy[i] - e.velocityMps.y, B.vz[i] - e.velocityMps.z,
            e.radius + 1.2, dt
          );
          if (t >= 0 && (hitT < 0 || t < hitT)) { hitT = t; hitE = e; }
        }
        if (hitE) {
          const hp = V.v3(B.x[i] + B.vx[i] * hitT, B.y[i] + B.vy[i] * hitT, B.z[i] + B.vz[i] * hitT);
          B.active[i] = 0;
          applyDamage(hitE, B.dmg[i], S.time, hp);
        } else {
          B.x[i] += B.vx[i] * dt; B.y[i] += B.vy[i] * dt; B.z[i] += B.vz[i] * dt;
          B.life[i] -= dt; if (B.life[i] <= 0) B.active[i] = 0;
        }
      }
    }

    function postStep(dt) {
      const p = S.player; if (!p) return;
      const bs = S.bodies;
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i], b = bs[j]; if (!a.alive || !b.alive) continue;
        const dx = b.positionMeters.x - a.positionMeters.x, dy = b.positionMeters.y - a.positionMeters.y, dz = b.positionMeters.z - a.positionMeters.z;
        const R = a.radius + b.radius, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= R * R || d2 < 1e-9) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, nz = dz / d, pen = R - d;
        a.positionMeters.x -= nx * pen * 0.5; a.positionMeters.y -= ny * pen * 0.5; a.positionMeters.z -= nz * pen * 0.5;
        b.positionMeters.x += nx * pen * 0.5; b.positionMeters.y += ny * pen * 0.5; b.positionMeters.z += nz * pen * 0.5;
        const vn = (b.velocityMps.x - a.velocityMps.x) * nx + (b.velocityMps.y - a.velocityMps.y) * ny + (b.velocityMps.z - a.velocityMps.z) * nz;
        if (vn < 0) {
          const j2 = -(1.3) * vn * 0.5;
          a.velocityMps.x -= nx * j2; a.velocityMps.y -= ny * j2; a.velocityMps.z -= nz * j2;
          b.velocityMps.x += nx * j2; b.velocityMps.y += ny * j2; b.velocityMps.z += nz * j2;
          const dmg = Math.min(45, -vn * 0.08);
          if (dmg > 1) {
            const mp = V.v3((a.positionMeters.x + b.positionMeters.x) / 2, (a.positionMeters.y + b.positionMeters.y) / 2, (a.positionMeters.z + b.positionMeters.z) / 2);
            applyDamage(a, dmg, S.time, mp); applyDamage(b, dmg, S.time, mp);
          }
        }
      }
      for (let k = S.enemies.length - 1; k >= 0; k--) {
        const e = S.enemies[k];
        if (!e.alive) {
          S.enemies.splice(k, 1); const bi = S.bodies.indexOf(e); if (bi >= 0) S.bodies.splice(bi, 1);
          const reward = KINDS[e.kind] ? KINDS[e.kind].score : 100;
          S.score += reward; S.credits += reward; S.kills++;
          if (hooks.onRemove) hooks.onRemove(e);
        }
      }
      if (!p.alive && S.mode !== 'gameover') { S.mode = 'gameover'; if (hooks.onState) hooks.onState(S.mode); return; }
      if (S.mode === 'intro') { S.timer -= dt; if (S.timer <= 0) startWave(1); }
      else if (S.mode === 'fight' && S.enemies.length === 0) {
        const bonus = 250 * S.wave;
        S.score += bonus; S.credits += bonus;
        if (S.wave >= S.maxWaves) { S.mode = 'victory'; if (hooks.onState) hooks.onState(S.mode); }
        else {
          S.mode = 'between'; S.timer = 4;
          p.shield = Math.min(p.shieldMax, p.shield + p.shieldMax * 0.5);
          S.missileAmmo = Math.min(PLAYER_MISSILE.maxAmmo, S.missileAmmo + 2);
          if (hooks.onState) hooks.onState(S.mode);
        }
      } else if (S.mode === 'between') { S.timer -= dt; if (S.timer <= 0) startWave(S.wave + 1); }
    }

    function shift(off) {
      for (let i = 0; i < MAXB; i++) if (B.active[i]) { B.x[i] -= off.x; B.y[i] -= off.y; B.z[i] -= off.z; }
      for (let i = 0; i < MAXM; i++) if (M[i].active) { M[i].pos.x -= off.x; M[i].pos.y -= off.y; M[i].pos.z -= off.z; }
    }

    return {
      S, B, M, preStep, postStep, reset, setPlayer, makeEntity, spawnEnemy,
      applyDamage, bestTarget, leadDir, shift, startWave, setSectorWaves,
      fireLaser, fireMissile, deployFlare
    };
  }
  return { create, segSphereTime, interceptTime, KINDS, WAVES, PLAYER_GUN, PLAYER_LASER, PLAYER_MISSILE };
})();
