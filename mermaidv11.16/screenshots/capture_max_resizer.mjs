import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(500); // Wait for initial render
  
  // Start dragging the editor aggressively to the right
  const handle = await page.locator('#editorResizeHandle');
  const box = await handle.boundingBox();
  
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Drag by 2000px to hit the max limit
  await page.mouse.move(box.x + 2000, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\29_max_resize.png' });
  await browser.close();
})();
