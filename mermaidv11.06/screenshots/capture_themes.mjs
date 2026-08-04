import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(1000);
  
  // Make settings panel visible
  await page.evaluate(() => {
    document.querySelector('.settings-panel').classList.add('show');
  });
  
  // Capture Teal Theme (Default)
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\46_theme_teal.png' });
  
  // Switch to Default Dark
  await page.selectOption('#theme', 'dark');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\47_theme_dark.png' });
  
  // Switch to Light
  await page.selectOption('#theme', 'default');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\48_theme_light.png' });
  
  await browser.close();
})();
