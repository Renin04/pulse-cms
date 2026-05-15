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

async function testQuiz(page) {
  console.log('  → Testing Quiz interactivity...');
  const ok = await addBlock(page, 'Quiz', 'Quiz');
  if (!ok) return { status: 'FAIL', reason: 'Could not add Quiz block' };
  await delay(800);

  // Click the first option ("Editor speed" — correct)
  await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return null;
    const opt = preview.querySelector('.pulse-quiz-option input');
    if (opt) opt.click();
    return preview.querySelector('.pulse-quiz-result')?.textContent;
  });
  await delay(400);

  const result = await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return { error: 'No preview' };
    const res = preview.querySelector('.pulse-quiz-result');
    const label = preview.querySelector('.pulse-quiz-option');
    return {
      resultText: res?.textContent || '',
      resultDisplay: res?.style?.display || getComputedStyle(res).display,
      labelBorder: label?.style?.borderColor || getComputedStyle(label).borderColor,
    };
  });

  console.log('     result:', JSON.stringify(result));
  const pass = result.resultText.includes('Correct') || result.resultText.includes('✅');
  return { status: pass ? 'PASS' : 'FAIL', details: result };
}

async function testPoll(page) {
  console.log('  → Testing Poll interactivity...');
  const ok = await addBlock(page, 'Poll', 'Poll');
  if (!ok) return { status: 'FAIL', reason: 'Could not add Poll block' };
  await delay(800);

  await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return;
    const btn = preview.querySelector('.pulse-poll-btn');
    if (btn) btn.click();
  });
  await delay(400);

  const result = await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return { error: 'No preview' };
    const btn = preview.querySelector('.pulse-poll-btn');
    const bar = preview.querySelector('.pulse-poll-bar');
    return {
      btnBorder: btn?.style?.borderColor || getComputedStyle(btn).borderColor,
      barWidth: bar?.style?.width || getComputedStyle(bar).width,
      btnCursor: btn?.style?.cursor || getComputedStyle(btn).cursor,
    };
  });

  console.log('     result:', JSON.stringify(result));
  // After voting, bar width should change and cursor should be default
  const pass = result.barWidth !== '0%' && result.btnCursor === 'default';
  return { status: pass ? 'PASS' : 'FAIL', details: result };
}

async function testSurvey(page) {
  console.log('  → Testing Survey interactivity...');
  const ok = await addBlock(page, 'Survey', 'Survey');
  if (!ok) return { status: 'FAIL', reason: 'Could not add Survey block' };
  await delay(800);

  await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return;
    const form = preview.querySelector('.pulse-survey form');
    if (form) {
      const radio = form.querySelector('input[type="radio"]');
      if (radio) radio.click();
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.click();
    }
  });
  await delay(400);

  const result = await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return { error: 'No preview' };
    const btn = preview.querySelector('.pulse-survey button[type="submit"]');
    return {
      btnText: btn?.textContent || '',
      btnDisabled: btn?.disabled,
      btnOpacity: btn?.style?.opacity || getComputedStyle(btn).opacity,
    };
  });

  console.log('     result:', JSON.stringify(result));
  const pass = result.btnText.includes('Submitted') || result.btnText.includes('✅');
  return { status: pass ? 'PASS' : 'FAIL', details: result };
}

async function testTabs(page) {
  console.log('  → Testing Tabs interactivity...');
  const ok = await addBlock(page, 'Tabs', 'Tabs');
  if (!ok) return { status: 'FAIL', reason: 'Could not add Tabs block' };
  await delay(800);

  // Click second tab
  await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return;
    const btns = preview.querySelectorAll('.pulse-tab-btn');
    if (btns.length > 1) btns[1].click();
  });
  await delay(400);

  const result = await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return { error: 'No preview' };
    const panels = preview.querySelectorAll('[data-tab-panel]');
    const btns = preview.querySelectorAll('.pulse-tab-btn');
    return {
      panelDisplays: Array.from(panels).map(p => ({
        id: p.getAttribute('data-tab-panel'),
        display: p.style.display || getComputedStyle(p).display,
      })),
      activeBtnWeight: btns[1]?.style?.fontWeight || getComputedStyle(btns[1]).fontWeight,
    };
  });

  console.log('     result:', JSON.stringify(result));
  const activePanel = result.panelDisplays?.find(p => p.id === 'tab-2');
  const inactivePanel = result.panelDisplays?.find(p => p.id === 'tab-1');
  const pass = activePanel?.display === 'block' && inactivePanel?.display === 'none';
  return { status: pass ? 'PASS' : 'FAIL', details: result };
}

async function testSpoiler(page) {
  console.log('  → Testing Spoiler interactivity...');
  const ok = await addBlock(page, 'Spoiler', 'Spoiler');
  if (!ok) return { status: 'FAIL', reason: 'Could not add Spoiler block' };
  await delay(800);

  await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return;
    const btn = preview.querySelector('.pulse-spoiler-btn');
    if (btn) btn.click();
  });
  await delay(400);

  const result = await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return { error: 'No preview' };
    const content = preview.querySelector('.pulse-spoiler-content');
    const icon = preview.querySelector('.pulse-spoiler-icon');
    return {
      contentDisplay: content?.style?.display || getComputedStyle(content).display,
      iconTransform: icon?.style?.transform || getComputedStyle(icon).transform,
    };
  });

  console.log('     result:', JSON.stringify(result));
  const pass = result.contentDisplay === 'block' && result.iconTransform.includes('90');
  return { status: pass ? 'PASS' : 'FAIL', details: result };
}

async function testNativeDetails(page, label, searchTerm) {
  console.log(`  → Testing ${label} (native <details>)...`);
  const ok = await addBlock(page, label, searchTerm);
  if (!ok) return { status: 'FAIL', reason: `Could not add ${label} block` };
  await delay(800);

  const result = await page.evaluate((type) => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    if (!preview) return { error: 'No preview' };
    // Toggle block IS the details element; others wrap details inside a container
    const details = type === 'toggle'
      ? preview.querySelector(`details[data-block-type="${type}"]`)
      : preview.querySelector(`[data-block-type="${type}"] details`);
    return {
      hasDetails: !!details,
      openAttr: details?.open,
    };
  }, label.toLowerCase());

  console.log('     result:', JSON.stringify(result));
  return { status: result.hasDetails ? 'PASS' : 'FAIL', details: result };
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
  await page.setViewport({ width: 1600, height: 1000 });

  console.log('\nNavigating to', BASE_URL + '/demo');
  await page.goto(BASE_URL + '/demo', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Enable preview if hidden
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('preview'));
    if (btn && btn.textContent.includes('Show')) btn.click();
  });
  await delay(500);

  const RESULTS = [];

  // L-4 Interactive blocks
  RESULTS.push({ type: 'quiz', ...await testQuiz(page) });
  RESULTS.push({ type: 'poll', ...await testPoll(page) });
  RESULTS.push({ type: 'survey', ...await testSurvey(page) });
  RESULTS.push({ type: 'tabs', ...await testTabs(page) });
  RESULTS.push({ type: 'spoiler', ...await testSpoiler(page) });

  // Native details blocks
  RESULTS.push({ type: 'flashcard', ...await testNativeDetails(page, 'Flashcard', 'Flashcard') });
  RESULTS.push({ type: 'accordion', ...await testNativeDetails(page, 'Accordion', 'Accordion') });
  RESULTS.push({ type: 'toggle', ...await testNativeDetails(page, 'Toggle', 'Toggle') });

  await page.setViewport({ width: 1600, height: 3000 });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'L-4-interactive-final.png') });

  console.log('\n=== L-4 INTERACTIVE BLOCKS QA RESULTS ===');
  for (const r of RESULTS) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`  ${icon} ${r.type.toUpperCase()}: ${r.status}${r.reason ? ' — ' + r.reason : ''}`);
  }

  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL').length;
  console.log(`\nSUMMARY: ${pass}/${RESULTS.length} PASS, ${fail} FAIL`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
