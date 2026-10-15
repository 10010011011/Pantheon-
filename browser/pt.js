// Puppeteer harness: node pt.js <scriptfile> [rootDir]. The script exports async (page, h) => {...}
const chromium = require('@sparticuz/chromium').default || require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const http = require('http'), fs = require('fs'), path = require('path');
const scriptFile = path.resolve(process.argv[2]);
const ROOT = process.argv[3] || '/mnt/user-data/outputs';
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(8766, r));
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
    executablePath: await chromium.executablePath(), headless: 'shell',
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  const h = {
    logs, sleep: ms => new Promise(r => setTimeout(r, ms)),
    open: async (w, hgt, url = 'http://localhost:8766/') => {
      await page.setViewport({ width: w, height: hgt, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    },
  };
  try { await require(scriptFile)(page, h); }
  catch (e) { console.error('SCRIPT ERROR:', e); }
  console.log('--- console ---\n' + logs.slice(-40).join('\n'));
  await browser.close(); server.close();
})();
