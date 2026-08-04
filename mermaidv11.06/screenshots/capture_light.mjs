import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

// Load the page
await page.goto('http://localhost:5505');

// Wait for it to render first time
await page.waitForSelector('#renderBtn.rendered', { state: 'attached' });

// Open settings panel
await page.click('#settingsToggleBtn');
await page.waitForTimeout(300);

// Switch to Light Theme
await page.selectOption('#theme', 'default');
await page.waitForTimeout(500);
await page.waitForSelector('#renderBtn.rendered', { state: 'attached' });

await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\12_light_theme_default.png' });

// Switch to Local Regex Mode
await page.selectOption('#hlMode', 'local');
await page.waitForTimeout(500);

await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\13_light_theme_local_regex.png' });

await browser.close();
