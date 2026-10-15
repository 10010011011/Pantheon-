// ---------------------------------------------------------------------------
// SECTION: CHASE CAMERA (v2) -- doc §15.4: behind/above offset, mild look-ahead,
// critically-damped spring. v2 also returns the ship's UP vector: the previous
// build used Babylon's fixed world-up, which flips the camera the moment the
// ship pitches past vertical and ignores roll entirely. A real 6DOF chase
// camera must inherit the ship's up.
// ---------------------------------------------------------------------------
Game.ChaseCamera = (function () {
  const V = Game.Vec3, Q = Game.Quat;
  const LOCAL_OFFSET = { x: 0, y: 6.5, z: -22 };
  const OMEGA = 7; // rad/s, my own choice (doc gives the form, not the gain)
  const LOOKAHEAD_SECONDS = 0.25, LOOKAHEAD_MAX_M = 70;

  function createState(p) { return { positionMeters: V.v3(p.x, p.y, p.z), velocityMps: V.v3(0, 0, 0) }; }
  const _wo = V.v3(), _des = V.v3(), _look = V.v3(), _fwd = V.v3(), _up = V.v3();

  function update(state, ship, dt) {
    Q.qRotateVector(_wo, ship.orientation, LOCAL_OFFSET);
    _des.x = ship.positionMeters.x + _wo.x; _des.y = ship.positionMeters.y + _wo.y; _des.z = ship.positionMeters.z + _wo.z;
    const S = Game.Spring.stepCriticallyDamped;
    const rx = S(state.positionMeters.x - _des.x, state.velocityMps.x, OMEGA, dt);
    const ry = S(state.positionMeters.y - _des.y, state.velocityMps.y, OMEGA, dt);
    const rz = S(state.positionMeters.z - _des.z, state.velocityMps.z, OMEGA, dt);
    state.positionMeters.x = _des.x + rx.e; state.velocityMps.x = rx.v;
    state.positionMeters.y = _des.y + ry.e; state.velocityMps.y = ry.v;
    state.positionMeters.z = _des.z + rz.e; state.velocityMps.z = rz.v;
    Q.qRotateVector(_fwd, ship.orientation, { x: 0, y: 0, z: 1 });
    Q.qRotateVector(_up, ship.orientation, { x: 0, y: 1, z: 0 });
    const d = Math.min(LOOKAHEAD_MAX_M, V.length(ship.velocityMps) * LOOKAHEAD_SECONDS);
    _look.x = ship.positionMeters.x + _fwd.x * d + _fwd.x * 40; // aim point ahead of the nose, not at the hull
    _look.y = ship.positionMeters.y + _fwd.y * d + _fwd.y * 40;
    _look.z = ship.positionMeters.z + _fwd.z * d + _fwd.z * 40;
    return { position: state.positionMeters, lookAt: _look, up: _up };
  }
  // doc §52.6-style rebase: ANY render-side state kept in local coordinates must shift with the origin.
  // (Bug found on re-review: the previous build rebased bodies but not the camera spring, so every
  // 50 km re-anchor made the camera fly 50 km back to the ship.)
  function shift(state, off) { state.positionMeters.x -= off.x; state.positionMeters.y -= off.y; state.positionMeters.z -= off.z; }
  return { createState, update, shift, LOCAL_OFFSET, OMEGA };
})();
