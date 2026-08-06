const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

describe('Mermaid Interactive Diagram Sync', () => {
  let browser;
  let page;
  let serverProcess;

  // 1. SETUP: Start local server and launch browser before all tests run
  beforeAll(async () => {
    // Start a local server on port 8080 serving the parent directory
    // We use the Python HTTP server since it's universally available and simple
    serverProcess = spawn('python', ['-m', 'http.server', '8080']);
    
    // Give the server a second to boot up
    await new Promise(r => setTimeout(r, 1000));
    
    // Launch headless Chrome
    browser = await puppeteer.launch();
  });

  // 2. RESET: Prepare a clean page before every individual test
  beforeEach(async () => {
    page = await browser.newPage();
    
    // Override localStorage to force raw textarea mode (bypassing CodeMirror for easier testing)
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('mermaid-hl-mode', 'off');
    });
    
    // Navigate to the app
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });
  });

  // 3. TEARDOWN: Clean up after all tests are done
  afterAll(async () => {
    if (browser) await browser.close();
    if (serverProcess) serverProcess.kill();
  });

  // --- TEST CASES ---

  it('should draw a bounding box around the actor and lifeline when a participant is selected', async () => {
    // A. Inject Mermaid source code
    await page.evaluate(() => {
      const editor = document.getElementById('source');
      editor.value = 'sequenceDiagram\\nparticipant Alice\\nAlice->>John: Hello John\\n';
      editor.dispatchEvent(new Event('input')); // Trigger rendering
    });
    
    // Wait for Mermaid SVG to fully render
    await new Promise(r => setTimeout(r, 2000));
    
    // B. Simulate User Interaction (selecting the "participant Alice" row)
    await page.evaluate(() => {
      const editor = document.getElementById('source');
      const text = editor.value;
      const pos = text.indexOf('participant Alice');
      
      editor.focus();
      editor.setSelectionRange(pos + 5, pos + 5);
      editor.dispatchEvent(new Event('mouseup')); // Trigger reverse-sync logic
    });
    
    // Wait for the custom bounding box logic to execute
    await new Promise(r => setTimeout(r, 500));
    
    // C. Verify the DOM State
    const boxDetails = await page.evaluate(() => {
      const box = document.getElementById('diagram-selection-box');
      if (!box) return null;
      return {
        height: parseFloat(box.getAttribute('height')),
        width: parseFloat(box.getAttribute('width'))
      };
    });

    // D. Assertions
    expect(boxDetails).not.toBeNull();
    
    // The lifeline bounding box should be significantly tall to cover top and bottom actors
    // A standard actor block is ~65px tall. If it covers the lifeline, it should be much larger.
    expect(boxDetails.height).toBeGreaterThan(100); 
  });
});
