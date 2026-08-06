# Automated Testing for Mermaid Diagrams

Automating tests for your Mermaid application ensures that rendering, interactive highlighting, and custom DOM manipulations (like our synchronized editor-to-diagram selection) work flawlessly across updates.

Since Mermaid heavily relies on browser APIs (like `getBBox()`, SVGs, and DOM layout), the best approach is to use a headless browser like **Puppeteer** paired with a testing framework like **Jest**.

---

## 1. Required Files and Directory Structure

To set up a proper automated testing suite, you should organize your project with the following structure:

```text
/your-project
├── index.html                 # Your main Mermaid application
├── package.json               # Defines your test scripts and dependencies
└── /tests
    └── diagram-sync.test.js   # Your automated test file
```

---

## 2. Prerequisites & Installation

You need Node.js installed on your system. 
You will need a testing framework (**Jest**) and a headless browser (**Puppeteer**). Because Mermaid uses ES modules, you also need a local server to bypass CORS restrictions during testing.

Run this command in your terminal to install the necessary packages:
```bash
npm install --save-dev jest puppeteer http-server
```

Next, add a test script to your `package.json`:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

---

## 3. What Needs to be in a Test File?

A standard UI test file for this application requires four main components:
1. **Setup (Before All):** Start a local web server (to host `index.html`) and launch the Puppeteer headless browser.
2. **Reset (Before Each):** Open a fresh browser page, navigate to `http://localhost:8080/index.html`, and enforce a predictable state (like turning off cached settings in localStorage).
3. **The Test Cases (It/Test):** 
   - Inject the Mermaid code into the editor.
   - Simulate user interactions (like clicking or selecting text).
   - Read the DOM to verify the outcome (e.g., checking if the green bounding box appears at the right coordinates).
4. **Teardown (After All):** Close the browser and shut down the local server so it doesn't hang in your terminal.

---

## 4. Sample Test File (`tests/diagram-sync.test.js`)

Below is a complete, industry-standard sample test file using Jest and Puppeteer.

```javascript
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Mermaid Interactive Diagram Sync', () => {
  let browser;
  let page;
  let serverProcess;

  // 1. SETUP: Start local server and launch browser before all tests run
  beforeAll(async () => {
    // Start a local server on port 8080 serving the parent directory
    serverProcess = spawn('npx', ['http-server', '../', '-p', '8080', '--silent']);
    
    // Give the server a second to boot up
    await new Promise(r => setTimeout(r, 1000));
    
    // Launch headless Chrome
    browser = await puppeteer.launch({ headless: 'new' });
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
```

## 5. Running Your Tests

Once everything is set up, you simply run the following command in your terminal:

```bash
npm test
```

Jest will automatically find files in the `/tests` folder, boot up the headless browser, run the interactions, and print out a clean Pass/Fail report!
