import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(500);
  
  // Set to a big flowchart
  await page.selectOption('#diagramType', 'flowchart');
  await page.waitForTimeout(1000);
  
  const handle = await page.locator('#editorResizeHandle');
  const box = await handle.boundingBox();
  
  console.log("Dragging handle...");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  
  await page.waitForTimeout(500);
  
  const bBox = await page.evaluate(() => {
    return document.getElementById('target').getBoundingClientRect();
  });
  
  console.log(`New diagram size: ${bBox.width}x${bBox.height}`);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\30_reproduce_disappear.png' });
  
  await browser.close();
})();
