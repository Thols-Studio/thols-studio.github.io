const { test, expect } = require('@playwright/test');

test.describe('Editor Warning Display (Undeclared Participants)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('displays amber warning for undeclared participants while rendering diagram cleanly', async ({ page }) => {
    const editor = page.locator('#source');
    const errBar = page.locator('#editorErrorBar');
    const errText = page.locator('#editorErrorText');
    const gutter = page.locator('#gutter');

    // 1. Enter sequence diagram with Note over S,C (undeclared participants)
    await editor.fill('sequenceDiagram\n Note over S,C: Cache invalidated');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(800);

    // 2. Diagram should render successfully in the preview pane
    const svg = page.locator('.preview svg');
    await expect(svg).toBeVisible();

    // 3. Amber warning bar should be visible displaying the warning text
    await expect(errBar).toBeVisible();
    await expect(errBar).toHaveClass(/warning-mode/);
    const message = await errText.textContent();
    expect(message).toContain("Warning in line 2: 'S', 'C' not declared as participant");

    // 4. Line 2 in gutter should have .gutter-warning-line class (amber/yellow)
    const warnLineSpan = gutter.locator('span.gutter-warning-line');
    await expect(warnLineSpan).toBeVisible();
    const lineText = (await warnLineSpan.textContent()).trim();
    expect(lineText).toBe('2');

    // 5. Declare participants S and C at top of diagram -> warning should clear
    await editor.fill('sequenceDiagram\n participant S\n participant C\n Note over S,C: Cache invalidated');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(800);

    await expect(errBar).toBeHidden();
    await expect(warnLineSpan).not.toBeVisible();
  });
});
