// ---------------------------------------------------------------------------
// SECTION: FLIGHT CONTROLLER (v2) -- doc §17 flight model + §59 orientation
// contract (quaternion + angular velocity; controller converts desired rate ->
// actual rate -> orientation; auto-bank etc. stay presentation-only).
//
// Local axes match Babylon's left-handed default: +Z forward, +Y up, +X right.
//
// SIGN CONVENTION (a bug in the previous build, found on re-review): the
// quaternion math here is standard right-handed math, so a POSITIVE rotation
// about local +X takes the nose DOWN (forward (0,0,1) -> (0,-sin,cos)) and a
// positive rotation about +Z lifts the RIGHT wing. The player-facing
// convention is thumb-up = nose up and roll-right = right wing down, so pitch
// and roll intents are negated below. Yaw already agreed (+Y rotation moves
// the nose toward +X = right). Direction (not just magnitude) is now tested.
//
// DELIBERATE DEVIATION FROM THE PLAN: doc §17 gives 5,000 m/s^2 and a 0.02c
// soft cruise limit -- strategic-travel numbers. At dogfight distances on a
// phone screen they make combat unplayable (1 s of thrust = 5 km/s, ships
// vanish). Flight profiles below are dogfight-scaled; the doc's soft-limiter
// SHAPE is kept (efficiency rolls off smoothly toward softMaxSpeed, braking is
// always full strength, no hard clamp).
//
// MY OWN CHOICES (not doc-given): first-order exponential approach to the
// desired angular rate instead of a literal second-order PD; dampener strength
// capped at that axis's own thrust ("Assisted" mode only).
// ---------------------------------------------------------------------------
Game.FlightController = (function () {
  const V = Game.Vec3, Q = Game.Quat, C = Game.Constants;

  const PLAYER_PROFILE = {
    accelFwd: 1400, accelRev: 900, accelLat: 800, accelVert: 800, softMaxSpeed: 650,
    maxPitchRate: C.SHIP_MAX_PITCH_RATE_RAD, maxYawRate: C.SHIP_MAX_YAW_RATE_RAD, maxRollRate: C.SHIP_MAX_ROLL_RATE_RAD, angularTau: 0.15,
  };
  const FIGHTER_PROFILE = {
    accelFwd: 1000, accelRev: 500, accelLat: 600, accelVert: 600, softMaxSpeed: 520,
    maxPitchRate: C.SHIP_MAX_PITCH_RATE_RAD * 0.78, maxYawRate: C.SHIP_MAX_YAW_RATE_RAD * 0.78, maxRollRate: C.SHIP_MAX_ROLL_RATE_RAD * 0.7, angularTau: 0.2,
  };
  const GUNSHIP_PROFILE = {
    accelFwd: 520, accelRev: 300, accelLat: 320, accelVert: 320, softMaxSpeed: 260,
    maxPitchRate: C.SHIP_MAX_PITCH_RATE_RAD * 0.45, maxYawRate: C.SHIP_MAX_YAW_RATE_RAD * 0.45, maxRollRate: C.SHIP_MAX_ROLL_RATE_RAD * 0.4, angularTau: 0.3,
  };

  function createShipControlState() { return { angularVelocityRadPerSecond: V.v3(0, 0, 0) }; }

  const _fwd = V.v3(), _right = V.v3(), _up = V.v3();
  const _desired = V.v3(), _axis = V.v3(), _omegaBody = V.v3();
  const _inc = { x: 0, y: 0, z: 0, w: 1 }, _qc = { x: 0, y: 0, z: 0, w: 1 };

  function localAxes(o) {
    Q.qRotateVector(_fwd, o, { x: 0, y: 0, z: 1 });
    Q.qRotateVector(_right, o, { x: 1, y: 0, z: 0 });
    Q.qRotateVector(_up, o, { x: 0, y: 1, z: 0 });
  }
  function forwardEfficiency(fSpeed, softMax) { return Math.max(0, 1 - Math.max(0, fSpeed) / softMax); }
  function dampAxis(component, dt, maxAccel) {
    const needed = -component / dt; // accel that would zero this axis in exactly one step
    return Math.sign(needed) * Math.min(Math.abs(needed), maxAccel);
  }

  /** intent: {thrust,strafe,vertical,yaw,pitch,roll} in [-1,1]. frameOmegaWorld (optional): angular velocity
   *  of the frame the ship should hold attitude against (orbit-relative hold); omit for inertial hold. */
  function update(ship, intent, dt, frameOmegaWorld) {
    const P = ship.profile || PLAYER_PROFILE;
    localAxes(ship.orientation);
    const vel = ship.velocityMps;
    const fSpeed = V.dot(vel, _fwd), rSpeed = V.dot(vel, _right), uSpeed = V.dot(vel, _up);
    const DEAD = 0.02;

    let fwdA;
    if (intent.thrust >= 0) fwdA = P.accelFwd * intent.thrust;
    else fwdA = P.accelRev * intent.thrust;
    if (Math.abs(intent.thrust) < DEAD) fwdA = dampAxis(fSpeed, dt, P.accelFwd);
    const rightA = Math.abs(intent.strafe) < DEAD ? dampAxis(rSpeed, dt, P.accelLat) : P.accelLat * intent.strafe;
    const upA = Math.abs(intent.vertical) < DEAD ? dampAxis(uSpeed, dt, P.accelVert) : P.accelVert * intent.vertical;

    const t = ship.thrustAccelMps2;
    t.x = _fwd.x * fwdA + _right.x * rightA + _up.x * upA;
    t.y = _fwd.y * fwdA + _right.y * rightA + _up.y * upA;
    t.z = _fwd.z * fwdA + _right.z * rightA + _up.z * upA;
    // TOTAL-speed soft limiter (root-cause fix found by simulating enemy AI: the forward-only limiter let
    // strafe/vertical/turning thrust pile speed far past the cap -- enemies reached 1,500 m/s against a
    // 520 m/s profile). The part of thrust that would INCREASE speed along the current velocity is scaled
    // by the same smooth efficiency; braking and direction-changing components are untouched.
    const spd = V.length(vel);
    if (spd > 1e-3) {
      const ap = (t.x * vel.x + t.y * vel.y + t.z * vel.z) / spd;
      if (ap > 0) {
        const cut = ap * (1 - forwardEfficiency(spd, P.softMaxSpeed)) / spd;
        t.x -= vel.x * cut; t.y -= vel.y * cut; t.z -= vel.z * cut;
      }
      // Restoring drag above the cap: semi-implicit integration of direction-changing thrust adds a small
      // amount of speed every step (~4 m/s per second at 800 m/s^2), so the cap needs a governor, not just
      // a trimmed push. Smooth (0.125 s time constant), never exceeds the axis's own thrust authority.
      if (spd > P.softMaxSpeed) {
        const drag = Math.min(8 * (spd - P.softMaxSpeed), P.accelFwd) / spd;
        t.x -= vel.x * drag; t.y -= vel.y * drag; t.z -= vel.z * drag;
      }
    }

    _desired.x = -intent.pitch * P.maxPitchRate;
    _desired.y = intent.yaw * P.maxYawRate;
    _desired.z = -intent.roll * P.maxRollRate;
    if (frameOmegaWorld) {
      Q.qConjugate(_qc, ship.orientation);
      Q.qRotateVector(_omegaBody, _qc, frameOmegaWorld);
      _desired.x += _omegaBody.x; _desired.y += _omegaBody.y; _desired.z += _omegaBody.z;
    }
    const av = ship.controlState.angularVelocityRadPerSecond;
    const k = 1 - Math.exp(-dt / P.angularTau);
    av.x += (_desired.x - av.x) * k; av.y += (_desired.y - av.y) * k; av.z += (_desired.z - av.z) * k;

    const angle = V.length(av) * dt;
    if (angle > 1e-12 && V.normalize(_axis, av)) {
      Q.qFromAxisAngle(_inc, _axis, angle);
      Q.qMultiply(ship.orientation, ship.orientation, _inc);
      Q.qNormalize(ship.orientation, ship.orientation);
    }
  }
  return { createShipControlState, update, forwardEfficiency, dampAxis, PLAYER_PROFILE, FIGHTER_PROFILE, GUNSHIP_PROFILE };
})();
