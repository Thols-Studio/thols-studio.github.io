const { test, expect } = require('@playwright/test');

test.describe('Mermaid Interactive Diagram Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Override localStorage to force raw textarea mode (bypassing CodeMirror for easier testing)
    await page.addInitScript(() => {
      localStorage.setItem('mermaid-hl-mode', 'off');
    });
    
    // Navigate to the app
    await page.goto('http://localhost:5505/index.html');
  });

  test('draws a bounding box around the actor and lifeline when a participant is selected', async ({ page }) => {
    const editor = page.locator('#source');
    
    // A. Inject Mermaid source code
    await editor.fill('sequenceDiagram\\nparticipant Alice\\nAlice->>John: Hello John\\n');
    await editor.dispatchEvent('input');
    
    // Wait for Mermaid SVG to fully render
    await page.waitForSelector('.preview svg');
    
    // B. Simulate User Interaction (selecting the "participant Alice" row)
    await page.evaluate(() => {
      const el = document.getElementById('source');
      const text = el.value;
      const pos = text.indexOf('participant Alice');
      
      el.focus();
      el.setSelectionRange(pos + 5, pos + 5);
      el.dispatchEvent(new Event('mouseup')); // Trigger reverse-sync logic
    });
    
    // Wait for the custom bounding box logic to execute
    await page.waitForTimeout(500);
    
    // C. Verify the DOM State
    const box = page.locator('#diagram-selection-box');
    await expect(box).toBeAttached();

    const boxHeight = await box.getAttribute('height');
    
    // D. Assertions
    // The lifeline bounding box should be significantly tall to cover top and bottom actors
    // A standard actor block is ~65px tall. If it covers the lifeline, it should be much larger.
    expect(parseFloat(boxHeight)).toBeGreaterThan(100); 
  });
});
