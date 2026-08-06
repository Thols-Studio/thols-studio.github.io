const { test, expect } = require('@playwright/test');

test.describe('Diagram Theme Style Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('selecting sharp, rounded, and pill diagram styles updates flowchart node rx/ry attributes', async ({ page }) => {
    // Inject a flowchart diagram
    const editor = page.locator('#source');
    await editor.fill('flowchart TD\n A[Start] --> B[Process]\n');
    await page.waitForSelector('.preview svg g.node rect');

    // Open Color Wheel / Theme Popup
    await page.locator('#colorWheelBtn').click();
    await page.waitForSelector('#themePanel.show');

    // 1. Click Sharp style button
    await page.locator('.style-btn[data-style="sharp"]').click();
    await page.waitForTimeout(300);

    const sharpRx = await page.evaluate(() => {
      const rect = document.querySelector('.preview svg g.node rect');
      return rect ? rect.getAttribute('rx') : null;
    });
    expect(sharpRx).toBe('0');

    // 2. Click Rounded style button
    await page.locator('.style-btn[data-style="rounded"]').click();
    await page.waitForTimeout(300);

    const roundedRx = await page.evaluate(() => {
      const rect = document.querySelector('.preview svg g.node rect');
      return rect ? rect.getAttribute('rx') : null;
    });
    expect(roundedRx).toBe('8');

    // 3. Click Pill style button
    await page.locator('.style-btn[data-style="pill"]').click();
    await page.waitForTimeout(300);

    const pillRx = await page.evaluate(() => {
      const rect = document.querySelector('.preview svg g.node rect');
      return rect ? rect.getAttribute('rx') : null;
    });
    expect(parseInt(pillRx, 10)).toBeGreaterThan(10);
  });
});
