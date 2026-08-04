import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(500); // Wait for initial render
  
  // Click the text size button
  await page.click('#textSizeBtn');
  await page.waitForTimeout(300);
  
  // Drag the text size slider to 22
  await page.evaluate(() => {
    const s = document.getElementById('textSizeSlider');
    s.value = 22;
    s.dispatchEvent(new Event('input'));
  });
  
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\31_text_size_slider.png' });
  await browser.close();
})();
