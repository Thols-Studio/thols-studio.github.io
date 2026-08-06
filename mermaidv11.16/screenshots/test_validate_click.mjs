import { chromium } from 'playwright';

const mermaidCode = `sequenceDiagram
    participant A
    alt foo
    else bar
    end
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
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
  
  // Get text of Validate button
  const text = await page.evaluate(() => document.getElementById('validateBtn').innerText);
  console.log('VALIDATE TEXT:', text);
  
  await browser.close();
})();
