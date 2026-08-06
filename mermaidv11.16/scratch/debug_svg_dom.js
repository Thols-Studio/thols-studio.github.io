const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5505/index.html');

  const sourceCode = 'sequenceDiagram\nparticipant Alice\nparticipant Bob\nAlice->>Bob: Hello\nloop Everyday\nAlice->>Bob: Hello\nend';
  await page.locator('#source').fill(sourceCode);
  await page.locator('#source').dispatchEvent('input');
  await page.waitForTimeout(1000);

  const res = await page.evaluate(() => {
    const previewEl = document.querySelector('.preview');
    const rawNodes = previewEl.querySelectorAll('.messageText, .edgeLabel, .node, .actor, .note, .classGroup');
    const filteredNodes = Array.from(rawNodes).filter(n => {
      return !n.parentElement.closest('.messageText, .edgeLabel, .node, .actor, .note, .classGroup');
    });

    const matchingNodes = [];
    const lineText = 'Alice->>Bob: Hello';
    let labelToFind = lineText;
    if (lineText.includes(':') && !lineText.toLowerCase().startsWith('note')) {
      labelToFind = lineText.split(':').slice(1).join(':').trim();
    }

    for (const n of filteredNodes) {
      let nodeText = n.textContent.trim();
      if (nodeText && (nodeText === labelToFind || labelToFind.endsWith(nodeText) || labelToFind.startsWith(nodeText))) {
        matchingNodes.push({
          tag: n.tagName,
          class: n.className.baseVal || n.className,
          text: nodeText,
          bbox: n.getBBox ? n.getBBox() : null
        });
      }
    }
    return { filteredNodesLength: filteredNodes.length, labelToFind, matchingNodes };
  });

  console.log('DEBUG MATCHING NODES:', JSON.stringify(res, null, 2));
  await browser.close();
})();
