import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'launch', 'qa-screenshots');
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BLOCKS = [
  { phase: 'L-2', type: 'heading', search: 'Heading', label: 'Heading' },
  { phase: 'L-2', type: 'text', search: 'Paragraph', label: 'Paragraph' },
  { phase: 'L-2', type: 'list', search: 'List', label: 'List' },
  { phase: 'L-2', type: 'blockquote', search: 'Quote', label: 'Quote' },
  { phase: 'L-2', type: 'code', search: 'Code', label: 'Code' },
  { phase: 'L-2', type: 'horizontal-rule', search: 'Divider', label: 'Divider' },
  { phase: 'L-2', type: 'link', search: 'Link', label: 'Link' },
  { phase: 'L-2', type: 'image', search: 'Image', label: 'Image' },
  { phase: 'L-3', type: 'video', search: 'Video', label: 'Video' },
  { phase: 'L-3', type: 'audio', search: 'Audio', label: 'Audio' },
  { phase: 'L-3', type: 'file', search: 'File', label: 'File' },
  { phase: 'L-3', type: 'embed', search: 'Embed', label: 'Embed' },
];

const RESULTS = [];

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
  await page.setViewport({ width: 1400, height: 900 });

  console.log('Navigating to', BASE_URL + '/demo');
  await page.goto(BASE_URL + '/demo', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00-initial.png') });

  for (const block of BLOCKS) {
    console.log(`Testing ${block.label}...`);
    try {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.textContent.includes('Add a block'));
        if (addBtn) addBtn.click();
      });
      await delay(400);

      await page.evaluate((term) => {
        const input = document.querySelector('input[placeholder*="Search"]');
        if (input) { input.value = term; input.dispatchEvent(new Event('input', { bubbles: true })); }
      }, block.search);
      await delay(400);

      const clicked = await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const blockBtn = buttons.find(b => b.textContent.trim().includes(label) && b.querySelector('p'));
        if (blockBtn) { blockBtn.click(); return true; }
        return false;
      }, block.label);

      if (!clicked) {
        RESULTS.push({ ...block, status: 'FAIL', reason: 'Button not found' });
        continue;
      }

      await delay(700);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${block.phase}-${block.type}.png`) });

      const previewHtml = await page.evaluate(() => {
        const preview = document.querySelector('[class*="prose prose-sm"]');
        return preview ? preview.innerHTML.length : 0;
      });

      RESULTS.push({ ...block, status: previewHtml > 100 ? 'PASS' : 'WARN', previewHtmlLength: previewHtml });
      console.log(`  ${previewHtml > 100 ? 'PASS' : 'WARN'} — preview HTML: ${previewHtml}`);
    } catch (err) {
      RESULTS.push({ ...block, status: 'ERROR', reason: err.message });
      console.log(`  ERROR: ${err.message}`);
    }
  }

  await page.setViewport({ width: 1400, height: 2000 });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'zz-final.png') });

  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const warn = RESULTS.filter(r => r.status === 'WARN').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;

  console.log(`\n=== SUMMARY ===`);
  console.log(`PASS: ${pass}, WARN: ${warn}, FAIL: ${fail} / ${RESULTS.length}`);

  await writeFile(path.join(SCREENSHOT_DIR, 'report.json'), JSON.stringify({
    date: new Date().toISOString(), results: RESULTS,
    summary: { pass, warn, fail, total: RESULTS.length }
  }, null, 2));

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
