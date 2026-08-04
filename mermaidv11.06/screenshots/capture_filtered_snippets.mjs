import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });

  // Expand snippets
  await page.click('#snippetsBtn');
  await page.waitForTimeout(500);

  // 1. Sequence diagram
  await page.evaluate(() => {
    const src = document.getElementById('source');
    src.value = 'sequenceDiagram\n';
    src.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\18_snippets_seq.png' });

  // 2. Flowchart
  await page.evaluate(() => {
    const src = document.getElementById('source');
    src.value = 'flowchart TD\n';
    src.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\18_snippets_flow.png' });

  // 3. Other diagram (architecture)
  await page.evaluate(() => {
    const src = document.getElementById('source');
    src.value = 'architecture-beta\n';
    src.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\18_snippets_none.png' });

  await browser.close();
})();
