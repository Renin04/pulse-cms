import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'launch', 'qa-screenshots');
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of candidates) { if (existsSync(p)) return p; }
  try {
    const { execSync } = await import('node:child_process');
    const result = execSync('where chrome 2>nul || where msedge 2>nul', { encoding: 'utf-8' });
    const first = result.split('\n')[0].trim();
    if (first) return first;
  } catch {}
  return null;
}

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 2000 },
  { name: 'tablet', width: 768, height: 2000 },
  { name: 'desktop', width: 1024, height: 2000 },
  { name: 'wide', width: 1400, height: 2000 },
];

async function testViewport(page, viewport) {
  await page.setViewport({ width: viewport.width, height: viewport.height });
  await delay(800);

  const metrics = await page.evaluate(() => {
    const article = document.querySelector('.studio-rendered');
    const sidebar = document.querySelector('#blog-sidebar');
    const wrapper = document.querySelector('#blog-content-wrapper');

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      articleWidth: article ? article.getBoundingClientRect().width : 0,
      sidebarVisible: sidebar ? getComputedStyle(sidebar).display !== 'none' : false,
      sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : 0,
      gridCols: wrapper ? getComputedStyle(wrapper).gridTemplateColumns : null,
      overflowCount: article
        ? Array.from(article.querySelectorAll('*')).filter(el => {
            const rect = el.getBoundingClientRect();
            const articleRect = article.getBoundingClientRect();
            const style = getComputedStyle(el);
            // Allow pre elements with overflow-x: auto (code blocks scroll horizontally)
            if (el.tagName === 'PRE' && style.overflowX === 'auto') return false;
            return rect.width > articleRect.width + 4; // allow subpixel rounding
          }).length
        : 0,
    };
  });

  // Screenshot
  const screenshotPath = path.join(SCREENSHOT_DIR, `L-7-${viewport.name}-${viewport.width}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  return {
    viewport: viewport.name,
    ...metrics,
    screenshot: screenshotPath,
    pass: !metrics.hasHorizontalScroll && metrics.overflowCount === 0,
  };
}

async function run() {
  const chromePath = await findChrome();
  if (!chromePath) { console.error('Chrome not found'); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  console.log('\nNavigating to', BASE_URL + '/blog/l5-advanced-blocks-qa/');
  await page.goto(BASE_URL + '/blog/l5-advanced-blocks-qa/', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  const RESULTS = [];
  for (const vp of VIEWPORTS) {
    console.log(`\n  → Testing ${vp.name} (${vp.width}px)...`);
    const result = await testViewport(page, vp);
    RESULTS.push(result);
    console.log(`     article: ${result.articleWidth.toFixed(0)}px | sidebar: ${result.sidebarVisible ? result.sidebarWidth.toFixed(0) + 'px' : 'hidden'} | h-scroll: ${result.hasHorizontalScroll} | overflow: ${result.overflowCount}`);
  }

  console.log('\n=== L-7 RENDERER LAYOUT & RESPONSIVE QA RESULTS ===');
  for (const r of RESULTS) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`  ${icon} ${r.viewport.toUpperCase()} (${r.viewportWidth}px): article=${r.articleWidth.toFixed(0)}px sidebar=${r.sidebarVisible ? 'visible' : 'hidden'} h-scroll=${r.hasHorizontalScroll}`);
  }

  const pass = RESULTS.filter(r => r.pass).length;
  console.log(`\nSUMMARY: ${pass}/${RESULTS.length} PASS`);

  await browser.close();
  process.exit(pass === RESULTS.length ? 0 : 1);
}

run().catch(err => { console.error(err); process.exit(1); });
