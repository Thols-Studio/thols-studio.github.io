# Playwright Automated Testing Guide

This project is now fully configured to use **Playwright** for robust End-to-End (E2E) testing. Playwright natively handles launching headless browsers, automatically starts your local web server to bypass CORS issues, and provides intelligent auto-waiting to prevent flaky tests.

---

## 1. Project Test Structure

The testing suite is located in the `/tests` folder, which contains individual `.spec.js` files testing isolated features:

```text
/Mermaid
├── playwright.config.js       # The master Playwright configuration file
├── serve.mjs                  # The local HTTP server script
└── /tests                     # Directory containing all E2E test suites
    ├── diagram-sync.spec.js   # Tests bi-directional editor/SVG highlighting
    ├── editor.spec.js         # Tests editor input, auto-rendering, and manual rendering
    ├── theme.spec.js          # Tests global theme and diagram style toggles
    └── zoom-pan.spec.js       # Tests the zoom controls and matrix transforms
```

---

## 2. Running the Tests

To run the entire test suite headlessly across your terminal:
```bash
npx playwright test
```

### Viewing the Test Report
If any tests fail, or if you simply want to see the results in a beautiful UI, run:
```bash
npx playwright show-report
```

### Debugging with UI Mode
If you want to watch the tests run in a real browser step-by-step to debug an issue visually:
```bash
npx playwright test --ui
```

---

## 3. How the Configuration Works

The `playwright.config.js` file handles the heavy lifting:

- **`webServer` Block:** Playwright automatically executes `node serve.mjs 5505` to boot up your local HTTP server before tests begin. It waits for the URL `http://localhost:5505` to respond, and shuts down the server automatically when tests finish.
- **`baseURL`:** The tests assume `http://localhost:5505` is the root, so in your test files you can simply write `await page.goto('/')`.

---

## 4. Writing New Tests

When writing new tests, leverage Playwright's specific locators and auto-waiting assertions (`expect(locator).toBeVisible()`).

Here is a standard template for a new feature test:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('New Feature Name', () => {
  // Reset the page state before every test
  test.beforeEach(async ({ page }) => {
    // Optionally override localStorage defaults
    await page.addInitScript(() => {
      localStorage.setItem('mermaid-hl-mode', 'off');
    });
    
    // Navigate to the app root
    await page.goto('/');
  });

  test('should perform specific action', async ({ page }) => {
    // 1. Arrange: locate elements
    const button = page.locator('#myButton');
    
    // 2. Act: simulate interaction
    await button.click();
    
    // 3. Assert: Verify the DOM updated correctly
    await expect(page.locator('.result')).toHaveText('Success!');
  });
});
```

Because Playwright automatically waits for elements to appear and animations to finish, you rarely need to use manual `setTimeout` or `waitForTimeout` commands!
