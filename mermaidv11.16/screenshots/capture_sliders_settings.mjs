import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Open settings panel
  await page.click('#settingsToggleBtn');
  await page.waitForTimeout(300);

  // Toggle to light theme
  await page.selectOption('#theme', 'default');
  await page.waitForTimeout(300);
  
  // Set some values to the sliders
  await page.evaluate(() => {
    const t = document.getElementById('themeBrightnessSlider');
    t.value = '85';
    t.dispatchEvent(new Event('input'));
    
    const c = document.getElementById('codeBrightnessSlider');
    c.value = '40';
    c.dispatchEvent(new Event('input'));
  });
  
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\27_settings_sliders.png' });
  await browser.close();
})();
