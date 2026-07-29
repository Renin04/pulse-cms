import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const logs = [];
page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));
page.on('response', async res => {
  const url = res.url();
  if (url.includes('/api/')) {
    const status = res.status();
    console.log(`API ${status}: ${url}`);
  }
});

// Go to studio login page
await page.goto('http://localhost:3000/studio/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: 'screenshots/studio-page.png', fullPage: true });

// Try to find any input
const inputs = await page.$$('input');
console.log('Input count:', inputs.length);

// Look for email/password inputs specifically
const emailInput = await page.$('input[type="email"], input[name="email"]');
if (emailInput) {
  console.log('Email input found');
  await page.type('input[type="email"], input[name="email"]', 'mmshfa@pulse.local');
  await page.type('input[type="password"], input[name="password"]', process.env.ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));
} else {
  console.log('No email input found on studio page');
}

// Now go to admin dashboard
await page.goto('http://localhost:3000/admin/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: 'screenshots/admin-dashboard-loggedin.png', fullPage: true });

console.log('=== CONSOLE LOGS ===');
logs.forEach(l => console.log(`[${l.type}] ${l.text}`));

await browser.close();
console.log('Done');
