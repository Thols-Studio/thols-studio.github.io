import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });

  // Close editor
  await page.click('#toggleSrcBtn');
  
  await page.waitForTimeout(500); // wait for re-layout/zoom
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\23_closed_editor.png' });

  await browser.close();
})();
