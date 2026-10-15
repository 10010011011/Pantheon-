
/*
 * BLACK HOLE COMBAT — FOUNDATION BUILD
 * Source of truth: "Black Hole Combat System — Ultimate Master Plan" (arena-synthesized, Fable5/Opus/Sol).
 *
 * PACKAGING DECISION (deviates from the doc's "canonical" stack on purpose):
 *   The master plan's Stage A step 1 calls for a TypeScript/Vite scaffold with 100+ modules.
 *   This build follows the doc's OWN "single-file prototype mode" (§3.3) instead, to match
 *   how every prior project here has actually shipped (single HTML file -> HopWeb, no bundler,
 *   no CDN). Babylon.js itself is vendored locally as ./babylon.js (classic global-namespace
 *   UMD build, v9.22.2 — confirmed current on npm as of this build) and referenced by relative
 *   path, per the same no-CDN constraint.
 *
 *   Dropping Vite also means dropping literal TypeScript — there's no compiler in this pipeline.
 *   The doc's "strong TypeScript aliases" (§4.2) were compile-time-only anyway ("compile-time
 *   discipline, not runtime objects" — the doc's own words), so nothing functional is lost.
 *   The real enforcement mechanism was always the naming convention in §4.3 (positionMeters,
 *   velocityMps, etc.) — that's followed here in plain JS, documented with JSDoc typedefs
 *   instead of branded types.
 *
 *   Each "module" from the doc's directory tree (§3.2) is kept as a clearly labeled, namespaced
 *   section below (Game.Constants, Game.Rng, ...) so this can still be split into real files
 *   later if the project ever needs it — same boundaries, just no build step today.
 *
 * SCOPE OF THIS BUILD (see §65 CANONICAL BUILD ORDER):
 *   Stage A (Contracts):  #2 unit aliases/config shapes, #3 stable entity IDs,
 *                         #4 command/event types, #5 deterministic RNG + seed state.
 *                         (Skipped as literal items: #1 Vite/TS scaffold — superseded by this
 *                         file; #6 test harness — replaced by the inline self-test below.)
 *   Stage B (Math spine): COMPLETE. #7 constants, #8 Vec3, #9 quaternion math, #10 Kepler
 *                         solver + analytic state, #11 gravity + tidal estimate, #12 hybrid
 *                         differential gravity, #13 map compression + inverse, #14 fixed-step
 *                         clock. All checked in Node (79 assertions) before this file was
 *                         touched; a representative subset runs on-page below.
 *   Stage C (Encounter spine): #15 encounter frame, #16 rebase invariants, #17
 *                         activation/deactivation hysteresis, #18 render snapshots, #19
 *                         strategic->local conversion (activation side only -- see note
 *                         below). 26 more assertions checked in Node, including the doc's
 *                         own required rebase invariants (§52.6) verified exactly.
 *   Phase 0 acceptance target: "project boots with no gameplay code" — met below (engine/scene/
 *                         camera/light boot + a rotating wireframe marker that exists ONLY to
 *                         prove a frame is actually rendering; it is not a game asset).
 *
 * TWO INTERNAL INCONSISTENCIES RESOLVED WHILE IMPLEMENTING STAGE B (doc vs. doc):
 *   1. §11.2's gravity snippet includes a MIN_SAFE_RADIUS clamp-to-zero. §51.3 item 1
 *      explicitly REJECTS exactly that pattern ("capture is a state transition; ordinary
 *      gravity evaluation remains finite"). Implemented per §51.3: gravity below keeps
 *      climbing all the way to a true numerical floor (r^2 <= 1 m^2); nothing is clamped.
 *   2. §9.2's plain-Newton Kepler solver is superseded by §64.3's Halley + bounded-bisection
 *      version — §51.2's consensus matrix names the latter as the actual final choice
 *      ("Newton/Halley + bounded fallback + tests"). §64.3 is what's implemented.
 *
 * DEFERRED FROM STAGE C: item 19's deactivation-side conversion (local state vector -> new
 *   osculating Kepler elements, the classical "rv2coe" problem) is a distinct algorithm from
 *   the activation-side conversion implemented here, and isn't needed until something can
 *   actually leave a combat bubble -- which needs Stage D ships to exist first.
 *
 * STAGE D — FIRST PLAYABLE: touch input, flight controller, chase camera, keyboard testing
 *   supplement, and a placeholder ship all now exist. Touch input (dual virtual sticks) was
 *   externally drafted by two independent models (Fable 5 and Opus) against a written spec
 *   and reviewed here -- both run through 18 synthetic pointer-event scenarios in jsdom before
 *   either line was trusted, both passed identically, merge decided by two confirmed real
 *   differences (window-blur safety net; pad-size-aware max radius vs. a hardcoded one). Flight
 *   controller (§17 linear motion + soft cruise limiter + inertial dampening "Assisted" mode,
 *   §59 quaternion/angular-velocity orientation) and chase camera (§15.4 critically-damped
 *   spring, exact closed form, not a naive integrator) were checked with 19 Node assertions
 *   covering cruise-limiter engagement, always-available braking, no-overshoot damping, exact
 *   convergence to the doc's stated max turn rates, quaternion normalization holding after 600
 *   integration steps, and camera convergence/look-ahead. The ship flies in a real gravity
 *   well now -- the encounter anchor rides haven's actual orbit (same body used throughout
 *   Stage B/C testing), and Stage C's already-tested auto-rebase fires live once local
 *   position passes 50km (reachable in ~10s of held thrust, not a someday edge case).
 *
 * WHAT STILL GENUINELY NEEDS YOUR DEVICE, NOT JUST NODE: real multi-touch feel: whether the
 *   ship mesh's nose is baked pointing the right way (one-line fix noted at the mesh-creation
 *   comment if not); whether the camera spring/look-ahead feels right, not just converges
 *   correctly; overall flight feel and the two chosen-not-given constants (angular response
 *   time constant, camera stiffness) -- both easy to retune once you've flown it once.
 *
 * NOT YET BUILT: projectiles, collision, shields/hull, one dummy enemy -- the rest of Stage D.
 *   Also deferred: auto-bank (doc §59.2 says presentation-only, not a rewrite of authoritative
 *   orientation -- correctly implementing that boundary deserves its own pass, not a rushed
 *   addition here), and the two other inertial-dampening modes (Drift, Precision-docking).
 *
 * LENSING DECISION (per your call): keep true geodesic ray integration as the eventual V1
 *   lensing approach rather than the doc's screen-space default — that lands in Stage G,
 *   not here. Nothing in this file touches rendering the black hole itself yet.
 */

const Game = {};

// ---------------------------------------------------------------------------
// SECTION: UNITS & NAMING — doc §4. No compiler, so this is documentation +
// naming discipline instead of branded types.
// ---------------------------------------------------------------------------
/**
 * @typedef {number} Meters
 * @typedef {number} MetersPerSecond
 * @typedef {number} MetersPerSecondSquared
 * @typedef {number} Seconds
 * @typedef {number} AstronomicalUnits
 * @typedef {number} Kilograms
 * Naming rule (doc §4.3): suffix ambiguous physics quantities with their unit —
 * positionMeters, velocityMps, accelerationMps2, semiMajorAxisAU, physicalRadiusMeters.
 */

// ---------------------------------------------------------------------------
// SECTION: AUTHORITATIVE CONSTANTS — doc §5, transcribed verbatim (values only;
// TS type annotations dropped). Verified against the doc's own §5.1/§5.2 tables
// in Node before this file was written — see build notes.
// ---------------------------------------------------------------------------
Game.Constants = (function () {
  const G = 6.67430e-11;
  const C = 299792458;
  const SOLAR_MASS = 1.98847e30;
  const SOLAR_LUMINOSITY = 3.828e26;
  const AU = 1.495978707e11;
  const DAY = 86400;
  const JULIAN_YEAR = 365.25 * DAY;

  const BH_MASS_SOLAR = 10000;
  const BH_MASS = BH_MASS_SOLAR * SOLAR_MASS;
  const BH_MU = G * BH_MASS;
  const BH_RS = (2 * BH_MU) / (C * C);

  const BH_EVENT_HORIZON_RADIUS = BH_RS;
  const BH_PHOTON_SPHERE_RADIUS = 1.5 * BH_RS;
  const BH_SHADOW_RADIUS = Math.sqrt(27) * 0.5 * BH_RS;
  const BH_ISCO_RADIUS = 3 * BH_RS;
  const BH_CAPTURE_RADIUS = 1.02 * BH_RS;

  const PHYSICS_DT = 1 / 120;
  const MAX_PHYSICS_STEPS_PER_RENDER = 8;
  const MAX_ACCEPTED_FRAME_DT = 0.10;

  const ENCOUNTER_ACTIVATION_RADIUS_M = 12000 * 1000;
  const COMBAT_BUBBLE_RADIUS_M = 8000 * 1000; // 8,000 km
  const ENCOUNTER_DEACTIVATION_RADIUS_M = 16000 * 1000;
  const REANCHOR_THRESHOLD_M = 50000;

  const SHIP_ACCEL_FWD = 5000;
  const SHIP_ACCEL_REV = 3500;
  const SHIP_ACCEL_LAT = 2800;
  const SHIP_ACCEL_VERTICAL = 2800; // doc \u00a717.1: listed separately from lateral even though same magnitude
  const SHIP_CRUISE_MAX = 0.02 * C;
  const SHIP_INTERCEPT_MAX = 0.05 * C;
  const SHIP_MAX_PITCH_RATE_RAD = (75 * Math.PI) / 180; // doc \u00a717.5 suggested max rates
  const SHIP_MAX_YAW_RATE_RAD = (62 * Math.PI) / 180;
  const SHIP_MAX_ROLL_RATE_RAD = (105 * Math.PI) / 180;

  /** @param {Meters} rMeters @returns {MetersPerSecond} */
  function circularOrbitalVelocity(rMeters) {
    if (!(rMeters > 0)) throw new RangeError("radius must be > 0");
    return Math.sqrt(BH_MU / rMeters);
  }
  /** @param {Meters} rMeters @returns {Seconds} */
  function circularOrbitalPeriod(rMeters) {
    if (!(rMeters > 0)) throw new RangeError("radius must be > 0");
    return 2 * Math.PI * Math.sqrt(Math.pow(rMeters, 3) / BH_MU);
  }

  return {
    G, C, SOLAR_MASS, SOLAR_LUMINOSITY, AU, DAY, JULIAN_YEAR,
    BH_MASS_SOLAR, BH_MASS, BH_MU, BH_RS,
    BH_EVENT_HORIZON_RADIUS, BH_PHOTON_SPHERE_RADIUS, BH_SHADOW_RADIUS, BH_ISCO_RADIUS, BH_CAPTURE_RADIUS,
    PHYSICS_DT, MAX_PHYSICS_STEPS_PER_RENDER, MAX_ACCEPTED_FRAME_DT,
    ENCOUNTER_ACTIVATION_RADIUS_M, COMBAT_BUBBLE_RADIUS_M, ENCOUNTER_DEACTIVATION_RADIUS_M, REANCHOR_THRESHOLD_M,
    SHIP_ACCEL_FWD, SHIP_ACCEL_REV, SHIP_ACCEL_LAT, SHIP_ACCEL_VERTICAL, SHIP_CRUISE_MAX, SHIP_INTERCEPT_MAX,
    SHIP_MAX_PITCH_RATE_RAD, SHIP_MAX_YAW_RATE_RAD, SHIP_MAX_ROLL_RATE_RAD,
    circularOrbitalVelocity, circularOrbitalPeriod,
  };
})();

// ---------------------------------------------------------------------------
// SECTION: VEC3 — allocation-free vector core, doc §64.2 verbatim. Vec3d
// itself is a plain {x,y,z} object (doc §6.2), not a class — operations are
// pure functions that write into an `out` param to avoid per-frame garbage.
// ---------------------------------------------------------------------------
Game.Vec3 = (function () {
  function v3(x, y, z) { return { x: x || 0, y: y || 0, z: z || 0 }; }
  function set(out, x, y, z) { out.x = x; out.y = y; out.z = z; return out; }
  function copy(out, a) { out.x = a.x; out.y = a.y; out.z = a.z; return out; }
  function add(out, a, b) { out.x = a.x + b.x; out.y = a.y + b.y; out.z = a.z + b.z; return out; }
  function sub(out, a, b) { out.x = a.x - b.x; out.y = a.y - b.y; out.z = a.z - b.z; return out; }
  function addScaled(out, a, b, s) { out.x = a.x + b.x * s; out.y = a.y + b.y * s; out.z = a.z + b.z * s; return out; }
  function scale(out, a, s) { out.x = a.x * s; out.y = a.y * s; out.z = a.z * s; return out; }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function lengthSq(a) { return dot(a, a); }
  function length(a) { return Math.sqrt(lengthSq(a)); }
  function cross(out, a, b) {
    const x = a.y * b.z - a.z * b.y;
    const y = a.z * b.x - a.x * b.z;
    const z = a.x * b.y - a.y * b.x;
    return set(out, x, y, z);
  }
  function normalize(out, a) {
    const l2 = lengthSq(a);
    if (!(l2 > 0)) return false;
    const inv = 1 / Math.sqrt(l2);
    set(out, a.x * inv, a.y * inv, a.z * inv);
    return true;
  }
  return { v3, set, copy, add, sub, addScaled, scale, dot, lengthSq, length, cross, normalize };
})();

// ---------------------------------------------------------------------------
// SECTION: QUAT — engine-independent quaternion math, Stage B item 9. Not
// given verbatim in the doc (only Vec3d was); standard textbook formulas,
// same allocation-free out-param style as Vec3. Converts to BABYLON.Quaternion
// only at the render boundary, mirroring §6.6's rule for positions.
// ---------------------------------------------------------------------------
Game.Quat = (function () {
  function qIdentity(out) { out.x = 0; out.y = 0; out.z = 0; out.w = 1; return out; }
  function qFromAxisAngle(out, axis, angleRadians) {
    const al = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
    const inv = al > 0 ? 1 / al : 0;
    const half = angleRadians * 0.5;
    const s = Math.sin(half);
    out.x = axis.x * inv * s; out.y = axis.y * inv * s; out.z = axis.z * inv * s;
    out.w = Math.cos(half);
    return out;
  }
  function qMultiply(out, a, b) {
    const x = a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y;
    const y = a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x;
    const z = a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w;
    const w = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
    out.x = x; out.y = y; out.z = z; out.w = w;
    return out;
  }
  function qLengthSq(a) { return a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w; }
  function qNormalize(out, a) {
    const l2 = qLengthSq(a);
    if (!(l2 > 0)) return qIdentity(out);
    const inv = 1 / Math.sqrt(l2);
    out.x = a.x * inv; out.y = a.y * inv; out.z = a.z * inv; out.w = a.w * inv;
    return out;
  }
  function qConjugate(out, a) { out.x = -a.x; out.y = -a.y; out.z = -a.z; out.w = a.w; return out; }
  // v' = v + w*(2*qv x v) + (2*qv x (qv x v)) -- optimized rotation, no full quaternion multiply.
  function qRotateVector(out, q, v) {
    const tx = 2 * (q.y * v.z - q.z * v.y);
    const ty = 2 * (q.z * v.x - q.x * v.z);
    const tz = 2 * (q.x * v.y - q.y * v.x);
    out.x = v.x + q.w * tx + (q.y * tz - q.z * ty);
    out.y = v.y + q.w * ty + (q.z * tx - q.x * tz);
    out.z = v.z + q.w * tz + (q.x * ty - q.y * tx);
    return out;
  }
  function qSlerp(out, a, b, t) {
    let bx = b.x, by = b.y, bz = b.z, bw = b.w;
    let cosom = a.x * bx + a.y * by + a.z * bz + a.w * bw;
    if (cosom < 0) { cosom = -cosom; bx = -bx; by = -by; bz = -bz; bw = -bw; }
    let s0, s1;
    if (1 - cosom > 1e-8) {
      const omega = Math.acos(cosom), sinom = Math.sin(omega);
      s0 = Math.sin((1 - t) * omega) / sinom; s1 = Math.sin(t * omega) / sinom;
    } else {
      s0 = 1 - t; s1 = t; // nearly-coincident endpoints: linear interp avoids a 0/0 divide.
    }
    out.x = s0 * a.x + s1 * bx; out.y = s0 * a.y + s1 * by; out.z = s0 * a.z + s1 * bz; out.w = s0 * a.w + s1 * bw;
    return qNormalize(out, out);
  }
  // Rotation taking local axes to the given world basis (right, up, forward are orthonormal world vectors).
  function qFromBasis(out, r, u, f) {
    const m00 = r.x, m01 = u.x, m02 = f.x, m10 = r.y, m11 = u.y, m12 = f.y, m20 = r.z, m21 = u.z, m22 = f.z;
    const tr = m00 + m11 + m22;
    let x, y, z, w, s;
    if (tr > 0) { s = Math.sqrt(tr + 1) * 2; w = 0.25 * s; x = (m21 - m12) / s; y = (m02 - m20) / s; z = (m10 - m01) / s; }
    else if (m00 > m11 && m00 > m22) { s = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s; }
    else if (m11 > m22) { s = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s; }
    else { s = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s; }
    out.x = x; out.y = y; out.z = z; out.w = w;
    return qNormalize(out, out);
  }
  return { qIdentity, qFromAxisAngle, qMultiply, qNormalize, qConjugate, qRotateVector, qSlerp, qLengthSq, qFromBasis };
})();

// ---------------------------------------------------------------------------
// SECTION: ORBITS — doc §9 (elements + update policy) using the §64.3 Kepler
// solver (Halley + bounded bisection), which supersedes §9.2's plain-Newton
// version per the §51.2 consensus matrix (see header note).
// ---------------------------------------------------------------------------
Game.Orbits = (function () {
  const TWO_PI = Math.PI * 2;
  function wrapPi(x) {
    let v = x % TWO_PI;
    if (v > Math.PI) v -= TWO_PI;
    if (v < -Math.PI) v += TWO_PI;
    return v;
  }
  function solveKepler(Mraw, e) {
    if (!(e >= 0 && e < 1)) throw new RangeError("e=" + e + " outside elliptic V1 range");
    const M = wrapPi(Mraw);
    if (e === 0) return M;
    let E = e < 0.8 ? M : Math.PI * Math.sign(M || 1);
    for (let i = 0; i < 12; i++) {
      const s = Math.sin(E), c = Math.cos(E);
      const f = E - e * s - M;
      const fp = 1 - e * c;
      const fpp = e * s;
      const denom = 2 * fp * fp - f * fpp;
      const dE = Math.abs(denom) > 1e-15 ? (2 * f * fp) / denom : f / fp;
      E -= dE;
      if (Math.abs(dE) < 1e-13) return E;
    }
    let lo = -Math.PI, hi = Math.PI; // monotonic bisection fallback
    for (let i = 0; i < 80; i++) {
      const mid = 0.5 * (lo + hi);
      const f = mid - e * Math.sin(mid) - M;
      if (f > 0) hi = mid; else lo = mid;
    }
    return 0.5 * (lo + hi);
  }
  function initializeOrbit(orbit) {
    const a = orbit.semiMajorAxisAU * Game.Constants.AU;
    orbit.semiMajorAxisMeters = a;
    orbit.meanMotion = Math.sqrt(Game.Constants.BH_MU / Math.pow(a, 3));
    orbit.periodSeconds = (2 * Math.PI) / orbit.meanMotion;
    return orbit;
  }
  // Standard Rz(Omega)*Rx(i)*Rz(omega) perifocal -> inertial rotation (Vallado-style
  // closed form), applied directly to components rather than building a matrix object.
  function rotatePerifocalStateToSystem(xP, yP, zP, vxP, vyP, vzP, Omega, inc, omega) {
    const cO = Math.cos(Omega), sO = Math.sin(Omega);
    const ci = Math.cos(inc), si = Math.sin(inc);
    const cw = Math.cos(omega), sw = Math.sin(omega);
    const r11 = cO * cw - sO * sw * ci, r12 = -cO * sw - sO * cw * ci;
    const r21 = sO * cw + cO * sw * ci, r22 = -sO * sw + cO * cw * ci;
    const r31 = sw * si, r32 = cw * si;
    return {
      position: { x: r11 * xP + r12 * yP, y: r21 * xP + r22 * yP, z: r31 * xP + r32 * yP },
      velocity: { x: r11 * vxP + r12 * vyP, y: r21 * vxP + r22 * vyP, z: r31 * vxP + r32 * vyP },
    };
  }
  function orbitalStateAtTime(orbit, tSeconds) {
    const a = orbit.semiMajorAxisMeters, e = orbit.eccentricity, n = orbit.meanMotion;
    const M = orbit.meanAnomalyAtEpochRadians + n * (tSeconds - orbit.epochSeconds);
    const E = solveKepler(M, e);
    const cosE = Math.cos(E), sinE = Math.sin(E);
    const root = Math.sqrt(1 - e * e), denominator = 1 - e * cosE;
    const xP = a * (cosE - e), yP = a * root * sinE;
    const vxP = (-a * n * sinE) / denominator, vyP = (a * n * root * cosE) / denominator;
    return rotatePerifocalStateToSystem(xP, yP, 0, vxP, vyP, 0,
      orbit.longitudeAscendingNodeRadians, orbit.inclinationRadians, orbit.argumentOfPeriapsisRadians);
  }
  return { solveKepler, initializeOrbit, orbitalStateAtTime, rotatePerifocalStateToSystem, wrapPi };
})();

// ---------------------------------------------------------------------------
// SECTION: GRAVITY — doc §11.2 WITH the §51.3 fix applied (see header note):
// no MIN_SAFE_RADIUS clamp. Only a true numerical floor near r=0 survives.
// Includes §12's ship-length tidal stress estimate and §64.4's differential
// gravity (linearized branch for the common case, exact branch as fallback).
// ---------------------------------------------------------------------------
Game.Gravity = (function () {
  const R2_NUMERICAL_FLOOR = 1; // 1 m^2 -- guards literal division blowup only, not a gameplay clamp.
  function gravityAt(position, out) {
    const V = Game.Vec3;
    const r2 = V.lengthSq(position);
    if (!(r2 > R2_NUMERICAL_FLOOR)) return V.set(out, 0, 0, 0);
    const r = Math.sqrt(r2);
    const factor = -Game.Constants.BH_MU / (r2 * r);
    return V.set(out, position.x * factor, position.y * factor, position.z * factor);
  }
  function tidalAccelerationDelta(rMeters, shipLengthMeters) {
    return (2 * Game.Constants.BH_MU * shipLengthMeters) / Math.pow(rMeters, 3);
  }
  const RATIO_LINEAR = 1e-5;
  function differentialGravityLinearized(anchor, anchorAcceleration, local, out, scratchAnchorGravity) {
    const V = Game.Vec3;
    const r = Math.sqrt(V.lengthSq(anchor));
    const invR = 1 / r;
    const nx = anchor.x * invR, ny = anchor.y * invR, nz = anchor.z * invR;
    const projection = nx * local.x + ny * local.y + nz * local.z;
    const k = Game.Constants.BH_MU / (r * r * r);
    const residualX = scratchAnchorGravity.x - anchorAcceleration.x;
    const residualY = scratchAnchorGravity.y - anchorAcceleration.y;
    const residualZ = scratchAnchorGravity.z - anchorAcceleration.z;
    return V.set(out,
      residualX + k * (3 * projection * nx - local.x),
      residualY + k * (3 * projection * ny - local.y),
      residualZ + k * (3 * projection * nz - local.z));
  }
  function differentialGravityExact(anchor, anchorAcceleration, local, out, scratchAbs, scratchAnchorGravity, scratchBodyGravity) {
    const V = Game.Vec3;
    V.add(scratchAbs, anchor, local);
    gravityAt(scratchAbs, scratchBodyGravity);
    gravityAt(anchor, scratchAnchorGravity); // refreshes the cache for subsequent calls this step
    return V.set(out,
      scratchBodyGravity.x - anchorAcceleration.x,
      scratchBodyGravity.y - anchorAcceleration.y,
      scratchBodyGravity.z - anchorAcceleration.z);
  }
  function differentialGravity(anchor, anchorAcceleration, local, out, scratchAbs, scratchAnchorGravity, scratchBodyGravity) {
    const V = Game.Vec3;
    const r2 = V.lengthSq(anchor);
    if (!(r2 > 0)) return V.set(out, 0, 0, 0);
    const d = V.length(local), r = Math.sqrt(r2);
    if (d / r < RATIO_LINEAR) return differentialGravityLinearized(anchor, anchorAcceleration, local, out, scratchAnchorGravity);
    return differentialGravityExact(anchor, anchorAcceleration, local, out, scratchAbs, scratchAnchorGravity, scratchBodyGravity);
  }
  return { gravityAt, tidalAccelerationDelta, differentialGravity, differentialGravityLinearized, differentialGravityExact, RATIO_LINEAR };
})();

// ---------------------------------------------------------------------------
// SECTION: CLOCK — deterministic fixed-step accumulator, doc §64.7 (converted
// from a TS class to a closure factory, consistent with the rest of this file).
// ---------------------------------------------------------------------------
Game.Clock = (function () {
  function createFixedStepClock(fixedDt, maxStepsPerFrame, maxFrameDt) {
    let accumulator = 0, simulationTimeSeconds = 0;
    function advance(realDt, step) {
      const dt = Math.min(Math.max(realDt, 0), maxFrameDt);
      accumulator += dt;
      let steps = 0;
      while (accumulator >= fixedDt && steps < maxStepsPerFrame) {
        step(fixedDt, simulationTimeSeconds);
        simulationTimeSeconds += fixedDt;
        accumulator -= fixedDt;
        steps++;
      }
      if (accumulator >= fixedDt) accumulator %= fixedDt;
      return accumulator / fixedDt;
    }
    return { advance, get timeSeconds() { return simulationTimeSeconds; } };
  }
  return { createFixedStepClock };
})();

// ---------------------------------------------------------------------------
// SECTION: NAV — map compression, doc §7.1. Display-only; must never feed
// physics, AI, collision, radar, or warp-route calculations (doc's own rule).
// ---------------------------------------------------------------------------
Game.Nav = (function () {
  function navCompressAxis(au) {
    const scale = 5, k = 0.1;
    return Math.sign(au) * scale * Math.log10(1 + Math.abs(au) / k);
  }
  function navDecompressAxis(mapUnits) { // inverse of navCompressAxis; not given in the doc, derived here.
    const scale = 5, k = 0.1;
    const sign = Math.sign(mapUnits);
    return sign * (k * (Math.pow(10, Math.abs(mapUnits) / scale) - 1));
  }
  return { navCompressAxis, navDecompressAxis };
})();

// ---------------------------------------------------------------------------
// SECTION: SYSTEM BODIES — example canonical configuration, doc §8.1. Data
// only, used so far just to exercise the Kepler solver with real numbers.
// ---------------------------------------------------------------------------
Game.SystemBodies = [
  { id: "cinder", aAU: 4, e: 0.10, type: "planet" },
  { id: "forge", aAU: 15, e: 0.04, type: "planet" },
  { id: "haven", aAU: 21.5, e: 0.02, type: "planet" },
  { id: "bastion", aAU: 50, e: 0.08, type: "planet" },
  { id: "veil", aAU: 100, e: 0.05, type: "planet" },
  { id: "leviathan", aAU: 300, e: 0.04, type: "gasGiant" },
  { id: "exile", aAU: 1000, e: 0.12, type: "iceGiant" },
  { id: "phantom", aAU: 3000, e: 0.25, type: "dwarf" },
  { id: "companion", aAU: 35, e: 0.10, type: "kDwarf" },
];

// ---------------------------------------------------------------------------
// SECTION: RENDER SNAPSHOT — doc §52.3, verbatim shape. Renderer interpolates
// with one frame-level alpha and must never feed the interpolated value back
// into simulation -- enforced here by `sample` only writing to caller-supplied
// out params, never touching the snapshot's own previous/current fields.
// ---------------------------------------------------------------------------
Game.RenderSnapshot = (function () {
  function create(entityId, positionMeters, orientation) {
    return {
      entityId,
      previousPositionMeters: Game.Vec3.v3(positionMeters.x, positionMeters.y, positionMeters.z),
      currentPositionMeters: Game.Vec3.v3(positionMeters.x, positionMeters.y, positionMeters.z),
      previousOrientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w },
      currentOrientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w },
      visible: true,
    };
  }
  function commit(snapshot, newPositionMeters, newOrientation) {
    Game.Vec3.copy(snapshot.previousPositionMeters, snapshot.currentPositionMeters);
    Game.Vec3.copy(snapshot.currentPositionMeters, newPositionMeters);
    const po = snapshot.previousOrientation, co = snapshot.currentOrientation;
    po.x = co.x; po.y = co.y; po.z = co.z; po.w = co.w;
    co.x = newOrientation.x; co.y = newOrientation.y; co.z = newOrientation.z; co.w = newOrientation.w;
  }
  function sample(snapshot, alpha, outPosition, outOrientation) {
    const p = snapshot.previousPositionMeters, c = snapshot.currentPositionMeters;
    outPosition.x = p.x + (c.x - p.x) * alpha;
    outPosition.y = p.y + (c.y - p.y) * alpha;
    outPosition.z = p.z + (c.z - p.z) * alpha;
    Game.Quat.qSlerp(outOrientation, snapshot.previousOrientation, snapshot.currentOrientation, alpha);
    return { position: outPosition, orientation: outOrientation };
  }
  // doc §52.6: "newPreviousPosition = oldPreviousPosition - offset", applied to both
  // stored positions so a rebase mid-interpolation never produces a visible jump.
  function rebaseShift(snapshot, offset) {
    snapshot.previousPositionMeters.x -= offset.x; snapshot.previousPositionMeters.y -= offset.y; snapshot.previousPositionMeters.z -= offset.z;
    snapshot.currentPositionMeters.x -= offset.x; snapshot.currentPositionMeters.y -= offset.y; snapshot.currentPositionMeters.z -= offset.z;
  }
  return { create, commit, sample, rebaseShift };
})();

// ---------------------------------------------------------------------------
// SECTION: ENCOUNTER MANAGER — activation/deactivation hysteresis, doc §52.4.
// Pure decision logic only; no spawning/despawning of real entities yet (no
// ship/AI entities exist to spawn -- that's Stage D).
// ---------------------------------------------------------------------------
Game.EncounterManager = (function () {
  function createTracker() { return { active: false }; }
  function update(tracker, distanceMeters) {
    const c = Game.Constants;
    if (!tracker.active && distanceMeters <= c.ENCOUNTER_ACTIVATION_RADIUS_M) { tracker.active = true; return "ACTIVATED"; }
    if (tracker.active && distanceMeters >= c.ENCOUNTER_DEACTIVATION_RADIUS_M) { tracker.active = false; return "DEACTIVATED"; }
    return "UNCHANGED";
  }
  return { createTracker, update };
})();

// ---------------------------------------------------------------------------
// SECTION: ENCOUNTER FRAME + REBASE — doc §6.3/6.5/52.6. Rebase now also
// shifts each body's RenderSnapshot history, satisfying invariant 3 ("new
// previous position = old previous position - offset") now that snapshots
// exist; the Stage B version only moved raw positions.
// ---------------------------------------------------------------------------
Game.Encounter = (function () {
  function createFrame(anchorPositionMeters, anchorVelocityMps, anchorAccelerationMps2) {
    return {
      anchorPositionMeters: Game.Vec3.v3(anchorPositionMeters.x, anchorPositionMeters.y, anchorPositionMeters.z),
      anchorVelocityMps: Game.Vec3.v3(anchorVelocityMps.x, anchorVelocityMps.y, anchorVelocityMps.z),
      anchorAccelerationMps2: Game.Vec3.v3(anchorAccelerationMps2.x, anchorAccelerationMps2.y, anchorAccelerationMps2.z),
    };
  }
  function rebaseEncounter(frame, bodies, player) {
    const dx = player.positionMeters.x, dy = player.positionMeters.y, dz = player.positionMeters.z;
    const offset = { x: dx, y: dy, z: dz };
    frame.anchorPositionMeters.x += dx; frame.anchorPositionMeters.y += dy; frame.anchorPositionMeters.z += dz;
    for (const body of bodies) {
      body.positionMeters.x -= dx; body.positionMeters.y -= dy; body.positionMeters.z -= dz;
      if (body.snapshot) Game.RenderSnapshot.rebaseShift(body.snapshot, offset);
      // velocity untouched: invariant 2 -- a pure origin translation changes no local velocity.
    }
  }
  return { createFrame, rebaseEncounter };
})();

// ---------------------------------------------------------------------------
// SECTION: PHYSICS WORLD — the actual per-tick stepping loop (PhysicsWorld.ts
// in the doc's module list). Integrator is semi-implicit (symplectic) Euler --
// not specified verbatim in the doc, but the standard stable default for
// fixed-step real-time game physics of this kind.
// ---------------------------------------------------------------------------
Game.PhysicsWorld = (function () {
  function createBody(id, positionMeters, velocityMps, orientation) {
    return {
      id,
      positionMeters: Game.Vec3.v3(positionMeters.x, positionMeters.y, positionMeters.z),
      velocityMps: Game.Vec3.v3(velocityMps.x, velocityMps.y, velocityMps.z),
      orientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w },
      snapshot: Game.RenderSnapshot.create(id, positionMeters, orientation),
      thrustAccelMps2: Game.Vec3.v3(0, 0, 0), // ships only; flight controller writes this before step()
    };
  }
  function createScratch() {
    return { accel: Game.Vec3.v3(), abs: Game.Vec3.v3(), anchorGravity: Game.Vec3.v3(), bodyGravity: Game.Vec3.v3() };
  }
  function step(frame, bodies, dtSeconds, scratch) {
    // Refresh the anchor-gravity cache once per tick so every body's fast linearized
    // path can use it without recomputing per body -- see differentialGravity's
    // calling contract in Game.Gravity.
    Game.Gravity.gravityAt(frame.anchorPositionMeters, scratch.anchorGravity);
    for (const body of bodies) {
      Game.Gravity.differentialGravity(
        frame.anchorPositionMeters, frame.anchorAccelerationMps2, body.positionMeters,
        scratch.accel, scratch.abs, scratch.anchorGravity, scratch.bodyGravity
      );
      // doc §6.4: a_local = gravity term (above) + thrust + local forces. Bodies with no
      // thrust (asteroids, Stage C's test probes) get thrustAccelMps2 = (0,0,0) and this
      // is a no-op, so Stage C's own tests are unaffected by this extension.
      scratch.accel.x += body.thrustAccelMps2.x;
      scratch.accel.y += body.thrustAccelMps2.y;
      scratch.accel.z += body.thrustAccelMps2.z;
      Game.Vec3.addScaled(body.velocityMps, body.velocityMps, scratch.accel, dtSeconds);
      Game.Vec3.addScaled(body.positionMeters, body.positionMeters, body.velocityMps, dtSeconds);
      Game.RenderSnapshot.commit(body.snapshot, body.positionMeters, body.orientation);
    }
  }
  return { createBody, createScratch, step };
})();

// ---------------------------------------------------------------------------
// SECTION: STRATEGIC -> LOCAL CONVERSION — doc §65 item 19, activation side
// only (Kepler state -> local encounter-frame state). The deactivation side
// (local state vector -> new osculating Kepler elements, classical "rv2coe")
// is a distinct algorithm, deferred until something can actually leave a
// bubble -- needs Stage D ships to exist first.
// ---------------------------------------------------------------------------
Game.StrategicConversion = (function () {
  function strategicToLocalState(orbit, tSeconds, anchorPositionMeters, anchorVelocityMps) {
    const s = Game.Orbits.orbitalStateAtTime(orbit, tSeconds);
    return {
      positionMeters: Game.Vec3.v3(s.position.x - anchorPositionMeters.x, s.position.y - anchorPositionMeters.y, s.position.z - anchorPositionMeters.z),
      velocityMps: Game.Vec3.v3(s.velocity.x - anchorVelocityMps.x, s.velocity.y - anchorVelocityMps.y, s.velocity.z - anchorVelocityMps.z),
    };
  }
  return { strategicToLocalState };
})();

// ---------------------------------------------------------------------------
// SECTION: TOUCH INPUT — dual virtual stick overlay, plain DOM over the canvas
// (never enters the WebGL pipeline). Drafted externally (Fable 5 and Opus,
// two independent attempts at the same spec) and reviewed here: both were
// tested against 18 synthetic pointer-event scenarios in jsdom (idle state,
// dead-zone boundary, full deflection sign conventions on both axes, two
// pads held independently and simultaneously, a second finger landing on an
// already-owned pad correctly ignored, pointercancel, clean re-press,
// detach cleanup) -- both passed all 18 identically, so the core math and
// pointer-ownership logic in both were correct.
//
// Two real, confirmed differences decided the merge:
//   1. Window-blur / visibility-change safety net. Verified empirically: the
//      version WITHOUT it leaves thrust latched at full deflection after a
//      simulated 'blur' event with no pointerup/pointercancel -- exactly the
//      "ship accelerates forever in the background" failure mode. Kept.
//   2. Pad-size-aware max travel radius (computed from the actual rendered
//      element via getBoundingClientRect + knob offsetWidth) instead of a
//      constant tied to one specific hardcoded CSS size. Kept for the same
//      reason Stage B kept Vec3d engine-independent: a magic number that's
//      silently wrong the moment someone edits the CSS is a bug waiting to
//      happen, not a simplification.
// One deliberate simplification on top of both: no INVERT_PITCH toggle in
// the widget itself. The convention is fixed and documented below; a flight-
// assist setting that flips it belongs in the flight controller, per the
// plan's own §52.2 boundary ("input produces commands; the controller
// decides what a command means") -- not duplicated as a second, hidden knob
// inside the input widget.
//
// AXIS CONVENTION (screen-space Y inverted before output, both pads):
//   leftX  : +1 strafe right,  -1 strafe left
//   leftY  : +1 forward (thumb toward top of screen), -1 back/brake
//   rightX : +1 yaw right,     -1 yaw left
//   rightY : +1 pitch nose up (thumb toward top of screen), -1 nose down
//
// STILL NEEDS A REAL PHONE: multi-touch pointer capture across two
// simultaneous fingers can't be fully verified without an actual touchscreen
// (jsdom doesn't implement setPointerCapture at all -- calls are caught and
// no-op). The live readout at the bottom of the screen is exactly for that:
// hold both pads and confirm the four numbers respond correctly to each thumb
// independently before anything is built on top of this.
// ---------------------------------------------------------------------------
Game.TouchInput = (function () {
  "use strict";

  const DEAD_ZONE_FRAC = 0.16;
  const KNOB_STEP = 0.5; // px quantization; skips redundant style writes on sub-pixel jitter

  let mounted = false;
  let rootEl = null;
  let styleEl = null;

  const outState = { leftX: 0, leftY: 0, rightX: 0, rightY: 0 };

  function makePad(side) {
    return {
      side, el: null, knob: null, pointerId: -1,
      cx: 0, cy: 0, maxR: 1, deadR: 0,
      lastClientX: 0, lastClientY: 0, knobX: 0, knobY: 0,
      hDown: null, hMove: null, hUp: null, hCancel: null, hLost: null,
    };
  }
  const padLeft = makePad("left");
  const padRight = makePad("right");
  const pads = [padLeft, padRight];

  const CSS_TEXT =
    '.ti-root{position:fixed;inset:0;z-index:20;pointer-events:none;touch-action:none;' +
    'overscroll-behavior:none;-webkit-user-select:none;user-select:none;' +
    '-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}' +
    '.ti-pad{position:absolute;bottom:calc(22px + env(safe-area-inset-bottom,0px));' +
    'width:148px;height:148px;border-radius:50%;pointer-events:auto;touch-action:none;' +
    'contain:layout style;border:1px solid rgba(186,204,222,.16);' +
    'background:radial-gradient(circle at 50% 50%,rgba(140,172,200,.045) 0%,' +
    'rgba(140,172,200,.018) 62%,rgba(0,0,0,0) 73%);' +
    'box-shadow:inset 0 0 26px rgba(120,160,200,.045);opacity:.72;' +
    'transition:opacity 120ms linear,border-color 120ms linear;-webkit-user-drag:none}' +
    '.ti-pad--left{left:calc(26px + env(safe-area-inset-left,0px))}' +
    '.ti-pad--right{right:calc(26px + env(safe-area-inset-right,0px))}' +
    ".ti-pad::before{content:'';position:absolute;left:50%;top:50%;width:26px;height:26px;" +
    "margin:-13px 0 0 -13px;border-radius:50%;border:1px solid rgba(186,204,222,.09)}" +
    ".ti-pad::after{content:'';position:absolute;left:50%;top:50%;width:1px;height:1px;" +
    "box-shadow:0 -58px 0 0 rgba(186,204,222,.10),0 58px 0 0 rgba(186,204,222,.10)," +
    "-58px 0 0 0 rgba(186,204,222,.10),58px 0 0 0 rgba(186,204,222,.10)}" +
    ".ti-pad.ti-active{opacity:1;border-color:rgba(206,224,240,.30)}" +
    ".ti-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;" +
    "border-radius:50%;border:1px solid rgba(206,224,240,.26);background:rgba(18,24,30,.42);" +
    "box-shadow:0 0 10px rgba(0,0,0,.55),inset 0 0 9px rgba(160,190,220,.055);" +
    "transform:translate3d(0,0,0);will-change:transform}" +
    ".ti-pad.ti-active .ti-knob{border-color:rgba(216,234,248,.42);background:rgba(26,34,42,.52)}" +
    "@media (max-height:420px){.ti-pad{width:124px;height:124px;" +
    "bottom:calc(14px + env(safe-area-inset-bottom,0px))}" +
    ".ti-knob{width:48px;height:48px;margin:-24px 0 0 -24px}}";

  function injectCss() {
    if (styleEl) return;
    styleEl = document.createElement("style");
    styleEl.id = "ti-style";
    styleEl.textContent = CSS_TEXT;
    document.head.appendChild(styleEl);
  }

  function measure(pad) {
    const r = pad.el.getBoundingClientRect();
    pad.cx = r.left + r.width * 0.5;
    pad.cy = r.top + r.height * 0.5;
    const knobR = pad.knob.offsetWidth * 0.5;
    pad.maxR = Math.max(8, r.width * 0.5 - knobR);
    pad.deadR = pad.maxR * DEAD_ZONE_FRAC;
  }
  function measureAll() {
    if (!mounted) return;
    for (const p of pads) {
      measure(p);
      if (p.pointerId !== -1) solve(p, p.lastClientX, p.lastClientY);
    }
  }

  // Fixed convention, both pads: screen-up is positive. No internal invert
  // toggle -- see header note.
  function writeOut(pad, x, y) {
    if (pad.side === "left") { outState.leftX = x; outState.leftY = -y; }
    else { outState.rightX = x; outState.rightY = -y; }
  }

  function drawKnob(pad, x, y) {
    const qx = Math.round(x / KNOB_STEP) * KNOB_STEP;
    const qy = Math.round(y / KNOB_STEP) * KNOB_STEP;
    if (qx === pad.knobX && qy === pad.knobY) return;
    pad.knobX = qx; pad.knobY = qy;
    pad.knob.style.transform = "translate3d(" + qx + "px," + qy + "px,0)";
  }

  function solve(pad, clientX, clientY) {
    pad.lastClientX = clientX; pad.lastClientY = clientY;
    let dx = clientX - pad.cx, dy = clientY - pad.cy;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > pad.maxR) { const s = pad.maxR / dist; dx *= s; dy *= s; dist = pad.maxR; }
    drawKnob(pad, dx, dy);
    if (dist > pad.deadR) {
      const norm = (dist - pad.deadR) / (pad.maxR - pad.deadR);
      const inv = norm / dist;
      writeOut(pad, dx * inv, dy * inv);
    } else {
      writeOut(pad, 0, 0);
    }
  }

  function release(pad) {
    if (pad.pointerId === -1) return;
    try { pad.el.releasePointerCapture(pad.pointerId); } catch (_e) { /* already released */ }
    pad.pointerId = -1;
    pad.el.classList.remove("ti-active");
    drawKnob(pad, 0, 0);
    writeOut(pad, 0, 0);
  }
  function releaseAll() { for (const p of pads) release(p); }

  function onDown(pad, e) {
    if (pad.pointerId !== -1) return; // pad already owned: ignore every other finger
    if (e.pointerType === "mouse" && e.button !== 0) return; // left-click only on desktop
    e.preventDefault();
    pad.pointerId = e.pointerId;
    measure(pad);
    try { pad.el.setPointerCapture(e.pointerId); } catch (_e) { /* non-fatal */ }
    pad.el.classList.add("ti-active");
    solve(pad, e.clientX, e.clientY);
  }
  function onMove(pad, e) { if (e.pointerId === pad.pointerId) { e.preventDefault(); solve(pad, e.clientX, e.clientY); } }
  function onUp(pad, e) { if (e.pointerId === pad.pointerId) { e.preventDefault(); release(pad); } }
  function onCancel(pad, e) { if (e.pointerId === pad.pointerId) release(pad); }
  function onLostCapture(pad, e) { if (e.pointerId === pad.pointerId) release(pad); }
  // A stuck stick means a ship thrusting forever -- an incoming call, an OS edge
  // gesture, or the app losing focus must all zero the output even if the
  // browser never gets around to firing pointercancel for the held pointer.
  function onWindowBlur() { releaseAll(); }
  function onVisibility() { if (document.hidden) releaseAll(); }
  function onResize() { measureAll(); }
  function killEvent(e) { e.preventDefault(); }

  function buildPad(pad) {
    const el = document.createElement("div");
    el.className = "ti-pad ti-pad--" + pad.side;
    el.setAttribute("aria-hidden", "true");
    const knob = document.createElement("div");
    knob.className = "ti-knob";
    el.appendChild(knob);
    pad.el = el; pad.knob = knob;
    pad.hDown = (e) => onDown(pad, e);
    pad.hMove = (e) => onMove(pad, e);
    pad.hUp = (e) => onUp(pad, e);
    pad.hCancel = (e) => onCancel(pad, e);
    pad.hLost = (e) => onLostCapture(pad, e);
    el.addEventListener("pointerdown", pad.hDown, { passive: false });
    el.addEventListener("pointermove", pad.hMove, { passive: false });
    el.addEventListener("pointerup", pad.hUp, { passive: false });
    el.addEventListener("pointercancel", pad.hCancel, { passive: false });
    el.addEventListener("lostpointercapture", pad.hLost);
    el.addEventListener("contextmenu", killEvent, { passive: false });
    el.addEventListener("dragstart", killEvent, { passive: false });
    return el;
  }
  function teardownPad(pad) {
    if (!pad.el) return;
    release(pad);
    pad.el.removeEventListener("pointerdown", pad.hDown);
    pad.el.removeEventListener("pointermove", pad.hMove);
    pad.el.removeEventListener("pointerup", pad.hUp);
    pad.el.removeEventListener("pointercancel", pad.hCancel);
    pad.el.removeEventListener("lostpointercapture", pad.hLost);
    pad.el.removeEventListener("contextmenu", killEvent);
    pad.el.removeEventListener("dragstart", killEvent);
    if (pad.el.parentNode) pad.el.parentNode.removeChild(pad.el);
    pad.el = null; pad.knob = null;
    pad.hDown = pad.hMove = pad.hUp = pad.hCancel = pad.hLost = null;
  }

  function attach(container) {
    if (mounted) return;
    const host = container || document.body;
    injectCss();
    rootEl = document.createElement("div");
    rootEl.className = "ti-root";
    rootEl.appendChild(buildPad(padLeft));
    rootEl.appendChild(buildPad(padRight));
    host.appendChild(rootEl);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibility);
    mounted = true;
    measureAll();
  }
  function getState() { return outState; }
  function detach() {
    if (!mounted) return;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    window.removeEventListener("blur", onWindowBlur);
    document.removeEventListener("visibilitychange", onVisibility);
    teardownPad(padLeft); teardownPad(padRight);
    if (rootEl && rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
    rootEl = null;
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    styleEl = null;
    outState.leftX = outState.leftY = outState.rightX = outState.rightY = 0;
    mounted = false;
  }

  return { attach, getState, detach };
})();


// ---------------------------------------------------------------------------
// SECTION: SPRING — exact closed-form critically-damped harmonic oscillator.
// Doc §15.4 gives the camera's spring as "acceleration = stiffness x error -
// damping x velocity"; damping is fixed at the critical value (2*omega) here
// so it converges as fast as possible with no overshoot/oscillation,
// regardless of dt (verified: a single 5-second step doesn't blow up).
// ---------------------------------------------------------------------------
Game.Spring = (function () {
  function stepCriticallyDamped(e0, v0, omega, dt) {
    const ex = Math.exp(-omega * dt);
    const newE = (e0 + (v0 + omega * e0) * dt) * ex;
    const newV = (v0 - omega * (v0 + omega * e0) * dt) * ex;
    return { e: newE, v: newV };
  }
  return { stepCriticallyDamped };
})();

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

// ---------------------------------------------------------------------------
// SECTION: KEYBOARD INPUT — desktop TESTING SUPPLEMENT only, not a designed
// desktop control scheme (that needs mouse-look + remappable bindings, a
// separate later feature). Exists so roll and vertical strafe -- unreachable
// from two 2D touch pads -- can be exercised at all right now. WASD+arrows+
// QE+Space, not final key bindings.
// ---------------------------------------------------------------------------
Game.KeyboardInput = (function () {
  const keys = Object.create(null);
  const state = { thrust: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0, roll: 0 };

  function axis(negCode, posCode) { return (keys[posCode] ? 1 : 0) - (keys[negCode] ? 1 : 0); }
  function recompute() {
    state.thrust = axis("KeyS", "KeyW");
    state.yaw = axis("KeyA", "KeyD");
    state.roll = axis("KeyQ", "KeyE");
    state.pitch = axis("ArrowDown", "ArrowUp");
    state.strafe = axis("ArrowLeft", "ArrowRight");
    state.vertical = axis("ShiftLeft", "Space") || axis("ShiftRight", "Space");
  }
  function onDown(e) { keys[e.code] = true; recompute(); }
  function onUp(e) { keys[e.code] = false; recompute(); }
  function onBlur() { for (const k in keys) keys[k] = false; recompute(); }

  let attached = false;
  function attach() {
    if (attached) return;
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    attached = true;
  }
  function getState() { return state; }
  return { attach, getState };
})();


// ---------------------------------------------------------------------------
// SECTION: DETERMINISTIC RNG + SEED STATE — Stage A item 5.
// mulberry32, restructured so internal state is inspectable/restorable
// (needed later for save/checkpoint integration, Stage I).
// ---------------------------------------------------------------------------
Game.Rng = (function () {
  function createRng(seed) {
    let state = seed >>> 0;
    function next() {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      next,
      getState: () => state >>> 0,
      setState: (s) => { state = s >>> 0; },
    };
  }
  return { createRng };
})();

// ---------------------------------------------------------------------------
// SECTION: STABLE ENTITY IDS — Stage A item 3.
// ---------------------------------------------------------------------------
Game.Ids = (function () {
  const counters = Object.create(null);
  function createId(prefix) {
    const p = prefix || "id";
    counters[p] = (counters[p] || 0) + 1;
    return p + "_" + String(counters[p]).padStart(6, "0");
  }
  return { createId };
})();

// ---------------------------------------------------------------------------
// SECTION: COMMAND / EVENT CONTRACTS — Stage A item 4.
// ---------------------------------------------------------------------------
Game.Messages = (function () {
  /** @typedef {{type: string, payload: any, id: string, tMs: number}} Command */
  /** @typedef {{type: string, payload: any, id: string, tMs: number}} GameEvent */
  /** @returns {Command} */
  function createCommand(type, payload) {
    return { type, payload: payload === undefined ? null : payload, id: Game.Ids.createId("cmd"), tMs: performance.now() };
  }
  /** @returns {GameEvent} */
  function createEvent(type, payload) {
    return { type, payload: payload === undefined ? null : payload, id: Game.Ids.createId("evt"), tMs: performance.now() };
  }
  function createQueue() {
    const items = [];
    return {
      push: (item) => items.push(item),
      drain: () => items.splice(0, items.length),
      get length() { return items.length; },
    };
  }
  return { createCommand, createEvent, createQueue };
})();

// ---------------------------------------------------------------------------
// SECTION: FOUNDATION SELF-TEST — Stage B item 7, "independent boot validation."
// Recomputes the doc's §5.1/§5.2 reference values from the formulas above and
// asserts tolerance, so a bad constant or unit slip fails loudly instead of
// silently. Orbital table abbreviated to 3 representative rows (near/mid/far)
// to fit a phone screen; all 8 rows were checked in Node before shipping this file.
// ---------------------------------------------------------------------------
Game.SelfTest = (function () {
  function pctErr(actual, expected) { return Math.abs(actual - expected) / expected * 100; }

  function run() {
    const c = Game.Constants;
    const results = [];
    function check(label, actual, expected, tolPct) {
      const err = pctErr(actual, expected);
      results.push({ label, actual, expected, err, pass: err <= tolPct });
    }

    check("Schwarzschild radius (km)", c.BH_RS / 1000, 29533, 0.1);
    check("Horizon diameter (km)", (2 * c.BH_EVENT_HORIZON_RADIUS) / 1000, 59067, 0.1);
    check("Photon sphere (km)", c.BH_PHOTON_SPHERE_RADIUS / 1000, 44300, 0.1);
    check("Shadow radius (km)", c.BH_SHADOW_RADIUS / 1000, 76700, 0.1);
    check("ISCO (km)", c.BH_ISCO_RADIUS / 1000, 88600, 0.1);

    const table = [
      [21.5, 642.4, 1],
      [1000, 94.2, 316],
      [3000, 54.4, 1643],
    ];
    for (const [rAU, vKmS, tYears] of table) {
      const rM = rAU * c.AU;
      check("v @ " + rAU + " AU (km/s)", c.circularOrbitalVelocity(rM) / 1000, vKmS, 0.5);
      check("T @ " + rAU + " AU (yr)", c.circularOrbitalPeriod(rM) / c.JULIAN_YEAR, tYears, 1.0);
    }

    const r1 = Game.Rng.createRng(12345);
    const r2 = Game.Rng.createRng(12345);
    const seqA = [r1.next(), r1.next(), r1.next()];
    const seqB = [r2.next(), r2.next(), r2.next()];
    const rngOk = seqA.every((v, i) => v === seqB[i]) && seqA.every((v) => v >= 0 && v < 1);
    results.push({ label: "Deterministic RNG (same seed -> same sequence)", actual: rngOk ? 1 : 0, expected: 1, err: rngOk ? 0 : 100, pass: rngOk });

    // --- Stage B math spine (full 79-assertion sweep run in Node before this
    // file was touched; this is a representative subset for on-device proof) ---
    const V = Game.Vec3, Q = Game.Quat, O = Game.Orbits, Gr = Game.Gravity;

    const crossOut = V.v3(0, 0, 0);
    V.cross(crossOut, V.v3(1, 0, 0), V.v3(0, 1, 0));
    results.push({ label: "Vec3 cross((1,0,0),(0,1,0)) = (0,0,1)", actual: crossOut.z, expected: 1, err: Math.abs(crossOut.z - 1) * 100, pass: Math.abs(crossOut.x) < 1e-12 && Math.abs(crossOut.y) < 1e-12 && Math.abs(crossOut.z - 1) < 1e-12 });

    const qz = { x: 0, y: 0, z: 0, w: 1 };
    Q.qFromAxisAngle(qz, { x: 0, y: 0, z: 1 }, Math.PI / 2);
    const rotOut = { x: 0, y: 0, z: 0 };
    Q.qRotateVector(rotOut, qz, { x: 1, y: 0, z: 0 });
    check("Quat: rotate (1,0,0) 90deg about Z -> (0,1,0)", rotOut.y, 1, 0.01);

    let maxKeplerResidual = 0;
    for (const e of [0.02, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99]) {
      for (const M of [0.01, 0.5, 1.0, 2.0, 3.0, -1.5]) {
        const E = O.solveKepler(M, e);
        maxKeplerResidual = Math.max(maxKeplerResidual, Math.abs(E - e * Math.sin(E) - O.wrapPi(M)));
      }
    }
    results.push({ label: "Kepler solver residual, max over 42 (e,M) pairs", actual: maxKeplerResidual, expected: 0, err: maxKeplerResidual * 1e11, pass: maxKeplerResidual < 1e-9 });

    const haven = Game.SystemBodies.find((b) => b.id === "haven");
    const havenOrbit = O.initializeOrbit({ semiMajorAxisAU: haven.aAU, eccentricity: haven.e, inclinationRadians: 0, longitudeAscendingNodeRadians: 0, argumentOfPeriapsisRadians: 0, meanAnomalyAtEpochRadians: 0, epochSeconds: 0 });
    const havenPeri = O.orbitalStateAtTime(havenOrbit, 0);
    const havenPeriAU = V.length(havenPeri.position) / c.AU;
    check("haven periapsis distance (AU), via full Kepler pipeline", havenPeriAU, haven.aAU * (1 - haven.e), 0.01);
    const havenVisViva = Math.sqrt(c.BH_MU * (2 / V.length(havenPeri.position) - 1 / havenOrbit.semiMajorAxisMeters)) / 1000;
    check("haven periapsis speed (km/s) matches vis-viva", V.length(havenPeri.velocity) / 1000, havenVisViva, 0.01);

    const gTest = V.v3(0, 0, 0);
    Gr.gravityAt({ x: c.AU, y: 0, z: 0 }, gTest);
    check("gravity magnitude at 1 AU matches GM/r^2 (m/s^2 x1e6)", V.length(gTest) * 1e6, (c.BH_MU / (c.AU * c.AU)) * 1e6, 0.01);
    const gHorizon = V.v3(0, 0, 0), gTenHorizon = V.v3(0, 0, 0);
    Gr.gravityAt({ x: c.BH_RS * 1.5, y: 0, z: 0 }, gHorizon);
    Gr.gravityAt({ x: c.BH_RS * 15, y: 0, z: 0 }, gTenHorizon);
    check("gravity keeps climbing near horizon, no clamp (ratio should be 100)", V.length(gHorizon) / V.length(gTenHorizon), 100, 0.5);

    const dgAnchor = { x: 21.5 * c.AU, y: 0, z: 0 };
    const dgAnchorGravity = V.v3(0, 0, 0);
    Gr.gravityAt(dgAnchor, dgAnchorGravity);
    const dgLocal = { x: c.COMBAT_BUBBLE_RADIUS_M * 0.6, y: c.COMBAT_BUBBLE_RADIUS_M * 0.3, z: -c.COMBAT_BUBBLE_RADIUS_M * 0.2 };
    const dgLin = V.v3(0, 0, 0);
    Gr.differentialGravityLinearized(dgAnchor, dgAnchorGravity, dgLocal, dgLin, dgAnchorGravity);
    const dgExact = V.v3(0, 0, 0), dgScratchAbs = V.v3(0, 0, 0), dgScratchAnchor = V.v3(dgAnchorGravity.x, dgAnchorGravity.y, dgAnchorGravity.z), dgScratchBody = V.v3(0, 0, 0);
    Gr.differentialGravityExact(dgAnchor, dgAnchorGravity, dgLocal, dgExact, dgScratchAbs, dgScratchAnchor, dgScratchBody);
    const dgDiff = { x: 0, y: 0, z: 0 };
    V.sub(dgDiff, dgLin, dgExact);
    const dgRelPct = (V.length(dgDiff) / V.length(dgExact)) * 100;
    results.push({ label: "Differential gravity: linearized vs exact @ 8,000km bubble, 21.5 AU", actual: dgRelPct, expected: 0, err: dgRelPct, pass: dgRelPct < 0.01 });

    const clockSteps = [];
    const testClock = Game.Clock.createFixedStepClock(1 / 120, 8, 0.10);
    testClock.advance((1 / 120) * 3.4, (dt, t) => clockSteps.push(t));
    results.push({ label: "Fixed-step clock: 3.4 ticks of real time -> 3 physics steps", actual: clockSteps.length, expected: 3, err: Math.abs(clockSteps.length - 3) * 100, pass: clockSteps.length === 3 });

    const navBack = Game.Nav.navDecompressAxis(Game.Nav.navCompressAxis(1000));
    check("Map compression round-trip @ 1000 AU", navBack, 1000, 0.001);

    // --- Stage C: encounter spine (26 assertions run in Node before shipping;
    // representative subset below) ---
    const tracker = Game.EncounterManager.createTracker();
    const hystSeq = [[20e6, "UNCHANGED"], [10e6, "ACTIVATED"], [14e6, "UNCHANGED"], [17e6, "DEACTIVATED"], [13e6, "UNCHANGED"]];
    let hystOk = true;
    for (const [dist, expected] of hystSeq) { if (Game.EncounterManager.update(tracker, dist) !== expected) hystOk = false; }
    results.push({ label: "Hysteresis: no flapping inside the 12k-16km band", actual: hystOk ? 1 : 0, expected: 1, err: hystOk ? 0 : 100, pass: hystOk });

    const havenOrbit2 = O.initializeOrbit({ semiMajorAxisAU: haven.aAU, eccentricity: haven.e, inclinationRadians: 0, longitudeAscendingNodeRadians: 0, argumentOfPeriapsisRadians: 0, meanAnomalyAtEpochRadians: 0.7, epochSeconds: 0 });
    const anchorState = O.orbitalStateAtTime(havenOrbit2, 0);
    const anchorG = V.v3(0, 0, 0);
    Gr.gravityAt(anchorState.position, anchorG);
    const testFrame = Game.Encounter.createFrame(anchorState.position, anchorState.velocity, anchorG);
    const localOffset = { x: c.COMBAT_BUBBLE_RADIUS_M * 0.5, y: 0, z: 0 };
    const probe = Game.PhysicsWorld.createBody("probe", localOffset, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
    const pwScratch = Game.PhysicsWorld.createScratch();
    for (let i = 0; i < 1200; i++) Game.PhysicsWorld.step(testFrame, [probe], c.PHYSICS_DT, pwScratch);
    const speedAfter = V.length(probe.velocityMps);
    results.push({ label: "PhysicsWorld: co-moving body does not inherit ~642,000 m/s bulk speed", actual: speedAfter, expected: 0, err: speedAfter, pass: speedAfter < 1 });

    const rebaseFrame = Game.Encounter.createFrame({ x: 1e6, y: 5e5, z: 0 }, { x: 100, y: 0, z: 0 }, { x: 0.01, y: 0, z: 0 });
    const rbA = Game.PhysicsWorld.createBody("a", { x: 3000, y: 1000, z: 0 }, { x: 5, y: -2, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
    const rbB = Game.PhysicsWorld.createBody("b", { x: -2000, y: 500, z: 0 }, { x: -1, y: 3, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
    const oldSep = V.length(V.sub(V.v3(), rbA.positionMeters, rbB.positionMeters));
    const oldAbsA = { x: rebaseFrame.anchorPositionMeters.x + rbA.positionMeters.x, y: rebaseFrame.anchorPositionMeters.y + rbA.positionMeters.y };
    Game.Encounter.rebaseEncounter(rebaseFrame, [rbA, rbB], rbA);
    const newSep = V.length(V.sub(V.v3(), rbA.positionMeters, rbB.positionMeters));
    const newAbsA = { x: rebaseFrame.anchorPositionMeters.x + rbA.positionMeters.x, y: rebaseFrame.anchorPositionMeters.y + rbA.positionMeters.y };
    const rebaseOk = Math.abs(newSep - oldSep) < 1e-6 && Math.abs(newAbsA.x - oldAbsA.x) < 1e-6 && Math.abs(newAbsA.y - oldAbsA.y) < 1e-6 && rbA.positionMeters.x === 0;
    results.push({ label: "Rebase: doc \u00a752.6 invariants (separation + absolute position preserved)", actual: rebaseOk ? 1 : 0, expected: 1, err: rebaseOk ? 0 : 100, pass: rebaseOk });

    return results;
  }

  function renderTo(el, results) {
    const failCount = results.filter((r) => !r.pass).length;
    const lines = [];
    lines.push('<span class="hdr">BLACK HOLE COMBAT — FOUNDATION BUILD</span>');
    lines.push('<span class="dim">Stage A+B complete, Stage C encounter spine — Babylon ' + (window.BABYLON && BABYLON.Engine && BABYLON.Engine.Version ? BABYLON.Engine.Version : "?") + '</span>');
    lines.push("");
    for (const r of results) {
      const cls = r.pass ? "pass" : "fail";
      const tag = r.pass ? "PASS" : "FAIL";
      lines.push(`<span class="${cls}">${tag}</span>  ${r.label}  <span class="dim">(got ${r.actual.toFixed(3)}, err ${r.err.toFixed(3)}%)</span>`);
    }
    lines.push("");
    lines.push(failCount === 0
      ? '<span class="pass">ALL ' + results.length + ' FOUNDATION CHECKS PASSED</span>'
      : '<span class="fail">' + failCount + " OF " + results.length + ' CHECKS FAILED — do not build on top of this until fixed</span>');
    el.innerHTML = lines.join("\n");
    return failCount;
  }

  return { run, renderTo };
})();

// ---------------------------------------------------------------------------
// SECTION: ENGINE BOOT — Stage D first-playable. The rotating wireframe
// icosahedron from Phase 0 is gone; there's a real ship now.
//
// World setup for this milestone: the encounter anchor rides haven's actual
// orbit (21.5 AU, e=0.02, same body used throughout Stage B/C testing) as a
// freely-falling frame (anchorAcceleration = gravity at the anchor, no
// thrust of its own). The ship starts co-moving with the anchor at the local
// origin. This is deliberately the SAME configuration already verified in
// Stage C (co-moving body drifts by tidal amounts only, ~0.014mm over 10s,
// not the anchor's actual ~642,000 m/s) -- flight is being added on top of
// an already-tested foundation, not a fresh, unverified setup.
//
// Render-time interpolation (RenderSnapshot, Stage C) drives the mesh so
// movement stays smooth regardless of actual frame rate; the fixed-step
// clock (Stage B) drives simulation at a constant 120Hz regardless of frame
// rate. Auto-rebase triggers past REANCHOR_THRESHOLD_M (50km) using the
// already-tested §52.6 rebase -- reachable quickly if you just hold thrust
// (5,000 m/s^2 for 10s covers roughly 250km), so this isn't a someday
// edge case, it's a first-session one.
// ---------------------------------------------------------------------------
Game.Boot = (function () {
  function start() {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    const camera = new BABYLON.UniversalCamera("chaseCam", new BABYLON.Vector3(0, 7, -20), scene);
    camera.minZ = 0.5;
    camera.fov = (68 * Math.PI) / 180; // Camera.fov is in RADIANS, not degrees (doc §15.4: ~68deg baseline)
    // No attachControl(): this camera is driven entirely by Game.ChaseCamera every frame,
    // not by user drag/scroll.

    const light = new BABYLON.HemisphericLight("bootLight", new BABYLON.Vector3(0.3, 1, 0.2), scene);
    light.intensity = 0.85;

    // --- Placeholder ship: procedural low-poly hull, doc §16.3's explicit allowance
    // for this phase. Tapered cylinder (narrow nose, wide tail) + one off-center fin
    // so "which way is forward" is unambiguous even face-on. Real ship art is doc
    // Phase 9, not now.
    const hull = BABYLON.MeshBuilder.CreateCylinder("shipHull", { height: 14, diameterTop: 1.6, diameterBottom: 4.2, tessellation: 8 }, scene);
    hull.rotation.x = Math.PI / 2; // lay the cylinder's long axis onto local +Z (forward)
    hull.bakeCurrentTransformIntoVertices();
    // NOTE: if the ship visually flies backward (nose trailing, not leading) once you're
    // actually flying it, this is the one line to flip -- change Math.PI/2 to -Math.PI/2,
    // or swap diameterTop/diameterBottom. It's a cosmetic mesh-alignment detail, fully
    // decoupled from the flight/orientation math (verified independently in Node) --
    // not a sign of a deeper bug either way.
    const fin = BABYLON.MeshBuilder.CreateBox("shipFin", { width: 0.3, height: 1.6, depth: 2.2 }, scene);
    fin.position.set(0, 1.1, -3);
    fin.parent = hull;
    const hullMat = new BABYLON.StandardMaterial("shipHullMat", scene);
    hullMat.diffuseColor = new BABYLON.Color3(0.55, 0.58, 0.62);
    hullMat.emissiveColor = new BABYLON.Color3(0.05, 0.07, 0.09);
    hull.material = hullMat;
    fin.material = hullMat;
    hull.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);

    // --- World: anchor riding haven's real orbit, ship co-moving at local origin ---
    const haven = Game.SystemBodies.find((b) => b.id === "haven");
    const havenOrbit = Game.Orbits.initializeOrbit({
      semiMajorAxisAU: haven.aAU, eccentricity: haven.e, inclinationRadians: 0,
      longitudeAscendingNodeRadians: 0, argumentOfPeriapsisRadians: 0,
      meanAnomalyAtEpochRadians: 0.7, epochSeconds: 0,
    });
    const anchorState0 = Game.Orbits.orbitalStateAtTime(havenOrbit, 0);
    const anchorGravity0 = Game.Vec3.v3();
    Game.Gravity.gravityAt(anchorState0.position, anchorGravity0);
    const frame = Game.Encounter.createFrame(anchorState0.position, anchorState0.velocity, anchorGravity0);
    let simTimeSeconds = 0;

    const ship = Game.PhysicsWorld.createBody("player", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
    ship.controlState = Game.FlightController.createShipControlState();
    const bodies = [ship];
    const physicsScratch = Game.PhysicsWorld.createScratch();
    const fixedClock = Game.Clock.createFixedStepClock(Game.Constants.PHYSICS_DT, Game.Constants.MAX_PHYSICS_STEPS_PER_RENDER, Game.Constants.MAX_ACCEPTED_FRAME_DT);

    const camState = Game.ChaseCamera.createState({ x: 0, y: 7, z: -20 });

    Game.TouchInput.attach(document.body);
    Game.KeyboardInput.attach();
    const touchDebugEl = document.getElementById("touchDebug");
    const speedHudEl = document.getElementById("speedHud");

    const renderPos = Game.Vec3.v3(), renderOri = { x: 0, y: 0, z: 0, w: 1 };

    function fixedStep(dt) {
      // Re-anchor the freely-falling frame's own reference orbit forward in time so the
      // anchor keeps riding haven's real trajectory rather than free-falling in a
      // straight line from a stale velocity snapshot.
      simTimeSeconds += dt;
      const anchorState = Game.Orbits.orbitalStateAtTime(havenOrbit, simTimeSeconds);
      Game.Vec3.copy(frame.anchorVelocityMps, anchorState.velocity);
      Game.Gravity.gravityAt(anchorState.position, frame.anchorAccelerationMps2);
      Game.Vec3.copy(frame.anchorPositionMeters, anchorState.position);

      const touch = Game.TouchInput.getState();
      const kb = Game.KeyboardInput.getState();
      const clamp11 = (v) => Math.max(-1, Math.min(1, v));
      const intent = {
        thrust: clamp11(touch.leftY + kb.thrust),
        strafe: clamp11(touch.leftX + kb.strafe),
        vertical: clamp11(kb.vertical), // no touch axis reaches this yet
        yaw: clamp11(touch.rightX + kb.yaw),
        pitch: clamp11(touch.rightY + kb.pitch),
        roll: clamp11(kb.roll), // no touch axis reaches this yet
      };
      Game.FlightController.update(ship, intent, dt);
      Game.PhysicsWorld.step(frame, bodies, dt, physicsScratch);

      // Doc §52.6 rebase, auto-triggered once the player's local position grows past
      // the re-anchor threshold -- already-tested machinery, exercised live for the
      // first time here.
      if (Game.Vec3.length(ship.positionMeters) > Game.Constants.REANCHOR_THRESHOLD_M) {
        Game.Encounter.rebaseEncounter(frame, bodies, ship);
      }
    }

    let lastFrameMs = performance.now();
    engine.runRenderLoop(() => {
      const nowMs = performance.now();
      const realDtSeconds = (nowMs - lastFrameMs) / 1000;
      lastFrameMs = nowMs;

      const alpha = fixedClock.advance(realDtSeconds, fixedStep);

      Game.RenderSnapshot.sample(ship.snapshot, alpha, renderPos, renderOri);
      hull.position.set(renderPos.x, renderPos.y, renderPos.z);
      hull.rotationQuaternion.set(renderOri.x, renderOri.y, renderOri.z, renderOri.w);

      const camResult = Game.ChaseCamera.update(camState, ship, Math.min(realDtSeconds, Game.Constants.MAX_ACCEPTED_FRAME_DT));
      camera.position.set(camResult.position.x, camResult.position.y, camResult.position.z);
      camera.setTarget(new BABYLON.Vector3(camResult.lookAt.x, camResult.lookAt.y, camResult.lookAt.z));

      scene.render();

      const t = Game.TouchInput.getState();
      touchDebugEl.textContent =
        "L(" + t.leftX.toFixed(2) + "," + t.leftY.toFixed(2) + ")   R(" + t.rightX.toFixed(2) + "," + t.rightY.toFixed(2) + ")";
      const speed = Game.Vec3.length(ship.velocityMps);
      speedHudEl.textContent = speed.toFixed(1) + " m/s  (" + ((speed / Game.Constants.SHIP_CRUISE_MAX) * 100).toFixed(3) + "% cruise)";
    });
    window.addEventListener("resize", () => engine.resize());

    return { engine, scene, camera, ship };
  }
  return { start };
})();

// ---------------------------------------------------------------------------
// BOOT SEQUENCE
// ---------------------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  const results = Game.SelfTest.run();
  const failCount = Game.SelfTest.renderTo(document.getElementById("diag"), results);
  if (failCount > 0) {
    console.error("[FOUNDATION] " + failCount + " check(s) failed:", results.filter((r) => !r.pass));
  } else {
    console.log("[FOUNDATION] all checks passed.");
  }
  Game.Boot.start();
});
