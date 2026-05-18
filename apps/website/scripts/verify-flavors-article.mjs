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
  console.log('Chrome:', chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  // Track console errors and failed requests
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleErrors.push({ type, text: msg.text() });
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      failedRequests.push({ url: response.url(), status });
    }
  });

  // DESKTOP VIEWPORT
  console.log('\n📸 Desktop viewport (1400px)');
  await page.setViewport({ width: 1400, height: 2000 });
  console.log('Navigating to', BASE_URL + '/blog/flavors');
  await page.goto(BASE_URL + '/blog/flavors', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);

  // Scroll to load all images
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  await delay(1000);

  // Full page desktop screenshot
  await page.screenshot({ 
    path: path.join(SCREENSHOT_DIR, 'flavors-desktop.png'),
    fullPage: true 
  });
  console.log('✅ Desktop screenshot saved');

  // MOBILE VIEWPORT
  console.log('\n📱 Mobile viewport (375px)');
  await page.setViewport({ width: 375, height: 900 });
  await page.goto(BASE_URL + '/blog/flavors', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);

  // Scroll to load all images
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  await delay(1000);

  // Full page mobile screenshot
  await page.screenshot({ 
    path: path.join(SCREENSHOT_DIR, 'flavors-mobile.png'),
    fullPage: true 
  });
  console.log('✅ Mobile screenshot saved');

  // TEST INTERACTIVE BLOCKS
  console.log('\n🧪 Testing interactive blocks...');

  // Reset to desktop for testing
  await page.setViewport({ width: 1400, height: 1200 });
  await page.goto(BASE_URL + '/blog/flavors', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Test Tabs
  console.log('  → Testing Tabs...');
  const tabsResult = await page.evaluate(() => {
    const tabBtn = document.querySelector('[data-tab-id="tab-europe"]');
    if (tabBtn) { tabBtn.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('     Tabs:', tabsResult);
  await delay(500);

  // Test Accordion
  console.log('  → Testing Accordion...');
  const accordionResult = await page.evaluate(() => {
    const details = document.querySelector('details summary');
    if (details) { details.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('     Accordion:', accordionResult);
  await delay(500);

  // Test Toggle
  console.log('  → Testing Toggle...');
  const toggleResult = await page.evaluate(() => {
    const toggle = document.querySelector('details[data-block-type="toggle"] summary');
    if (toggle) { toggle.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('     Toggle:', toggleResult);
  await delay(500);

  // Test Spoiler
  console.log('  → Testing Spoiler...');
  const spoilerResult = await page.evaluate(() => {
    const btn = document.querySelector('.pulse-spoiler-btn');
    if (btn) { btn.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('     Spoiler:', spoilerResult);
  await delay(500);

  // Test Quiz
  console.log('  → Testing Quiz...');
  const quizResult = await page.evaluate(() => {
    const opt = document.querySelector('.pulse-quiz-option input');
    if (opt) { opt.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('     Quiz:', quizResult);
  await delay(500);

  // Test Poll
  console.log('  → Testing Poll...');
  const pollResult = await page.evaluate(() => {
    const btn = document.querySelector('.pulse-poll-btn');
    if (btn) { btn.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('     Poll:', pollResult);
  await delay(500);

  // Test Branch Block
  console.log('  → Testing Branch Block...');
  const branchResult = await page.evaluate(() => {
    const btn = document.querySelector('.pulse-branch__option');
    if (btn) { btn.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('     Branch:', branchResult);
  await delay(500);

  // Screenshot after interactions
  await page.screenshot({ 
    path: path.join(SCREENSHOT_DIR, 'flavors-interactions.png'),
    fullPage: true 
  });
  console.log('✅ Interaction screenshot saved');

  // Summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`Console errors/warnings: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 10).forEach(e => console.log(`  [${e.type}] ${e.text}`));
  }
  console.log(`Failed requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    failedRequests.slice(0, 10).forEach(r => console.log(`  ${r.status} ${r.url}`));
  }

  await browser.close();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
