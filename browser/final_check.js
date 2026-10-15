module.exports = async (page, h) => {
  await h.open(915, 412);
  await h.sleep(2500);
  const fy = () => page.evaluate(() => { const b = window.__bh, o = b.ship.orientation; const V = b.V, Q = b.Q; const f = V.v3(); Q.qRotateVector(f, o, { x: 0, y: 0, z: 1 }); return f; });
  const before = await fy();
  // real multi-touch path through CDP: right pad centre ~ (815,316); push thumb UP
  await page.touchscreen.touchStart(815, 316);
  await page.touchscreen.touchMove(815, 262);
  await h.sleep(7000);
  const during = await page.evaluate(() => { const t = Game.TouchInput.getState(); return { rightY: t.rightY, avx: window.__bh.ship.controlState.angularVelocityRadPerSecond.x }; });
  const after = await fy();
  await page.touchscreen.touchEnd();
  console.log('touch state while held:', JSON.stringify(during));
  console.log('forward.y before/after pushing right thumb UP:', before.y.toFixed(3), '->', after.y.toFixed(3), after.y > before.y ? '(nose UP: correct)' : '(WRONG)');
  await page.screenshot({ path: '/home/claude/browser/final.png' });
};
