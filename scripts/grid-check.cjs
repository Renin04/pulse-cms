const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const OUT = path.join(__dirname, '..', 'test-results', 'mobile-audit');

(async () => {
  const exe = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright', 'chromium-1228', 'chrome-win64', 'chrome.exe');
  const browser = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  for (const w of [375, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 1024, hasTouch: w < 1024, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3001/blog/interactive-content-playbook', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const out = {};
      const grids = ['.pulse-gallery__grid', '.pulse-manga-grid', '.pulse-comparison__grid'];
      for (const sel of grids) {
        const el = document.querySelector(sel);
        if (el) out[sel] = getComputedStyle(el).gridTemplateColumns.slice(0, 80);
      }
      // map iframe, video, sandbox iframe, embed containment
      const frames = [];
      document.querySelectorAll('article iframe, article video, article canvas, article svg.pulse-chart__svg').forEach(el => {
        const r = el.getBoundingClientRect();
        const p = el.parentElement;
        frames.push({ tag: el.tagName, cls: (typeof el.className === 'string' ? el.className : (el.className.baseVal || '')).split(' ').filter(Boolean).slice(0, 2).join('.'), w: Math.round(r.width), parentW: p ? Math.round(p.getBoundingClientRect().width) : 0 });
      });
      out.frames = frames.slice(0, 14);
      return out;
    });
    console.log('=== width', w, JSON.stringify(r, null, 1).slice(0, 1400));
    await ctx.close();
  }
  await browser.close();
})();
