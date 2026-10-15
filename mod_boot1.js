// ---------------------------------------------------------------------------
// SECTION: ENGINE BOOT -- wires the world together.
//
// Fixes carried in here (found on re-review of the previous build):
//  * REBASE: the previous build re-anchored bodies but not the chase-camera
//    spring (camera flew 50 km back to the ship at every re-anchor), and it
//    overwrote the frame anchor from the reference orbit every tick, silently
//    discarding the accumulated rebase displacement D. Now anchor = reference
//    orbit position + D, frame acceleration = gravity at the reference point
//    (the true free-fall acceleration of the frame), and every consumer of
//    local coordinates is shifted on rebase.
//  * Render resolution is adaptive (phones run at 2-3x device-pixel-ratio; the
//    sky pass is per-pixel, so internal resolution is capped and auto-tuned).
// ---------------------------------------------------------------------------
Game.Boot = (function () {
  const V = Game.Vec3, Q = Game.Quat, K = Game.Constants, FC = Game.FlightController;

  function start() {
    const params = new URLSearchParams(location.search);
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false }, false);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    // ---- adaptive internal resolution ----
    const dpr = window.devicePixelRatio || 1;
    const cssPixels = Math.max(1, window.innerWidth * window.innerHeight);
    let pixelRatio = Math.min(dpr, Math.sqrt(1.3e6 / cssPixels)); // ~1.3 megapixel budget
    pixelRatio = Math.max(0.6, pixelRatio);
    const ratioMax = pixelRatio;
    const adaptive = params.get('q') !== 'fixed';
    function applyRatio() { engine.setHardwareScalingLevel(1 / pixelRatio); }
    applyRatio();
    let emaMs = 16, frameCount = 0;

    const camera = new BABYLON.UniversalCamera('chaseCam', new BABYLON.Vector3(0, 6.5, -22), scene);
    camera.minZ = 0.5; camera.maxZ = 20000;
    camera.fov = (68 * Math.PI) / 180; // Camera.fov is RADIANS (doc §15.4 baseline ~68 deg)
    // no attachControl(): Game.ChaseCamera drives the camera every frame

    // ---- world ----
    const arena = Game.Arena.create({ name: 'Photon Reach', radiusRs: 40, orbitInclinationDeg: 20, diskInnerRs: 3.0, diskOuterRs: 18.0 });
    const sky = Game.Sky.create(scene, arena, { lowQuality: params.get('q') === 'low', exposure: 1.0 });

    const sun = new BABYLON.DirectionalLight('bhLight', new BABYLON.Vector3(0, -1, 0), scene);
    sun.diffuse = new BABYLON.Color3(1.0, 0.72, 0.45); sun.specular = new BABYLON.Color3(1.0, 0.8, 0.6); sun.intensity = 1.6;
    const fill = new BABYLON.HemisphericLight('fill', new BABYLON.Vector3(0.2, 1, 0.1), scene);
    fill.diffuse = new BABYLON.Color3(0.4, 0.55, 0.95); fill.groundColor = new BABYLON.Color3(0.05, 0.05, 0.09); fill.intensity = 0.45;

    const dust = Game.Dust.create(scene, 460, 900);

    // ---- simulation state ----
    const ref0 = arena.refState(0);
    const g0 = V.v3(); Game.Gravity.gravityAt(ref0.position, g0);
    const frame = Game.Encounter.createFrame(ref0.position, ref0.velocity, g0);
    const D = V.v3(0, 0, 0); // accumulated rebase displacement of the frame origin
    let simTime = 0;
    const q0 = { x: 0, y: 0, z: 0, w: 1 };
    arena.startOrientation(q0, 26, 6);
    const ship = Game.PhysicsWorld.createBody('player', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, q0);
    ship.controlState = FC.createShipControlState();
    ship.profile = FC.PLAYER_PROFILE;
    const omegaW = V.v3(); arena.frameOmega(omegaW, ref0.position, ref0.velocity);
    { const qc = { x: 0, y: 0, z: 0, w: 1 }, ob = V.v3(); Q.qConjugate(qc, ship.orientation); Q.qRotateVector(ob, qc, omegaW); V.copy(ship.controlState.angularVelocityRadPerSecond, ob); }
    const bodies = [ship];
    const scratch = Game.PhysicsWorld.createScratch();
    const clock = Game.Clock.createFixedStepClock(K.PHYSICS_DT, K.MAX_PHYSICS_STEPS_PER_RENDER, K.MAX_ACCEPTED_FRAME_DT);
    const state = { holdMode: params.get('hold') === 'inertial' ? 'inertial' : 'orbit' };

    const player = Game.ShipModels.buildPlayer(scene);
    player.root.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);

    const camState = Game.ChaseCamera.createState((() => { const o = V.v3(); Q.qRotateVector(o, q0, Game.ChaseCamera.LOCAL_OFFSET); return o; })());

    Game.TouchInput.attach(document.body);
    Game.KeyboardInput.attach();
    const speedHudEl = document.getElementById('speedHud');
    const touchDebugEl = document.getElementById('touchDebug');
    const renderPos = V.v3(), renderOri = { x: 0, y: 0, z: 0, w: 1 };
    const omega = V.v3(), rHat = V.v3(), camAbs = V.v3();
    let ref = ref0;
    const clamp11 = (v) => Math.max(-1, Math.min(1, v));

    function rebase() {
      const off = V.v3(ship.positionMeters.x, ship.positionMeters.y, ship.positionMeters.z);
      Game.Encounter.rebaseEncounter(frame, bodies, ship);
      V.add(D, D, off);
      Game.ChaseCamera.shift(camState, off);
      dust.shift(off);
      if (Game.Boot.onRebase) Game.Boot.onRebase(off);
    }

    function fixedStep(dt) {
      simTime += dt;
      ref = arena.refState(simTime);
      frame.anchorPositionMeters.x = ref.position.x + D.x; frame.anchorPositionMeters.y = ref.position.y + D.y; frame.anchorPositionMeters.z = ref.position.z + D.z;
      V.copy(frame.anchorVelocityMps, ref.velocity);
      Game.Gravity.gravityAt(ref.position, frame.anchorAccelerationMps2); // true free-fall acceleration of the frame

      const t = Game.TouchInput.getState(), kb = Game.KeyboardInput.getState();
      const intent = {
        thrust: clamp11(t.leftY + kb.thrust), strafe: clamp11(t.leftX + kb.strafe), vertical: clamp11(kb.vertical),
        yaw: clamp11(t.rightX + kb.yaw), pitch: clamp11(t.rightY + kb.pitch), roll: clamp11(kb.roll),
      };
      arena.frameOmega(omega, ref.position, ref.velocity);
      FC.update(ship, intent, dt, state.holdMode === 'orbit' ? omega : null);
      Game.PhysicsWorld.step(frame, bodies, dt, scratch);
      if (V.length(ship.positionMeters) > K.REANCHOR_THRESHOLD_M) rebase();
    }

    let lastMs = performance.now();
    engine.runRenderLoop(() => {
      const nowMs = performance.now();
      const realDt = (nowMs - lastMs) / 1000; lastMs = nowMs;
      const alpha = clock.advance(realDt, fixedStep);

      Game.RenderSnapshot.sample(ship.snapshot, alpha, renderPos, renderOri);
      player.root.position.set(renderPos.x, renderPos.y, renderPos.z);
      player.root.rotationQuaternion.set(renderOri.x, renderOri.y, renderOri.z, renderOri.w);

      const cam = Game.ChaseCamera.update(camState, ship, Math.min(realDt, K.MAX_ACCEPTED_FRAME_DT));
      camera.position.set(cam.position.x, cam.position.y, cam.position.z);
      camera.upVector.copyFromFloats(cam.up.x, cam.up.y, cam.up.z);
      camera.setTarget(new BABYLON.Vector3(cam.lookAt.x, cam.lookAt.y, cam.lookAt.z));

      // black hole direction as seen from the camera (absolute = reference orbit + D + local)
      camAbs.x = ref.position.x + D.x + cam.position.x; camAbs.y = ref.position.y + D.y + cam.position.y; camAbs.z = ref.position.z + D.z + cam.position.z;
      V.normalize(rHat, camAbs);
      sun.direction.copyFromFloats(rHat.x, rHat.y, rHat.z); // light travels outward from the hole
      sky.update(camera, engine, rHat, nowMs / 1000, cam.position, cam.lookAt, cam.up);
      dust.update(cam.position, ship.velocityMps);
      if (Game.Boot.onFrame) Game.Boot.onFrame(realDt, alpha, cam);

      scene.render();

      // adaptive resolution
      emaMs += (realDt * 1000 - emaMs) * 0.05; frameCount++;
      if (adaptive && frameCount % 90 === 0) {
        if (emaMs > 25 && pixelRatio > 0.5) { pixelRatio = Math.max(0.5, pixelRatio * 0.88); applyRatio(); }
        else if (emaMs < 14 && pixelRatio < ratioMax) { pixelRatio = Math.min(ratioMax, pixelRatio * 1.06); applyRatio(); }
      }

      const tt = Game.TouchInput.getState();
      touchDebugEl.textContent = 'L(' + tt.leftX.toFixed(2) + ',' + tt.leftY.toFixed(2) + ')  R(' + tt.rightX.toFixed(2) + ',' + tt.rightY.toFixed(2) + ')  ' + Math.round(1000 / Math.max(1, emaMs)) + 'fps x' + pixelRatio.toFixed(2);
      speedHudEl.textContent = V.length(ship.velocityMps).toFixed(0) + ' m/s';
    });
    window.addEventListener('resize', () => engine.resize());
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyH') state.holdMode = state.holdMode === 'orbit' ? 'inertial' : 'orbit'; });

    const api = { engine, scene, camera, ship, arena, sky, frame, D, bodies, state, camState, dust, player, V, Q,
      get simTime() { return simTime; }, setPixelRatio(r) { pixelRatio = r; applyRatio(); }, rebase, fixedStep,
      // debug/screenshot helper: jump the arena clock and re-frame the black hole (snaps camera, re-syncs attitude hold)
      jumpTo(t, yawDeg, pitchDeg) {
        simTime = t; ref = arena.refState(t);
        arena.startOrientation(ship.orientation, yawDeg, pitchDeg, t);
        arena.frameOmega(omega, ref.position, ref.velocity);
        const qc = { x: 0, y: 0, z: 0, w: 1 }, ob = V.v3(); Q.qConjugate(qc, ship.orientation); Q.qRotateVector(ob, qc, omega); V.copy(ship.controlState.angularVelocityRadPerSecond, ob);
        V.set(ship.positionMeters, 0, 0, 0); V.set(ship.velocityMps, 0, 0, 0);
        ship.snapshot.previousPositionMeters.x = ship.snapshot.currentPositionMeters.x = 0; ship.snapshot.previousPositionMeters.y = ship.snapshot.currentPositionMeters.y = 0; ship.snapshot.previousPositionMeters.z = ship.snapshot.currentPositionMeters.z = 0;
        const o = V.v3(); Q.qRotateVector(o, ship.orientation, Game.ChaseCamera.LOCAL_OFFSET); V.copy(camState.positionMeters, o); V.set(camState.velocityMps, 0, 0, 0);
      } };
    window.__bh = api;
    return api;
  }
  return { start, onFrame: null, onRebase: null };
})();
