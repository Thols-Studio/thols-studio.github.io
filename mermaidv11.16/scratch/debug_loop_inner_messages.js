const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5505/index.html');

  const sourceCode = 'sequenceDiagram\nparticipant Alice\nparticipant Bob\nAlice->>Bob: Outside Message\nloop Everyday\nAlice->>Bob: Inside Loop Message 1\nBob->>Alice: Inside Loop Message 2\nend';
  await page.locator('#source').fill(sourceCode);
  await page.locator('#source').dispatchEvent('input');
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const preview = document.querySelector('.preview');
    const svg = preview.querySelector('svg');

    const loopText = preview.querySelector('.loopText, .labelText');
    const loopGroup = loopText ? loopText.closest('g') : null;
    
    // Get loop bounding box
    let loopBox = null;
    if (loopGroup) {
      const allEls = loopGroup.querySelectorAll('polygon, text, line, rect, path, tspan');
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
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
      });
      loopBox = { minX, minY, maxX, maxY };
    }

    // Find all message texts and check if their Y position is inside loopBox
    const messages = Array.from(svg.querySelectorAll('.messageText'));
    const messageInfo = messages.map(msg => {
      const b = msg.getBBox();
      const y = b.y;
      const isInside = loopBox ? (y >= loopBox.minY && y <= loopBox.maxY) : false;
      return { text: msg.textContent.trim(), y, isInside };
    });

    return { loopBox, messageInfo };
  });

  console.log('LOOP INNER MESSAGES:', JSON.stringify(info, null, 2));
  await browser.close();
})();
