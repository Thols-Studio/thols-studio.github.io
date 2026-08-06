import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(500); 
  
  // Set Light Theme
  await page.evaluate(() => {
    document.getElementById('theme').value = 'light';
    document.getElementById('theme').dispatchEvent(new Event('change'));
  });
  
  // Set Local Syntax
  await page.selectOption('#hlMode', 'local');
  
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\32_local_light.png' });
  await browser.close();
})();
