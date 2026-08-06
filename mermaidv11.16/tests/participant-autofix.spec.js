const { test, expect } = require('@playwright/test');

test.describe('Participant Keyword Typo Auto-Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('auto-fixes typo "participan Alice" to "participant Alice" without adding percentage signs', async ({ page }) => {
    const editor = page.locator('#source');
    const fixBtn = page.locator('#fixBtn');
    const errBar = page.locator('#editorErrorBar');

    // 1. Enter sequence diagram with typo "participan Alice"
    await editor.fill('sequenceDiagram\n participan Alice\n participant Bob\n Alice->>Bob: Hello');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(800);

    // 2. Error bar & Auto-Fix button should be visible
    await expect(errBar).toBeVisible();
    await expect(fixBtn).toBeVisible();

    // 3. Click Auto-Fix
    await fixBtn.click();
    await page.waitForTimeout(500);

    // 4. Validate output
    const val = await editor.inputValue();
    expect(val).toContain('participant Alice');
    expect(val).not.toContain('participan Alice');

    // 5. Error bar should be hidden
    await expect(errBar).toBeHidden();
  });

  test('auto-fixes alias display names to alias in sequence diagrams', async ({ page }) => {
    const editor = page.locator('#source');
    const fixBtn = page.locator('#fixBtn');
    
    // Enter sequence diagram with alias, but using display name in arrow
    await editor.fill('sequenceDiagram\n participant A as Alice\n Alice->>Bob: Hello');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(800);

    // Auto-Fix button should be visible (due to 'Alice' being undeclared warning)
    await expect(fixBtn).toBeVisible();

    // Click auto-fix
    await fixBtn.click();
    await page.waitForTimeout(500);

    // Validate output replaced Alice with A
    const val = await editor.inputValue();
    expect(val).toContain('A->>Bob: Hello');
    expect(val).not.toContain('Alice->>Bob');
  });
});
