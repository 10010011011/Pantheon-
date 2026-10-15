# BLACK HOLE COMBAT — HANDOFF & ARCHITECTURE CONTEXT

Owner: Arav. Single-file HTML deployment via HopWeb (plus full Canvas compatibility).

## 1. Current State (Complete Open-World Solar-Scale & Combat Build)
`index.html` (+ `babylon.js` beside it, and self-contained inline WebGL2 fallback when opened standalone) is now a complete, verified open-world 6DOF space combat game set across **6 Keplerian Orbital Sectors** around a 10,000 M☉ Schwarzschild black hole ("Gargantua"):
- **S1–S8 Integrated & Verified**:
  - **Combat (`mod_combat.js`)**: Twin plasma autocannons (swept relative-motion CCD, shooter velocity inheritance, 6° mobile aim assist, weapon thermal loop), High-Energy Phase Laser (`1,450 m` hitscan shield-breaker beam), 3D Proportional-Navigation Seeker Missiles (`8 tubes`), Countermeasure Flares, directional shield sectors, and 4 enemy classes (`fighter`, `gunship`, `corvette`, and the `carrier` boss Dreadnought Valkyrie-IX).
  - **Root-Cause AI Fix (`mod_combat.js`)**: Fixed the enemy throttle controller in `enemyThink` (which previously held `+0.12` forward acceleration indefinitely, pinning fighters at `520 m/s` where their minimum turn radius `v / omega = 619 m` exceeded the `330 m` engagement range). Enemies now regulate speed to `165 m/s` inside engagement range (`R_turn = 196 m < 330 m`), and `tests/combat_body.js` passes **17/17 assertions** (`skill 1.0` bot achieves `victory` on Wave 5 with 23 kills).
  - **Instanced FX (`mod_fx.js`)**: Thin-instanced `fxGlow` (particles, engine plumes, missile exhaust) and `fxStreak` (velocity-aligned laser bolts + fading phase-laser beams), multi-stage explosions, shield/hull impact sparks, and flare bursts.
  - **Open-World Solar System (`mod_world.js`)**:
    1. **Photon Reach (`40 Rs` / `1.18M km`, inc `20°`)**: Inner patrol corridor, Obsidian Asteroid Belt & Relay Beacon Alpha-7.
    2. **Cinder (`14.5 Rs` / `0.43M km`, inc `6°`)**: Scorched molten tidal world (`20.6°` BH shadow, `112°` disk) with procedural GLSL basalt tectonic plates & glowing magma rivers.
    3. **The Forge (`26 Rs` / `0.77M km`, inc `12°`)**: Industrial core-world Hephaestus, planetary slag ring & Citadel Station Aegis-IV.
    4. **Haven Meridian (`68 Rs` / `2.01M km`, inc `16°`)**: Inhabited Terran biosphere world (continents, specular oceans, clouds, Rayleigh blue limb, night-side city lights), Moon Selene & Vanguard Sanctuary Dock (flying within `240 m` repairs hull & rearms missiles).
    5. **Leviathan (`115 Rs` / `3.40M km`, inc `8°`)**: Colossal banded storm gas giant, double planetary ice rings & Dreadnought Carrier Valkyrie-IX.
    6. **Solis-B & Veil (`185 Rs` / `5.46M km`, inc `28°`)**: Captured K-dwarf companion star (solar granulation & coronal glow shader), frozen world Veil & Deep Listening Array.
  - **Dynamic Radial Geodesic Lensing (`Game.Sky`)**: Exact 704×256 RGBA32F Schwarzschild LUT with live per-frame `uPsiC`, `uYMax`, `uUc`, and `uWarp` uniforms so the black hole shadow and accretion disk continuously scale with true radial distance `|r| / BH_RS` during Alcubierre FTL warp across the solar system.
  - **Tactical HUD & 6-Tab Drawer (`mod_hud.js`)**: 3D-projected enemy target brackets, predictive intercept lead pip, prograde velocity pip, off-screen threat chevrons, 3D linear radar disc with elevation stems, quick sector warp bar, and the 6-tab Hamburger Tactical Drawer (🚀 Telemetry, 🌌 Logarithmic Keplerian System Map, 🎯 Missions, ⚡ Weapons, 🎮 Controls, ⚙️ Settings).
  - **Procedural WebAudio (`mod_audio.js`)**: Singularity sub-bass drone, dynamic engine thruster synthesis, twin plasma cannons, phase laser, missile launch, shield/hull impacts, explosions, and Alcubierre warp spool.

## 2. Verification Summary
- `tests/lens_test.js`: **13 / 13 passed**
- `tests/flight2_body.js`: **18 / 18 passed**
- `tests/combat_body.js`: **17 / 17 passed** (skill 1.0 bot clears all 5 waves, 23 kills)
- On-page Foundation Self-Test: **25 / 25 passed**
- Headless Chromium WebGL2 verification: Verified multi-touch right-pad pitch response (`(815, 316) -> (815, 256)` raises nose `forward.y` from `-0.874` to `-0.857`), combat HUD rendering, Alcubierre sector warp, procedural planet/ring/station shaders, and zero console errors.
