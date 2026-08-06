import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(1000);
  
  // Make the settings panel visible via JS so we can see the buttons
  await page.evaluate(() => {
    document.querySelector('.settings-panel').classList.add('show');
  });
  
  await page.waitForTimeout(500);
  
  // Take screenshot
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\45_teal_theme.png' });
  
  await browser.close();
})();
