const { test, expect } = require('@playwright/test');

test.describe('Clear Button, Docs Icon & Actor Green Selection Rect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('Clear button in code editor header clears editor source text', async ({ page }) => {
    const editor = page.locator('#source');
    const clearBtn = page.locator('#clearBtn');

    await editor.fill('flowchart TD\n A --> B');
    await expect(editor).toHaveValue('flowchart TD\n A --> B');

    await clearBtn.click();
    await expect(editor).toHaveValue('');
  });

  test('Canvas top-right documentation button uses the open-book icon', async ({ page }) => {
    const docsBtn = page.locator('#canvasDocsBtn');
    await expect(docsBtn).toBeVisible();
    const svgPath = docsBtn.locator('path').first();
    const pathD = await svgPath.getAttribute('d');
    expect(pathD).toContain('M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z');
  });

  test('Sequence diagram actor selection rect spans from top actor to bottom actor', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('sequenceDiagram\n participant Alice\n participant Bob\n Alice->>Bob: Hello');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(800);

    const actorText = page.locator('.preview text.actor').first();
    await expect(actorText).toBeVisible();

    // Click the Alice actor node in preview canvas
    await actorText.click({ force: true });
    await page.waitForTimeout(300);

    const selectionBox = page.locator('#diagram-selection-box');
    await expect(selectionBox).toBeVisible();

    const boxHeight = await selectionBox.evaluate(el => parseFloat(el.getAttribute('height')));
    expect(boxHeight).toBeGreaterThan(60); // Height should span across top and bottom actor boxes
  });
});
