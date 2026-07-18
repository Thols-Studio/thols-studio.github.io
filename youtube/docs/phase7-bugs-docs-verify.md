# TubeVault / TholsStudio — Implementation Notes (Phases 7–9)

Covers the bug-fix session of 2026-07 plus the documentation and verification work that
followed. Repo files referenced: `app.js`, `build.js`, `delete-category.js`, `maintain.html`,
`page-template.html`, `page-template.js`, `style.css`, `categories.json`, `tests.html`, `tests.js`,
`PRD.md`, `TDD.md`, `MAINTAIN.md`, `workflow.md`, `Tasks.md`, and the generated
`unity3d/`, `gamedesign/`, `blender/`, `csharp/`, `test/` folders.

---

## Phase 7 — Bug fixes applied this session

### 1. Missing seeds broke pages
- **Root cause:** `build.js` originally generated only `page-template.js`; the per-category
  `<id>/` seed files were absent. `app.js` then threw at top-level state init when it called
  `DEFAULT_COLLECTIONS.map` against an undefined `COLLECTION_COLORS`. That exception aborted
  script execution before any event handlers were wired, so **all buttons were dead** — New
  Collection, New Playlist, etc.
- **Why tests.html survived:** the `test/` folder already had its own seed files, so the test
  page initialized normally while every real category page did not.
- **Fix:** `build.js` now generates starter seed files (skip-if-exists) into each `<id>/`
  directory. Existing curated seeds are never overwritten.

### 2. Stale category list
- **Root cause:** `BUILTIN_APPS` was hard-coded in both `app.js` and `delete-category.js`, and
  the docs still listed the old `music / electronics / astrology` set instead of the real
  `unity3d / gamedesign / blender / csharp`. The bottom menu linked to pages that did not exist.
- **Fix:** every surface now reads `categories.json`. `build.js` injects a generated
  `window.__BUILTIN_APPS__` (built from `categories.json`) into each page **before** `app.js`,
  which also eliminates the `file://` fallback drift. The literal `BUILTIN_APPS` constant is now
  last-resort only.
- **Runtime resolution order:**
  - `app.js` `getFallbackBuiltins()` prefers `window.__BUILTIN_APPS__`, then the literal
    `BUILTIN_APPS`.
  - `getAppsRegistryAsync` prefers the fetched `categories.json`, then the fallback.

### 3. Build dead-end
- **Root cause:** a generated page with no seeds produced a broken page, and no automated step
  existed to fill those seeds.
- **Fix:** `build.js` now owns the *full* folder contents for each category — the HTML,
  `page-template.js`, and the starter seeds. Re-running the build preserves curated data
  (seeds are only written when missing).

---

## Phase 8 — Documentation set

| Doc | Purpose |
| --- | --- |
| `workflow.md` | File map, CLI workflow, add/remove category, seed data, caveats. |
| `MAINTAIN.md` | Browser-only generator usage, delete guards, file layout. |
| `PRD.md` | Product requirements + known issues (with fixes logged). |
| `TDD.md` | Technical design: build pipeline, runtime, data model, category system, security, testing. |
| `Tasks.md` | Ordered recreate-from-scratch task list (Phases 0–9). |

All docs were updated to reflect the **real categories** (`unity3d / gamedesign / blender /
csharp`) and the **new build behaviour** (build.js owns full folder contents, seeds are
generated and preserved).

---

## Phase 9 — Verification (after any rebuild)

Steps performed (and required after each rebuild):

1. **Syntax check** — `node -c app.js && node -c build.js && node -c delete-category.js`.
2. **Build runs clean** — `node build.js` completes with no errors and **no leftover `{{...}}`
   tokens** in any output file.
3. **Injected registry** — every `<id>.html` contains the injected `window.__BUILTIN_APPS__`
   (all categories) placed **before** `app.js`.
4. **Test suite** — open `tests.html` over HTTP; the feature suite is green.
5. **Regression check** — open a category page and confirm **New Collection / New Playlist**
   buttons work (the original dead-button bug).
6. **Preservation check** — re-run `node build.js`; existing seed files must be reported as
   `kept existing … (preserve)` with no data loss.

> **PowerShell caveat:** the shell here is Windows PowerShell, where `cmd1 && cmd2` does **not**
> short-circuit on failure the way it does in bash. Use `;` to separate commands, or explicitly
> check `$LASTEXITCODE` after each step (e.g. `node -c app.js; if ($LASTEXITCODE -eq 0) { ... }`).
