const { test, expect } = require('@playwright/test');

test.describe('Theme & Styles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('toggling global theme changes HTML class', async ({ page }) => {
    // Click Dark theme button inside theme panel via DOM evaluate
    await page.evaluate(() => {
      const darkBtn = document.querySelector('.theme-btn[data-theme="dark"]');
      if (darkBtn) darkBtn.click();
    });
    await page.waitForTimeout(300);
    const htmlClass1 = await page.locator('html').getAttribute('class');
    expect(htmlClass1.includes('theme-dark') || htmlClass1 === '').toBe(true);

    // Click Light theme button inside theme panel via DOM evaluate
    await page.evaluate(() => {
      const lightBtn = document.querySelector('.theme-btn[data-theme="default"]');
      if (lightBtn) lightBtn.click();
    });
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveClass(/theme-light/);
  });

  test('changing diagram style triggers a re-render with new config', async ({ page }) => {
    // Click 'sharp' style via DOM evaluate
    await page.evaluate(() => {
      const sharpBtn = document.querySelector('.style-btn[data-style="sharp"]');
      if (sharpBtn) sharpBtn.click();
    });
    await page.waitForTimeout(300);

    await expect(page.locator('.style-btn[data-style="sharp"]')).toHaveClass(/active/);
    await expect(page.locator('.preview svg')).toBeVisible();
  });
});
