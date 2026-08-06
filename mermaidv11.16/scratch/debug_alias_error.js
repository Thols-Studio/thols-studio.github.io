// We need playwright to check the mermaid error/output
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5505/index.html');

  const sourceCode = [
    'sequenceDiagram',
    'participant A as Alice',
    'Alice->>Bob: Hello'
  ].join('\n');

  await page.locator('#source').fill(sourceCode);
  await page.locator('#source').dispatchEvent('input');
  await page.waitForTimeout(1000);

  // Check if there is a mermaid error or warning
  const errText = await page.evaluate(() => {
    const errEl = document.getElementById('editorErrorBar');
    return errEl && errEl.style.display !== 'none' ? errEl.innerText : 'NO ERROR';
  });
  console.log('Error bar:', errText);

  // Check how many actors there are
  const actorTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.preview .actor text')).map(t => t.textContent.trim());
  });
  console.log('Actors in SVG:', actorTexts);

  await browser.close();
})();
