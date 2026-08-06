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
  
  // Switch to Local syntax highlighting mode to see the actor coloring
  await page.selectOption('#hlMode', 'local');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\34_flowchart_coloring.png' });
  await browser.close();
})();
