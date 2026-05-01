import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });

await page.goto('http://localhost:5000/blog', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: 'screenshots/mobile-header-footer.png', fullPage: true });

const btn = await page.$('button[aria-label="Open menu"]');
if (btn) {
  await btn.click();
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'screenshots/mobile-menu-open.png', fullPage: false });
}

await browser.close();
console.log('Done');
