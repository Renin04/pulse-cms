import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of candidates) { if (existsSync(p)) return p; }
  return null;
}

async function run() {
  const chromePath = await findChrome();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  // Capture console errors
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));

  await page.goto(BASE_URL + '/demo', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Add a Quiz block
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add a block'));
    if (addBtn) addBtn.click();
  });
  await delay(400);

  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    if (input) { input.value = 'Quiz'; input.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(400);

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const blockBtn = buttons.find(b => b.textContent.trim().includes('Quiz') && b.querySelector('p'));
    if (blockBtn) blockBtn.click();
  });
  await delay(2000);

  // Check hydration state
  const state = await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    const quiz = preview?.querySelector('.pulse-quiz');
    return {
      previewExists: !!preview,
      quizExists: !!quiz,
      quizHydrated: !!(quiz && quiz.__hydrated),
      quizHtml: quiz?.outerHTML?.slice(0, 500) || '',
      inputs: quiz ? Array.from(quiz.querySelectorAll('input')).map(i => ({
        type: i.type,
        name: i.name,
        disabled: i.disabled,
      })) : [],
    };
  });

  console.log('Hydration state:', JSON.stringify(state, null, 2));

  // Try clicking the input
  await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    const input = preview?.querySelector('.pulse-quiz-option input');
    if (input) {
      input.click();
      console.log('Clicked input:', input.value);
    }
  });
  await delay(500);

  const afterClick = await page.evaluate(() => {
    const preview = document.querySelector('[class*="prose prose-sm"]');
    const quiz = preview?.querySelector('.pulse-quiz');
    const res = quiz?.querySelector('.pulse-quiz-result');
    const label = quiz?.querySelector('.pulse-quiz-option');
    return {
      resultText: res?.textContent || '',
      resultDisplay: res?.style?.display || '',
      labelBorder: label?.style?.borderColor || '',
      checkedCount: quiz?.querySelectorAll('input:checked').length || 0,
    };
  });

  console.log('After click:', JSON.stringify(afterClick, null, 2));
  console.log('\nConsole logs:', logs.filter(l => l.type !== 'log'));

  await browser.close();
}

run().catch(console.error);
