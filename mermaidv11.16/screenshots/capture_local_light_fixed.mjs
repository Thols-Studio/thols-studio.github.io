import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Set Light Theme
  await page.evaluate(() => {
    const el = document.getElementById('theme');
    el.value = 'light';
    el.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\33_local_light_fixed.png' });
  await browser.close();
})();
