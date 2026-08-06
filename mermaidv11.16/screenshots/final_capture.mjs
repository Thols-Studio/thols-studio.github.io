import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5505');
await page.waitForSelector('#renderBtn.rendered', { timeout: 10000 });
await page.waitForTimeout(400);

// --- Flowchart with Local HL ---
await page.selectOption('#hlMode', 'local');
await page.waitForTimeout(400);
await page.screenshot({ path: 'd:/Mermaid/screenshots/10_flowchart_local.png' });

// --- Sequence diagram with Local HL (actor colors) ---
await page.selectOption('#diagramType', 'sequence');
await page.waitForSelector('#renderBtn.rendered', { timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: 'd:/Mermaid/screenshots/11_sequence_local.png' });

// --- Editor panel zoomed ---
const editorBox = await page.locator('.editor').boundingBox();
await page.screenshot({
  path: 'd:/Mermaid/screenshots/12_editor_zoom.png',
  clip: { x: editorBox.x - 5, y: editorBox.y - 5, width: editorBox.width + 10, height: editorBox.height + 10 }
});

await browser.close();
console.log('Done');
