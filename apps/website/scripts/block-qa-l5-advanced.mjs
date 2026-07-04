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

async function addBlock(page, label, searchTerm) {
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add a block'));
    if (addBtn) addBtn.click();
  });
  await delay(400);

  await page.evaluate((term) => {
    const input = document.querySelector('input[placeholder*="Search"]');
    if (input) { input.value = term; input.dispatchEvent(new Event('input', { bubbles: true })); }
  }, searchTerm);
  await delay(400);

  const clicked = await page.evaluate((lbl) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const blockBtn = buttons.find(b => b.textContent.trim().includes(lbl) && b.querySelector('p'));
    if (blockBtn) { blockBtn.click(); return true; }
    return false;
  }, label);

  return clicked;
}

async function clearBlocks(page) {
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const resetBtn = btns.find(b => b.textContent.trim() === 'Reset');
    if (resetBtn) resetBtn.click();
  });
  await delay(600);
}

// Expected render signatures for each block type
const BLOCK_SPECS = [
  {
    type: 'table',
    label: 'Table',
    search: 'Table',
    assertions: {
      selector: '[data-block-type="table"]',
      tagName: 'FIGURE',
      childSelector: 'table',
    },
  },
  {
    type: 'chart',
    label: 'Chart',
    search: 'Chart',
    assertions: {
      selector: '[data-block-type="chart"]',
      tagName: 'SECTION',
      childSelector: 'table',
      attrCheck: { name: 'data-chart-type', values: ['bar', 'line', 'pie'] },
    },
  },
  {
    type: 'map',
    label: 'Map',
    search: 'Map',
    assertions: {
      selector: '[data-block-type="map"]',
      tagName: 'FIGURE',
      attrCheck: { name: 'data-provider', values: ['openstreetmap', 'google', 'mapbox'] },
    },
  },
  {
    type: 'math-equation',
    label: 'Equation',
    search: 'Equation',
    assertions: {
      selector: '[data-block-type="math-equation"]',
      tagName: 'DIV',
      childSelector: 'code',
      textIncludes: 'E = mc^2',
    },
  },
  {
    type: 'diagram',
    label: 'Diagram',
    search: 'Diagram',
    assertions: {
      selector: '[data-block-type="diagram"]',
      tagName: 'FIGURE',
      childSelector: 'pre code',
      attrCheck: { name: 'data-engine', values: ['mermaid', 'plantuml'] },
    },
  },
  {
    type: 'manga-panel',
    label: 'Manga Panel',
    search: 'Manga',
    assertions: {
      selector: '[data-block-type="manga-panel"]',
      tagName: 'SECTION',
      attrCheck: { name: 'data-layout', values: ['single', 'two-up', 'grid-2x2', 'strip'] },
    },
  },
  {
    type: 'speech-bubble',
    label: 'Speech Bubble',
    search: 'Speech',
    assertions: {
      selector: '[data-block-type="speech-bubble"]',
      tagName: 'FIGURE',
      childSelector: '.pulse-speech-bubble__body',
      attrCheck: { name: 'data-tone', values: ['neutral', 'happy', 'angry', 'thinking'] },
    },
  },
  {
    type: 'card',
    label: 'Card',
    search: 'Card',
    assertions: {
      selector: '[data-block-type="card"]',
      tagName: 'ARTICLE',
      childSelector: 'h3',
    },
  },
  {
    type: 'gallery',
    label: 'Gallery',
    search: 'Gallery',
    assertions: {
      selector: '[data-block-type="gallery"]',
      tagName: 'SECTION',
      attrCheck: { name: 'data-layout', values: ['grid', 'masonry'] },
    },
  },
  {
    type: 'carousel',
    label: 'Carousel',
    search: 'Carousel',
    assertions: {
      selector: '[data-block-type="carousel"]',
      tagName: 'SECTION',
      childSelector: 'article[data-slide-index]',
      attrCheck: { name: 'data-autoplay', values: ['true', 'false'] },
    },
  },
  {
    type: 'timeline',
    label: 'Timeline',
    search: 'Timeline',
    assertions: {
      selector: '[data-block-type="timeline"]',
      tagName: 'SECTION',
      childSelector: 'ol li',
    },
  },
  {
    type: 'comparison',
    label: 'Comparison',
    search: 'Comparison',
    assertions: {
      selector: '[data-block-type="comparison"]',
      tagName: 'SECTION',
      childSelector: 'table',
    },
  },
  {
    type: 'before-after',
    label: 'Before / After',
    search: 'Before',
    assertions: {
      selector: '[data-block-type="before-after"]',
      tagName: 'SECTION',
      childSelector: 'figure img',
      attrCheck: { name: 'data-position', values: null }, // any number 0-100
    },
  },
  {
    type: 'hero-section',
    label: 'Hero Section',
    search: 'Hero',
    assertions: {
      selector: '[data-block-type="hero-section"]',
      tagName: 'SECTION',
      childSelector: 'h2',
    },
  },
  {
    type: 'annotated-image',
    label: 'Annotated Image',
    search: 'Annotated',
    assertions: {
      selector: '[data-block-type="annotated-image"]',
      tagName: 'FIGURE',
      childSelector: 'div[data-hotspot-layer="true"]',
    },
  },
];

async function testBlock(page, blockSpec, consoleErrors, failedRequests) {
  console.log(`  → Testing ${blockSpec.label}...`);
  const ok = await addBlock(page, blockSpec.label, blockSpec.search);
  if (!ok) return { status: 'FAIL', reason: 'Could not add block via palette' };
  await delay(800);

  const result = await page.evaluate((assertions) => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return { error: 'No preview pane found' };

    const el = preview.querySelector(assertions.selector);
    if (!el) return { error: `Missing selector: ${assertions.selector}` };

    const tagOk = !assertions.tagName || el.tagName === assertions.tagName;
    const childOk = !assertions.childSelector || !!el.querySelector(assertions.childSelector);
    const textOk = !assertions.textIncludes || el.textContent.includes(assertions.textIncludes);

    let attrOk = true;
    let attrValue = null;
    if (assertions.attrCheck) {
      attrValue = el.getAttribute(assertions.attrCheck.name);
      if (assertions.attrCheck.values) {
        attrOk = assertions.attrCheck.values.includes(attrValue);
      } else {
        attrOk = attrValue !== null && attrValue !== '';
      }
    }

    return {
      tagOk,
      childOk,
      textOk,
      attrOk,
      attrValue,
      tagName: el.tagName,
      htmlSnippet: el.outerHTML.slice(0, 300),
    };
  }, blockSpec.assertions);

  // Screenshot desktop
  await page.setViewport({ width: 1400, height: 1200 });
  await delay(300);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `L-5-${blockSpec.type}-desktop.png`),
  });

  // Screenshot mobile
  await page.setViewport({ width: 375, height: 900 });
  await delay(300);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `L-5-${blockSpec.type}-mobile.png`),
  });

  // Restore desktop for next block
  await page.setViewport({ width: 1400, height: 1200 });

  console.log('     result:', JSON.stringify(result));

  const pass = result.error
    ? false
    : result.tagOk && result.childOk && result.textOk && result.attrOk;

  if (!pass && result.error) {
    return { status: 'FAIL', reason: result.error, details: result };
  }
  return { status: pass ? 'PASS' : 'FAIL', details: result };
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
  await page.setViewport({ width: 1400, height: 1200 });

  // Track console errors and failed network requests
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleErrors.push({ type, text: msg.text(), location: msg.location() });
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      failedRequests.push({ url: response.url(), status });
    }
  });

  console.log('\nNavigating to', BASE_URL + '/demo');
  await page.goto(BASE_URL + '/demo', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Ensure preview is shown
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('preview'));
    if (btn && btn.textContent.includes('Show')) btn.click();
  });
  await delay(500);

  const RESULTS = [];

  for (const spec of BLOCK_SPECS) {
    await clearBlocks(page);
    const blockResult = await testBlock(page, spec, consoleErrors, failedRequests);
    RESULTS.push({ type: spec.type, label: spec.label, ...blockResult });
  }

  // Final full-page screenshot
  await page.setViewport({ width: 1400, height: 3000 });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'L-5-advanced-final.png') });

  console.log('\n=== L-5 ADVANCED BLOCKS QA RESULTS ===');
  for (const r of RESULTS) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`  ${icon} ${r.label.toUpperCase()}: ${r.status}${r.reason ? ' — ' + r.reason : ''}`);
  }

  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL').length;
  console.log(`\nSUMMARY: ${pass}/${RESULTS.length} PASS, ${fail} FAIL`);

  if (consoleErrors.length > 0) {
    console.log(`\nConsole errors/warnings (${consoleErrors.length}):`);
    for (const e of consoleErrors.slice(0, 20)) {
      console.log(`  [${e.type}] ${e.text}`);
    }
  }

  if (failedRequests.length > 0) {
    console.log(`\nFailed network requests (${failedRequests.length}):`);
    for (const r of failedRequests.slice(0, 20)) {
      console.log(`  ${r.status} ${r.url}`);
    }
  }

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
