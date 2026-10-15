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
