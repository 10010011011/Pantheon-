const V = Game.Vec3, Q = Game.Quat, K = Game.Constants, FC = Game.FlightController, CB = Game.Combat;
let pass = 0, fail = 0;
function ok(l, c, d) { if (c) pass++; else { fail++; console.log('FAIL:', l, d || ''); } }
const near = (a, b, t) => Math.abs(a - b) <= t;

// ---- swept sphere ----
ok('head-on bolt hits at the right time', near(CB.segSphereTime(0, 0, -100, 0, 0, 1400, 8, 0.1), (100 - 8) / 1400, 1e-9));
ok('a 1400 m/s bolt cannot tunnel a 16 m target in one 1/120 s step', CB.segSphereTime(0, 0, -5, 0, 0, 1400, 8, 1 / 120) >= 0);
ok('clean miss returns -1', CB.segSphereTime(30, 0, -100, 0, 0, 1400, 8, 0.2) === -1);
ok('already overlapping returns t=0', CB.segSphereTime(1, 0, 0, 0, 0, 10, 8, 0.01) === 0);
ok('hit too far for this step returns -1', CB.segSphereTime(0, 0, -500, 0, 0, 1400, 8, 1 / 120) === -1);
ok('moving target: relative motion used', CB.segSphereTime(0, 0, -100, 0, 0, 500, 8, 0.15) < 0 && CB.segSphereTime(0, 0, -100, 0, 0, 700, 8, 0.15) >= 0);

// ---- intercept: simulate the shot and confirm it arrives ----
{
  const rel = V.v3(400, 100, 700), vrel = V.v3(-60, 30, 120), s = 1400;
  const t = CB.interceptTime(rel, vrel, s);
  const hit = V.v3(rel.x + vrel.x * t, rel.y + vrel.y * t, rel.z + vrel.z * t);
  ok('interceptTime: projectile and target coincide at t', near(V.length(hit), s * t, 1e-6), `${V.length(hit)} vs ${s * t}`);
  ok('interceptTime: no solution when target outruns the bolt', CB.interceptTime(V.v3(0, 0, 100), V.v3(0, 0, 2000), 1400) === -1);
}

// ---- damage flow + kill hook ----
{
  const killed = [], hits = [];
  const c = CB.create({ onKill: e => killed.push(e.kind), onHit: (e, p, sh, d) => hits.push(sh) });
  const p = Game.PhysicsWorld.createBody('p', V.v3(), V.v3(), { x: 0, y: 0, z: 0, w: 1 });
  Object.assign(p, { kind: 'player', team: 0, radius: 6, hull: 120, hullMax: 120, shield: 150, shieldMax: 150, alive: true, lastHitT: -99 });
  c.setPlayer(p);
  const e = c.makeEntity('fighter', V.v3(0, 0, 500), V.v3(), { x: 0, y: 0, z: 0, w: 1 });
  c.applyDamage(e, 30, 1, V.v3());
  ok('shield absorbs first', e.shield === 5 && e.hull === 45 && hits[0] === true);
  c.applyDamage(e, 20, 1, V.v3());
  ok('overflow goes to hull', e.shield === 0 && e.hull === 30 && hits[1] === false);
  c.applyDamage(e, 40, 1, V.v3());
  ok('hull <= 0 kills and fires onKill once', !e.alive && killed.length === 1);
  c.applyDamage(e, 40, 1, V.v3());
  ok('dead entities take no further damage events', killed.length === 1);
}

// ---- full-loop simulation with a bot pilot (headless): does the game actually play? ----
function simulate(seed, botSkill) {
  const arena = Game.Arena.create({ name: 't', radiusRs: 40, orbitInclinationDeg: 20 });
  const ref0 = arena.refState(0); const g0 = V.v3(); Game.Gravity.gravityAt(ref0.position, g0);
  const frame = Game.Encounter.createFrame(ref0.position, ref0.velocity, g0);
  const q0 = { x: 0, y: 0, z: 0, w: 1 }; arena.startOrientation(q0, 26, 6);
  const log = { shots: 0, enemyShots: 0, hitsOnPlayer: 0, hitsOnEnemy: 0, kills: 0, minDist: 1e9, nan: false, maxEnemies: 0 };
  const c = CB.create({
    onFire: (e, isP) => { if (isP) log.shots++; else log.enemyShots++; },
    onHit: (e, p, sh, d) => { if (e.team === 0) log.hitsOnPlayer++; else log.hitsOnEnemy++; },
    onKill: () => { log.kills++; },
  }, { seed });
  const player = Game.PhysicsWorld.createBody('player', V.v3(), V.v3(), q0);
  player.kind = 'player'; player.team = 0; player.radius = 6; player.hullMax = 120; player.shieldMax = 150; player.lastHitT = -99; player.controlState = FC.createShipControlState(); player.profile = FC.PLAYER_PROFILE; player.thrustAccelMps2 = V.v3();
  c.reset(player);
  const scratch = Game.PhysicsWorld.createScratch();
  const dt = 1 / 120; let t = 0;
  const D = V.v3(); const omega = V.v3(); const _aLoc = V.v3(), _qc = { x: 0, y: 0, z: 0, w: 1 };
  const I = { thrust: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0, roll: 0 };
  while (t < 420 && c.S.mode !== 'victory' && c.S.mode !== 'gameover') {
    t += dt;
    const ref = arena.refState(t);
    V.set(frame.anchorPositionMeters, ref.position.x + D.x, ref.position.y + D.y, ref.position.z + D.z);
    V.copy(frame.anchorVelocityMps, ref.velocity); Game.Gravity.gravityAt(ref.position, frame.anchorAccelerationMps2);
    // bot pilot: aim at nearest enemy's lead point, keep range, fire when aligned
    I.thrust = 0; I.strafe = 0; I.yaw = 0; I.pitch = 0;
    c.S.fireHeld = false;
    let tgt = null, best = 1e9;
    for (const e of c.S.enemies) { const d = V.length(V.sub(V.v3(), e.positionMeters, player.positionMeters)); if (d < best) { best = d; tgt = e; } }
    if (tgt) {
      const dir = V.v3(); c.leadDir(dir, player, tgt, CB.PLAYER_GUN.boltSpeed);
      Q.qConjugate(_qc, player.orientation); Q.qRotateVector(_aLoc, _qc, dir);
      const yawErr = Math.atan2(_aLoc.x, _aLoc.z), pitchErr = Math.atan2(_aLoc.y, Math.hypot(_aLoc.x, _aLoc.z));
      I.yaw = Math.max(-1, Math.min(1, yawErr * 3 * botSkill)); I.pitch = Math.max(-1, Math.min(1, pitchErr * 3 * botSkill));
      I.thrust = best > 600 ? 0.6 : best < 160 ? -0.5 : 0;
      const ang = Math.hypot(yawErr, pitchErr);
      c.S.fireHeld = ang < 0.07 && best < 1100;
      log.minDist = Math.min(log.minDist, best);
    }
    arena.frameOmega(omega, ref.position, ref.velocity);
    c.preStep(dt);
    FC.update(player, I, dt, omega);
    Game.PhysicsWorld.step(frame, c.S.bodies, dt, scratch);
    c.postStep(dt);
    if (V.length(player.positionMeters) > K.REANCHOR_THRESHOLD_M) { const off = V.v3(player.positionMeters.x, player.positionMeters.y, player.positionMeters.z); Game.Encounter.rebaseEncounter(frame, c.S.bodies, player); V.add(D, D, off); c.shift(off); }
    log.maxEnemies = Math.max(log.maxEnemies, c.S.enemies.length);
    if (global.TRACE && Math.abs(t * 120 % 600) < 1) { console.log('t=' + t.toFixed(0), 'mode', c.S.mode, 'w', c.S.wave, 'en:', c.S.enemies.map(e => e.kind[0] + ':' + V.length(V.sub(V.v3(), e.positionMeters, player.positionMeters)).toFixed(0) + '/' + e.ai.state[0] + '/' + V.length(e.velocityMps).toFixed(0)).join(' '), 'pv', V.length(player.velocityMps).toFixed(0), 'hp', player.hull.toFixed(0), player.shield.toFixed(0)); }
    if (!isFinite(player.positionMeters.x + player.velocityMps.x + player.orientation.w)) { log.nan = true; break; }
  }
  return { mode: c.S.mode, wave: c.S.wave, t: +t.toFixed(1), score: c.S.score, hull: +player.hull.toFixed(1), shield: +player.shield.toFixed(1), log, speed: V.length(player.velocityMps) };
}
const r1 = simulate(1, 1.0), r2 = simulate(7, 0.55);
console.log('bot (skill 1.0):', JSON.stringify(r1));
console.log('bot (skill 0.55):', JSON.stringify(r2));
ok('sim stays finite (no NaN)', !r1.log.nan && !r2.log.nan);
ok('enemies actually close to engagement range', r1.log.minDist < 450, 'minDist=' + r1.log.minDist);
ok('enemies fire and hit the player sometimes', r1.log.enemyShots > 20 && r1.log.hitsOnPlayer > 0, JSON.stringify(r1.log));
ok('bot lands hits and kills enemies', r1.log.hitsOnEnemy > 10 && r1.log.kills >= 3, JSON.stringify(r1.log));
ok('skilled bot progresses past wave 1', r1.wave >= 2, 'wave=' + r1.wave);
console.log(`${pass} passed, ${fail} failed.`); process.exit(fail ? 1 : 0);
