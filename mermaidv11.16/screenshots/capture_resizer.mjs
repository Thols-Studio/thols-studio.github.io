import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  await page.waitForTimeout(500); // Wait for initial render
  
  // Get original bounding box of the diagram
  const originalBbox = await page.evaluate(() => {
    return document.getElementById('target').getBoundingClientRect();
  });
  
  // Start dragging the editor right by 300px
  const handle = await page.locator('#editorResizeHandle');
  const box = await handle.boundingBox();
  
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  
  await page.waitForTimeout(500);
  
  // Get new bounding box
  const newBbox = await page.evaluate(() => {
    return document.getElementById('target').getBoundingClientRect();
  });
  
  console.log(`Original diagram size: ${originalBbox.width}x${originalBbox.height}`);
  console.log(`New diagram size: ${newBbox.width}x${newBbox.height}`);
  
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\28_resized_editor.png' });
  await browser.close();
})();
