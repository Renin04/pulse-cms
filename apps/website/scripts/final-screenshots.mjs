import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'images', 'flavors', 'screenshots');
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

async function run() {
  const chromePath = await findChrome();
  if (!chromePath) { console.error('Chrome not found'); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  // DESKTOP
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1400, height: 2000 });
  await page1.goto(BASE_URL + '/blog/flavors', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);
  await page1.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) { clearInterval(timer); resolve(); }
      }, 80);
    });
  });
  await delay(1000);
  await page1.screenshot({ path: path.join(SCREENSHOT_DIR, 'flavors-desktop.png'), fullPage: true });
  console.log('✅ Desktop screenshot');
  await page1.close();

  // MOBILE
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 375, height: 900, deviceScaleFactor: 2 });
  await page2.goto(BASE_URL + '/blog/flavors', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);
  await page2.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) { clearInterval(timer); resolve(); }
      }, 80);
    });
  });
  await delay(1000);
  await page2.screenshot({ path: path.join(SCREENSHOT_DIR, 'flavors-mobile.png'), fullPage: true });
  console.log('✅ Mobile screenshot');
  await page2.close();

  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
