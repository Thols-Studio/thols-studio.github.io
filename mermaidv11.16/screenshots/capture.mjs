import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

// Load the page
await page.goto('http://localhost:5505');

// Wait for mermaid diagram to render (renderBtn turns green = class 'rendered')
await page.waitForSelector('#renderBtn.rendered', { timeout: 10000 });

// Extra wait for colorize pass
await page.waitForTimeout(400);

// Screenshot 1: default state (no highlighting)
await page.screenshot({ path: 'd:/Mermaid/screenshots/01_default.png', fullPage: false });
console.log('Shot 1: default');

// Select "Local (regex)" syntax mode
await page.selectOption('#hlMode', 'local');
await page.waitForTimeout(300);

// Screenshot 2: local regex highlighting active
await page.screenshot({ path: 'd:/Mermaid/screenshots/02_local_hl.png', fullPage: false });
console.log('Shot 2: local HL');

// Switch to sequence diagram to see actor colours
await page.selectOption('#diagramType', 'sequence');
await page.waitForSelector('#renderBtn.rendered', { timeout: 10000 });
await page.waitForTimeout(500);  // wait for colour refresh

// Screenshot 3: sequence diagram with actor coloring
await page.screenshot({ path: 'd:/Mermaid/screenshots/03_sequence_actors.png', fullPage: false });
console.log('Shot 3: sequence actors');

// Zoom in on just the editor panel
const editorBox = await page.locator('.editor').boundingBox();
if (editorBox) {
  await page.screenshot({
    path: 'd:/Mermaid/screenshots/04_editor_zoom.png',
    clip: { x: editorBox.x, y: editorBox.y, width: editorBox.width, height: editorBox.height }
  });
  console.log('Shot 4: editor zoomed');
}

// Collect any console errors
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await browser.close();
console.log('Console errors:', errors.length ? errors : 'none');
