const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5505/index.html');

  const sourceCode = 'sequenceDiagram\nparticipant Alice\nparticipant Bob\nloop Everyday\nAlice->>Bob: Hello\nend';
  await page.locator('#source').fill(sourceCode);
  await page.locator('#source').dispatchEvent('input');
  await page.waitForTimeout(1000);

  const res = await page.evaluate(() => {
    const preview = document.querySelector('.preview');
    const loopText = preview.querySelector('.loopText, .labelText');
    const loopGroup = loopText ? loopText.closest('g') : null;
    
    let bbox = null;
    let childrenInfo = [];
    if (loopGroup) {
      const allEls = loopGroup.querySelectorAll('polygon, text, line, rect, path');
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      const svg = preview.querySelector('svg');
      const getSVGOffset = (el) => {
        let x = 0, y = 0;
        let current = el;
        while (current && current !== svg) {
          const transform = current.getAttribute('transform');
          if (transform) {
            const translateMatch = transform.match(/translate\s*\(\s*([\d.-]+)\s*(?:[,\s]+\s*([\d.-]+)\s*)?\)/);
            if (translateMatch) {
              x += parseFloat(translateMatch[1] || 0);
              y += parseFloat(translateMatch[2] || 0);
            }
          }
          current = current.parentElement;
        }
        return { x, y };
      };

      allEls.forEach(el => {
        const b = el.getBBox();
        const off = getSVGOffset(el);
        const x1 = off.x + b.x;
        const y1 = off.y + b.y;
        const x2 = x1 + b.width;
        const y2 = y1 + b.height;
        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
        maxX = Math.max(maxX, x2);
        maxY = Math.max(maxY, y2);
        childrenInfo.push({ tag: el.tagName, class: el.className.baseVal || el.className, x1, y1, x2, y2 });
      });

      bbox = { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    return { loopGroupFound: !!loopGroup, bbox, childrenInfo };
  });

  console.log('LOOP BBOX TEST:', JSON.stringify(res, null, 2));
  await browser.close();
})();
