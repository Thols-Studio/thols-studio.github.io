import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.setViewportSize({ width: 1280, height: 800 });

// Load the page
await page.goto('http://localhost:5505');

// Wait for it to render first time
await page.waitForSelector('#target svg', { state: 'attached' });

// Clear the editor and focus it
await page.evaluate(() => {
  const src = document.getElementById('source');
  src.value = '';
  src.dispatchEvent(new Event('input'));
  src.focus();
});
await page.waitForTimeout(500);

await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\17_autocomplete.png' });

await browser.close();
