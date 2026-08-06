const { test, expect } = require('@playwright/test');

test.describe('Auto-Align & Participant Alias Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('Auto-Align button exists in editor header next to Auto-Update', async ({ page }) => {
    const autoAlignBtn = page.locator('#autoAlignBtn');
    await expect(autoAlignBtn).toBeAttached();

    const labelText = page.locator('.ide-header-right');
    await expect(labelText).toContainText('Auto-Align');
  });

  test('Clicking Auto-Align formats code indentation with 4-space diagram body alignment', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('sequenceDiagram\nparticipant Alice\nparticipant Bob\nloop Everyday\nAlice->>Bob: Hello\nend');
    await editor.dispatchEvent('input');

    await page.evaluate(() => {
      const btn = document.getElementById('autoAlignBtn');
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);

    const formattedCode = await editor.inputValue();
    expect(formattedCode).toBe('sequenceDiagram\n    participant Alice\n    participant Bob\n    loop Everyday\n        Alice->>Bob: Hello\n    end');
  });

  test('Updating participant declaration to alias updates participant references across diagram when aligned', async ({ page }) => {
    const editor = page.locator('#source');
    await editor.fill('sequenceDiagram\nparticipant Alice\nparticipant Bob\nAlice->>Bob: Hello\nBob->>Alice: Response');
    await editor.dispatchEvent('input');

    await page.evaluate(() => {
      const btn = document.getElementById('autoAlignBtn');
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);

    // Update line 2 from participant Alice to participant A as Alice
    await editor.fill('sequenceDiagram\nparticipant A as Alice\nparticipant Bob\nAlice->>Bob: Hello\nBob->>Alice: Response');
    await editor.dispatchEvent('input');
    await page.waitForTimeout(400);
    
    await page.evaluate(() => {
      const btn = document.getElementById('autoAlignBtn');
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);

    const val = await editor.inputValue();
    expect(val).toContain('A->>Bob: Hello');
    expect(val).toContain('Bob->>A: Response');
  });
});
