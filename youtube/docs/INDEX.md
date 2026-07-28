# TubeVault / TholsStudio — Docs Index

This folder holds the complete documentation for the TubeVault (TholsStudio)
project: a dependency-free, client-side YouTube video vault distributed as
static pages on GitHub Pages.

## Reading order (recommended)

1. **`PRD.md`** — Product Requirements: goals, users, functional/non-functional
   requirements, architecture, known issues, roadmap.
2. **`TDD.md`** — Technical Design: build pipeline, runtime architecture, data
   model, drift-free category system, security, testing.
3. **`Tasks.md`** — Ordered recreate-from-scratch task list (Phases 0–9) with
   `[x]`/`[ ]` markers, named verification tasks (**V1/V2/V6**), checkpoints
   (**C1/C2**), and a dependency-waves graph. The phase docs cross-reference its
   task IDs (e.g. T1.11, T2.5, T7.1–T7.3, V1, T9.x).
4. **`workflow.md`** — Canonical CLI workflow (`build.js`, `delete-category.js`).
5. **`MAINTAIN.md`** — Browser-only generator (`maintain.html`) usage.
6. **Phase docs** — implementation detail per component:
   - `phase0-scaffold.md` — `page-template.html` tokens + script load order, `style.css`
   - `phase1-appjs.md` — `app.js` core engine
   - `phase2-buildjs.md` — `build.js` pipeline + gotchas
   - `phase3-delete-maintain.md` — `delete-category.js` + `maintain.html`
   - `phase5-seed-tests.md` — `categories.json`/seeds + `tests.js` harness
   - `phase7-bugs-docs-verify.md` — bug fixes (Fix 7.1–7.3) + verification (V1/V2/V6, T9.x)

## For model ingestion / testing

- **`Prompt.md`** — recommended prompts to test another model (Goal A reconstruct
  from `bundle.md`; Goal B verify against `sources/` + `bundle.md`).
- **`bundle.md`** — all docs concatenated into one file, for feeding into another
  model in a single prompt.
- **`sources/`** — the canonical real source files (for Goal B verification).

## Convention notes

- Category list lives in `categories.json` (single source of truth); the real
  shipped categories are `unity3d / gamedesign / blender / csharp`.
- `build.js` generates starter seed files **skip-if-exists** (preserves curated
  data on re-run) and injects `window.__BUILTIN_APPS__` into every page.

## Source layout (context)

```
youtube/
  page-template.html   ← single source of truth ({{TOKENS}})
  categories.json      ← category manifest (SINGLE SOURCE OF TRUTH for list)
  build.js             ← generates pages + starter seeds (skip-if-exists)
  delete-category.js   ← removes a category (guarded by categories.json + test)
  maintain.html        ← browser-only generator (HTTP; file:// fallback)
  app.js               ← shared engine (~3.2k lines)
  style.css            ← shared stylesheet
  <id>.html            ← generated category page
  <id>/<id>-{collections,playlist,watched}.js  ← seed files (preserved)
  <id>/page-template.js ← window.PAGE_TEMPLATE (runtime Create-category template)
  tests.html / tests.js ← feature-test harness
  docs/                ← this folder
```
