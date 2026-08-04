import { chromium } from 'playwright';

const mermaidCode = `sequenceDiagram
    participant Alice
    alt foo
    else bar
    end
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  await page.evaluate((code) => {
    const el = document.getElementById('source');
    el.value = code;
    el.dispatchEvent(new Event('input'));
  }, mermaidCode);
  
  await page.waitForTimeout(1000);
  
  // Click Validate
  await page.click('#validateBtn');
  await page.waitForTimeout(500);
  
  // Take screenshot
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\43_error_highlight.png' });
  
  await browser.close();
})();
