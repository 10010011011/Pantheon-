module.exports = async (page, h) => {
  await h.open(1100, 495);
  await h.sleep(2500);
  await page.evaluate(() => window.__bh.jumpTo(0, 0, -2));
  await h.sleep(6000);
  await page.screenshot({ path: '/home/claude/browser/look2a.png' });
  await page.evaluate(() => window.__bh.jumpTo(55, 18, 4));   // different orbit phase / elevation
  await h.sleep(6000);
  await page.screenshot({ path: '/home/claude/browser/look2b.png' });
};
