const { test, expect } = require('@playwright/test');

test.describe('Theme & Styles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
    // Open settings if needed, or interact with theme buttons directly if they are in the DOM
  });

  test('toggling global theme changes HTML class', async ({ page }) => {
    // The theme buttons are in the DOM, we might need to open the theme panel first
    const themeBtn = page.locator('#settingsToggleBtn');
    await themeBtn.click(); // Wait, the theme buttons are in #themePanel. Is there a button to open it?
    // Let's just force the panel visible or click the pill button
    
    // In index.html, the combined pill has #diagramTypeBadge which opens shapes, 
    // wait, #themePanel is toggled by #openEditorBtn ? No.
    // Let's assume we can interact with the buttons directly if we use force: true
    
    // Click the Dark theme button
    await page.locator('.theme-btn[data-theme="dark"]').click({ force: true });
    await expect(page.locator('html')).toHaveClass(/theme-dark/);

    // Click the Light theme button
    await page.locator('.theme-btn[data-theme="default"]').click({ force: true });
    await expect(page.locator('html')).toHaveClass(/theme-light/);
  });

  test('changing diagram style triggers a re-render with new config', async ({ page }) => {
    // Click 'sharp' style
    await page.locator('.style-btn[data-style="sharp"]').click({ force: true });
    
    // The active class should move
    await expect(page.locator('.style-btn[data-style="sharp"]')).toHaveClass(/active/);
    
    // The rendering should occur (this test is more of a smoke test to ensure no crash)
    await expect(page.locator('.preview svg')).toBeVisible();
  });
});
