import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Enable local syntax
  await page.evaluate(() => {
    const hlMode = document.getElementById('hlMode');
    hlMode.value = 'local';
    hlMode.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(1000);
  
  // Take screenshot of dark theme syntax
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\38_syntax_dark.png' });
  
  // Switch to light theme
  await page.evaluate(() => {
    const el = document.getElementById('theme');
    el.value = 'default';
    el.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(1000);
  
  // Take screenshot of light theme syntax
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\39_syntax_light.png' });
  await browser.close();
})();
