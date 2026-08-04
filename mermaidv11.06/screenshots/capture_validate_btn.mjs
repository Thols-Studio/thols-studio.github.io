import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  await page.waitForTimeout(1000);
  
  // Take screenshot
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\42_validate_btn.png' });
  
  await browser.close();
})();
