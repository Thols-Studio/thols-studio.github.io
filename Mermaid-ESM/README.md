# 🚀 Mermaid Explorer

A fast, interactive diagramming workbench built with Vite, vanilla JavaScript, and local **Mermaid v11.16.0 ESM** native dynamic code-splitting.

---

## 📚 Documentation & User Manuals

All project user manuals and testing guides are located in the [`UserManual/`](UserManual/) directory:

- 📖 **[User Manual & Setup Guide](UserManual/README.md)**: Prerequisites, installation, dependency overview, and directory structure.
- 🧪 **[Testing & Verification Guide](UserManual/Test.md)**: Automated test commands (Vitest + Playwright), manual server modes (`serve.mjs`), and DevTools lazy-chunk verification.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browser binaries for E2E testing
npx playwright install chromium

# 3. Start development server (hot-reloading)
npm run dev

# 4. Run automated tests (Unit + E2E)
npm test

# 5. Build and serve production bundle locally
npm run build
npm run serve
```
