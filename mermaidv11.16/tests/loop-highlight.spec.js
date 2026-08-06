const { test, expect } = require('@playwright/test');

test.describe('Loop Block Selection Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  const sourceCode = 'sequenceDiagram\nparticipant Alice\nparticipant Bob\nloop Everyday\nAlice->>Bob: Hello\nend';

  test('selecting loop line in code editor highlights the entire loop box in preview', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill(sourceCode);
    await editor.dispatchEvent('input');
    await page.waitForTimeout(1000);

    const loopIndex = sourceCode.indexOf('loop Everyday');
    await editor.evaluate((el, idx) => {
      el.focus();
      el.setSelectionRange(idx + 2, idx + 2);
      el.dispatchEvent(new Event('mouseup'));
    }, loopIndex);

    await page.waitForTimeout(400);

    const selectionBox = page.locator('#diagram-selection-box');
    await expect(selectionBox).toBeVisible();

    const boxWidth = await selectionBox.evaluate(el => parseFloat(el.getAttribute('width')));
    const boxHeight = await selectionBox.evaluate(el => parseFloat(el.getAttribute('height')));

    expect(boxWidth).toBeGreaterThan(150);
    expect(boxHeight).toBeGreaterThan(60);
  });

  test('selecting end line resolves to and highlights the enclosing loop block', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill(sourceCode);
    await editor.dispatchEvent('input');
    await page.waitForTimeout(1000);

    const endIndex = sourceCode.lastIndexOf('\nend') + 1;
    await editor.evaluate((el, idx) => {
      el.focus();
      el.setSelectionRange(idx + 1, idx + 1);
      el.dispatchEvent(new Event('mouseup'));
    }, endIndex);

    await page.waitForTimeout(400);

    const selectionBox = page.locator('#diagram-selection-box');
    await expect(selectionBox).toBeVisible();

    const boxWidth = await selectionBox.evaluate(el => parseFloat(el.getAttribute('width')));
    expect(boxWidth).toBeGreaterThan(150);
  });

  test('selecting loop line highlights inner messages with accent color', async ({ page }) => {
    const src = 'sequenceDiagram\nparticipant Alice\nparticipant Bob\nloop Everyday\nAlice->>Bob: Inside 1\nBob->>Alice: Inside 2\nend';
    const editor = page.locator('#source');
    await editor.fill(src);
    await editor.dispatchEvent('input');
    await page.waitForTimeout(1000);

    const loopIndex = src.indexOf('loop Everyday');
    await editor.evaluate((el, idx) => {
      el.focus();
      el.setSelectionRange(idx + 2, idx + 2);
      el.dispatchEvent(new Event('mouseup'));
    }, loopIndex);

    await page.waitForTimeout(400);

    const innerCount = await page.evaluate(() =>
      document.querySelectorAll('.inner-loop-message').length
    );
    expect(innerCount).toBe(2);
  });
});

