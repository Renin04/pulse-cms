#!/usr/bin/env node
/**
 * Pulse UI/UX Screenshot Audit Script
 *
 * Captures screenshots of all key pages in multiple viewports.
 * Supports authenticated admin pages via login automation.
 *
 * Usage:
 *   node scripts/screenshot-audit.mjs
 *
 * Requirements:
 *   - puppeteer-core (devDependency)
 *   - System Chrome or Edge installed
 *   - Next.js dev server running on http://localhost:3000
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = process.env.PULSE_BASE_URL || 'http://localhost:3000';

// Admin credentials for authenticated screenshots
const ADMIN_EMAIL = process.env.PULSE_ADMIN_EMAIL || 'mmshfa@pulse.local';
const ADMIN_PASSWORD = process.env.PULSE_ADMIN_PASSWORD || '**removed**';

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  mobile: { width: 375, height: 812, deviceScaleFactor: 3 }, // iPhone X dimensions
};

const PUBLIC_PAGES = [
  { name: 'home', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'post', path: '/blog/hello-backend' },
];

const ADMIN_PAGES = [
  { name: 'admin-dashboard', path: '/admin' },
  { name: 'admin-content', path: '/admin/content' },
  { name: 'admin-users', path: '/admin/users', modal: { text: 'New User', waitFor: 'input[type="email"]', suffix: 'modal' } },
  { name: 'admin-media', path: '/admin/media' },
  { name: 'admin-settings', path: '/admin/settings' },
  { name: 'admin-studio', path: '/admin/studio' },
];

const STUDIO_PAGES = [
  { name: 'old-studio', path: '/studio' },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  // Try registry lookup on Windows
  try {
    const reg = execSync(
      'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve',
      { encoding: 'utf-8' }
    );
    const m = reg.match(/REG_SZ\s+(.+\.exe)/i);
    if (m && fs.existsSync(m[1].trim())) return m[1].trim();
  } catch {
    // ignore
  }
  throw new Error('Could not find Chrome or Edge. Please install Chrome.');
}

async function capturePage(browser, pageInfo, viewportName, viewport, cookies = null) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  if (cookies) {
    await page.setCookie(...cookies);
  }

  const url = `${BASE_URL}${pageInfo.path}`;
  console.log(`  → ${pageInfo.name} [${viewportName}]`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.warn(`    ⚠️ Timeout loading ${url}, continuing with partial load`);
  }

  // Wait for main content to render (not just spinner)
  // Admin pages show spinner while auth loads, so we wait for the spinner to disappear
  // or for key content elements to appear
  try {
    await page.waitForFunction(
      () => {
        const spinners = document.querySelectorAll('[class*="animate-spin"], .animate-spin');
        const hasSpinner = spinners.length > 0;
        const bodyHasContent = document.body.innerText.length > 200;
        return !hasSpinner || bodyHasContent;
      },
      { timeout: 10000, polling: 500 }
    );
  } catch {
    // If spinner never goes away, we still capture what we have
  }

  // Extra wait for any lazy-loaded images or animations
  await new Promise((r) => setTimeout(r, 1500));

  const filename = `${pageInfo.name}-${viewportName}.png`;
  const filepath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });

  // Capture modal/interactive state if configured
  if (pageInfo.modal) {
    try {
      // Use XPath for text-based selection (Puppeteer doesn't support :has-text)
      const clicked = await page.evaluate((text) => {
        const result = document.evaluate(`//button[contains(., '${text}')]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const btn = result.singleNodeValue;
        if (btn) { btn.click(); return true; }
        return false;
      }, pageInfo.modal.text);
      if (clicked) {
        await page.waitForSelector(pageInfo.modal.waitFor, { visible: true, timeout: 5000 });
        await new Promise((r) => setTimeout(r, 800));
        const modalFilename = `${pageInfo.name}-${pageInfo.modal.suffix}-${viewportName}.png`;
        const modalFilepath = path.join(OUT_DIR, modalFilename);
        await page.screenshot({ path: modalFilepath, fullPage: true });
        console.log(`    📸 Modal captured: ${modalFilename}`);
      }
    } catch (e) {
      console.warn(`    ⚠️ Modal capture failed for ${pageInfo.name}: ${e.message}`);
    }
  }

  // Capture hover states on table rows if table exists
  const tableRows = await page.$$('table tbody tr');
  if (tableRows.length > 0) {
    try {
      await tableRows[0].hover();
      await new Promise((r) => setTimeout(r, 500));
      const hoverFilename = `${pageInfo.name}-hover-${viewportName}.png`;
      const hoverFilepath = path.join(OUT_DIR, hoverFilename);
      await page.screenshot({ path: hoverFilepath, fullPage: true });
      console.log(`    📸 Hover captured: ${hoverFilename}`);
    } catch {
      // ignore hover capture errors
    }
  }

  await page.close();
  return filepath;
}

async function loginAdmin(browser) {
  console.log('🔐 Logging in as admin...');
  const page = await browser.newPage();
  await page.setViewport(VIEWPORTS.desktop);

  await page.goto(`${BASE_URL}/studio`, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for login form
  await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });

  // Fill credentials
  const emailInput = await page.$('input[type="email"], input[name="email"], #email');
  const passwordInput = await page.$('input[type="password"], input[name="password"], #password');

  if (!emailInput || !passwordInput) {
    console.warn('⚠️ Could not find login form inputs. Taking screenshots without auth.');
    await page.close();
    return null;
  }

  await emailInput.type(ADMIN_EMAIL);
  await passwordInput.type(ADMIN_PASSWORD);

  // Submit form (press Enter on password field — simplest and most reliable)
  await passwordInput.press('Enter');

  // Wait for navigation or dashboard to load
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  } catch {
    // may not navigate
  }

  // Wait a bit for auth state to settle
  await new Promise((r) => setTimeout(r, 2000));

  // Extract cookies for reuse in other pages
  const cookies = await page.cookies();
  await page.close();

  console.log(`   ✓ Logged in, got ${cookies.length} cookies`);
  return cookies;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Pulse Screenshot Audit');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Output:   ${OUT_DIR}`);
  console.log('═══════════════════════════════════════════════\n');

  ensureDir(OUT_DIR);

  // Clean old screenshots (keep last audit if you want, but let's overwrite for clarity)
  const existing = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'));
  for (const f of existing) {
    fs.unlinkSync(path.join(OUT_DIR, f));
  }
  console.log(`🗑️  Cleared ${existing.length} old screenshots\n`);

  const chromePath = findChrome();
  console.log(`🌐 Using browser: ${chromePath}\n`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  });

  const results = [];

  // ── Public pages ─────────────────────────────
  console.log('📸 Public Pages');
  for (const pageInfo of PUBLIC_PAGES) {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      const fp = await capturePage(browser, pageInfo, vpName, vp);
      results.push({ page: pageInfo.name, viewport: vpName, file: fp, auth: false });
    }
  }

  // ── Studio (public, old page) ────────────────
  console.log('\n📸 Studio Pages');
  for (const pageInfo of STUDIO_PAGES) {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      const fp = await capturePage(browser, pageInfo, vpName, vp);
      results.push({ page: pageInfo.name, viewport: vpName, file: fp, auth: false });
    }
  }

  // ── Admin pages (authenticated) ──────────────
  console.log('\n📸 Admin Pages (authenticated)');
  const cookies = await loginAdmin(browser);

  if (cookies) {
    for (const pageInfo of ADMIN_PAGES) {
      for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
        const fp = await capturePage(browser, pageInfo, vpName, vp, cookies);
        results.push({ page: pageInfo.name, viewport: vpName, file: fp, auth: true });
      }
    }
  } else {
    console.log('   ⚠️ Skipping admin pages — login failed');
  }

  await browser.close();

  // ── Summary ──────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════');
  const byViewport = { desktop: 0, tablet: 0, mobile: 0 };
  for (const r of results) {
    byViewport[r.viewport]++;
  }
  console.log(`  Total screenshots: ${results.length}`);
  console.log(`    Desktop: ${byViewport.desktop}`);
  console.log(`    Tablet:  ${byViewport.tablet}`);
  console.log(`    Mobile:  ${byViewport.mobile}`);
  console.log(`  Output directory: ${OUT_DIR}`);
  console.log('═══════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('❌ Screenshot audit failed:', err.message);
  process.exit(1);
});
