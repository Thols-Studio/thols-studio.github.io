const { test, expect } = require('@playwright/test');

test.describe('Editor & Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('modifying source text re-renders the diagram', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('flowchart TD\nA[Start] --> B[End]');
    await editor.dispatchEvent('input');

    await page.waitForSelector('.preview svg');
    const svgText = await page.locator('.preview').textContent();
    expect(svgText).toContain('Start');
    expect(svgText).toContain('End');
  });

  test('auto-update toggle prevents rendering when unchecked', async ({ page }) => {
    const editor = page.locator('#source');

    // Turn off Auto-Update via evaluate
    await page.evaluate(() => {
      const toggle = document.getElementById('autoUpdateToggle');
      if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
      }
    });

    // Type new diagram (using permitted 'flowchart' diagram type)
    await editor.fill('flowchart TD\nC[Wait] --> D[For Click]');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(600);

    // SVG should not contain new text yet
    const svgTextBefore = await page.locator('.preview').textContent();
    expect(svgTextBefore).not.toContain('Wait');

    // Turn Auto-Update back ON via evaluate
    await page.evaluate(() => {
      const toggle = document.getElementById('autoUpdateToggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));
      }
    });

    // Wait for auto-retry assertion on preview
    await expect(page.locator('.preview')).toContainText('Wait', { timeout: 5000 });
  });
});
