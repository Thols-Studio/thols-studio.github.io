const { test, expect } = require('@playwright/test');

test.describe('UI Refinements & Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('Validate button font size is enlarged and legible', async ({ page }) => {
    const validateBtn = page.locator('#validateBtn');
    await expect(validateBtn).toBeVisible();
    const fontSize = await validateBtn.evaluate(el => window.getComputedStyle(el).fontSize);
    const fontSizePx = parseFloat(fontSize);
    expect(fontSizePx).toBeGreaterThanOrEqual(13.5); // 0.88rem >= 14px
  });

  test('Snippets header text and rightside chevron icon are vertically centered', async ({ page }) => {
    const snippetsHeader = page.locator('#snippetsBtn');
    const snippetsText = snippetsHeader.locator('.left-side span');
    const chevron = snippetsHeader.locator('.chevron');

    await expect(snippetsHeader).toBeVisible();
    await expect(snippetsText).toBeVisible();
    await expect(chevron).toBeVisible();

    const textBox = await snippetsText.boundingBox();
    const chevronBox = await chevron.boundingBox();

    // Verify vertical center points are closely aligned (within 4px difference)
    const textCenterY = textBox.y + textBox.height / 2;
    const chevronCenterY = chevronBox.y + chevronBox.height / 2;
    expect(Math.abs(textCenterY - chevronCenterY)).toBeLessThan(5);
  });

  test('Pan tool toggles on when clicked and disables properly when clicked again', async ({ page }) => {
    const panBtn = page.locator('#panBtn');
    const preview = page.locator('#preview');

    await expect(panBtn).toBeVisible();
    await expect(panBtn).not.toHaveClass(/active/);
    await expect(preview).not.toHaveClass(/pan-mode/);

    // Click to enable Pan mode
    await panBtn.click();
    await expect(panBtn).toHaveClass(/active/);
    await expect(preview).toHaveClass(/pan-mode/);

    // Click again to disable Pan mode
    await panBtn.click();
    await expect(panBtn).not.toHaveClass(/active/);
    await expect(preview).not.toHaveClass(/pan-mode/);

    const inlineCursor = await preview.evaluate(el => el.style.cursor);
    expect(inlineCursor).toBe('');
  });
});
