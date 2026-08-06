const { test, expect } = require('@playwright/test');

test.describe('Diagram Theme Toggle Button Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('Diagram theme toggle is ON when page opens in Teal Theme', async ({ page }) => {
    const toggleBtn = page.locator('#diagramThemeToggleBtn');
    
    // Check initial state (Teal theme is dark/active -> toggle is checked)
    const isChecked = await toggleBtn.isChecked();
    expect(isChecked).toBe(true);
  });

  test('Diagram theme toggle turns OFF when Light theme is selected and ON when Teal/Dark is selected', async ({ page }) => {
    const toggleBtn = page.locator('#diagramThemeToggleBtn');
    const themeSelect = page.locator('#theme');

    // Switch to Light theme (value = 'default')
    await themeSelect.evaluate(el => {
      el.value = 'default';
      el.dispatchEvent(new Event('change'));
    });
    await page.waitForTimeout(300);

    let isChecked = await toggleBtn.isChecked();
    expect(isChecked).toBe(false);

    // Switch back to Teal theme (value = 'teal')
    await themeSelect.evaluate(el => {
      el.value = 'teal';
      el.dispatchEvent(new Event('change'));
    });
    await page.waitForTimeout(300);

    isChecked = await toggleBtn.isChecked();
    expect(isChecked).toBe(true);
  });
});
