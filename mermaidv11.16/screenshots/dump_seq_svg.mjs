import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Set to sequence
  await page.evaluate(() => {
    const el = document.getElementById('diagramType');
    el.value = 'sequence';
    el.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(1000);
  
  const svgHTML = await page.evaluate(() => document.getElementById('target').innerHTML);
  fs.writeFileSync('d:\\Mermaid\\screenshots\\sequence_svg.txt', svgHTML);
  
  await browser.close();
})();
