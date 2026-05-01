import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

await page.goto('http://localhost:3000/studio/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));

const hasEmail = await page.$('input[type="email"]');
if (hasEmail) {
  await page.type('input[type="email"]', 'mmshfa@pulse.local');
  await page.type('input[type="password"]', '**removed**');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
}

await page.goto('http://localhost:3000/admin/content', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: 'screenshots/admin-content-loggedin.png', fullPage: true });

await browser.close();
console.log('Done');
