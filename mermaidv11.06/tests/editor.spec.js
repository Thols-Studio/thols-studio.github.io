const { test, expect } = require('@playwright/test');

test.describe('Editor & Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Disable CodeMirror fallback to ensure we are testing the raw textarea
    await page.addInitScript(() => {
      localStorage.setItem('mermaid-hl-mode', 'off');
    });
    await page.goto('http://localhost:5505/index.html');
  });

  test('modifying source text re-renders the diagram', async ({ page }) => {
    const editor = page.locator('#source');
    
    // Inject a specific diagram
    await editor.fill('graph TD\\nA[Start] --> B[End]');
    
    // Playwright auto-waits, but we can explicitly wait for Mermaid to process
    await page.waitForSelector('.preview svg');
    
    // Verify that the diagram contains the text we just typed
    const svgText = await page.locator('.preview').textContent();
    expect(svgText).toContain('Start');
    expect(svgText).toContain('End');
  });

  test('auto-update toggle prevents rendering when unchecked', async ({ page }) => {
    const autoUpdateToggle = page.locator('#autoUpdateToggle');
    const editor = page.locator('#source');
    const renderBtn = page.locator('#renderBtn');

    // Turn off Auto-Update
    await autoUpdateToggle.uncheck();

    // Type new diagram
    await editor.fill('graph TD\\nC[Wait] --> D[For Click]');
    
    // Wait briefly to ensure it didn't auto-update
    await page.waitForTimeout(1000);
    
    // The SVG should NOT contain the new text yet
    let svgText = await page.locator('.preview').textContent();
    expect(svgText).not.toContain('Wait');

    // Click render button manually
    await renderBtn.click();
    
    // Now it should contain the text
    await expect(page.locator('.preview:has-text("Wait")')).toBeVisible();
  });
});
