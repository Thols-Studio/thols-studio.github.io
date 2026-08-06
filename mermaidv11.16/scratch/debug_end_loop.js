const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5505/index.html');

  const sourceCode = [
    'sequenceDiagram',
    'participant Alice',
    'participant Bob',
    'Alice->>Bob: Outside',
    'loop Everyday',
    '    Alice->>Bob: Inside 1',
    '    Bob->>Alice: Inside 2',
    'end'
  ].join('\n');

  await page.locator('#source').fill(sourceCode);
  await page.locator('#source').dispatchEvent('input');
  await page.waitForTimeout(1200);

  // Test 1: cursor on 'end' line → should resolve to 'loop Everyday' and highlight loop
  const endIdx = sourceCode.lastIndexOf('\nend') + 1;
  const result1 = await page.evaluate((idx) => {
    const el = document.getElementById('source');
    el.focus();
    el.setSelectionRange(idx + 1, idx + 1);
    el.dispatchEvent(new Event('mouseup'));
    return new Promise(res => setTimeout(() => {
      const box = document.getElementById('diagram-selection-box');
      res({ boxExists: !!box, boxW: box ? box.getAttribute('width') : null });
    }, 400));
  }, endIdx);

  console.log('TEST 1 (end line → loop box):', result1);

  // Test 2: cursor on 'loop Everyday' line
  const loopIdx = sourceCode.indexOf('loop Everyday');
  const result2 = await page.evaluate((idx) => {
    const el = document.getElementById('source');
    el.focus();
    el.setSelectionRange(idx + 2, idx + 2);
    el.dispatchEvent(new Event('mouseup'));
    return new Promise(res => setTimeout(() => {
      const box = document.getElementById('diagram-selection-box');
      const innerMsgs = document.querySelectorAll('.inner-loop-message');
      res({
        boxExists: !!box,
        boxW: box ? box.getAttribute('width') : null,
        innerMsgCount: innerMsgs.length,
        innerMsgTexts: Array.from(innerMsgs).map(m => m.textContent.trim())
      });
    }, 400));
  }, loopIdx);

  console.log('TEST 2 (loop line → loop box + inner msgs highlighted):', result2);

  // Test 3: cursor on 'Inside 1' message
  const insideIdx = sourceCode.indexOf('Alice->>Bob: Inside 1');
  const result3 = await page.evaluate((idx) => {
    const el = document.getElementById('source');
    el.focus();
    el.setSelectionRange(idx + 2, idx + 2);
    el.dispatchEvent(new Event('mouseup'));
    return new Promise(res => setTimeout(() => {
      const box = document.getElementById('diagram-selection-box');
      res({
        boxExists: !!box,
        boxY: box ? box.getAttribute('y') : null
      });
    }, 400));
  }, insideIdx);

  console.log('TEST 3 (inside loop message → highlighted in SVG):', result3);

  await browser.close();
})();
