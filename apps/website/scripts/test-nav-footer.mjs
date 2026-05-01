import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox']
});

// Desktop
const pageD = await browser.newPage();
await pageD.setViewport({ width: 1440, height: 900 });
await pageD.goto('http://localhost:5000/blog', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
await pageD.screenshot({ path: 'screenshots/nav-desktop.png', fullPage: true });

// Mobile
const pageM = await browser.newPage();
await pageM.setViewport({ width: 390, height: 844 });
await pageM.goto('http://localhost:5000/blog', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
await pageM.screenshot({ path: 'screenshots/nav-mobile.png', fullPage: true });

// Open mobile menu
const btns = await pageM.$$('button');
console.log('Buttons found:', btns.length);
for (const b of btns) {
  const label = await b.evaluate(el => el.getAttribute('aria-label'));
  console.log('Button aria-label:', label);
}
const menuBtn = await pageM.$('button[aria-label="Open menu"]');
if (menuBtn) {
  await menuBtn.click();
  await new Promise(r => setTimeout(r, 800));
  await pageM.screenshot({ path: 'screenshots/nav-mobile-menu.png', fullPage: false });
  console.log('Menu screenshot saved');
} else {
  console.log('Menu button not found');
}

await browser.close();
console.log('Done');
