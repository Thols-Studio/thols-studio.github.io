const { test, expect } = require('@playwright/test');

test.describe('Note Selection & Clean Snippet Insertion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('Note selection rect encloses both note text and background rectangle', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('sequenceDiagram\n participant Alice\n Note left of Alice: Cache invalidated');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(1000);

    // Click on Note text or background in preview
    const noteEl = page.locator('.preview [class*="note"]').first();
    await expect(noteEl).toBeVisible();

    await noteEl.click({ force: true });
    await page.waitForTimeout(300);

    const selectionBox = page.locator('#diagram-selection-box');
    await expect(selectionBox).toBeVisible();

    const boxWidth = await selectionBox.evaluate(el => parseFloat(el.getAttribute('width')));
    const boxHeight = await selectionBox.evaluate(el => parseFloat(el.getAttribute('height')));

    expect(boxWidth).toBeGreaterThan(40);
    expect(boxHeight).toBeGreaterThan(20);
  });

  test('Inserting snippet does not append extra trailing newlines', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('flowchart TD\n ');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(400);

    // Expand snippets panel
    const snippetsBtn = page.locator('#snippetsBtn');
    await snippetsBtn.click();
    await page.waitForTimeout(300);

    // Click the first flowchart shape snippet (Rectangle)
    const firstSnippet = page.locator('.snippet-btn').first();
    await firstSnippet.click();
    await page.waitForTimeout(300);

    const val = await editor.inputValue();
    expect(val).toBe('flowchart TD\n id1[Node]');
    expect(val.endsWith('\n')).toBe(false);
  });
});
