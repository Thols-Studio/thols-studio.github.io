import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Set to flowchart
  await page.evaluate(() => {
    const el = document.getElementById('diagramType');
    el.value = 'flowchart';
    el.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(1000);
  
  // Enable local syntax
  await page.evaluate(() => {
    const hlMode = document.getElementById('hlMode');
    hlMode.value = 'local';
    hlMode.dispatchEvent(new Event('change'));
  });
  
  // Add some typing to force re-render and re-highlight
  await page.type('#src', ' ');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\35_flowchart_colored.png' });
  await browser.close();
})();
