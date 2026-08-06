const { test, expect } = require('@playwright/test');

test.describe('Editor Layering and Drag Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('editor panel has higher z-index than AI action bar (Use Voice)', async ({ page }) => {
    const editorZIndex = await page.locator('#sourceCol').evaluate(el => getComputedStyle(el).zIndex);
    const aiBarZIndex = await page.locator('.ai-action-bar').evaluate(el => getComputedStyle(el).zIndex);

    expect(parseInt(editorZIndex, 10)).toBeGreaterThan(parseInt(aiBarZIndex, 10));
  });

  test('Use Voice button is inside preview-container and moves with canvas area', async ({ page }) => {
    const isInsidePreview = await page.evaluate(() => {
      const aiBar = document.querySelector('.ai-action-bar');
      const previewContainer = document.querySelector('.preview-container');
      return previewContainer.contains(aiBar);
    });

    expect(isInsidePreview).toBe(true);
  });

  test('diagram preview container left stops moving when editor reaches 35vw min width', async ({ page }) => {
    const previewContainer = page.locator('.preview-container');
    const resizeHandle = page.locator('#editorResizeHandle');

    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(0, handleBox.y + handleBox.height / 2); // Drag far left
      
      const leftAtMin = parseFloat(await previewContainer.evaluate(el => getComputedStyle(el).left));
      
      await page.mouse.move(-500, handleBox.y + handleBox.height / 2);
      const leftFurther = parseFloat(await previewContainer.evaluate(el => getComputedStyle(el).left));
      await page.mouse.up();

      expect(leftAtMin).toBe(leftFurther);
    }
  });
});
