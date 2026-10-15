const Game = {};
// ---------------------------------------------------------------------------
// SECTION: LENS TABLES -- exact Schwarzschild null-geodesic lookup tables for
// a camera at a FIXED radius (rs = 1 units, u = 1/r).
//
// Why tables: tracing a geodesic per pixel is too heavy for phones, and the
// camera radius barely changes inside one arena (+-100 km against ~1e9 m),
// so ONE small table per arena gives per-pixel cost of a few texture fetches
// while staying exactly on the geodesic. (Approach in the spirit of Bruneton's
// "Real-time High-Quality Rendering of Non-Rotating Black Holes", which
// precomputes ray results; this version exploits the fixed-radius observer to
// avoid his 3-D tables.)
//
// Geometry: a ray traced BACKWARD from the camera lies in a plane through the
// black hole. Polar angle phi is measured in that plane from the camera's
// outward radial direction toward the ray's tangential direction. The orbit
// equation, with u = 1/r:
//        d2u/dphi2 = 1.5 u^2 - u,      (du/dphi)^2 = e^2 - u^2 (1 - u)
// where e = 1/b is the inverse impact parameter. For a static observer whose
// LOCAL angle between view direction and outward radial is psi:
//        du/dphi at start = -uc*sqrt(1-uc)*cot(psi)     (inbound => positive)
// Capture happens when u reaches 1 (the horizon).
//
// Table layout: rows = psi (three segments, dense near the critical angle
// where deflection diverges logarithmically), columns = phi in [0, phiMax].
// Texel = (u at phi, du/dphi at phi, S, 0); u = -1 once the ray has escaped or
// been captured. S = total polar sweep to infinity (the star-lookup direction
// is the radial axis rotated by S toward the tangent), or -1 if captured.
// ---------------------------------------------------------------------------
Game.LensTables = (function () {
  const PI = Math.PI;
  const B_CRIT = 1.5 * Math.sqrt(3); // 2.598 rs: critical impact parameter

  function psiCritical(rc) {
    const uc = 1 / rc;
    const s = B_CRIT * uc * Math.sqrt(1 - uc);
    return PI - Math.asin(Math.min(1, s));
  }

  // Backward-traced ray. Fills uOut/vOut (length nCols) at phi_j = j*phiMax/(nCols-1);
  // returns S (sweep to infinity) or -1 if captured / never resolved.
  function traceRay(psi, rc, phiMax, nCols, sub, uOut, vOut) {
    const uc = 1 / rc;
    const sinP = Math.sin(psi), cosP = Math.cos(psi);
    let u = uc;
    let v = -uc * Math.sqrt(1 - uc) * (cosP / sinP);
    const hCol = phiMax / (nCols - 1);
    const h = hCol / sub;
    let phi = 0;
    let alive = true;
    let S = -1;

    function step() {
      const k1u = v, k1v = 1.5 * u * u - u;
      const u2 = u + 0.5 * h * k1u, v2 = v + 0.5 * h * k1v;
      const k2u = v2, k2v = 1.5 * u2 * u2 - u2;
      const u3 = u + 0.5 * h * k2u, v3 = v + 0.5 * h * k2v;
      const k3u = v3, k3v = 1.5 * u3 * u3 - u3;
      const u4 = u + h * k3u, v4 = v + h * k3v;
      const k4u = v4, k4v = 1.5 * u4 * u4 - u4;
      const un = u + (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
      const vn = v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      return { un, vn };
    }

    for (let j = 0; j < nCols; j++) {
      if (alive) { uOut[j] = u; vOut[j] = v; } else { uOut[j] = -1; vOut[j] = 0; }
      if (j === nCols - 1) break;
      for (let s = 0; s < sub && alive; s++) {
        const r = step();
        if (r.un >= 1) { alive = false; S = -1; break; }
        if (r.un <= 0) {
          // escaped to infinity: linear interpolation of the zero crossing inside this step
          S = phi + h * (u / (u - r.un));
          alive = false;
          break;
        }
        u = r.un; v = r.vn; phi += h;
      }
    }
    if (alive) {
      // not resolved inside the stored range: keep integrating (no storage) to find S
      const hExt = h;
      let guard = 0;
      while (guard++ < 200000 && phi < 10 * PI) {
        const r = step();
        if (r.un >= 1) { S = -1; alive = false; break; }
        if (r.un <= 0) { S = phi + hExt * (u / (u - r.un)); alive = false; break; }
        u = r.un; v = r.vn; phi += hExt;
      }
      if (alive) S = -1; // winding near the photon sphere: treat as dark
    }
    return S;
  }

  const DEFAULTS = { nPhi: 256, phiMax: 3 * PI, n0: 192, n1: 320, n2: 192, p1: 3, p2: 3, sub: 3, epsPsi: 2e-5 };

  function rowPsi(tab, row) {
    const { n0, n1, n2, p1, p2, psiC, epsPsi, yMax } = tab;
    if (row < n0) return Math.max(1e-4, (row / (n0 - 1)) * PI * 0.5);
    row -= n0;
    if (row < n1) {
      const y = (row / (n1 - 1)) * yMax;
      return psiC - (psiC - PI * 0.5) * Math.pow(1 - y, p1);
    }
    row -= n1;
    const z = row / (n2 - 1);
    return Math.min(PI - 1e-4, psiC + epsPsi + (PI - psiC - epsPsi) * Math.pow(z, p2));
  }

  function build(rc, opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const psiC = psiCritical(rc);
    const yMax = 1 - Math.pow(o.epsPsi / (psiC - PI * 0.5), 1 / o.p1);
    const tab = Object.assign({ rc, psiC, yMax, nPsi: o.n0 + o.n1 + o.n2 }, o);
    const data = new Float32Array(tab.nPsi * o.nPhi * 4);
    const uRow = new Float64Array(o.nPhi), vRow = new Float64Array(o.nPhi);
    for (let r = 0; r < tab.nPsi; r++) {
      const psi = rowPsi(tab, r);
      const S = traceRay(psi, rc, o.phiMax, o.nPhi, o.sub, uRow, vRow);
      for (let j = 0; j < o.nPhi; j++) {
        const k = (r * o.nPhi + j) * 4;
        data[k] = uRow[j]; data[k + 1] = vRow[j]; data[k + 2] = S; data[k + 3] = 0;
      }
    }
    tab.data = data;
    return tab;
  }

  // ---- JS mirror of the shader's lookup math (used by tests; the GLSL port uses the same formulas) ----
  function segInfo(tab, psi) {
    const { n0, n1, n2, p1, p2, psiC, epsPsi, yMax } = tab;
    if (psi <= PI * 0.5) return { row: (psi / (PI * 0.5)) * (n0 - 1), lo: 0, hi: n0 - 1 };
    if (psi < psiC - epsPsi) {
      const y = 1 - Math.pow((psiC - psi) / (psiC - PI * 0.5), 1 / p1);
      return { row: n0 + (y / yMax) * (n1 - 1), lo: n0, hi: n0 + n1 - 1 };
    }
    const z = Math.pow(Math.max(0, (psi - psiC - epsPsi) / (PI - psiC - epsPsi)), 1 / p2);
    return { row: n0 + n1 + z * (n2 - 1), lo: n0 + n1, hi: n0 + n1 + n2 - 1 };
  }
  function texel(tab, row, col) {
    const k = (row * tab.nPhi + col) * 4;
    return [tab.data[k], tab.data[k + 1], tab.data[k + 2]];
  }
  function lookup(tab, psi, phi) {
    const s = segInfo(tab, psi);
    const row = Math.min(s.hi, Math.max(s.lo, s.row));
    const col = Math.min(tab.nPhi - 1, Math.max(0, (phi / tab.phiMax) * (tab.nPhi - 1)));
    const r0 = Math.floor(row), r1 = Math.min(r0 + 1, s.hi), fr = row - r0;
    const c0 = Math.floor(col), c1 = Math.min(c0 + 1, tab.nPhi - 1), fc = col - c0;
    const t00 = texel(tab, r0, c0), t01 = texel(tab, r0, c1), t10 = texel(tab, r1, c0), t11 = texel(tab, r1, c1);
    const valid = t00[0] >= 0 && t01[0] >= 0 && t10[0] >= 0 && t11[0] >= 0;
    const mix = (a, b, t) => a + (b - a) * t;
    const u = mix(mix(t00[0], t01[0], fc), mix(t10[0], t11[0], fc), fr);
    const v = mix(mix(t00[1], t01[1], fc), mix(t10[1], t11[1], fc), fr);
    const S = (t00[2] < 0 || t10[2] < 0) ? -1 : mix(t00[2], t10[2], fr);
    return { u: valid ? u : -1, v, S };
  }

  return { build, traceRay, psiCritical, lookup, rowPsi, segInfo, B_CRIT, DEFAULTS };
})();

const L = Game.LensTables;
let pass = 0, fail = 0;
function ok(label, cond, detail) { if (cond) pass++; else { fail++; console.log('FAIL:', label, detail || ''); } }
const PI = Math.PI;

// ---- independent reference: Gauss-Legendre quadrature of the sweep integral F(e,u) ----
function gl(n) { // nodes/weights on [-1,1]
  const x = [], w = [];
  for (let i = 0; i < n; i++) {
    let z = Math.cos(PI * (i + 0.75) / (n + 0.5)), pp;
    for (let it = 0; it < 100; it++) {
      let p1 = 1, p2 = 0;
      for (let j = 0; j < n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j + 1) * z * p2 - j * p3) / (j + 1); }
      pp = n * (z * p1 - p2) / (z * z - 1);
      const z1 = z; z = z1 - p1 / pp; if (Math.abs(z - z1) < 1e-15) break;
    }
    x.push(z); w.push(2 / ((1 - z * z) * pp * pp));
  }
  return { x, w };
}
const G = gl(64);
function integ(f, a, b) { let s = 0; for (let i = 0; i < G.x.length; i++) s += G.w[i] * f(0.5 * (b - a) * G.x[i] + 0.5 * (b + a)); return 0.5 * (b - a) * s; }
function periapsisU(e2) { let lo = 0, hi = 2 / 3; for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (m * m * (1 - m) < e2) lo = m; else hi = m; } return 0.5 * (lo + hi); }
function Fref(e2, u) {
  if (e2 >= 4 / 27) return integ(x => 1 / Math.sqrt(e2 - x * x + x * x * x), 0, u);
  const ua = periapsisU(e2);
  const Q = x => ua + x - ua * ua - ua * x - x * x;
  return integ(t => 2 / Math.sqrt(Q(ua - t * t)), Math.sqrt(ua - u), Math.sqrt(ua));
}
function Sref(psi, rc) {
  const uc = 1 / rc;
  const e2 = uc * uc * (1 - uc) / (Math.sin(psi) ** 2);
  if (psi <= PI / 2) return Fref(e2, uc);
  if (e2 >= 4 / 27) return -1;
  const ua = periapsisU(e2);
  return 2 * Fref(e2, ua) - Fref(e2, uc);
}

// 1. critical angle separates escape from capture
for (const rc of [5, 12, 40, 200]) {
  const pc = L.psiCritical(rc);
  const u = new Float64Array(64), v = new Float64Array(64);
  const Sin = L.traceRay(pc - 2e-3, rc, 3 * PI, 64, 3, u, v);
  const Sout = L.traceRay(pc + 2e-3, rc, 3 * PI, 64, 3, u, v);
  ok(`rc=${rc}: psi just below critical escapes`, Sin > 0, `S=${Sin}`);
  ok(`rc=${rc}: psi just above critical is captured`, Sout === -1, `S=${Sout}`);
}

// 2. traced sweep vs independent quadrature (RK4 table builder vs integral)
let maxErr = 0, worst = null;
for (const rc of [5, 12, 40, 200]) {
  const pc = L.psiCritical(rc);
  const psis = [0.05, 0.3, 0.8, 1.2, 1.5, PI / 2, 1.7, 2.0, 2.5, (PI / 2 + pc) / 2, pc - 0.05, pc - 0.01, pc - 0.002];
  for (const psi of psis) {
    if (psi >= pc) continue;
    const u = new Float64Array(64), v = new Float64Array(64);
    const S = L.traceRay(psi, rc, 3 * PI, 64, 8, u, v);
    const R = Sref(psi, rc);
    const err = Math.abs(S - R);
    if (err > maxErr) { maxErr = err; worst = { rc, psi, S, R }; }
  }
}
ok('RK4 sweep matches Gauss-Legendre quadrature (max abs err < 2e-3 rad)', maxErr < 2e-3, JSON.stringify({ maxErr, worst }));
console.log('headline: max |S_rk4 - S_quadrature| over 4 camera radii x 13 rays =', maxErr.toExponential(2), 'rad');

// 3. weak-field limit: total deflection of a far-away ray ~ 2/b + (15pi/16)/b^2 (rs=1)
{
  const rc = 1e5, b = 100, uc = 1 / rc;
  const psi = PI - Math.asin(b * uc * Math.sqrt(1 - uc));
  const u = new Float64Array(64), v = new Float64Array(64);
  const S = L.traceRay(psi, rc, 3 * PI, 64, 40, u, v);
  const Fc = Math.asin(b * uc); // sweep from infinity to the camera radius in flat space
  const alpha = S - PI + Fc;
  const expect = 2 / b + (15 * PI / 16) / (b * b);
  ok('weak-field deflection ~ 2/b (+ second order), within 1%', Math.abs(alpha - expect) / expect < 0.01, `alpha=${alpha}, expect=${expect}`);
  console.log('headline: b=100 rs weak-field deflection traced', alpha.toFixed(6), 'rad vs analytic', expect.toFixed(6));
}

// 4. monotonic divergence toward the critical angle (photon ring: more windings as psi -> psi_c)
{
  const rc = 40, pc = L.psiCritical(rc);
  let prev = 0, mono = true;
  const u = new Float64Array(64), v = new Float64Array(64);
  for (const d of [0.3, 0.1, 0.03, 0.01, 0.003, 0.001, 0.0003]) {
    const S = L.traceRay(pc - d, rc, 3 * PI, 64, 6, u, v);
    if (!(S > prev)) mono = false; prev = S;
  }
  ok('sweep grows monotonically as psi -> critical (log divergence)', mono && prev > 2 * PI, `last S=${prev}`);
}

// 5. table build + lookups vs direct trace
{
  const rc = 40;
  const t0 = Date.now();
  const tab = L.build(rc);
  const ms = Date.now() - t0;
  console.log('headline: table', tab.nPsi, 'x', tab.nPhi, '=', (tab.data.byteLength / 1048576).toFixed(2), 'MB built in', ms, 'ms (node)');
  let worstU = 0, worstS = 0, n = 0, rngS = 12345;
  const rnd = () => { rngS = (rngS * 1664525 + 1013904223) >>> 0; return rngS / 4294967296; };
  for (let i = 0; i < 400; i++) {
    const psi = 0.02 + rnd() * (PI - 0.04);
    const phi = rnd() * 3 * PI;
    const lk = L.lookup(tab, psi, phi);
    const NF = 8192;
    const uRow = new Float64Array(NF), vRow = new Float64Array(NF);
    const S = L.traceRay(psi, rc, 3 * PI, NF, 1, uRow, vRow);
    const x = phi / (3 * PI) * (NF - 1), c0 = Math.floor(x), c1 = Math.min(NF - 1, c0 + 1), fx = x - c0;
    const uDirect = (uRow[c0] >= 0 && uRow[c1] >= 0) ? uRow[c0] + (uRow[c1] - uRow[c0]) * fx : -1;
    if (lk.u >= 0 && uDirect >= 0 && Math.abs(psi - tab.psiC) > 0.01) {
      const rel = Math.abs(1 / lk.u - 1 / uDirect) / (1 / uDirect); // relative error in RADIUS
      worstU = Math.max(worstU, rel); n++;
    }
    if (lk.S > 0 && S > 0 && Math.abs(psi - tab.psiC) > 0.01) worstS = Math.max(worstS, Math.abs(lk.S - S));
  }
  ok('LUT crossing radius within 1% of direct trace (away from the critical ray)', worstU < 0.01, `worst rel radius err=${worstU}`);
  ok('LUT star-sweep within 3e-3 rad of direct trace (away from critical ray)', worstS < 3e-3, `worst S err=${worstS}`);
  console.log('headline: LUT vs direct trace over', n, 'samples: worst radius err', (worstU * 100).toFixed(3) + '%, worst sweep err', worstS.toExponential(2), 'rad');
  const pc = tab.psiC;
  console.log('headline: shadow angular radius at rc=40 rs:', ((PI - pc) * 180 / PI).toFixed(3), 'deg');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
