// ---------------------------------------------------------------------------
// SECTION: SECTORS -- Full 8-Sector Keplerian Solar System around the
// 10,000 M_sun Schwarzschild Black Hole ("Gargantua").
// Dark, gritty hard-sci-fi atmosphere: true pitch-black vacuum, high-contrast
// accretion illumination, and dramatic crescent-lit planetary worlds.
// ---------------------------------------------------------------------------
Game.Sectors = (function () {
  const LIST = [
    {
      id: 'photon_reach',
      name: 'Photon Reach',
      subtitle: 'Inner Accretion Vista & Endurance Orbital Ring',
      radiusRs: 30,
      visualBhRs: 14.8,
      orbitInclinationDeg: 14,
      startAnomaly: Math.PI * 0.5,
      bhYawDeg: 20,
      bhPitchDeg: 4,
      gravityMul: 1.8,
      threat: 'MEDIUM',
      faction: 'Vanguard Patrol / Raider Scouts',
      description: 'Close-in orbital patrol corridor silhouetted against Gargantua’s accretion disk, with Haven’s crescent horizon in the distance.',
      planetType: 'belt_haven',
      color: '#ffb74d',
      waves: [
        { fighter: 3 },
        { fighter: 4 },
        { fighter: 3, gunship: 1 },
        { fighter: 5, gunship: 1 },
        { fighter: 4, gunship: 2 }
      ]
    },
    {
      id: 'cinder',
      name: 'Cinder',
      subtitle: 'Scorched Tidal Magma World (Extreme Gravity Well)',
      radiusRs: 14.0,
      visualBhRs: 13.5,
      orbitInclinationDeg: 6,
      startAnomaly: 0.45,
      bhYawDeg: 22,
      bhPitchDeg: 3,
      gravityMul: 3.6,
      threat: 'HIGH',
      faction: 'Crimson Heavy Harvesters',
      description: 'Tidally locked basalt-and-magma proto-planet skimming the inner accretion ring under intense gravitational shear.',
      planetType: 'lava',
      color: '#ff5522',
      waves: [
        { fighter: 4 },
        { fighter: 4, gunship: 1 },
        { fighter: 5, gunship: 2 },
        { fighter: 4, gunship: 2, corvette: 1 },
        { fighter: 6, gunship: 2, corvette: 1 }
      ]
    },
    {
      id: 'forge',
      name: 'The Forge',
      subtitle: 'Industrial Core-World Hephaestus & Citadel Aegis-IV',
      radiusRs: 22,
      visualBhRs: 14.2,
      orbitInclinationDeg: 11,
      startAnomaly: 2.1,
      bhYawDeg: 22,
      bhPitchDeg: 5,
      gravityMul: 2.4,
      threat: 'HIGH',
      faction: 'Iron Syndicate / Orbital Fortress',
      description: 'Dark metallic core-world encircled by a debris ring and the fortified orbital station Aegis-IV.',
      planetType: 'forge',
      color: '#ffaa00',
      waves: [
        { fighter: 3, gunship: 1 },
        { fighter: 4, gunship: 2 },
        { fighter: 4, gunship: 1, corvette: 1 },
        { fighter: 5, gunship: 2, corvette: 1 },
        { fighter: 5, gunship: 3, corvette: 1 }
      ]
    },
    {
      id: 'haven',
      name: 'Haven Meridian',
      subtitle: 'Atmospheric Terran Biosphere, Moon Selene & Vanguard Dock',
      radiusRs: 48,
      visualBhRs: 16.0,
      orbitInclinationDeg: 15,
      startAnomaly: 3.6,
      bhYawDeg: 21,
      bhPitchDeg: 4,
      gravityMul: 1.4,
      threat: 'LOW-MED',
      faction: 'Meridian Coalition (Allied Sanctuary Dock)',
      description: 'Temperate ocean-continent world with Rayleigh-scattered blue atmospheric limb and night-side city lights.',
      planetType: 'terran',
      color: '#38bdf8',
      waves: [
        { fighter: 3 },
        { fighter: 3, gunship: 1 },
        { fighter: 4, gunship: 1 },
        { fighter: 4, gunship: 2 },
        { fighter: 5, gunship: 2, corvette: 1 }
      ]
    },
    {
      id: 'bastion',
      name: 'Bastion',
      subtitle: 'Arid Canyon Fortress World & Defense Ring',
      radiusRs: 72,
      visualBhRs: 17.2,
      orbitInclinationDeg: 9,
      startAnomaly: 1.2,
      bhYawDeg: 21,
      bhPitchDeg: 5,
      gravityMul: 1.3,
      threat: 'HIGH',
      faction: 'Bastion Armored Garrison',
      description: 'Rust-oxide desert fortress world wrapped in thin amber dust-storm haze and orbital defense batteries.',
      planetType: 'desert',
      color: '#f97316',
      waves: [
        { fighter: 4, gunship: 1 },
        { fighter: 4, gunship: 2 },
        { fighter: 4, gunship: 2, corvette: 1 },
        { fighter: 5, gunship: 2, corvette: 1 },
        { fighter: 5, gunship: 2, corvette: 2 }
      ]
    },
    {
      id: 'leviathan',
      name: 'Leviathan',
      subtitle: 'Ringed Storm Gas Giant & Dreadnought Carrier Zone',
      radiusRs: 105,
      visualBhRs: 18.5,
      orbitInclinationDeg: 8,
      startAnomaly: 4.8,
      bhYawDeg: 20,
      bhPitchDeg: 5,
      gravityMul: 2.1,
      threat: 'EXTREME',
      faction: 'Dreadnought Carrier Valkyrie-IX',
      description: 'Colossal banded storm gas giant with expansive ice rings, staging ground for the enemy Dreadnought Carrier.',
      planetType: 'gasGiant',
      color: '#a855f7',
      waves: [
        { fighter: 4, gunship: 1 },
        { fighter: 4, gunship: 2 },
        { fighter: 3, gunship: 1, corvette: 1 },
        { fighter: 4, gunship: 2, corvette: 1 },
        { fighter: 4, gunship: 1, carrier: 1 }
      ]
    },
    {
      id: 'solis_veil',
      name: 'Solis-B & Veil',
      subtitle: 'Captured K-Dwarf Companion Star & Glaciated World Veil',
      radiusRs: 145,
      visualBhRs: 20.0,
      orbitInclinationDeg: 24,
      startAnomaly: 5.5,
      bhYawDeg: 20,
      bhPitchDeg: 6,
      gravityMul: 1.9,
      threat: 'EXTREME',
      faction: 'Outer Remnant Armada',
      description: 'Captured orange-gold K-dwarf star illuminating the deep-freeze world Veil and Listening Array.',
      planetType: 'starIce',
      color: '#facc15',
      waves: [
        { fighter: 4, corvette: 1 },
        { fighter: 5, gunship: 2 },
        { fighter: 4, gunship: 2, corvette: 1 },
        { fighter: 5, gunship: 2, corvette: 2 },
        { fighter: 5, gunship: 2, corvette: 1, carrier: 1 }
      ]
    },
    {
      id: 'exile',
      name: 'Exile & Phantom',
      subtitle: 'Outer Methanogenic Ice Giant & Nitrogen Glacier Moon',
      radiusRs: 195,
      visualBhRs: 21.5,
      orbitInclinationDeg: 19,
      startAnomaly: 2.8,
      bhYawDeg: 20,
      bhPitchDeg: 5,
      gravityMul: 1.5,
      threat: 'EXTREME',
      faction: 'Deep-Space Phantom Fleet',
      description: 'Outer-system worlds shrouded in dark methane clouds and crystalline rings at the edge of Gargantua’s gravity well.',
      planetType: 'iceGiant',
      color: '#38ef7d',
      waves: [
        { fighter: 5, gunship: 1 },
        { fighter: 5, gunship: 2, corvette: 1 },
        { fighter: 4, gunship: 2, corvette: 2 },
        { fighter: 5, gunship: 2, carrier: 1 },
        { fighter: 6, gunship: 2, corvette: 1, carrier: 1 }
      ]
    }
  ];

  function byId(id) {
    return LIST.find(s => s.id === id) || LIST[0];
  }
  return { LIST, byId };
})();

// ---------------------------------------------------------------------------
// SECTION: ARENA -- Keplerian free-fall reference frame for any orbital sector.
// ---------------------------------------------------------------------------
Game.Arena = (function () {
  const V = Game.Vec3, K = Game.Constants;

  function create(opts) {
    const rs = K.BH_RS;
    const radiusM = opts.radiusRs * rs;
    const orbit = Game.Orbits.initializeOrbit({
      semiMajorAxisAU: radiusM / K.AU, eccentricity: opts.eccentricity || 0,
      inclinationRadians: (opts.orbitInclinationDeg * Math.PI) / 180,
      longitudeAscendingNodeRadians: opts.lanRad || 0, argumentOfPeriapsisRadians: 0,
      meanAnomalyAtEpochRadians: opts.startAnomaly == null ? Math.PI / 2 : opts.startAnomaly, epochSeconds: 0,
    });
    const arena = {
      id: opts.id || 'photon_reach',
      name: opts.name, subtitle: opts.subtitle || '',
      radiusRs: opts.radiusRs,
      visualBhRs: opts.visualBhRs || opts.radiusRs,
      gravityMul: opts.gravityMul || 1.0,
      radiusM, orbit,
      orbitInclinationDeg: opts.orbitInclinationDeg,
      diskNormal: V.v3(0.31, 0.0, 0.9507), diskA1: V.v3(0.9507, 0.0, -0.31), diskA2: V.v3(0, 1, 0),
      diskInnerRs: opts.diskInnerRs || 2.6, diskOuterRs: opts.diskOuterRs || 11.8,
      periodSeconds: orbit.periodSeconds,
    };
    arena.refState = (t) => Game.Orbits.orbitalStateAtTime(orbit, t);
    arena.frameOmega = (out, p, v) => {
      const r2 = V.lengthSq(p);
      V.cross(out, p, v); V.scale(out, out, 1 / r2);
      return out;
    };
    arena.startOrientation = (out, bhYawDeg, bhPitchDeg, t) => {
      const p = arena.refState(t || 0).position;
      const dBH = V.v3(-p.x, -p.y, -p.z); V.normalize(dBH, dBH);
      const up0 = V.v3(); V.addScaled(up0, arena.diskNormal, dBH, -V.dot(arena.diskNormal, dBH)); V.normalize(up0, up0);
      const right0 = V.v3(); V.cross(right0, up0, dBH); V.normalize(right0, right0);
      const th = (bhYawDeg * Math.PI) / 180, ph = (bhPitchDeg * Math.PI) / 180;
      const f = V.v3(
        dBH.x * Math.cos(th) + right0.x * Math.sin(th) + up0.x * Math.sin(ph),
        dBH.y * Math.cos(th) + right0.y * Math.sin(th) + up0.y * Math.sin(ph),
        dBH.z * Math.cos(th) + right0.z * Math.sin(th) + up0.z * Math.sin(ph));
      V.normalize(f, f);
      const up = V.v3(); V.addScaled(up, arena.diskNormal, f, -V.dot(arena.diskNormal, f)); V.normalize(up, up);
      const right = V.v3(); V.cross(right, up, f); V.normalize(right, right);
      return Game.Quat.qFromBasis(out, right, up, f);
    };
    return arena;
  }
  return { create };
})();

// ---------------------------------------------------------------------------
// SECTION: SKY -- Dark, Gritty, High-Contrast Interstellar "Gargantua" Shader.
// True pitch-black cosmic vacuum, pinpoint high-dynamic-range stars, dark dust
// lanes carved between incandescent plasma filaments, razor-sharp photon ring,
// and optical visor filters.
// ---------------------------------------------------------------------------
Game.Sky = (function () {
  const VERT = [
    'precision highp float;',
    'attribute vec3 position;',
    'attribute vec2 uv;',
    'varying vec2 vUV;',
    'void main(void) {',
    '  vUV = uv;',
    '  gl_Position = vec4(position.x * 2.0, position.y * 2.0, 0.9999, 1.0);',
    '}'].join('\n');

  const FRAG = `
precision highp float;
varying vec2 vUV;
uniform vec3 camRight;
uniform vec3 camUp;
uniform vec3 camForward;
uniform float tanHalfFov;
uniform float aspect;
uniform vec3 rHat;
uniform vec3 diskN;
uniform vec3 diskA1;
uniform vec3 diskA2;
uniform vec3 galaxyN;
uniform float time;
uniform float uPsiC;
uniform float uYMax;
uniform float uUc;
uniform float uWarp;
uniform float uFilterMode;
uniform sampler2D lens;
const float PI = 3.14159265359;
const float HALF_PI = 1.57079632679;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash31(i);
  float b = hash31(i + vec3(1.0, 0.0, 0.0));
  float c = hash31(i + vec3(0.0, 1.0, 0.0));
  float d = hash31(i + vec3(1.0, 1.0, 0.0));
  float e = hash31(i + vec3(0.0, 0.0, 1.0));
  float g = hash31(i + vec3(1.0, 0.0, 1.0));
  float h = hash31(i + vec3(0.0, 1.0, 1.0));
  float k = hash31(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
float fbm3(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 3; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return s;
}

vec3 starLayer(vec3 dir, float scale, float sizeAng, float fp, float bright, float seed, float thr) {
  vec3 p = dir * scale + seed;
  vec3 cell = floor(p);
  float h0 = hash31(cell);
  if (h0 < thr) return vec3(0.0);
  vec3 off = vec3(hash31(cell + 1.7), hash31(cell + 5.3), hash31(cell + 9.1));
  vec3 sp = cell + 0.2 + 0.6 * off - seed;
  float ang = length(dir - normalize(sp));
  float rad = max(sizeAng, 0.65 * fp);
  float k = sizeAng / rad;
  k = k * k;
  float mag = pow(hash31(cell + 3.1), 10.0);
  float inten = smoothstep(rad, 0.0, ang) * k * bright * (0.06 + 4.5 * mag);
  vec3 tint = mix(vec3(1.0, 0.82, 0.62), vec3(0.70, 0.85, 1.0), hash31(cell + 8.8));
  return tint * inten;
}

// True pitch-black deep space with crisp pinpoint stars & faint dark-matter dust rifts
vec3 skyColor(vec3 dir, float fp) {
  vec3 c = vec3(0.0);
  c += starLayer(dir, 52.0, 0.0018, fp, 1.25, 0.0, 0.945);
  c += starLayer(dir, 110.0, 0.0013, fp, 0.90, 11.3, 0.965);
  c += starLayer(dir, 220.0, 0.0009, fp, 0.65, 27.9, 0.980);
  float b = dot(dir, galaxyN);
  float band = exp(-b * b / 0.035);
  float cloud = fbm3(dir * 3.8 + 4.0);
  float rift = smoothstep(0.42, 0.72, fbm3(dir * 7.5 - 2.1));
  c += vec3(0.08, 0.06, 0.11) * band * cloud * cloud * rift * 0.14;
  return c;
}

vec4 fetchT(float row, float col) {
  return texture2D(lens, vec2((col + 0.5) / NPHI, (row + 0.5) / NPSI));
}
void psiToRow(float psi, float psiC, float yMax, out float row, out float lo, out float hi) {
  if (psi <= HALF_PI) {
    row = psi / HALF_PI * (N0 - 1.0);
    lo = 0.0;
    hi = N0 - 1.0;
  } else if (psi < psiC - EPS_PSI) {
    float y = 1.0 - pow(max(0.0, (psiC - psi) / (psiC - HALF_PI)), 1.0 / P1);
    row = N0 + (y / max(1e-4, yMax)) * (N1 - 1.0);
    lo = N0;
    hi = N0 + N1 - 1.0;
  } else {
    float z = pow(max(0.0, (psi - psiC - EPS_PSI) / max(1e-4, PI - psiC - EPS_PSI)), 1.0 / P2);
    row = N0 + N1 + z * (N2 - 1.0);
    lo = N0 + N1;
    hi = N0 + N1 + N2 - 1.0;
  }
}
vec4 lensBilinear(float row, float col, float lo, float hi) {
  row = clamp(row, lo, hi);
  col = clamp(col, 0.0, NPHI - 1.0);
  float r0 = floor(row);
  float r1 = min(r0 + 1.0, hi);
  float fr = row - r0;
  float c0 = floor(col);
  float c1 = min(c0 + 1.0, NPHI - 1.0);
  float fc = col - c0;
  vec4 t00 = fetchT(r0, c0);
  vec4 t01 = fetchT(r0, c1);
  vec4 t10 = fetchT(r1, c0);
  vec4 t11 = fetchT(r1, c1);
  if (t00.x < 0.0 || t01.x < 0.0 || t10.x < 0.0 || t11.x < 0.0) return vec4(-1.0);
  return mix(mix(t00, t01, fc), mix(t10, t11, fc), fr);
}

// High-contrast gritty Gargantua palette: soot-black -> smoldering rust-copper -> molten gold -> blinding white
vec3 gargantuaColor(float t, float dopplerG, float filterMode) {
  if (filterMode > 1.5 && filterMode < 2.5) {
    vec3 c = mix(vec3(0.85, 0.12, 0.32), vec3(1.0, 0.72, 0.22), smoothstep(0.65, 1.05, dopplerG));
    c = mix(c, vec3(0.20, 0.90, 1.0), smoothstep(1.05, 1.55, dopplerG));
    return c * (0.5 + 0.85 * t);
  }
  vec3 c = mix(vec3(0.06, 0.01, 0.002), vec3(0.68, 0.18, 0.02), smoothstep(0.12, 0.45, t));
  c = mix(c, vec3(0.98, 0.52, 0.12), smoothstep(0.40, 0.76, t));
  c = mix(c, vec3(1.0, 0.86, 0.58), smoothstep(0.70, 1.05, t));
  c = mix(c, vec3(1.0, 0.98, 0.92), smoothstep(0.98, 1.45, t));
  return c;
}

vec4 diskSample(float phi, vec4 L, vec3 rH, vec3 tH, float ucVal, int passIdx, float filterMode) {
  float ue = L.x;
  float r = 1.0 / ue;
  vec3 h = cos(phi) * rH + sin(phi) * tH;
  float theta = atan(dot(h, diskA2), dot(h, diskA1));
  float lr = log(r);
  float omega = DISK_SPIN * 0.85 * pow(R_IN / r, 1.5);
  float ang = theta - omega * time + 4.6 * lr;

  // High-contrast sheared plasma filaments with dark dust gaps carved between streams
  float f1 = fbm3(vec3(cos(ang) * 1.6, sin(ang) * 1.6, lr * 8.5));
  float f2 = fbm3(vec3(cos(ang * 2.8 + 1.4) * 2.2, sin(ang * 2.8 + 1.4) * 2.2, lr * 19.0 - f1 * 2.8));
  float f3 = vnoise(vec3(cos(ang * 6.0) * 1.5, sin(ang * 6.0) * 1.5, lr * 38.0 + f2 * 3.2));
  float rawWisp = f1 * 0.50 + f2 * 0.32 + f3 * 0.25;
  // Carve dark gritty dust lanes so the disk has real shadow veins like shared_image.jpg
  float dustGap = smoothstep(0.34, 0.78, rawWisp);
  float fibers = 0.06 + 2.15 * pow(dustGap, 1.55);

  float normR = clamp((r - R_IN) / (R_OUT - R_IN), 0.0, 1.0);
  float tRel = pow(R_IN / r, 0.76) * (1.0 - 0.42 * normR);
  float edgeIn = smoothstep(R_IN, R_IN * 1.04, r);
  float edgeOut = pow(1.0 - smoothstep(R_OUT * 0.22, R_OUT, r), 2.1);
  float sq = sqrt(max(1.0 - ue, 1e-4));
  float cotE = -L.y / (ue * sq);
  float sinE = 1.0 / sqrt(1.0 + cotE * cotE);
  float cosE = cotE * sinE;
  vec3 tAt = -sin(phi) * rH + cos(phi) * tH;
  vec3 nPh = -(cosE * h + sinE * tAt);
  vec3 vHat = normalize(cross(diskN, h)) * DISK_SPIN;
  float beta = sqrt(1.0 / (2.0 * max(r - 1.0, 0.5)));
  float gam = 1.0 / sqrt(1.0 - beta * beta);
  float g = (sq / sqrt(max(0.05, 1.0 - ucVal))) / (gam * (1.0 - beta * dot(vHat, nPh)));
  g = clamp(g, 0.58, 2.10);
  float T = tRel * (0.45 + 0.55 * g) * (0.65 + 0.45 * dustGap);
  float inten = pow(tRel, 2.15) * pow(g, 2.05) * fibers * (passIdx == 0 ? 4.8 : 3.4) * edgeOut;
  if (filterMode > 2.5) {
    inten *= 0.14;
  } else if (filterMode < 0.5) {
    inten *= 2.3;
  }
  vec3 emit = gargantuaColor(T, g, filterMode) * inten;
  float a = clamp(fibers * 0.90 * edgeIn * edgeOut, 0.0, 0.98);
  return vec4(emit, a);
}

vec3 tonemap(vec3 x) {
  vec3 c = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}

void main(void) {
  vec2 ndc = vUV * 2.0 - 1.0;
  float fovScale = tanHalfFov * (1.0 + uWarp * 0.55);
  vec3 d = normalize(camForward + ndc.x * aspect * fovScale * camRight + ndc.y * fovScale * camUp);
  float cosP = dot(d, rHat);
  vec3 tang = d - cosP * rHat;
  float sinP = length(tang);
  float psi = atan(sinP, cosP);
  vec3 tHat;
  if (sinP > 1e-5) {
    tHat = tang / sinP;
  } else {
    vec3 any = abs(rHat.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    tHat = normalize(cross(rHat, any));
  }

  float psiC = uPsiC > 0.1 ? uPsiC : PSI_C;
  float yMax = uYMax > 0.01 ? uYMax : Y_MAX;
  float ucVal = uUc > 1e-5 ? uUc : UC;

  float row;
  float lo;
  float hi;
  psiToRow(psi, psiC, yMax, row, lo, hi);
  float rr = clamp(row, lo, hi);
  float r0 = floor(rr);
  float r1 = min(r0 + 1.0, hi);
  float fr = rr - r0;
  float s0 = fetchT(r0, 0.0).z;
  float s1 = fetchT(r1, 0.0).z;
  float S = (s0 < 0.0 || s1 < 0.0) ? -1.0 : mix(s0, s1, fr);

  vec3 dEnd = S >= 0.0 ? (cos(S) * rHat + sin(S) * tHat) : d;
  float fp = length(fwidth(dEnd));
  vec3 bg = S >= 0.0 ? skyColor(dEnd, fp) : vec3(0.0);

  // Razor-sharp critical Photon Ring + secondary inner lensed rim against pitch-black shadow
  float shadowRad = PI - psiC;
  float dCrit = psi - psiC;
  bool inShadow = psi > psiC;
  float thinRing = exp(-abs(dCrit) / max(0.00035, shadowRad * 0.011)) * 3.4;
  float innerArc = exp(-abs(dCrit - shadowRad * 0.082) / max(0.0004, shadowRad * 0.013)) * 1.15;
  float outerGlow = inShadow ? 0.0 : exp(dCrit / max(0.0025, shadowRad * 0.15)) * 0.28;
  vec3 ringCol = vec3(1.0, 0.94, 0.80) * (thinRing + innerArc) + vec3(0.90, 0.42, 0.10) * outerGlow;

  vec3 accum = ringCol;
  float trans = 1.0;
  if (!inShadow && psi > HALF_PI * 0.60 && sinP > 1e-4) {
    vec3 nOrb = cross(rHat, tHat);
    vec3 ell = cross(nOrb, diskN);
    float ellLen = length(ell);
    if (ellLen > 1e-4) {
      ell = ell / ellLen;
      float alpha = atan(dot(ell, tHat), dot(ell, rHat));
      if (alpha < 0.0) alpha += PI;
      for (int m = 0; m < DISK_PASSES; m++) {
        float phi = alpha + float(m) * PI;
        vec4 L = lensBilinear(row, phi / PHI_MAX * (NPHI - 1.0), lo, hi);
        if (L.x > 0.0) {
          float r = 1.0 / L.x;
          if (r > R_IN && r < R_OUT) {
            vec4 ds = diskSample(phi, L, rHat, tHat, ucVal, m, uFilterMode);
            accum += trans * ds.a * ds.rgb;
            trans *= (1.0 - ds.a);
          }
        }
      }
    }
  }

  // Foreground equatorial accretion sheet slicing across the front of Gargantua's shadow (shared_image.jpg)
  vec3 bhRight = normalize(cross(diskN, rHat));
  vec3 bhUp = cross(rHat, bhRight);
  float xDisk = dot(d, bhRight) / max(0.04, shadowRad);
  float yDisk = (dot(d, bhUp) + shadowRad * 0.10) / max(0.04, shadowRad);
  float bandEnv = exp(-yDisk * yDisk * 14.5) * smoothstep(2.85, 0.25, abs(xDisk));
  if (bandEnv > 0.004 && uFilterMode < 2.5) {
    float rBand = clamp(R_IN + abs(xDisk) * (R_OUT - R_IN) * 0.38, R_IN * 1.02, R_OUT * 0.98);
    float lrB = log(rBand);
    float angB = xDisk * 1.6 - DISK_SPIN * 0.85 * pow(R_IN / rBand, 1.5) * time + 4.2 * lrB;
    float fb1 = fbm3(vec3(angB * 1.6, yDisk * 7.0, lrB * 6.0));
    float fb2 = vnoise(vec3(angB * 3.8, yDisk * 16.0, lrB * 18.0));
    float wispB = smoothstep(0.28, 0.82, 0.6 * fb1 + 0.4 * fb2);
    float streakB = 0.22 + 1.75 * pow(wispB, 1.35);
    float dopplerFront = clamp(1.15 - 0.38 * clamp(xDisk * 0.65, -1.0, 1.0), 0.65, 1.75);
    float coreHot = exp(-yDisk * yDisk * 38.0) * exp(-abs(xDisk) * 0.65);
    vec3 frontCol = gargantuaColor(0.48 + 0.58 * coreHot * wispB, dopplerFront, uFilterMode);
    float frontInten = bandEnv * streakB * (2.4 + 3.4 * coreHot) * (uFilterMode < 0.5 ? 2.2 : 1.0);
    float frontAlpha = clamp(bandEnv * streakB * 0.95, 0.0, 0.98);
    accum = accum * (1.0 - frontAlpha * 0.72) + frontCol * frontInten;
    trans *= (1.0 - frontAlpha);
  }

  // Tight equatorial glare (keeps surrounding space pitch-black!)
  float radialDist = PI - psi;
  float anamorphic = exp(-yDisk * yDisk * 24.0) * exp(-max(0.0, abs(xDisk) - 0.5) / 1.15);
  float glareStrength = uFilterMode < 0.5 ? 1.85 : (uFilterMode > 2.5 ? 0.05 : 0.28);
  accum += vec3(1.0, 0.72, 0.32) * anamorphic * glareStrength;
  if (uFilterMode < 0.5) {
    float rawBloom = exp(-max(0.0, radialDist - shadowRad * 0.35) / (shadowRad * 1.15)) * (inShadow ? 0.25 : 1.0);
    accum += vec3(1.0, 0.85, 0.58) * rawBloom * 1.45;
  }

  vec3 col = accum + trans * bg;
  if (uWarp > 0.01) {
    float rNdc = length(ndc);
    float streak = smoothstep(0.15, 1.25, rNdc) * uWarp;
    float angW = atan(ndc.y, ndc.x);
    float tunnel = 0.5 + 0.5 * sin(angW * 24.0 + time * 18.0 + rNdc * 12.0);
    col += vec3(0.18, 0.65, 1.0) * streak * (0.35 + 0.65 * tunnel) * 1.4;
  }
  gl_FragColor = vec4(tonemap(col * EXPOSURE), 1.0);
}
`;

  function create(scene, arena, opts) {
    opts = opts || {};
    const lutCache = Object.create(null);
    let rc = arena.radiusRs;
    function getTab(r) {
      const key = Math.round(r * 2) / 2;
      if (!lutCache[key]) lutCache[key] = Game.LensTables.build(key);
      return lutCache[key];
    }
    let tab = getTab(rc);
    let visTab = getTab(arena.visualBhRs || 14.8);
    const tex = BABYLON.RawTexture.CreateRGBATexture(visTab.data, visTab.nPhi, visTab.nPsi, scene, false, false,
      BABYLON.Constants.TEXTURE_NEAREST_SAMPLINGMODE, BABYLON.Constants.TEXTURETYPE_FLOAT);
    tex.wrapU = BABYLON.Constants.TEXTURE_CLAMP_ADDRESSMODE; tex.wrapV = BABYLON.Constants.TEXTURE_CLAMP_ADDRESSMODE;

    const f = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
    const defs = [
      ['N0', visTab.n0], ['N1', visTab.n1], ['N2', visTab.n2], ['NPHI', visTab.nPhi], ['NPSI', visTab.nPsi],
      ['PSI_C', visTab.psiC], ['EPS_PSI', visTab.epsPsi], ['Y_MAX', visTab.yMax], ['P1', visTab.p1], ['P2', visTab.p2],
      ['PHI_MAX', visTab.phiMax], ['R_IN', arena.diskInnerRs || 2.6], ['R_OUT', arena.diskOuterRs || 11.8], ['UC', 1 / visTab.rc],
      ['DISK_SPIN', opts.diskSpin || 1], ['EXPOSURE', opts.exposure || 1.08],
    ].map(([k, v]) => '#define ' + k + ' ' + f(v)).join('\n') + '\n#define DISK_PASSES ' + (opts.lowQuality ? 2 : 3) + '\n';

    BABYLON.Effect.ShadersStore.bhSkyVertexShader = VERT;
    BABYLON.Effect.ShadersStore.bhSkyFragmentShader = defs + FRAG;
    const mat = new BABYLON.ShaderMaterial('bhSky', scene, { vertex: 'bhSky', fragment: 'bhSky' }, {
      attributes: ['position', 'uv'],
      uniforms: ['camRight', 'camUp', 'camForward', 'tanHalfFov', 'aspect', 'rHat', 'diskN', 'diskA1', 'diskA2', 'galaxyN', 'time', 'uPsiC', 'uYMax', 'uUc', 'uWarp', 'uFilterMode'],
      samplers: ['lens'],
    });
    mat.backFaceCulling = false;
    mat.disableDepthWrite = true;
    mat.setTexture('lens', tex);
    const V3 = BABYLON.Vector3;
    mat.setVector3('diskN', new V3(arena.diskNormal.x, arena.diskNormal.y, arena.diskNormal.z));
    mat.setVector3('diskA1', new V3(arena.diskA1.x, arena.diskA1.y, arena.diskA1.z));
    mat.setVector3('diskA2', new V3(arena.diskA2.x, arena.diskA2.y, arena.diskA2.z));
    const gn = new V3(0.25, 0.9, 0.35); gn.normalize(); mat.setVector3('galaxyN', gn);
    mat.setFloat('uPsiC', visTab.psiC);
    mat.setFloat('uYMax', visTab.yMax);
    mat.setFloat('uUc', 1 / visTab.rc);
    mat.setFloat('uWarp', 0);
    mat.setFloat('uFilterMode', 1.0);

    const quad = BABYLON.MeshBuilder.CreatePlane('bhSkyQuad', { size: 1 }, scene);
    quad.material = mat; quad.alwaysSelectAsActiveMesh = true; quad.isPickable = false; quad.renderingGroupId = 0;

    function mapToVisualRs(physicalRs) {
      return Math.max(13.5, Math.min(22.0, 13.5 + Math.pow(Math.max(0, physicalRs - 12), 0.48) * 0.52));
    }

    function setRadiusRs(newRc, visualOverride) {
      rc = Math.max(3.5, newRc);
      tab = getTab(rc);
      const vRs = visualOverride || mapToVisualRs(rc);
      visTab = getTab(vRs);
      if (tex.updateData) tex.updateData(scene, visTab.data, visTab.nPhi, visTab.nPsi);
      mat.setFloat('uPsiC', visTab.psiC);
      mat.setFloat('uYMax', visTab.yMax);
      mat.setFloat('uUc', 1 / visTab.rc);
    }

    let filterMode = 1;
    function setFilterMode(m) {
      filterMode = m | 0;
      mat.setFloat('uFilterMode', filterMode);
    }
    function getFilterMode() { return filterMode; }

    const vR = new V3(), vU = new V3(), vF = new V3(), vH = new V3();
    function update(camera, engine, rHat, timeSeconds, camPos, lookAt, up, liveRc, warpFactor) {
      let fx = lookAt.x - camPos.x, fy = lookAt.y - camPos.y, fz = lookAt.z - camPos.z;
      let l = Math.hypot(fx, fy, fz) || 1; fx /= l; fy /= l; fz /= l;
      let rx = up.y * fz - up.z * fy, ry = up.z * fx - up.x * fz, rz = up.x * fy - up.y * fx;
      l = Math.hypot(rx, ry, rz) || 1; rx /= l; ry /= l; rz /= l;
      const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
      vF.copyFromFloats(fx, fy, fz); vR.copyFromFloats(rx, ry, rz); vU.copyFromFloats(ux, uy, uz);
      vH.copyFromFloats(rHat.x, rHat.y, rHat.z);
      mat.setVector3('camForward', vF); mat.setVector3('camRight', vR); mat.setVector3('camUp', vU);
      mat.setVector3('rHat', vH);
      mat.setFloat('tanHalfFov', Math.tan(camera.fov * 0.5));
      mat.setFloat('aspect', engine.getAspectRatio(camera));
      mat.setFloat('time', timeSeconds);
      if (liveRc && liveRc > 3.2) {
        const vRs = mapToVisualRs(liveRc);
        const psiC = Game.LensTables.psiCritical(vRs);
        const yMax = 1 - Math.pow(visTab.epsPsi / Math.max(1e-4, psiC - Math.PI * 0.5), 1 / visTab.p1);
        mat.setFloat('uPsiC', psiC);
        mat.setFloat('uYMax', yMax);
        mat.setFloat('uUc', 1 / vRs);
      }
      mat.setFloat('uWarp', warpFactor || 0);
      mat.setFloat('uFilterMode', filterMode);
    }
    return { mesh: quad, material: mat, get table() { return tab; }, update, setRadiusRs, setFilterMode, getFilterMode, mapToVisualRs };
  }
  return { create };
})();

// ---------------------------------------------------------------------------
// SECTION: DUST -- Subtle micro-debris velocity streaks in dark space.
// ---------------------------------------------------------------------------
Game.Dust = (function () {
  function create(scene, count, boxM) {
    const rng = Game.Rng.createRng(424242);
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pts[i] = (rng.next() - 0.5) * boxM;
    const bright = new Float32Array(count);
    for (let i = 0; i < count; i++) bright[i] = 0.15 + 0.55 * rng.next();
    const lines = [], colors = [];
    for (let i = 0; i < count; i++) {
      lines.push([new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 1)]);
      colors.push([new BABYLON.Color4(0.85, 0.78, 0.68, 0.0), new BABYLON.Color4(0.95, 0.88, 0.78, bright[i] * 0.55)]);
    }
    const mesh = BABYLON.MeshBuilder.CreateLineSystem('dust', { lines, colors, updatable: true }, scene);
    mesh.alwaysSelectAsActiveMesh = true; mesh.isPickable = false; mesh.renderingGroupId = 1;
    const buf = new Float32Array(count * 6);
    function wrap(v, c, L) { let d = v - c; d -= L * Math.round(d / L); return c + d; }
    function update(cam, shipVel, warpBoost) {
      const sp = Math.hypot(shipVel.x, shipVel.y, shipVel.z) + (warpBoost || 0) * 2800;
      const len = Math.min(200, Math.max(0.4, sp * 0.05));
      let dx = 0, dy = 0, dz = 1;
      if (sp > 1e-3) {
        const vLen = Math.hypot(shipVel.x, shipVel.y, shipVel.z);
        if (vLen > 1) { dx = -shipVel.x / vLen; dy = -shipVel.y / vLen; dz = -shipVel.z / vLen; }
      }
      for (let i = 0; i < count; i++) {
        const x = wrap(pts[i * 3], cam.x, boxM), y = wrap(pts[i * 3 + 1], cam.y, boxM), z = wrap(pts[i * 3 + 2], cam.z, boxM);
        const k = i * 6;
        buf[k] = x; buf[k + 1] = y; buf[k + 2] = z;
        buf[k + 3] = x + dx * len; buf[k + 4] = y + dy * len; buf[k + 5] = z + dz * len;
      }
      mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, buf);
    }
    function shift(off) { for (let i = 0; i < count; i++) { pts[i * 3] -= off.x; pts[i * 3 + 1] -= off.y; pts[i * 3 + 2] -= off.z; } }
    return { mesh, update, shift };
  }
  return { create };
})();

// ---------------------------------------------------------------------------
// SECTION: CELESTIAL -- Realistic Crescent-Phase Planetary Worlds with
// Rayleigh + Mie Volumetric Limb Scattering, Cloud Shadows, and Endurance
// Ring Station. Clean, uncluttered composition (one primary world per sector).
// ---------------------------------------------------------------------------
Game.Celestial = (function () {
  const PLANET_VS = [
    'precision highp float;',
    'attribute vec3 position;',
    'attribute vec3 normal;',
    'attribute vec2 uv;',
    'uniform mat4 world;',
    'uniform mat4 viewProjection;',
    'varying vec3 vNorm;',
    'varying vec3 vLocal;',
    'varying vec3 vWPos;',
    'varying vec2 vUV;',
    'void main(void) {',
    '  vLocal = normalize(position);',
    '  vec4 wp = world * vec4(position, 1.0);',
    '  vWPos = wp.xyz;',
    '  vNorm = normalize(mat3(world[0].xyz, world[1].xyz, world[2].xyz) * normal);',
    '  vUV = uv;',
    '  gl_Position = viewProjection * wp;',
    '}'
  ].join('\n');

  const PLANET_FS = `
precision highp float;
varying vec3 vNorm;
varying vec3 vLocal;
varying vec3 vWPos;
varying vec2 vUV;
uniform vec3 uCamPos;
uniform vec3 uLightDir;
uniform float uTime;
uniform float uMode;

float hash3(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}
float fbm5(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise3(p); p = p * 2.05 + 13.7; a *= 0.5; }
  return s;
}

vec3 atmosphereScattering(vec3 N, vec3 V, vec3 L, vec3 rayleighCol, vec3 mieCol, float density) {
  float ndv = max(0.0, dot(N, V));
  float ndl = dot(N, L);
  float limb = pow(1.0 - ndv, 3.8) * density;
  float outerRim = pow(1.0 - ndv, 7.2) * density;
  float sunWrap = smoothstep(-0.22, 0.72, ndl);
  float twilight = exp(-ndl * ndl * 14.0) * smoothstep(-0.32, 0.22, ndl) * pow(1.0 - ndv, 2.2);
  vec3 scatter = rayleighCol * limb * (0.12 + 0.88 * sunWrap) * 0.68
               + mieCol * twilight * 0.38
               + mix(rayleighCol, vec3(0.75, 0.92, 1.0), 0.45) * outerRim * (0.20 + 0.85 * sunWrap) * 1.25;
  return scatter;
}

void main(void) {
  vec3 N0 = normalize(vNorm);
  vec3 V = normalize(uCamPos - vWPos);
  // True dramatic space terminator: light comes from the Black Hole on the left (-uLightDir) with a 55% day / 45% pitch-black shadow crescent
  vec3 L = normalize(normalize(-uLightDir) * 0.82 + V * 0.38 + vec3(0.0, 0.18, 0.0));
  vec3 P = vLocal;

  float e = 0.012;
  float h0 = fbm5(P * 6.5);
  float hx = fbm5((P + vec3(e, 0.0, 0.0)) * 6.5) - h0;
  float hy = fbm5((P + vec3(0.0, e, 0.0)) * 6.5) - h0;
  vec3 N = normalize(N0 + vec3(hx, hy, 0.0) * 2.1);

  float ndl = max(0.0, dot(N, L));
  float ndlSmooth = max(0.0, dot(N0, L));
  float ndv = max(0.0, dot(N0, V));
  vec3 col = vec3(0.0);

  if (uMode < 0.5) {
    // 0: Lava Tidal World (Cinder) -- dark charred basalt crust with glowing magma fissures
    float n1 = fbm5(P * 5.2 + vec3(0.0, uTime * 0.015, 0.0));
    float n2 = fbm5(P * 15.0);
    float ridge = abs(n1 - 0.5) * 2.0;
    float river = 1.0 - smoothstep(0.0, 0.11, ridge - n2 * 0.065);
    vec3 magma = mix(vec3(0.92, 0.16, 0.01), vec3(1.0, 0.82, 0.28), pow(river, 2.4));
    vec3 crust = mix(vec3(0.025, 0.02, 0.025), vec3(0.11, 0.08, 0.07), n2) * (0.04 + 0.96 * ndl);
    col = mix(crust, magma * 1.25, river);
    col += atmosphereScattering(N0, V, L, vec3(0.95, 0.28, 0.05), vec3(1.0, 0.58, 0.16), 1.05);
  } else if (uMode < 1.5) {
    // 1: Realistic Earth-Like Biosphere World (Haven -- 573204705.jpg high-contrast terminator)
    float warp = fbm5(P * 2.4 + 1.7);
    float cont = fbm5(P * 3.1 + warp * 0.55 + 2.4);
    float detail = fbm5(P * 14.0);
    float lat = abs(P.y);
    float land = smoothstep(0.46, 0.505, cont + 0.06 * detail);
    float coast = smoothstep(0.42, 0.51, cont + 0.06 * detail) * (1.0 - land);

    vec3 deepOcean = mix(vec3(0.008, 0.035, 0.12), vec3(0.018, 0.11, 0.28), detail);
    vec3 ocean = mix(deepOcean, vec3(0.03, 0.32, 0.50), coast * 0.80);

    float humid = fbm5(P * 5.5 + 8.2);
    vec3 forest = mix(vec3(0.04, 0.18, 0.06), vec3(0.14, 0.29, 0.11), detail);
    vec3 desert = mix(vec3(0.46, 0.37, 0.23), vec3(0.62, 0.50, 0.34), detail);
    vec3 mountain = mix(vec3(0.22, 0.20, 0.19), vec3(0.92, 0.95, 1.0), smoothstep(0.64, 0.84, h0));
    vec3 biome = mix(desert, forest, smoothstep(0.38, 0.64, humid));
    biome = mix(biome, mountain, smoothstep(0.56, 0.75, cont));
    biome = mix(biome, vec3(0.92, 0.96, 1.0), smoothstep(0.74, 0.88, lat + detail * 0.12));

    vec3 cPos = P * 3.8 + vec3(uTime * 0.008, 0.0, -uTime * 0.006);
    float cSwirl = fbm5(cPos + vec3(fbm5(cPos * 1.8) * 0.65));
    float cDetail = fbm5(P * 16.0 - vec3(uTime * 0.012, 0.0, 0.0));
    float clouds = smoothstep(0.44, 0.73, cSwirl * 0.78 + cDetail * 0.28);
    float fogHaze = smoothstep(0.34, 0.70, cSwirl) * 0.22;

    float cShadow = smoothstep(0.46, 0.70, fbm5((P + L * 0.022) * 3.8 + vec3(uTime * 0.008, 0.0, -uTime * 0.006)));
    vec3 surf = mix(ocean, biome, land);
    surf *= (1.0 - cShadow * 0.48 * (1.0 - clouds));

    vec3 H = normalize(L + V);
    float spec = pow(max(0.0, dot(N0, H)), 56.0) * (1.0 - land * 0.9) * (1.0 - clouds * 0.85) * ndlSmooth;

    // Deep pitch-black night side with delicate city-light filaments
    float night = smoothstep(0.06, -0.18, dot(N0, L));
    float cities = smoothstep(0.68, 0.79, detail) * land * (1.0 - clouds * 0.92) * night;

    vec3 litSurf = surf * (0.008 + 1.05 * ndl) + vec3(1.0, 0.92, 0.78) * spec * 0.70;
    vec3 cloudCol = vec3(0.95, 0.97, 1.0) * (0.01 + 1.04 * ndlSmooth);
    col = mix(litSurf, cloudCol, clouds * 0.86);
    col = mix(col, vec3(0.38, 0.62, 0.92) * (0.02 + 0.95 * ndlSmooth), fogHaze);
    col += vec3(1.0, 0.72, 0.28) * cities * 0.75;
    col += atmosphereScattering(N0, V, L, vec3(0.16, 0.56, 1.0), vec3(1.0, 0.58, 0.24), 1.48);
  } else if (uMode < 2.5) {
    // 2: Banded Storm Gas Giant (Leviathan)
    float turb = fbm5(P * 5.5 + vec3(uTime * 0.015, 0.0, 0.0));
    float bands = sin(P.y * 24.0 + turb * 4.8);
    float storm = exp(-length((P.xy - vec2(0.22, -0.16)) * vec2(3.2, 5.2)));
    vec3 c1 = vec3(0.68, 0.48, 0.32), c2 = vec3(0.22, 0.19, 0.36), c3 = vec3(0.88, 0.76, 0.58);
    vec3 surf = mix(c1, c2, 0.5 + 0.5 * bands);
    surf = mix(surf, c3, smoothstep(0.3, 0.78, turb));
    surf = mix(surf, vec3(0.86, 0.32, 0.16), storm * 0.75);
    col = surf * (0.015 + 0.98 * ndlSmooth) + atmosphereScattering(N0, V, L, vec3(0.42, 0.52, 0.90), vec3(0.90, 0.68, 0.40), 1.15);
  } else if (uMode < 3.5) {
    // 3: Industrial / Arid Canyon World (Bastion / Forge)
    float n = fbm5(P * 6.0);
    float haze = fbm5(P * 4.2 + vec3(uTime * 0.01, 0.0, 0.0));
    vec3 canyon = mix(vec3(0.24, 0.10, 0.05), vec3(0.58, 0.28, 0.12), n);
    canyon = mix(canyon, vec3(0.75, 0.52, 0.34), haze * 0.30);
    col = canyon * (0.015 + 0.98 * ndl) + atmosphereScattering(N0, V, L, vec3(0.90, 0.42, 0.16), vec3(1.0, 0.70, 0.35), 1.20);
  } else if (uMode < 4.5) {
    // 4: K-Dwarf Companion Star (Solis-B)
    float gran = fbm5(P * 10.0 + vec3(uTime * 0.06, -uTime * 0.05, 0.0));
    vec3 core = mix(vec3(0.95, 0.34, 0.05), vec3(1.0, 0.90, 0.52), pow(ndv, 0.42) * (0.65 + 0.5 * gran));
    col = core * 1.45 + vec3(1.0, 0.55, 0.15) * pow(1.0 - ndv, 2.6) * 1.35;
  } else {
    // 5: Methanogenic Azure Ice Giant (Veil / Exile)
    float f = fbm5(P * 5.0 + vec3(0.0, uTime * 0.01, 0.0));
    float mist = fbm5(P * 9.0);
    vec3 ice = mix(vec3(0.04, 0.20, 0.42), vec3(0.22, 0.64, 0.80), f * 0.7 + mist * 0.3);
    col = ice * (0.015 + 0.98 * ndlSmooth) + atmosphereScattering(N0, V, L, vec3(0.18, 0.78, 1.0), vec3(0.55, 0.90, 1.0), 1.30);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

  const ATMO_FS = `
precision highp float;
varying vec3 vNorm;
varying vec3 vWPos;
uniform vec3 uCamPos;
uniform vec3 uLightDir;
uniform vec3 uAtmoCol;
void main(void) {
  vec3 N = normalize(vNorm);
  vec3 V = normalize(uCamPos - vWPos);
  vec3 L = normalize(normalize(-uLightDir) * 0.82 + V * 0.38 + vec3(0.0, 0.18, 0.0));
  float ndv = max(0.0, dot(N, V));
  float ndl = smoothstep(-0.20, 0.72, dot(N, L));
  float rim = pow(1.0 - ndv, 5.2) * ndl;
  gl_FragColor = vec4(uAtmoCol * rim * 0.90, rim);
}
`;

  const PORTAL_FS = `
precision highp float;
varying vec3 vNorm;
varying vec3 vLocal;
varying vec3 vWPos;
varying vec2 vUV;
uniform vec3 uCamPos;
uniform float uTime;
uniform float uCharge;
void main(void) {
  vec3 N = normalize(vNorm);
  vec3 V = normalize(uCamPos - vWPos);
  float ndv = abs(dot(N, V));
  float rim = pow(1.0 - ndv, 2.2);
  float swirl = sin(vLocal.x * 14.0 + vLocal.y * 14.0 - uTime * 9.0) * 0.5 + 0.5;
  vec3 col = mix(vec3(0.02, 0.18, 0.42), vec3(0.25, 0.92, 1.0), rim * (0.65 + 0.35 * swirl));
  col += vec3(0.85, 0.96, 1.0) * pow(rim, 5.0) * 1.4;
  float alpha = clamp((0.28 + 0.72 * rim) * uCharge, 0.0, 0.95);
  gl_FragColor = vec4(col, alpha);
}
`;

  function create(scene) {
    BABYLON.Effect.ShadersStore.bhPlanetVertexShader = PLANET_VS;
    BABYLON.Effect.ShadersStore.bhPlanetFragmentShader = PLANET_FS;
    BABYLON.Effect.ShadersStore.bhAtmoVertexShader = PLANET_VS;
    BABYLON.Effect.ShadersStore.bhAtmoFragmentShader = ATMO_FS;
    BABYLON.Effect.ShadersStore.bhPortalVertexShader = PLANET_VS;
    BABYLON.Effect.ShadersStore.bhPortalFragmentShader = PORTAL_FS;

    const envRoot = new BABYLON.TransformNode('sectorEnvRoot', scene);
    let activeMeshes = [];
    let rotatingNodes = [];
    let dockStation = null;
    let gravityBodies = [];

    const planetMats = [];
    const atmoMats = [];

    function clearSector() {
      for (const m of activeMeshes) m.dispose();
      activeMeshes = [];
      rotatingNodes = [];
      planetMats.length = 0;
      atmoMats.length = 0;
      gravityBodies = [];
      dockStation = null;
    }

    function makePlanetMat(name, mode) {
      const m = new BABYLON.ShaderMaterial(name, scene, { vertex: 'bhPlanet', fragment: 'bhPlanet' }, {
        attributes: ['position', 'normal', 'uv'],
        uniforms: ['world', 'viewProjection', 'uCamPos', 'uLightDir', 'uTime', 'uMode'],
      });
      m.setFloat('uMode', mode);
      m.setFloat('uTime', 0);
      m.setVector3('uCamPos', new BABYLON.Vector3(0, 0, 0));
      m.setVector3('uLightDir', new BABYLON.Vector3(0, -1, 0));
      planetMats.push(m);
      return m;
    }

    function addAtmosphereShell(parentPlanet, diameter, r, g, b) {
      const m = new BABYLON.ShaderMaterial(parentPlanet.name + '_atmoMat', scene, { vertex: 'bhAtmo', fragment: 'bhAtmo' }, {
        attributes: ['position', 'normal', 'uv'],
        uniforms: ['world', 'viewProjection', 'uCamPos', 'uLightDir', 'uAtmoCol'],
        needAlphaBlending: true
      });
      m.alphaMode = BABYLON.Constants.ALPHA_ONEONE;
      m.disableDepthWrite = true;
      m.setVector3('uAtmoCol', new BABYLON.Vector3(r, g, b));
      m.setVector3('uCamPos', new BABYLON.Vector3(0, 0, 0));
      m.setVector3('uLightDir', new BABYLON.Vector3(0, -1, 0));
      atmoMats.push(m);
      const shell = BABYLON.MeshBuilder.CreateSphere(parentPlanet.name + '_atmo', { diameter: diameter * 1.05, segments: 28 }, scene);
      shell.parent = parentPlanet;
      shell.material = m;
      shell.renderingGroupId = 1;
      return shell;
    }

    function stdMat(name, dr, dg, db, er, eg, eb, alpha) {
      const m = new BABYLON.StandardMaterial(name, scene);
      m.diffuseColor = new BABYLON.Color3(dr, dg, db);
      m.emissiveColor = new BABYLON.Color3(er || 0, eg || 0, eb || 0);
      m.specularColor = new BABYLON.Color3(0.42, 0.42, 0.48);
      m.specularPower = 48;
      m.backFaceCulling = false;
      if (alpha !== undefined && alpha < 1) m.alpha = alpha;
      return m;
    }

    function buildAsteroids(count, spreadM, minR, maxR, tint) {
      const rng = Game.Rng.createRng(77123);
      const rockMat = stdMat('astMat', tint[0], tint[1], tint[2], tint[3] || 0.005, tint[4] || 0.005, tint[5] || 0.01);
      for (let i = 0; i < count; i++) {
        const a = rng.next() * Math.PI * 2;
        const d = minR + rng.next() * (maxR - minR);
        const h = (rng.next() - 0.5) * spreadM * 0.32;
        const sz = 9 + Math.pow(rng.next(), 2.2) * 38;
        const rock = BABYLON.MeshBuilder.CreateSphere('ast_' + i, {
          diameterX: sz * (0.7 + 0.6 * rng.next()),
          diameterY: sz * (0.6 + 0.6 * rng.next()),
          diameterZ: sz * (0.7 + 0.6 * rng.next()),
          segments: 5
        }, scene);
        rock.parent = envRoot;
        rock.position.set(Math.cos(a) * d, h, Math.sin(a) * d);
        rock.rotation.set(rng.next() * 6, rng.next() * 6, rng.next() * 6);
        rock.material = rockMat;
        rock.renderingGroupId = 1;
        activeMeshes.push(rock);
        rotatingNodes.push({ node: rock, rx: (rng.next() - 0.5) * 0.2, ry: (rng.next() - 0.5) * 0.2 });
      }
    }

    function buildStation(name, pos, isFriendly) {
      const root = new BABYLON.TransformNode(name, scene);
      root.parent = envRoot;
      root.position.set(pos.x, pos.y, pos.z);
      activeMeshes.push(root);

      const modMat = stdMat(name + '_mod', 0.52, 0.55, 0.60, 0.01, 0.015, 0.02);
      const darkMat = stdMat(name + '_dark', 0.14, 0.16, 0.19, 0.005, 0.005, 0.01);
      const glowColor = isFriendly ? [0.25, 0.78, 1.0] : [1.0, 0.42, 0.12];
      const glowMat = stdMat(name + '_glow', glowColor[0], glowColor[1], glowColor[2], glowColor[0], glowColor[1], glowColor[2]);
      glowMat.disableLighting = true;

      const hub = BABYLON.MeshBuilder.CreateCylinder(name + '_hub', { height: 18, diameter: 22, tessellation: 12 }, scene);
      hub.parent = root; hub.rotation.x = Math.PI * 0.5; hub.material = darkMat; hub.renderingGroupId = 1;

      const ring = BABYLON.MeshBuilder.CreateTorus(name + '_ring', { diameter: 140, thickness: 4.5, tessellation: 32 }, scene);
      ring.parent = root; ring.rotation.x = Math.PI * 0.5; ring.material = darkMat; ring.renderingGroupId = 1;

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const R = 70;
        const mod = BABYLON.MeshBuilder.CreateBox(name + '_m' + i, { width: 18, height: 12, depth: 14 }, scene);
        mod.parent = root;
        mod.position.set(Math.cos(ang) * R, Math.sin(ang) * R, 0);
        mod.rotation.z = ang;
        mod.material = modMat;
        mod.renderingGroupId = 1;
        if (i % 3 === 0) {
          const light = BABYLON.MeshBuilder.CreateSphere(name + '_l' + i, { diameter: 3.5, segments: 6 }, scene);
          light.parent = root;
          light.position.set(Math.cos(ang) * (R + 8), Math.sin(ang) * (R + 8), 3);
          light.material = glowMat;
          light.renderingGroupId = 1;
        }
      }

      for (let i = 0; i < 2; i++) {
        const sp = BABYLON.MeshBuilder.CreateBox(name + '_sp' + i, { width: 136, height: 3.2, depth: 3.2 }, scene);
        sp.parent = root; sp.rotation.z = (i * Math.PI) / 2; sp.material = darkMat; sp.renderingGroupId = 1;
      }

      rotatingNodes.push({ node: root, rx: 0, ry: 0.05, rz: isFriendly ? 0.18 : -0.15 });
      return { root, position: root.position, isFriendly, radius: 95 };
    }

    function spawnPlanet(name, mode, diameter, pos, atmoRGB, hasRing, ringCol, gravStrength) {
      const pMat = makePlanetMat(name + '_mat', mode);
      const planet = BABYLON.MeshBuilder.CreateSphere(name, { diameter, segments: 36 }, scene);
      planet.parent = envRoot;
      planet.position.set(pos.x, pos.y, pos.z);
      planet.material = pMat;
      planet.renderingGroupId = 1;
      activeMeshes.push(planet);
      rotatingNodes.push({ node: planet, rx: 0, ry: 0.018 });
      if (atmoRGB) addAtmosphereShell(planet, diameter, atmoRGB[0], atmoRGB[1], atmoRGB[2]);
      if (hasRing) {
        const rCol = ringCol || [0.62, 0.68, 0.80];
        const r1 = BABYLON.MeshBuilder.CreateTorus(name + '_r1', { diameter: diameter * 1.85, thickness: diameter * 0.10, tessellation: 48 }, scene);
        r1.parent = planet; r1.scaling.y = 0.02; r1.rotation.x = 0.28; r1.rotation.z = 0.16;
        r1.material = stdMat(name + '_rm1', rCol[0], rCol[1], rCol[2], rCol[0] * 0.12, rCol[1] * 0.12, rCol[2] * 0.12, 0.55);
        r1.renderingGroupId = 1;
      }
      gravityBodies.push({ name, pos: planet.position, radius: diameter * 0.5, strength: gravStrength || 18 });
      return planet;
    }

    function loadSector(sectorId, startOri) {
      clearSector();
      envRoot.position.set(0, 0, 0);
      const sec = Game.Sectors.byId(sectorId);
      const Q = Game.Quat, V = Game.Vec3;
      const ori = startOri || { x: 0, y: 0, z: 0, w: 1 };
      const fwd = V.v3(0, 0, 1), right = V.v3(1, 0, 0), up = V.v3(0, 1, 0);
      Q.qRotateVector(fwd, ori, { x: 0, y: 0, z: 1 });
      Q.qRotateVector(right, ori, { x: 1, y: 0, z: 0 });
      Q.qRotateVector(up, ori, { x: 0, y: 1, z: 0 });

      function relPos(fDist, rDist, uDist) {
        return {
          x: fwd.x * fDist + right.x * rDist + up.x * uDist,
          y: fwd.y * fDist + right.y * rDist + up.y * uDist,
          z: fwd.z * fDist + right.z * rDist + up.z * uDist
        };
      }

      // Clean, realistic composition: ONE majestic primary planet per sector on the right horizon,
      // Endurance station silhouetted on the upper-left near Gargantua, and open dark space in the center!
      if (sec.id === 'photon_reach') {
        dockStation = buildStation('enduranceRelay', relPos(680, -290, 125), true);
        spawnPlanet('havenVista', 1, 2100, relPos(3600, 1950, -180), [0.18, 0.58, 1.0], false, null, 22);
        buildAsteroids(32, 1800, 320, 1650, [0.22, 0.24, 0.28, 0.005, 0.005, 0.01]);
      } else if (sec.id === 'cinder') {
        spawnPlanet('cinderPlanet', 0, 2200, relPos(3300, 1750, -160), [0.95, 0.30, 0.06], false, null, 38);
        buildAsteroids(36, 1500, 260, 1400, [0.28, 0.12, 0.06, 0.06, 0.015, 0.005]);
      } else if (sec.id === 'forge') {
        spawnPlanet('forgePlanet', 3, 2300, relPos(3400, 1800, -160), [0.90, 0.45, 0.16], true, [0.80, 0.42, 0.14], 28);
        dockStation = buildStation('citadelAegis', relPos(640, -260, 95), false);
        buildAsteroids(30, 1400, 260, 1300, [0.24, 0.20, 0.18, 0.01, 0.005, 0.002]);
      } else if (sec.id === 'haven') {
        spawnPlanet('havenPlanet', 1, 2600, relPos(3400, 1780, -140), [0.18, 0.58, 1.0], false, null, 32);
        const moon = BABYLON.MeshBuilder.CreateSphere('seleneMoon', { diameter: 380, segments: 20 }, scene);
        const mp = relPos(2650, 720, 480);
        moon.parent = envRoot; moon.position.set(mp.x, mp.y, mp.z);
        moon.material = stdMat('moonMat', 0.48, 0.50, 0.55, 0.005, 0.005, 0.01);
        moon.renderingGroupId = 1;
        activeMeshes.push(moon);
        dockStation = buildStation('havenDock', relPos(620, -240, 110), true);
      } else if (sec.id === 'bastion') {
        spawnPlanet('bastionPlanet', 3, 2400, relPos(3400, 1800, -150), [0.90, 0.46, 0.18], true, [0.75, 0.48, 0.25], 30);
        dockStation = buildStation('bastionFort', relPos(650, -250, 90), false);
      } else if (sec.id === 'leviathan') {
        spawnPlanet('levPlanet', 2, 3100, relPos(3800, 1950, -180), [0.46, 0.54, 0.88], true, [0.65, 0.58, 0.82], 42);
        buildAsteroids(32, 1600, 300, 1450, [0.30, 0.34, 0.44, 0.01, 0.01, 0.02]);
      } else if (sec.id === 'solis_veil') {
        spawnPlanet('solisStar', 4, 2100, relPos(4000, 2100, 260), [1.0, 0.58, 0.16], false, null, 45);
        spawnPlanet('veilPlanet', 5, 1350, relPos(2900, 980, -320), [0.18, 0.78, 1.0], false, null, 24);
        dockStation = buildStation('veilArray', relPos(640, -260, 100), true);
      } else {
        spawnPlanet('exilePlanet', 5, 2600, relPos(3500, 1820, -150), [0.18, 0.82, 1.0], true, [0.40, 0.80, 0.95], 34);
        dockStation = buildStation('exileOutpost', relPos(620, -240, 95), true);
      }
    }

    const portalMat = new BABYLON.ShaderMaterial('bhPortal', scene, { vertex: 'bhPortal', fragment: 'bhPortal' }, {
      attributes: ['position', 'normal', 'uv'],
      uniforms: ['world', 'viewProjection', 'uCamPos', 'uTime', 'uCharge'],
      needAlphaBlending: true
    });
    portalMat.backFaceCulling = false;
    portalMat.disableDepthWrite = true;
    const portalMesh = BABYLON.MeshBuilder.CreateSphere('warpPortal', { diameter: 36, segments: 24 }, scene);
    portalMesh.material = portalMat;
    portalMesh.renderingGroupId = 1;
    portalMesh.isVisible = false;

    function update(dt, timeS, camPos, sunDir, shipPos, shipFwd, warpState) {
      for (const item of rotatingNodes) {
        if (item.rx) item.node.rotation.x += item.rx * dt;
        if (item.ry) item.node.rotation.y += item.ry * dt;
        if (item.rz) item.node.rotation.z += item.rz * dt;
      }
      for (const m of planetMats) {
        m.setFloat('uTime', timeS);
        m.setVector3('uCamPos', camPos);
        m.setVector3('uLightDir', sunDir);
      }
      for (const m of atmoMats) {
        m.setVector3('uCamPos', camPos);
        m.setVector3('uLightDir', sunDir);
      }
      if (warpState && warpState.portalVisible) {
        portalMesh.isVisible = true;
        const d = 62;
        portalMesh.position.set(shipPos.x + shipFwd.x * d, shipPos.y + shipFwd.y * d, shipPos.z + shipFwd.z * d);
        const sc = Math.max(0.05, warpState.portalScale || 1);
        portalMesh.scaling.set(sc, sc, sc);
        portalMat.setFloat('uTime', timeS);
        portalMat.setFloat('uCharge', warpState.portalAlpha || 0.8);
        portalMat.setVector3('uCamPos', camPos);
      } else {
        portalMesh.isVisible = false;
      }
    }

    function computeDynamicGravity(shipPos, rHatBH, sectorGravMul, outAccel) {
      const V = Game.Vec3;
      const bhPull = 14.0 * (sectorGravMul || 1.0);
      let ax = -rHatBH.x * bhPull, ay = -rHatBH.y * bhPull, az = -rHatBH.z * bhPull;
      for (const b of gravityBodies) {
        const dx = b.pos.x - shipPos.x, dy = b.pos.y - shipPos.y, dz = b.pos.z - shipPos.z;
        const d = Math.hypot(dx, dy, dz) || 1;
        const pull = (b.strength * 2800) / Math.max(600, d * d * 0.001 + 400);
        ax += (dx / d) * pull;
        ay += (dy / d) * pull;
        az += (dz / d) * pull;
      }
      return V.set(outAccel, ax, ay, az);
    }

    function shift(off) {
      if (dockStation && dockStation.root) {
        dockStation.root.position.x -= off.x;
        dockStation.root.position.y -= off.y;
        dockStation.root.position.z -= off.z;
      }
    }

    return { loadSector, update, shift, computeDynamicGravity, get dockStation() { return dockStation; }, get gravityBodies() { return gravityBodies; }, portalMesh };
  }
  return { create };
})();

// ---------------------------------------------------------------------------
// SECTION: SHIP MODELS -- Gritty Weathered Ceramic-Hex PBR Player Ship
// (matching file_00000000849c8210b4b1cbb2bf23a154_cacdca.png) + Enemy Hulls.
// ---------------------------------------------------------------------------
Game.ShipModels = (function () {
  const HULL_VS = [
    'precision highp float;',
    'attribute vec3 position;',
    'attribute vec3 normal;',
    'uniform mat4 world;',
    'uniform mat4 viewProjection;',
    'varying vec3 vWPos;',
    'varying vec3 vWNorm;',
    'varying vec3 vLocal;',
    'void main(void) {',
    '  vLocal = position;',
    '  vec4 wp = world * vec4(position, 1.0);',
    '  vWPos = wp.xyz;',
    '  vWNorm = normalize(mat3(world[0].xyz, world[1].xyz, world[2].xyz) * normal);',
    '  gl_Position = viewProjection * wp;',
    '}'
  ].join('\n');

  // Gritty, battle-worn Hexagonal Ceramic Armor Shader with deep space shadow contrast
  const HULL_FS = `
precision highp float;
varying vec3 vWPos;
varying vec3 vWNorm;
varying vec3 vLocal;
uniform vec3 uCamPos;
uniform vec3 uSunDir;

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.73205))), p.x);
}
vec4 hexGrid(vec2 uv) {
  vec2 r = vec2(1.0, 1.73205);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  float edge = 0.5 - hexDist(gv);
  vec2 id = uv - gv;
  return vec4(edge, id.x, id.y, 0.0);
}
float hash3(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main(void) {
  vec3 N = normalize(vWNorm);
  vec3 V = normalize(uCamPos - vWPos);
  if (dot(N, V) < 0.0) N = -N;
  vec3 L = normalize(-uSunDir);
  float ndl = max(0.0, dot(N, L));
  float hemi = 0.5 * N.y + 0.5;

  vec4 hx = hexGrid(vLocal.xz * 0.75);
  float seam = smoothstep(0.018, 0.065, hx.x);
  float tileVar = fract(sin(hx.y * 127.1 + hx.z * 311.7) * 43758.5453);
  float grit = hash3(floor(vLocal * 16.0)) * 0.08;

  // Weathered warm ceramic plating with dark panel seams & aft thermal soot
  float aftScorch = smoothstep(-2.5, -7.2, vLocal.z) * 0.35;
  vec3 cream = mix(vec3(0.76, 0.72, 0.66), vec3(0.88, 0.84, 0.78), tileVar) - grit;
  cream = mix(cream, vec3(0.22, 0.20, 0.19), aftScorch);
  cream = mix(vec3(0.18, 0.17, 0.16), cream, seam);

  // Gritty low-key space lighting: dark shadow floor + warm accretion rim & specular
  vec3 amb = mix(vec3(0.05, 0.06, 0.08), vec3(0.24, 0.26, 0.30), hemi);
  vec3 H = normalize(L + V);
  float spec = pow(max(0.0, dot(N, H)), 54.0) * ndl;
  float fres = pow(1.0 - max(0.0, dot(N, V)), 3.2);

  vec3 col = cream * (amb + vec3(1.0, 0.88, 0.72) * ndl * 0.95)
           + vec3(1.0, 0.90, 0.76) * spec * 0.42
           + vec3(1.0, 0.76, 0.45) * fres * 0.22;
  gl_FragColor = vec4(col, 1.0);
}
`;

  function flatMesh(name, scene, tris, mat) {
    const pos = [], idx = [], nor = [];
    let cx = 0, cy = 0, cz = 0, n = 0;
    for (const t of tris) for (const p of t) { cx += p[0]; cy += p[1]; cz += p[2]; n++; }
    cx /= n; cy /= n; cz /= n;
    tris.forEach((t, i) => {
      const ux = t[1][0] - t[0][0], uy = t[1][1] - t[0][1], uz = t[1][2] - t[0][2];
      const vx = t[2][0] - t[0][0], vy = t[2][1] - t[0][1], vz = t[2][2] - t[0][2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const mx = (t[0][0] + t[1][0] + t[2][0]) / 3 - cx, my = (t[0][1] + t[1][1] + t[2][1]) / 3 - cy, mz = (t[0][2] + t[1][2] + t[2][2]) / 3 - cz;
      const flip = nx * mx + ny * my + nz * mz < 0;
      for (let k = 0; k < 3; k++) { pos.push(t[k][0], t[k][1], t[k][2]); nor.push(flip ? -nx : nx, flip ? -ny : ny, flip ? -nz : nz); }
      idx.push(i * 3, i * 3 + 1, i * 3 + 2);
    });
    const vd = new BABYLON.VertexData(); vd.positions = pos; vd.indices = idx; vd.normals = nor;
    const m = new BABYLON.Mesh(name, scene); vd.applyToMesh(m);
    m.material = mat; m.renderingGroupId = 1;
    return m;
  }
  function quad(a, b, c, d) { return [[a, b, c], [a, c, d]]; }
  function mirrorX(tris) { return tris.map(t => t.map(p => [-p[0], p[1], p[2]])); }

  function getPalette(scene) {
    if (scene._shipPalette) return scene._shipPalette;
    BABYLON.Effect.ShadersStore.bhHullVertexShader = HULL_VS;
    BABYLON.Effect.ShadersStore.bhHullFragmentShader = HULL_FS;
    const pCeramicHex = new BABYLON.ShaderMaterial('pCeramicHex', scene, { vertex: 'bhHull', fragment: 'bhHull' }, {
      attributes: ['position', 'normal'],
      uniforms: ['world', 'viewProjection', 'uCamPos', 'uSunDir'],
    });
    pCeramicHex.backFaceCulling = false;
    pCeramicHex.setVector3('uCamPos', new BABYLON.Vector3(0, 0, -20));
    pCeramicHex.setVector3('uSunDir', new BABYLON.Vector3(0, -0.5, 1));

    function mat(name, dr, dg, db, er, eg, eb, spec) {
      const m = new BABYLON.StandardMaterial(name, scene);
      m.diffuseColor = new BABYLON.Color3(dr, dg, db); m.emissiveColor = new BABYLON.Color3(er, eg, eb);
      const s = spec == null ? 0.40 : spec; m.specularColor = new BABYLON.Color3(s, s, s); m.specularPower = 52;
      m.backFaceCulling = false;
      return m;
    }
    function glow(name, r, g, b) {
      const m = new BABYLON.StandardMaterial(name, scene);
      m.disableLighting = true; m.emissiveColor = new BABYLON.Color3(r, g, b); m.backFaceCulling = false;
      return m;
    }
    scene._shipPalette = {
      pCeramicHex,
      pHull: mat('pHull', 0.84, 0.80, 0.74, 0.02, 0.02, 0.02, 0.45),
      pCharcoal: mat('pCharcoal', 0.12, 0.13, 0.15, 0.01, 0.01, 0.015, 0.45),
      pOrange: mat('pOrange', 0.85, 0.38, 0.12, 0.12, 0.04, 0.005, 0.40),
      pCopper: mat('pCopper', 0.68, 0.32, 0.12, 0.15, 0.06, 0.01, 0.70),
      pCanopy: mat('pCanopy', 0.08, 0.10, 0.13, 0.01, 0.02, 0.04, 0.95),
      pNozzleCore: glow('pNozzleCore', 1.0, 0.86, 0.42),
      pLedWhite: glow('pLedWhite', 0.90, 0.96, 1.0),
      fBody: mat('fBody', 0.12, 0.13, 0.16, 0.04, 0.01, 0.005, 0.55),
      fTrim: mat('fTrim', 0.42, 0.08, 0.04, 0.25, 0.04, 0.01, 0.40),
      fRed: glow('fRed', 1.0, 0.22, 0.06),
      gBody: mat('gBody', 0.14, 0.15, 0.18, 0.03, 0.01, 0.005, 0.50),
      gArmor: mat('gArmor', 0.24, 0.18, 0.14, 0.08, 0.02, 0.005, 0.50),
      gOrange: glow('gOrange', 1.0, 0.45, 0.08),
      cBody: mat('cBody', 0.16, 0.14, 0.22, 0.04, 0.01, 0.06, 0.55),
      cGlow: glow('cGlow', 0.78, 0.28, 1.0),
    };
    return scene._shipPalette;
  }

  function addGlow(scene, root, name, x, y, z, size, mat) {
    const s = BABYLON.MeshBuilder.CreateSphere(name, { diameter: size, segments: 8 }, scene);
    s.material = mat; s.parent = root; s.position.set(x, y, z); s.renderingGroupId = 1; return s;
  }

  function addHexNozzle(scene, root, name, x, y, z, outerR, len, P) {
    const shroud = BABYLON.MeshBuilder.CreateCylinder(name + '_shroud', {
      height: len, diameterTop: outerR * 2.15, diameterBottom: outerR * 1.75, tessellation: 6
    }, scene);
    shroud.parent = root; shroud.rotation.x = Math.PI * 0.5;
    shroud.position.set(x, y, z + len * 0.35);
    shroud.material = P.pCharcoal; shroud.renderingGroupId = 1;

    const lip = BABYLON.MeshBuilder.CreateCylinder(name + '_lip', {
      height: len * 0.45, diameterTop: outerR * 1.80, diameterBottom: outerR * 1.52, tessellation: 6
    }, scene);
    lip.parent = root; lip.rotation.x = Math.PI * 0.5;
    lip.position.set(x, y, z - len * 0.12);
    lip.material = P.pCopper; lip.renderingGroupId = 1;

    const core = BABYLON.MeshBuilder.CreateCylinder(name + '_core', {
      height: 0.4, diameterTop: outerR * 1.38, diameterBottom: outerR * 1.38, tessellation: 6
    }, scene);
    core.parent = root; core.rotation.x = Math.PI * 0.5;
    core.position.set(x, y, z - len * 0.22);
    core.material = P.pNozzleCore; core.renderingGroupId = 1;
    return core;
  }

  function buildPlayer(scene) {
    const P = getPalette(scene);
    const root = new BABYLON.TransformNode('playerShip', scene);
    const box = (name, w, h, d, x, y, z, m, rx, ry, rz) => {
      const b = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z);
      if (rx || ry || rz) b.rotation.set(rx || 0, ry || 0, rz || 0);
      b.parent = root; b.material = m; b.renderingGroupId = 1; return b;
    };

    const nose = [0, 0.0, 11.2];
    const R0 = [[0, 1.15, 7.8], [1.85, 0.1, 7.8], [0, -0.75, 7.8], [-1.85, 0.1, 7.8]];
    const R1 = [[0, 1.75, 2.2], [2.95, 0.2, 2.2], [0, -0.95, 2.2], [-2.95, 0.2, 2.2]];
    const R2 = [[0, 1.65, -6.4], [2.75, 0.15, -6.4], [0, -1.05, -6.4], [-2.75, 0.15, -6.4]];
    const fus = [];
    for (let i = 0; i < 4; i++) fus.push([nose, R0[i], R0[(i + 1) % 4]]);
    for (let i = 0; i < 4; i++) fus.push(...quad(R0[i], R1[i], R1[(i + 1) % 4], R0[(i + 1) % 4]));
    for (let i = 0; i < 4; i++) fus.push(...quad(R1[i], R2[i], R2[(i + 1) % 4], R1[(i + 1) % 4]));
    fus.push(...quad(R2[0], R2[1], R2[2], R2[3]));
    flatMesh('pFusCeramic', scene, fus, P.pCeramicHex).parent = root;

    box('pNoseCap', 2.2, 0.95, 2.6, 0, -0.05, 9.8, P.pCharcoal);
    box('pCenterSpine', 1.25, 0.42, 8.6, 0, 1.56, -2.0, P.pCharcoal);
    box('pRearCollar', 2.8, 0.85, 2.4, 0, 0.85, -6.3, P.pHull);

    box('pCanopyBase', 1.85, 0.72, 3.4, 0, 1.52, 4.2, P.pCanopy, 0.14, 0, 0);
    box('pCheekOrangeL', 0.25, 0.45, 2.0, -1.75, 0.85, 5.2, P.pOrange, 0, -0.22, -0.3);
    box('pCheekOrangeR', 0.25, 0.45, 2.0, 1.75, 0.85, 5.2, P.pOrange, 0, 0.22, 0.3);

    for (const side of [-1, 1]) {
      box('pIntakeHood_' + side, 1.45, 0.62, 3.0, side * 1.48, 1.32, -3.5, P.pHull);
      box('pIntakeSlot_' + side, 1.10, 0.34, 0.6, side * 1.48, 1.26, -4.85, P.pCharcoal);
      box('pSidePod_' + side, 2.35, 1.65, 5.2, side * 2.55, -0.05, -4.4, P.pCharcoal, 0, side * 0.06, 0);
    }

    const wingR = [
      [[2.4, 0.26, 2.2], [2.8, 0.22, -5.2], [8.8, 0.08, -4.2], [8.8, 0.08, -1.8]],
      [[2.4, -0.22, 2.2], [8.8, -0.14, -1.8], [8.8, -0.14, -4.2], [2.8, -0.22, -5.2]]
    ];
    const wTris = [
      ...quad(wingR[0][0], wingR[0][1], wingR[0][2], wingR[0][3]),
      ...quad(wingR[1][0], wingR[1][1], wingR[1][2], wingR[1][3]),
      ...quad(wingR[0][0], wingR[0][3], wingR[1][1], wingR[1][0]),
      ...quad(wingR[0][1], wingR[1][3], wingR[1][2], wingR[0][2])
    ];
    flatMesh('pWingsCeramic', scene, wTris.concat(mirrorX(wTris)), P.pCeramicHex).parent = root;

    for (const side of [-1, 1]) {
      box('pWingStripe_' + side, 0.52, 0.14, 3.4, side * 4.2, 0.22, -2.5, P.pOrange, 0, side * 0.35, 0);
      box('pWingVent_' + side, 1.35, 0.18, 0.85, side * 5.2, 0.18, -3.5, P.pCharcoal, 0, side * 0.2, 0);
      box('pWingRootDark_' + side, 0.65, 0.45, 5.8, side * 2.55, 0.42, -1.2, P.pCharcoal);
      box('pWingLed_' + side, 1.1, 0.14, 0.22, side * 6.4, 0.0, -4.35, P.pLedWhite, 0, side * 0.15, 0);
    }

    const finR = [
      [[8.75, -1.65, -4.8], [8.75, 2.65, -3.6], [8.75, 2.55, -1.6], [8.75, -1.15, -1.2]]
    ];
    const finTris = [...quad(finR[0][0], finR[0][1], finR[0][2], finR[0][3])];
    flatMesh('pEndplates', scene, finTris.concat(mirrorX(finTris)), P.pHull).parent = root;
    for (const side of [-1, 1]) {
      box('pFinLead_' + side, 0.34, 4.1, 0.55, side * 8.8, 0.55, -1.5, P.pCharcoal, -0.15, 0, 0);
      box('pFinRear_' + side, 0.36, 4.3, 0.62, side * 8.8, 0.45, -4.55, P.pCharcoal, 0.22, 0, 0);
      box('pFinOrange_' + side, 0.28, 1.75, 1.15, side * 8.78, 1.15, -3.45, P.pOrange, 0.2, 0, 0);
      box('pFinLed_' + side, 0.22, 1.1, 0.18, side * 8.85, -0.75, -4.65, P.pLedWhite);
    }

    const engCenter = addHexNozzle(scene, root, 'pNozCenter', 0, -0.05, -7.2, 1.32, 2.2, P);
    const engLeft   = addHexNozzle(scene, root, 'pNozLeft',  -2.55, -0.12, -6.8, 0.92, 1.8, P);
    const engRight  = addHexNozzle(scene, root, 'pNozRight',  2.55, -0.12, -6.8, 0.92, 1.8, P);

    return { root, engines: [engLeft, engCenter, engRight], hullMat: P.pCeramicHex, radius: 8.8 };
  }

  function buildFighter(scene) {
    const P = getPalette(scene);
    const root = new BABYLON.TransformNode('fighter', scene);
    const nose = [0, 0, 9.5], top = [0, 1.4, -3], bot = [0, -0.95, -2], rear = [0, 0.2, -6.8];
    const L = [-1.7, 0, -3], Rr = [1.7, 0, -3];
    const wl = [-7.8, -0.25, -5.8], wr = [7.8, -0.25, -5.8], wlb = [-7.8, -0.5, -5.8], wrb = [7.8, -0.5, -5.8];
    const tris = [
      [nose, top, Rr], [nose, Rr, bot], [nose, bot, L], [nose, L, top],
      [top, rear, Rr], [Rr, rear, bot], [bot, rear, L], [L, rear, top],
      [Rr, rear, wr], [Rr, wr, rear], [L, wl, rear], [L, rear, wl],
      [Rr, wr, wrb], [L, wlb, wl], [rear, wrb, wr], [rear, wl, wlb],
    ];
    flatMesh('fHull', scene, tris, P.fBody).parent = root;
    addGlow(scene, root, 'fSensor', 0, 0.25, 7.4, 0.95, P.fRed);
    const eng = addGlow(scene, root, 'fEng', 0, 0.2, -7.1, 1.85, P.fRed);
    return { root, engines: [eng], radius: 8 };
  }

  function buildGunship(scene) {
    const P = getPalette(scene);
    const root = new BABYLON.TransformNode('gunship', scene);
    const box = (name, w, h, d, x, y, z, m) => {
      const b = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.parent = root; b.material = m; b.renderingGroupId = 1; return b;
    };
    box('gMain', 7.2, 3.8, 22, 0, 0, 0, P.gBody);
    box('gPodL', 3.2, 3.0, 15, -6.6, -0.4, 3.5, P.gArmor);
    box('gPodR', 3.2, 3.0, 15, 6.6, -0.4, 3.5, P.gArmor);
    box('gStrut', 14.0, 1.1, 4.5, 0, -0.2, 1.5, P.gBody);
    box('gBridge', 3.6, 2.5, 6.5, 0, 2.9, -2.5, P.gArmor);
    addGlow(scene, root, 'gSensor', 0, 0.4, 11.4, 1.7, P.gOrange);
    const engines = [
      addGlow(scene, root, 'gEng1', -2.4, 0, -11.5, 2.5, P.gOrange),
      addGlow(scene, root, 'gEng2', 2.4, 0, -11.5, 2.5, P.gOrange)
    ];
    return { root, engines, radius: 12 };
  }

  function buildCorvette(scene) {
    const P = getPalette(scene);
    const root = new BABYLON.TransformNode('corvette', scene);
    const box = (name, w, h, d, x, y, z, m) => {
      const b = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.parent = root; b.material = m; b.renderingGroupId = 1; return b;
    };
    box('cCore', 9.0, 4.8, 30, 0, 0, 0, P.cBody);
    box('cProw', 5.5, 3.0, 12, 0, -0.3, 18, P.pCharcoal);
    box('cWingL', 8.0, 1.4, 16, -8.0, 0, -2, P.cBody);
    box('cWingR', 8.0, 1.4, 16, 8.0, 0, -2, P.cBody);
    box('cTower', 4.0, 3.8, 8, 0, 3.8, -5, P.pCharcoal);
    addGlow(scene, root, 'cVls1', 0, 2.6, 6, 1.8, P.cGlow);
    addGlow(scene, root, 'cVls2', 0, 2.6, 11, 1.8, P.cGlow);
    const engines = [
      addGlow(scene, root, 'cEngL', -3.2, 0, -15.5, 3.0, P.cGlow),
      addGlow(scene, root, 'cEngR', 3.2, 0, -15.5, 3.0, P.cGlow)
    ];
    return { root, engines, radius: 15 };
  }

  function buildCarrier(scene) {
    const P = getPalette(scene);
    const root = new BABYLON.TransformNode('carrier', scene);
    const box = (name, w, h, d, x, y, z, m) => {
      const b = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z); b.parent = root; b.material = m; b.renderingGroupId = 1; return b;
    };
    box('kHull', 28, 12, 86, 0, 0, 0, P.gBody);
    box('kDeckL', 10, 5, 68, -18, 1, 6, P.gArmor);
    box('kDeckR', 10, 5, 68, 18, 1, 6, P.gArmor);
    box('kBridge', 9, 10, 18, 0, 10, -16, P.cBody);
    addGlow(scene, root, 'kHangar', 0, 0.5, 36, 6.5, P.fRed);
    addGlow(scene, root, 'kShieldDome', 0, 15.5, -16, 5.2, P.cGlow);
    const engines = [
      addGlow(scene, root, 'kEng1', -9, 0, -44, 5.5, P.gOrange),
      addGlow(scene, root, 'kEng2', 9, 0, -44, 5.5, P.gOrange),
      addGlow(scene, root, 'kEng3', 0, 3, -44, 6.2, P.fRed)
    ];
    return { root, engines, radius: 38 };
  }

  function buildByKind(scene, kind) {
    if (kind === 'player') return buildPlayer(scene);
    if (kind === 'gunship') return buildGunship(scene);
    if (kind === 'corvette') return buildCorvette(scene);
    if (kind === 'carrier') return buildCarrier(scene);
    return buildFighter(scene);
  }

  return { buildPlayer, buildFighter, buildGunship, buildCorvette, buildCarrier, buildByKind };
})();
