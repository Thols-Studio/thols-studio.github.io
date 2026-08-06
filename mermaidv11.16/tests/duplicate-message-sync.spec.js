const { test, expect } = require('@playwright/test');

test.describe('Duplicate Message Selection Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('selecting second duplicate message line in editor highlights second message in preview', async ({ page }) => {
    const editor = page.locator('#source');
    const sourceCode = 'sequenceDiagram\nparticipant Alice\nparticipant Bob\nAlice->>Bob: Hello\nloop Everyday\nAlice->>Bob: Hello\nend';
    await editor.fill(sourceCode);
    await editor.dispatchEvent('input');
    await page.waitForTimeout(1000);

    // Place cursor on line 6 (inside loop Hello message)
    const line6Index = sourceCode.lastIndexOf('Alice->>Bob: Hello');
    await editor.evaluate((el, idx) => {
      el.focus();
      el.setSelectionRange(idx + 2, idx + 2);
      el.dispatchEvent(new Event('mouseup'));
    }, line6Index);

    await page.waitForTimeout(400);

    const selectionBox = page.locator('#diagram-selection-box');
    await expect(selectionBox).toBeVisible();

    const boxY = await selectionBox.evaluate(el => parseFloat(el.getAttribute('y')));

    // Place cursor on line 4 (outside loop Hello message)
    const line4Index = sourceCode.indexOf('Alice->>Bob: Hello');
    await editor.evaluate((el, idx) => {
      el.focus();
      el.setSelectionRange(idx + 2, idx + 2);
      el.dispatchEvent(new Event('mouseup'));
    }, line4Index);

    await page.waitForTimeout(400);

    const boxYFirst = await selectionBox.evaluate(el => parseFloat(el.getAttribute('y')));

    // Line 6 (inside loop) message should be positioned lower (larger Y coordinate) than line 4 (outside loop)
    expect(boxY).toBeGreaterThan(boxYFirst);
  });
});
