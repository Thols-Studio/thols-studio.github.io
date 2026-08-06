const { test, expect } = require('@playwright/test');

test.describe('Mermaid Interactive Diagram Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('draws a bounding box around the actor and lifeline when a participant is selected', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('sequenceDiagram\nparticipant Alice\nAlice->>John: Hello John\n');
    await editor.dispatchEvent('input');

    await page.waitForSelector('.preview svg');
    await page.waitForTimeout(1000);

    // Call window.highlightDiagramNode directly
    await page.evaluate(() => {
      const actorNode = document.querySelector('.preview .actor, .preview [class*="actor"]');
      if (actorNode && typeof window.highlightDiagramNode === 'function') {
        window.highlightDiagramNode(actorNode);
      }
    });

    await page.waitForTimeout(500);

    const box = page.locator('#diagram-selection-box');
    await expect(box).toBeAttached();

    const boxHeight = await box.evaluate(el => parseFloat(el.getAttribute('height')));
    expect(boxHeight).toBeGreaterThan(40);
  });
});
