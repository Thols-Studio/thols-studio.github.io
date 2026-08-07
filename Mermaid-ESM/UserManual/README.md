# 🚀 Mermaid Explorer

A fast, interactive diagramming workbench built with Vite, vanilla JavaScript, and local **Mermaid v11.16.0 ESM** native dynamic code-splitting.

---

## 📋 1. Prerequisites

Ensure you have the following installed on your machine:

* **Node.js**: `v18.0.0` or higher (check with `node -v`)
* **npm**: `v9.0.0` or higher (check with `npm -v`)

---

## ⚙️ 2. Installation & Initial Setup

### Step 1: Install Dependencies
Run the following command in the project root directory:

```bash
npm install
```

This installs **Vite**, **Vitest**, and **Playwright** devDependencies configured in [`package.json`](../package.json).

### Step 2: Install Playwright Browser Binaries
Install the Chromium browser binary required for Playwright automated end-to-end (E2E) testing:

```bash
npx playwright install chromium
```

---

## 🛠️ 3. Configured Dependencies & Packages

| Package | Type | Purpose |
| :--- | :--- | :--- |
| **`vite`** | `devDependency` | Frontend build tool and development server. |
| **`vitest`** | `devDependency` | Unit testing framework integrated with Vite. |
| **`@playwright/test`** | `devDependency` | Cross-browser End-to-End (E2E) testing framework. |

---

## 📁 4. Files & Directory Structure

### 🔧 Configuration & Server Files
- **[`vite.config.js`](../vite.config.js)**: Configures Vite target (`esnext`) and retains native Rollup ESM code-splitting for on-demand diagram chunk loading.
- **[`vitest.config.js`](../vitest.config.js)**: Configures Vitest to target unit tests in `tests/unit/`.
- **[`playwright.config.js`](../playwright.config.js)**: Configures Playwright E2E browser tests.
- **[`serve.mjs`](../serve.mjs)**: Zero-dependency Node.js HTTP server specifying proper MIME types (`.mjs` / `.js`) for serving ES modules.
- **[`package.json`](../package.json)**: Project manifest containing dependencies and custom scripts (`dev`, `build`, `preview`, `serve`, `test`, `test:unit`, `test:e2e`).
- **[`.gitignore`](../.gitignore)**: Excludes `node_modules/`, `dist/`, and test output directories (`test-results/`, `playwright-report/`).

### 💻 Application Source Files
- **[`index.html`](../index.html)**: Main single-page application markup.
- **[`src/`](../src/)**: ES module application logic (`main.js`, `data.js`, `dom.js`, `panels.js`, `coloring.js`, etc.).
- **[`css/`](../css/)**: Modular CSS stylesheets.
- **[`mermaid-11.16.0/`](../mermaid-11.16.0/)**: Local Mermaid v11.16.0 ESM distribution files.

---

## 🧪 5. Testing & Verification Guide

For full instructions on running automated tests, manual server options, and DevTools network verification:

👉 **See the complete testing guide in [`Test.md`](Test.md)**

### Quick Test Commands

```bash
# Run unit tests + E2E tests
npm test

# Run Vitest unit tests only
npm run test:unit

# Run Playwright E2E tests only
npm run test:e2e

# Build and serve production bundle locally
npm run build
npm run serve
```
