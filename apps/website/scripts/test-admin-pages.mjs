import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// Login via studio
await page.goto('http://localhost:5000/studio/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));
const hasEmail = await page.$('input[type="email"]');
if (hasEmail) {
  await page.type('input[type="email"]', 'mmshfa@pulse.local');
  await page.type('input[type="password"]', process.env.ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
}

// Settings page
await page.goto('http://localhost:5000/admin/settings', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: 'screenshots/admin-settings.png', fullPage: true });

// Taxonomies page
await page.goto('http://localhost:5000/admin/taxonomies', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: 'screenshots/admin-taxonomies.png', fullPage: true });

await browser.close();
console.log('Done');
