import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });

  // Flowchart
  await page.evaluate(() => {
    const src = document.getElementById('source');
    src.value = '---\nconfig:\n  theme: redux\n---\nflowchart TD\n  A[Start] --> B(End)\n';
    src.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\21_flowchart_toolbar.png' });

  await browser.close();
})();
