import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(1000);
  
  // Open Export Modal
  await page.click('#exportMenuBtn');
  
  // Wait a moment for modal to appear
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\export_modal.png' });
  
  await browser.close();
})();
