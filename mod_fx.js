// ---------------------------------------------------------------------------
// SECTION: FX -- Thin-instanced additive glow quads + ribbon-billboard streaks
// (one draw call each), pooled particle explosions, shield sparks, missile exhaust,
// countermeasure flares, and lingering phase-laser beams.
// ---------------------------------------------------------------------------
Game.FX = (function () {
  const VERT = [
    'precision highp float;',
    'attribute vec3 position; attribute vec2 uv;',
    'attribute vec4 world0; attribute vec4 world1; attribute vec4 world2; attribute vec4 world3;',
    'attribute vec4 instanceColor;',
    'uniform mat4 viewProjection;',
    'varying vec2 vUV; varying vec4 vColor;',
    'void main(void) {',
    '  mat4 w = mat4(world0, world1, world2, world3);',
    '  vUV = uv; vColor = instanceColor;',
    '  gl_Position = viewProjection * w * vec4(position, 1.0);',
    '}'].join('\n');
  const FRAG_GLOW = [
    'precision highp float; varying vec2 vUV; varying vec4 vColor;',
    'void main(void) {',
    '  vec2 q = vUV * 2.0 - 1.0; float d2 = dot(q, q);',
    '  float a = exp(-d2 * 4.5) * (1.0 - smoothstep(0.7, 1.0, d2));',
    '  gl_FragColor = vec4(vColor.rgb * a * vColor.a, 1.0);',
    '}'].join('\n');
  const FRAG_STREAK = [
    'precision highp float; varying vec2 vUV; varying vec4 vColor;',
    'void main(void) {',
    '  vec2 q = vUV * 2.0 - 1.0;',
    '  float w = exp(-q.x * q.x * 5.0);',
    '  float l = pow(max(0.0, 1.0 - q.y * q.y), 1.4);',
    '  float core = exp(-q.x * q.x * 40.0) * l;',
    '  vec3 c = vColor.rgb * (w * l * 0.9) + vec3(1.0) * core * 0.8;',
    '  gl_FragColor = vec4(c * vColor.a, 1.0);',
    '}'].join('\n');

  function makeLayer(scene, name, frag, maxCount) {
    BABYLON.Effect.ShadersStore[name + 'VertexShader'] = VERT;
    BABYLON.Effect.ShadersStore[name + 'FragmentShader'] = frag;
    const mat = new BABYLON.ShaderMaterial(name, scene, { vertex: name, fragment: name }, {
      attributes: ['position', 'uv', 'world0', 'world1', 'world2', 'world3', 'instanceColor'],
      uniforms: ['viewProjection'], needAlphaBlending: true,
    });
    mat.backFaceCulling = false; mat.disableDepthWrite = true;
    mat.alphaMode = BABYLON.Constants.ALPHA_ONEONE;
    const mesh = BABYLON.MeshBuilder.CreatePlane(name + 'Quad', { size: 1 }, scene);
    mesh.material = mat; mesh.alwaysSelectAsActiveMesh = true; mesh.isPickable = false; mesh.renderingGroupId = 1;
    const mats = new Float32Array(maxCount * 16), cols = new Float32Array(maxCount * 4);
    mesh.thinInstanceSetBuffer('matrix', mats, 16, false);
    mesh.thinInstanceSetBuffer('instanceColor', cols, 4, false);
    mesh.thinInstanceCount = 0;
    return { mesh, mats, cols, n: 0, max: maxCount };
  }
  function pushInstance(L, rx, ry, rz, ux, uy, uz, fx, fy, fz, px, py, pz, r, g, b, a) {
    if (L.n >= L.max) return;
    const k = L.n * 16, c = L.n * 4;
    L.mats[k] = rx; L.mats[k + 1] = ry; L.mats[k + 2] = rz; L.mats[k + 3] = 0;
    L.mats[k + 4] = ux; L.mats[k + 5] = uy; L.mats[k + 6] = uz; L.mats[k + 7] = 0;
    L.mats[k + 8] = fx; L.mats[k + 9] = fy; L.mats[k + 10] = fz; L.mats[k + 11] = 0;
    L.mats[k + 12] = px; L.mats[k + 13] = py; L.mats[k + 14] = pz; L.mats[k + 15] = 1;
    L.cols[c] = r; L.cols[c + 1] = g; L.cols[c + 2] = b; L.cols[c + 3] = a;
    L.n++;
  }
  function flush(L) {
    L.mesh.thinInstanceCount = L.n;
    L.mesh.thinInstanceBufferUpdated('matrix');
    L.mesh.thinInstanceBufferUpdated('instanceColor');
  }

  function create(scene) {
    const glow = makeLayer(scene, 'fxGlow', FRAG_GLOW, 800);
    const streak = makeLayer(scene, 'fxStreak', FRAG_STREAK, 320);
    const MAXP = 600;
    const px = new Float32Array(MAXP), py = new Float32Array(MAXP), pz = new Float32Array(MAXP);
    const vx = new Float32Array(MAXP), vy = new Float32Array(MAXP), vz = new Float32Array(MAXP);
    const life = new Float32Array(MAXP), maxLife = new Float32Array(MAXP), s0 = new Float32Array(MAXP), s1 = new Float32Array(MAXP);
    const cr = new Float32Array(MAXP), cg = new Float32Array(MAXP), cb = new Float32Array(MAXP), ca = new Float32Array(MAXP);
    let cursor = 0;
    const rng = Game.Rng.createRng(99173);

    // Active laser beams (rendered as ribbon streaks while fading)
    const beams = [];

    function spawn(x, y, z, ax, ay, az, lifeS, size0, size1, r, g, b, a) {
      const i = cursor; cursor = (cursor + 1) % MAXP;
      px[i] = x; py[i] = y; pz[i] = z; vx[i] = ax; vy[i] = ay; vz[i] = az;
      life[i] = lifeS; maxLife[i] = lifeS; s0[i] = size0; s1[i] = size1; cr[i] = r; cg[i] = g; cb[i] = b; ca[i] = a;
    }
    function burst(pos, baseVel, count, speed, lifeS, size, r, g, b) {
      for (let n = 0; n < count; n++) {
        const u = rng.next() * 2 - 1, th = rng.next() * 6.2831853, s = Math.sqrt(1 - u * u);
        const sp = speed * (0.35 + 0.65 * rng.next());
        spawn(pos.x, pos.y, pos.z, baseVel.x + s * Math.cos(th) * sp, baseVel.y + u * sp, baseVel.z + s * Math.sin(th) * sp,
          lifeS * (0.55 + 0.45 * rng.next()), size * (0.6 + 0.8 * rng.next()), size * 0.15, r, g, b, 1);
      }
    }
    function explosion(pos, baseVel, scale) {
      spawn(pos.x, pos.y, pos.z, baseVel.x, baseVel.y, baseVel.z, 0.55, 12 * scale, 48 * scale, 1.0, 0.9, 0.6, 1.0);
      burst(pos, baseVel, 28, 75 * scale, 1.45, 7.5 * scale, 1.0, 0.48, 0.14);
      burst(pos, baseVel, 18, 125 * scale, 0.95, 3.8 * scale, 1.0, 0.88, 0.52);
      burst(pos, baseVel, 12, 32 * scale, 2.1, 13 * scale, 0.55, 0.18, 0.06);
    }
    function sparks(pos, baseVel, count, color) {
      burst(pos, baseVel, count, 95, 0.38, 2.4, color[0], color[1], color[2]);
    }
    function laserBeam(start, end) {
      beams.push({
        sx: start.x, sy: start.y, sz: start.z,
        ex: end.x, ey: end.y, ez: end.z,
        life: 0.32, maxLife: 0.32
      });
    }
    function flareBurst(pos, baseVel) {
      burst(pos, baseVel, 18, 65, 2.2, 5.5, 1.0, 0.85, 0.35);
    }

    function updateParticles(dt, camPos, camRight, camUp, camFwd) {
      glow.n = 0;
      for (let i = 0; i < MAXP; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        if (life[i] <= 0) continue;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;
        const t = 1 - life[i] / maxLife[i];
        const size = s0[i] + (s1[i] - s0[i]) * t;
        const a = ca[i] * (1 - t) * (1 - t * 0.3);
        pushInstance(glow, camRight.x * size, camRight.y * size, camRight.z * size, camUp.x * size, camUp.y * size, camUp.z * size,
          camFwd.x, camFwd.y, camFwd.z, px[i], py[i], pz[i], cr[i], cg[i], cb[i], a);
      }
    }
    function glowAt(x, y, z, size, r, g, b, a, camRight, camUp, camFwd) {
      pushInstance(glow, camRight.x * size, camRight.y * size, camRight.z * size, camUp.x * size, camUp.y * size, camUp.z * size,
        camFwd.x, camFwd.y, camFwd.z, x, y, z, r, g, b, a);
    }
    function beginStreaks() { streak.n = 0; }
    function streakAt(x, y, z, dx, dy, dz, length, width, camPos, r, g, b, a) {
      let tx = camPos.x - x, ty = camPos.y - y, tz = camPos.z - z;
      let l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      let sx = dy * tz - dz * ty, sy = dz * tx - dx * tz, sz = dx * ty - dy * tx;
      l = Math.hypot(sx, sy, sz);
      if (l < 1e-4) { sx = 1; sy = 0; sz = 0; l = 1; }
      sx /= l; sy /= l; sz /= l;
      pushInstance(streak, sx * width, sy * width, sz * width, dx * length, dy * length, dz * length, tx, ty, tz, x, y, z, r, g, b, a);
    }
    function updateBeams(dt, camPos) {
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.life -= dt;
        if (b.life <= 0) { beams.splice(i, 1); continue; }
        const dx = b.ex - b.sx, dy = b.ey - b.sy, dz = b.ez - b.sz;
        const len = Math.hypot(dx, dy, dz) || 1;
        const mx = (b.sx + b.ex) * 0.5, my = (b.sy + b.ey) * 0.5, mz = (b.sz + b.ez) * 0.5;
        const alpha = b.life / b.maxLife;
        streakAt(mx, my, mz, dx / len, dy / len, dz / len, len, 3.6 * alpha, camPos, 0.25, 0.95, 1.0, alpha);
      }
    }
    function endFrame() { flush(glow); flush(streak); }
    function shift(off) {
      for (let i = 0; i < MAXP; i++) { px[i] -= off.x; py[i] -= off.y; pz[i] -= off.z; }
      for (const b of beams) {
        b.sx -= off.x; b.sy -= off.y; b.sz -= off.z;
        b.ex -= off.x; b.ey -= off.y; b.ez -= off.z;
      }
    }
    function clear() { life.fill(0); beams.length = 0; }
    return { updateParticles, updateBeams, glowAt, beginStreaks, streakAt, endFrame, spawn, burst, explosion, sparks, laserBeam, flareBurst, shift, clear };
  }
  return { create };
})();
