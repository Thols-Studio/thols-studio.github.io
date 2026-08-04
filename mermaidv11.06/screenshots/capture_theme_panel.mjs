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

// Switch to Light Theme
await page.evaluate(() => {
  document.getElementById('theme').value = 'default';
  document.getElementById('theme').dispatchEvent(new Event('change'));
});
await page.waitForTimeout(500);

// Open theme panel
await page.click('#colorWheelBtn');
await page.waitForTimeout(500);

await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\16_theme_panel.png' });

await browser.close();
