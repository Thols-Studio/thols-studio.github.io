const { test, expect } = require('@playwright/test');

test.describe('Loop Block & Inner Messages Identification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
  });

  test('identifies and retrieves all messages inside a loop block', async ({ page }) => {
    const editor = page.locator('#source');
    const sourceCode = 'sequenceDiagram\nparticipant Alice\nparticipant Bob\nAlice->>Bob: Outside Message\nloop Everyday\nAlice->>Bob: Inside Loop Message 1\nBob->>Alice: Inside Loop Message 2\nend';
    await editor.fill(sourceCode);
    await editor.dispatchEvent('input');
    await page.waitForTimeout(1000);

    const innerMessages = await page.evaluate(() => {
      const loopText = document.querySelector('.loopText, .labelText');
      if (!loopText) return [];
      const msgs = window.getMessagesInLoop(loopText);
      return msgs.map(m => m.textContent.trim());
    });

    expect(innerMessages).toContain('Inside Loop Message 1');
    expect(innerMessages).toContain('Inside Loop Message 2');
    expect(innerMessages).not.toContain('Outside Message');
  });
});
