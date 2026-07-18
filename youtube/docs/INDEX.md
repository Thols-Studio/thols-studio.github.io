# TubeVault / TholsStudio — Docs Index

This folder holds the complete documentation for the TubeVault (TholsStudio)
project: a dependency-free, client-side YouTube video vault distributed as
static pages on GitHub Pages.

## Reading order (recommended)

1. **`PRD.md`** — Product Requirements: goals, users, functional/non-functional
   requirements, architecture, known issues, roadmap.
2. **`TDD.md`** — Technical Design: build pipeline, runtime architecture, data
   model, drift-free category system, security, testing.
3. **`Tasks.md`** — Ordered recreate-from-scratch task list (Phases 0–9) +
   verification checklist.
4. **`workflow.md`** — Canonical CLI workflow (`build.js`, `delete-category.js`).
5. **`MAINTAIN.md`** — Browser-only generator (`maintain.html`) usage.
6. **Phase docs** — implementation detail per component:
   - `phase0-scaffold.md` — `page-template.html` tokens + script load order, `style.css`
   - `phase1-appjs.md` — `app.js` core engine
   - `phase2-buildjs.md` — `build.js` pipeline + gotchas
   - `phase3-delete-maintain.md` — `delete-category.js` + `maintain.html`
   - `phase5-seed-tests.md` — `categories.json`/seeds + `tests.js` harness
   - `phase7-bugs-docs-verify.md` — bug fixes + verification steps

## For model ingestion

- **`bundle.md`** — all the above concatenated into one file, for feeding into
  another model in a single prompt.

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
