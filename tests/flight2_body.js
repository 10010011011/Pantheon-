
const V = Game.Vec3, Q = Game.Quat, C = Game.Constants, FC = Game.FlightController;
let pass = 0, fail = 0;
function ok(l, c, d) { if (c) pass++; else { fail++; console.log('FAIL:', l, d || ''); } }
const near = (a, b, t) => Math.abs(a - b) <= t;
const I = { thrust: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0, roll: 0 };
function ship() { return { positionMeters: V.v3(), velocityMps: V.v3(), orientation: { x: 0, y: 0, z: 0, w: 1 }, thrustAccelMps2: V.v3(), controlState: FC.createShipControlState() }; }
const dt = 1 / 120;
function fwd(s) { const o = V.v3(); Q.qRotateVector(o, s.orientation, { x: 0, y: 0, z: 1 }); return o; }
function rgt(s) { const o = V.v3(); Q.qRotateVector(o, s.orientation, { x: 1, y: 0, z: 0 }); return o; }

// DIRECTION semantics (the bug found on re-review)
let s = ship(); for (let i = 0; i < 60; i++) FC.update(s, { ...I, pitch: 1 }, dt);
ok('pitch +1 (thumb up) raises the nose (+Y)', fwd(s).y > 0.1, JSON.stringify(fwd(s)));
s = ship(); for (let i = 0; i < 60; i++) FC.update(s, { ...I, pitch: -1 }, dt);
ok('pitch -1 lowers the nose', fwd(s).y < -0.1);
s = ship(); for (let i = 0; i < 60; i++) FC.update(s, { ...I, yaw: 1 }, dt);
ok('yaw +1 moves the nose right (+X)', fwd(s).x > 0.1, JSON.stringify(fwd(s)));
s = ship(); for (let i = 0; i < 60; i++) FC.update(s, { ...I, roll: 1 }, dt);
ok('roll +1 drops the RIGHT wing (right vector tilts to -Y)', rgt(s).y < -0.1, JSON.stringify(rgt(s)));
s = ship(); for (let i = 0; i < 60; i++) { FC.update(s, { ...I, thrust: 1 }, dt); V.addScaled(s.velocityMps, s.velocityMps, s.thrustAccelMps2, dt); }
ok('thrust +1 accelerates along +Z forward', s.velocityMps.z > 100 && Math.abs(s.velocityMps.x) < 1e-6);
s = ship(); for (let i = 0; i < 60; i++) { FC.update(s, { ...I, strafe: 1 }, dt); V.addScaled(s.velocityMps, s.velocityMps, s.thrustAccelMps2, dt); }
ok('strafe +1 accelerates toward +X (right)', s.velocityMps.x > 100);
s = ship(); for (let i = 0; i < 60; i++) { FC.update(s, { ...I, vertical: 1 }, dt); V.addScaled(s.velocityMps, s.velocityMps, s.thrustAccelMps2, dt); }
ok('vertical +1 accelerates toward +Y (up)', s.velocityMps.y > 100);

// soft limiter shape (dogfight profile)
const P = FC.PLAYER_PROFILE;
ok('forward efficiency is 1 at rest and 0 at softMaxSpeed', FC.forwardEfficiency(0, P.softMaxSpeed) === 1 && FC.forwardEfficiency(P.softMaxSpeed, P.softMaxSpeed) === 0);
s = ship(); for (let i = 0; i < 1200; i++) { FC.update(s, { ...I, thrust: 1 }, dt); V.addScaled(s.velocityMps, s.velocityMps, s.thrustAccelMps2, dt); }
ok('sustained thrust converges below softMaxSpeed without a hard clamp', V.length(s.velocityMps) < P.softMaxSpeed + 1 && V.length(s.velocityMps) > P.softMaxSpeed * 0.97, 'speed=' + V.length(s.velocityMps));
s = ship(); s.velocityMps.z = P.softMaxSpeed; FC.update(s, { ...I, thrust: -1 }, dt);
ok('braking at top speed is full strength', near(V.length(s.thrustAccelMps2), P.accelRev, 1e-6));
s = ship(); s.velocityMps.x = 300; let flipped = false;
for (let i = 0; i < 300; i++) { FC.update(s, I, dt); V.addScaled(s.velocityMps, s.velocityMps, s.thrustAccelMps2, dt); if (s.velocityMps.x < -0.5) flipped = true; }
ok('dampener kills lateral drift without overshoot', Math.abs(s.velocityMps.x) < 0.5 && !flipped);

// orbit-relative attitude hold: ship co-rotates with the frame, BH bearing stays fixed
{
  const arenaR = 40 * C.BH_RS, mu = C.BH_MU, n = Math.sqrt(mu / Math.pow(arenaR, 3));
  const omegaWorld = V.v3(0, 0, n); // frame rotating about +Z
  const sh = ship();
  const q0 = { x: 0, y: 0, z: 0, w: 1 };
  sh.controlState.angularVelocityRadPerSecond = V.v3(0, 0, n); // start already co-rotating (no transient)
  const f0 = fwd(sh);
  const T = 100; // seconds
  for (let i = 0; i < T * 120; i++) FC.update(sh, I, dt, omegaWorld);
  const expected = V.v3(); const qz = { x: 0, y: 0, z: 0, w: 1 }; Q.qFromAxisAngle(qz, { x: 0, y: 0, z: 1 }, n * T); Q.qRotateVector(expected, qz, f0);
  const got = fwd(sh);
  const ang = Math.acos(Math.min(1, V.dot(expected, got))) * 180 / Math.PI;
  ok('with zero input the ship co-rotates with the orbit frame (error < 0.05 deg after 100 s)', ang < 0.05, 'err=' + ang + ' deg; frame turned ' + (n * T * 180 / Math.PI).toFixed(1) + ' deg');
  console.log('headline: ship attitude tracked a frame rotating', (n * T * 180 / Math.PI).toFixed(2), 'deg in 100 s to within', ang.toExponential(2), 'deg');
}
// inertial hold still holds
{ const sh = ship(); const f0 = fwd(sh); for (let i = 0; i < 12000; i++) FC.update(sh, I, dt); const ang = Math.acos(Math.min(1, V.dot(f0, fwd(sh)))); ok('inertial hold keeps attitude', ang < 1e-9); }

// qFromBasis round trip
{
  const r = V.v3(0.6, 0, -0.8), u = V.v3(0, 1, 0); const f = V.v3(); V.cross(f, r, u); // left-handed-ish check below via rotation round trip
  const q = { x: 0, y: 0, z: 0, w: 1 }; Q.qFromBasis(q, r, u, f);
  const rr = V.v3(), uu = V.v3(), ff = V.v3();
  Q.qRotateVector(rr, q, { x: 1, y: 0, z: 0 }); Q.qRotateVector(uu, q, { x: 0, y: 1, z: 0 }); Q.qRotateVector(ff, q, { x: 0, y: 0, z: 1 });
  ok('qFromBasis maps local axes onto the requested basis', near(rr.x, r.x, 1e-9) && near(rr.z, r.z, 1e-9) && near(uu.y, 1, 1e-9) && near(ff.x, f.x, 1e-9) && near(ff.z, f.z, 1e-9), JSON.stringify({ rr, uu, ff }));
}
// camera: returns ship's up; shift subtracts offset
{
  const sh = ship(); const q = { x: 0, y: 0, z: 0, w: 1 }; Q.qFromAxisAngle(q, { x: 1, y: 0, z: 0 }, Math.PI * 0.75); sh.orientation = q; // pitched well past vertical
  const cs = Game.ChaseCamera.createState({ x: 0, y: 0, z: 0 });
  const r = Game.ChaseCamera.update(cs, sh, dt);
  const expUp = V.v3(); Q.qRotateVector(expUp, q, { x: 0, y: 1, z: 0 });
  ok('camera up follows the ship (no flip past vertical)', near(r.up.y, expUp.y, 1e-9) && near(r.up.z, expUp.z, 1e-9));
  const c2 = Game.ChaseCamera.createState({ x: 100, y: 0, z: 0 }); Game.ChaseCamera.shift(c2, { x: 40, y: 0, z: 0 });
  ok('camera.shift subtracts the rebase offset', near(c2.positionMeters.x, 60, 1e-12));
}

// total-speed limiter: strafe+vertical+forward together, and thrust while turning, must not exceed the soft cap
{
  const P2 = FC.PLAYER_PROFILE;
  let s2 = ship(); for (let i = 0; i < 2400; i++) { FC.update(s2, { ...I, thrust: 1, strafe: 1, vertical: 1 }, dt); V.addScaled(s2.velocityMps, s2.velocityMps, s2.thrustAccelMps2, dt); }
  ok('full diagonal thrust (fwd+strafe+up) converges at/below the soft cap', V.length(s2.velocityMps) <= P2.softMaxSpeed * 1.01 && V.length(s2.velocityMps) > P2.softMaxSpeed * 0.9, 'speed=' + V.length(s2.velocityMps));
  let s3 = ship(); let peak = 0;
  for (let i = 0; i < 6000; i++) { FC.update(s3, { ...I, thrust: 1, yaw: Math.sin(i * dt * 1.7), strafe: Math.sin(i * dt * 1.1) * 0.8, vertical: Math.cos(i * dt * 0.8) * 0.5, pitch: Math.cos(i * dt * 0.9) * 0.6 }, dt); V.addScaled(s3.velocityMps, s3.velocityMps, s3.thrustAccelMps2, dt); peak = Math.max(peak, V.length(s3.velocityMps)); }
  ok('weaving thrust (what the enemy AI does) never blows past the cap', peak <= P2.softMaxSpeed * 1.08, 'peak=' + peak);
  console.log('headline: weaving full-thrust peak speed', peak.toFixed(0), 'm/s against a', P2.softMaxSpeed, 'm/s soft cap (old forward-only limiter let the AI reach ~1,500)');
}
console.log(`${pass} passed, ${fail} failed.`); process.exit(fail ? 1 : 0);
