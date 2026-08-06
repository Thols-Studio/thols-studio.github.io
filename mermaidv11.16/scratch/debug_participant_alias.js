const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5505/index.html');

  const sourceCode = [
    'sequenceDiagram',
    'participant A as Alice',
    'participant B as Bob',
    'A->>B: Hello'
  ].join('\n');

  await page.locator('#source').fill(sourceCode);
  await page.locator('#source').dispatchEvent('input');
  await page.waitForTimeout(1200);

  // Get the rendered text in the SVG for the actor
  const svgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.preview .actor text')).map(t => t.textContent.trim());
  });
  console.log('Actor text in SVG:', svgs);

  // Try selecting "participant A as Alice"
  const lineIdx = sourceCode.indexOf('participant A as Alice');
  const res = await page.evaluate((idx) => {
    const el = document.getElementById('source');
    el.focus();
    el.setSelectionRange(idx + 5, idx + 5);
    el.dispatchEvent(new Event('mouseup'));
    return new Promise(r => setTimeout(() => {
      const box = document.getElementById('diagram-selection-box');
      r(!!box);
    }, 400));
  }, lineIdx);
  
  console.log('Selection box appeared for "participant A as Alice":', res);
  
  // Try selecting "A->>B: Hello"
  const lineIdx2 = sourceCode.indexOf('A->>B: Hello');
  const res2 = await page.evaluate((idx) => {
    const el = document.getElementById('source');
    el.focus();
    el.setSelectionRange(idx + 5, idx + 5);
    el.dispatchEvent(new Event('mouseup'));
    return new Promise(r => setTimeout(() => {
      const box = document.getElementById('diagram-selection-box');
      r(!!box);
    }, 400));
  }, lineIdx2);
  
  console.log('Selection box appeared for "A->>B: Hello":', res2);

  await browser.close();
})();
