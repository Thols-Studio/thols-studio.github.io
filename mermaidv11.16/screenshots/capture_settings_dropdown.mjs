import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });

  // Expand settings panel
  await page.click('#settingsToggleBtn');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\20_settings_dropdown.png' });

  await browser.close();
})();
