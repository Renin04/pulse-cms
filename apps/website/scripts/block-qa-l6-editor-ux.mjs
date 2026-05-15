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

async function testSlashCommandPalette(page) {
  console.log('  → Testing Slash Command Palette...');
  const results = {};

  // Test 1: Open palette with "/"
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) el.blur();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
  });
  await delay(500);
  results.openWithSlash = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    return !!input;
  });

  // Test 2: Search for "Table"
  if (results.openWithSlash) {
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search"]');
      if (input) { input.value = 'Table'; input.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await delay(400);
    results.searchTable = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.trim().includes('Table') && b.querySelector('p'));
    });

    // Test 3: Category filter
    await page.evaluate(() => {
      const catBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'advanced');
      if (catBtn) catBtn.click();
    });
    await delay(400);
    results.categoryFilter = await page.evaluate(() => {
      const activeCat = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.trim() === 'advanced' && b.className.includes('pulse-black')
      );
      return !!activeCat;
    });

    // Close palette
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg') && b.innerHTML.includes('X'));
      if (closeBtn) closeBtn.click();
    });
    await delay(200);
  }

  console.log('     results:', JSON.stringify(results));
  const pass = results.openWithSlash && results.searchTable;
  return { status: pass ? 'PASS' : 'FAIL', details: results };
}

async function testBackslashMacro(page) {
  console.log('  → Testing Backslash Macro...');
  const results = {};

  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) el.blur();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '\\', bubbles: true }));
  });
  await delay(500);
  results.openWithBackslash = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    return !!input;
  });

  // Search for "date" macro
  if (results.openWithBackslash) {
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search"]');
      if (input) { input.value = 'date'; input.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await delay(400);
    results.searchDate = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.trim().toLowerCase().includes('date') && b.querySelector('p'));
    });

    // Close palette
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg') && b.innerHTML.includes('X'));
      if (closeBtn) closeBtn.click();
    });
    await delay(200);
  }

  console.log('     results:', JSON.stringify(results));
  const pass = results.openWithBackslash;
  return { status: pass ? 'PASS' : 'FAIL', details: results };
}

async function testBlockReordering(page) {
  console.log('  → Testing Block Reordering...');
  const results = {};

  // Add two blocks so we can reorder
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add a block'));
    if (addBtn) addBtn.click();
  });
  await delay(400);
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    if (input) { input.value = 'Table'; input.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(400);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const blockBtn = btns.find(b => b.textContent.trim().includes('Table') && b.querySelector('p'));
    if (blockBtn) blockBtn.click();
  });
  await delay(600);

  // Check move buttons exist on hover
  results.hasMoveButtons = await page.evaluate(() => {
    const canvas = document.querySelector('.space-y-3');
    const blocks = Array.from(canvas?.querySelectorAll(':scope > div') || []);
    const lastBlock = blocks[blocks.length - 1];
    if (!lastBlock) return false;
    // Hover to show action buttons
    lastBlock.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const moveUp = lastBlock.querySelector('button[title="Move up"]');
    const moveDown = lastBlock.querySelector('button[title="Move down"]');
    return { hasUp: !!moveUp, hasDown: !!moveDown };
  });

  // Test move up
  if (results.hasMoveButtons?.hasUp) {
    await page.evaluate(() => {
      const canvas = document.querySelector('.space-y-3');
      const blocks = Array.from(canvas?.querySelectorAll(':scope > div') || []);
      const lastBlock = blocks[blocks.length - 1];
      lastBlock.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      const moveUp = lastBlock.querySelector('button[title="Move up"]');
      if (moveUp) moveUp.click();
    });
    await delay(400);
    results.moveUpWorked = await page.evaluate(() => {
      const canvas = document.querySelector('.space-y-3');
      const blocks = Array.from(canvas?.querySelectorAll(':scope > div') || []);
      const last = blocks[blocks.length - 1];
      const secondLast = blocks[blocks.length - 2];
      return last?.textContent?.includes('Table') && !secondLast?.textContent?.includes('Table');
    });
  }

  console.log('     results:', JSON.stringify(results));
  const pass = results.hasMoveButtons?.hasUp;
  return { status: pass ? 'PASS' : 'FAIL', details: results };
}

async function testBlockDuplication(page) {
  console.log('  → Testing Block Duplication...');
  const results = {};

  results.duplicateBtnExists = await page.evaluate(() => {
    const canvas = document.querySelector('.space-y-3');
    const blocks = Array.from(canvas?.querySelectorAll(':scope > div') || []);
    const lastBlock = blocks[blocks.length - 1];
    if (!lastBlock) return false;
    lastBlock.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const dupBtn = lastBlock.querySelector('button[title="Duplicate"]');
    return !!dupBtn;
  });

  if (results.duplicateBtnExists) {
    const beforeCount = await page.evaluate(() => {
      return document.querySelector('.space-y-3')?.querySelectorAll(':scope > div').length || 0;
    });
    await page.evaluate(() => {
      const canvas = document.querySelector('.space-y-3');
      const blocks = Array.from(canvas?.querySelectorAll(':scope > div') || []);
      const lastBlock = blocks[blocks.length - 1];
      lastBlock.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      const dupBtn = lastBlock.querySelector('button[title="Duplicate"]');
      if (dupBtn) dupBtn.click();
    });
    await delay(400);
    const afterCount = await page.evaluate(() => {
      return document.querySelector('.space-y-3')?.querySelectorAll(':scope > div').length || 0;
    });
    results.countIncreased = afterCount === beforeCount + 1;
  }

  console.log('     results:', JSON.stringify(results));
  const pass = results.duplicateBtnExists && results.countIncreased;
  return { status: pass ? 'PASS' : 'FAIL', details: results };
}

async function testBlockDeletion(page) {
  console.log('  → Testing Block Deletion...');
  const results = {};

  results.deleteBtnExists = await page.evaluate(() => {
    const canvas = document.querySelector('.space-y-3');
    const blocks = Array.from(canvas?.querySelectorAll(':scope > div') || []);
    const lastBlock = blocks[blocks.length - 1];
    if (!lastBlock) return false;
    lastBlock.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const delBtn = lastBlock.querySelector('button[title="Delete"]');
    return !!delBtn;
  });

  if (results.deleteBtnExists) {
    const beforeCount = await page.evaluate(() => {
      return document.querySelector('.space-y-3')?.querySelectorAll(':scope > div').length || 0;
    });
    await page.evaluate(() => {
      const canvas = document.querySelector('.space-y-3');
      const blocks = Array.from(canvas?.querySelectorAll(':scope > div') || []);
      const lastBlock = blocks[blocks.length - 1];
      lastBlock.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      const delBtn = lastBlock.querySelector('button[title="Delete"]');
      if (delBtn) delBtn.click();
    });
    await delay(400);
    const afterCount = await page.evaluate(() => {
      return document.querySelector('.space-y-3')?.querySelectorAll(':scope > div').length || 0;
    });
    results.countDecreased = afterCount === beforeCount - 1;
  }

  console.log('     results:', JSON.stringify(results));
  const pass = results.deleteBtnExists && results.countDecreased;
  return { status: pass ? 'PASS' : 'FAIL', details: results };
}

async function testKeyboardShortcuts(page) {
  console.log('  → Testing Keyboard Shortcuts...');
  const results = {};

  // Test / shortcut opens palette
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) el.blur();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
  });
  await delay(400);
  results.slashShortcut = await page.evaluate(() => {
    return !!document.querySelector('input[placeholder*="Search"]');
  });

  // Close palette
  if (results.slashShortcut) {
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg') && b.innerHTML.includes('X'));
      if (closeBtn) closeBtn.click();
    });
    await delay(200);
  }

  // Test Escape closes palette
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
  });
  await delay(400);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await delay(400);
  results.escapeCloses = await page.evaluate(() => {
    return !document.querySelector('input[placeholder*="Search"]');
  });

  console.log('     results:', JSON.stringify(results));
  const pass = results.slashShortcut && results.escapeCloses;
  return { status: pass ? 'PASS' : 'FAIL', details: results };
}

async function testUndoRedo(page) {
  console.log('  → Testing Undo/Redo...');
  const results = {};

  // Add a block, then try undo
  await page.evaluate(() => {
    const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Reset');
    if (resetBtn) resetBtn.click();
  });
  await delay(600);

  const beforeCount = await page.evaluate(() => {
    return document.querySelector('.space-y-3')?.querySelectorAll(':scope > div').length || 0;
  });

  // Add a block
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add a block'));
    if (addBtn) addBtn.click();
  });
  await delay(400);
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    if (input) { input.value = 'Table'; input.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await delay(400);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const blockBtn = btns.find(b => b.textContent.trim().includes('Table') && b.querySelector('p'));
    if (blockBtn) blockBtn.click();
  });
  await delay(600);

  const afterAddCount = await page.evaluate(() => {
    return document.querySelector('.space-y-3')?.querySelectorAll(':scope > div').length || 0;
  });

  // Try Ctrl+Z undo
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
  });
  await delay(600);

  const afterUndoCount = await page.evaluate(() => {
    return document.querySelector('.space-y-3')?.querySelectorAll(':scope > div').length || 0;
  });

  results.beforeCount = beforeCount;
  results.afterAddCount = afterAddCount;
  results.afterUndoCount = afterUndoCount;
  results.undoWorked = afterUndoCount === beforeCount;

  console.log('     results:', JSON.stringify(results));
  const pass = results.undoWorked;
  return { status: pass ? 'PASS' : 'FAIL', details: results };
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

  RESULTS.push({ type: 'slash-command-palette', ...await testSlashCommandPalette(page) });
  RESULTS.push({ type: 'backslash-macro', ...await testBackslashMacro(page) });
  RESULTS.push({ type: 'block-reordering', ...await testBlockReordering(page) });
  RESULTS.push({ type: 'block-duplication', ...await testBlockDuplication(page) });
  RESULTS.push({ type: 'block-deletion', ...await testBlockDeletion(page) });
  RESULTS.push({ type: 'keyboard-shortcuts', ...await testKeyboardShortcuts(page) });
  RESULTS.push({ type: 'undo-redo', ...await testUndoRedo(page) });

  await page.setViewport({ width: 1400, height: 3000 });
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'L-6-editor-ux-final.png') });

  console.log('\n=== L-6 EDITOR CORE UX QA RESULTS ===');
  for (const r of RESULTS) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : 'ℹ️';
    console.log(`  ${icon} ${r.type.toUpperCase()}: ${r.status}${r.reason ? ' — ' + r.reason : ''}`);
  }

  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL').length;
  const info = RESULTS.filter(r => r.status === 'INFO').length;
  console.log(`\nSUMMARY: ${pass}/${RESULTS.length} PASS, ${fail} FAIL, ${info} INFO`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
