# 🧪 Mermaid Explorer — Testing & Verification Guide

Comprehensive instructions for running automated unit and E2E test suites, serving the application under different environments, and manually verifying native ESM dynamic import code-splitting.

---

## 🤖 1. Automated Testing

The repository includes pre-configured test suites for both **unit testing** (via Vitest) and **end-to-end (E2E) testing** (via Playwright).

### 🚀 Quick Start Commands

| Command | Suite | Tool | Description |
| :--- | :--- | :--- | :--- |
| `npm test` | **All Tests** | Vitest + Playwright | Executes the unit test suite followed by the E2E test suite. |
| `npm run test:unit` | **Unit Tests** | Vitest | Runs fast unit tests for catalogue data, diagram definitions, and snippets. |
| `npm run test:e2e` | **E2E Tests** | Playwright | Builds production assets and runs headless browser tests. |
| `npx playwright test --ui` | **Interactive UI** | Playwright UI | Opens the visual test runner dashboard for step-by-step time-travel debugging. |

### 📁 Test File Locations
- **Unit Tests**: [`tests/unit/data.test.js`](../tests/unit/data.test.js)
- **E2E Tests**: [`tests/e2e/rendering.spec.js`](../tests/e2e/rendering.spec.js)

---

## 🌐 2. Manual Testing & Server Options

You can serve and manually test the application using four different server modes:

### Option A: Vite Development Server (Hot-Reloading)
```bash
npm run dev
```
- **URL**: `http://localhost:5173`
- **Use Case**: Active UI development and live hot-reloading when modifying files in `src/`.

---

### Option B: Custom Server — Unbundled Root Mode (`serve.mjs`)
```bash
node serve.mjs
```
- **URL**: `http://localhost:4444`
- **Use Case**: Serves raw, unbundled source files directly using Node's HTTP module with proper ES module MIME types (`.mjs` → `text/javascript`).

---

### Option C: Custom Server — Production Build Mode (`serve.mjs`)
```bash
npm run build
npm run serve
# or: node serve.mjs 4444 dist
```
- **URL**: `http://localhost:4444`
- **Use Case**: Serves compiled production assets from `dist/` to verify bundled performance and chunk splitting.

---

### Option D: Vite Production Preview
```bash
npm run build
npm run preview
```
- **URL**: `http://localhost:4173`
- **Use Case**: Previews the production bundle using Vite's built-in preview server.

---

## 🔍 3. Verifying Lazy-Loading Code-Splitting in DevTools

Mermaid ESM uses native ES module `import()` to fetch diagram renderer logic on demand. You can verify this in Chrome, Edge, or Firefox DevTools.

> [!TIP]
> Removing `manualChunks` in [`vite.config.js`](../vite.config.js) allows Rollup to preserve Mermaid's native chunk architecture. Initial page payload remains light (~75 KB app + core), while diagram renderers load dynamically.

### Step-by-Step Verification Procedure

1. **Build and start the production server**:
   ```bash
   npm run build
   npm run serve
   ```
2. **Open browser**: Navigate to `http://localhost:4444/`.
3. **Open DevTools**: Press `F12` (or `Ctrl + Shift + I` / `Cmd + Option + I`).
4. **Configure Network Panel**:
   - Go to the **Network** tab.
   - Filter requests by **JS**.
   - Click the **Clear Log** button (🚫).
5. **Switch Diagrams**:
   - Select different diagram types (e.g., **Sequence**, **Gantt**, **ER**, or **Class** diagram) from the application header dropdown or snippet palette.
6. **Observe Network Requests**:
   - Notice individual diagram sub-chunks (e.g., `sequenceDiagram-*.js`, `ganttDiagram-*.js`, `erDiagram-*.js`) downloading on demand **only when selected**.
