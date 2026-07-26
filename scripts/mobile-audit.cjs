/* Mobile/tablet perfection audit for the live blog article.
 * Runs its own Chromium (no shared-browser contention) with real touch
 * emulation so (pointer: coarse) rules actually apply.
 * Usage: node scripts/mobile-audit.cjs [url]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:3001/blog/interactive-content-playbook';
const OUT = path.join(__dirname, '..', 'test-results', 'mobile-audit');

const CONTEXTS = [
  { name: 'mobile-375', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'small-320', viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet-768', viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'desktop-1280', viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

const AUDIT_JS = `(() => {
  const vw = document.documentElement.clientWidth;
  function clipOf(el) {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const pc = getComputedStyle(p);
      if (['hidden','auto','scroll','clip'].includes(pc.overflowX)) return true;
      p = p.parentElement;
    }
    return false;
  }
  const seen = new Set();
  const bad = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 2 || r.left < -2) && r.width > 0 && !clipOf(el)) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') return;
      const cls = (typeof el.className === 'string' ? el.className : (el.className.baseVal || '')).split(' ').filter(Boolean).slice(0,3).join('.');
      const key = el.tagName + '.' + cls + '@' + Math.round(r.left);
      if (seen.has(key)) return;
      seen.add(key);
      bad.push({ tag: el.tagName, cls, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
    }
  });
  const tap = {};
  const check = (name, sel) => {
    const els = Array.from(document.querySelectorAll(sel)).filter(e => {
      const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    if (!els.length) { tap[name] = 'nf'; return; }
    tap[name] = els.slice(0, 3).map(e => { const r = e.getBoundingClientRect(); return Math.round(r.height) + 'x' + Math.round(r.width); });
  };
  check('pollBtn', '.pulse-poll-btn');
  check('quizLabel', '.pulse-quiz-label');
  check('branchOption', '.pulse-branches__option, .pulse-branch-option');
  check('tab', '.pulse-tabs__tab');
  check('flashcardNav', '.pulse-flashcards__controls button');
  check('baHandle', '.pulse-ba__handle');
  check('accordionSummary', '.pulse-accordion summary, .pulse-disclosure summary');
  check('spoiler', '.pulse-spoiler__toggle, .pulse-spoiler button');
  check('carouselArrow', '.pulse-carousel__arrow');
  check('carouselDot', '.pulse-carousel__dot');
  check('share', '[data-share-button]');
  const se = document.querySelector('.pulse-sandbox-editor');
  const surveyTa = document.querySelector('.pulse-survey textarea');
  // trailing gap
  const article = document.querySelector('article.studio-rendered');
  const footer = document.querySelector('body > footer');
  const ab = article ? article.getBoundingClientRect().bottom + window.scrollY : 0;
  const ft = footer ? footer.getBoundingClientRect().top + window.scrollY : 0;
  const fb = footer ? footer.getBoundingClientRect().bottom + window.scrollY : 0;
  // comparison
  const cmp = document.querySelector('.pulse-comparison');
  const cmpGrid = document.querySelector('.pulse-comparison__grid');
  const cmpHint = document.querySelector('.pulse-comparison__hint');
  const cmpScroll = document.querySelector('.pulse-comparison__scroll');
  // toc
  const toc = document.getElementById('blog-toc-sidebar');
  return {
    vw, scrollW: document.documentElement.scrollWidth,
    hScroll: document.documentElement.scrollWidth > vw,
    coarse: window.matchMedia('(pointer: coarse)').matches,
    bad: bad.slice(0, 12),
    tap,
    sandboxFs: se ? getComputedStyle(se).fontSize : 'nf',
    surveyTaFs: surveyTa ? getComputedStyle(surveyTa).fontSize : 'nf',
    trailing: { articleBottom: Math.round(ab), footerTop: Math.round(ft), gap: Math.round(ft - ab), afterFooter: Math.round(document.documentElement.scrollHeight - fb) },
    comparison: cmp ? {
      cols: cmp.getAttribute('data-cols'),
      gridW: cmpGrid ? Math.round(cmpGrid.getBoundingClientRect().width) : 0,
      scrollW: cmpScroll ? Math.round(cmpScroll.getBoundingClientRect().width) : 0,
      hint: cmpHint ? getComputedStyle(cmpHint).display : 'nf'
    } : 'nf',
    tocDisplay: toc ? getComputedStyle(toc).display : 'nf'
  };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const os = require('os');
  const exe = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright', 'chromium-1228', 'chrome-win64', 'chrome.exe');
  const browser = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  const report = {};
  for (const cfg of CONTEXTS) {
    const ctx = await browser.newContext({
      viewport: cfg.viewport,
      isMobile: cfg.isMobile,
      hasTouch: cfg.hasTouch,
      deviceScaleFactor: cfg.deviceScaleFactor,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    report[cfg.name] = await page.evaluate(AUDIT_JS);
    // screenshots: top + end
    await page.screenshot({ path: path.join(OUT, cfg.name + '-top.png') });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, cfg.name + '-end.png') });
    await ctx.close();
    console.log('done', cfg.name);
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})();
