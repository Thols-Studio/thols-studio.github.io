const { test, expect } = require('@playwright/test');

test.describe('Sequence Diagram Snippets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('Displays all sequence diagram snippet categories and items when sequenceDiagram is active', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('sequenceDiagram\n participant Alice\n participant Bob');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(500);

    // Expand snippets panel
    const snippetsBtn = page.locator('#snippetsBtn');
    await snippetsBtn.click();
    await page.waitForTimeout(300);

    // Verify sequence categories are visible
    const seqCategories = page.locator('.snippet-category[data-type="sequence"]');
    const categoryCount = await seqCategories.count();
    expect(categoryCount).toBe(4);

    // Verify items inside sequence categories
    const seqItems = page.locator('.snippet-grid[data-type="sequence"] .snippet-btn');
    const itemNum = await seqItems.count();
    expect(itemNum).toBe(20); // 2 actors + 3 notes + 8 messages + 7 other = 20 items
  });
});
