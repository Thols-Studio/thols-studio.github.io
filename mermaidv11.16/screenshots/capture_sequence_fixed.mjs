import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Set to sequence
  await page.evaluate(() => {
    const el = document.getElementById('diagramType');
    el.value = 'sequence';
    el.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(1000);
  
  // Take screenshot of the corrected sequence diagram coloring
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\36_sequence_fixed.png' });
  await browser.close();
})();
