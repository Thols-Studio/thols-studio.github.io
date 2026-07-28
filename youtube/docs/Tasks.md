# Tasks — TubeVault / TholsStudio (Recreate-from-Scratch Guide)

_Compiled 2026-07-18 from the actual work session. Each task is a concrete,
ordered step. Follow top-to-bottom to rebuild the project in a clean repo._

_Companion docs: `PRD.md` (product), `TDD.md` (design), `workflow.md` /
`MAINTAIN.md` (maintenance), `phase*.md` (implementation detail)._

_Conventions (see `Ref-tasks.md` for the pattern this mirrors):_
- `[x]` = already implemented in this repo; `[ ]` = pending / to verify.
- Each task cites the **artifact** it produces or touches (file · function) and,
  where relevant, the **session fix** it must preserve (`Fix 7.1`–`7.3`).
- Tests/verification are called out as named tasks immediately after the code
  they validate, so regressions are caught early.
- **Checkpoints** (C1, C2) provide incremental validation at layer boundaries.

---

## Phase 0 — Project scaffold

- [x] **T0.1** Create repo root `youtube/` (static site on GitHub Pages). _Artifact: repo layout._
- [x] **T0.2** Add `style.css` — shared stylesheet (sidebar, cards, modals,
      playlist split-view, toasts, category switcher). Drives CSS vars
      `--indigo`, `--indigo-bright`, `--text-dim`, `--surface-raised`, `--mono`. _Artifact: `style.css`._
- [x] **T0.3** Add `page-template.html` — the **single source of truth** for page
      markup, with tokens `{{APP_NAME}}`, `{{APP_LABEL}}`, `{{APP_COLOR}}`,
      `{{JS_DIR}}`, `{{SCRIPT_TAGS}}`, `{{BUILTIN_APPS_JS}}`. _Artifact: `page-template.html`._
      Script load order (critical — every global must exist before `app.js`):
      `iframe_api` → inline `APP_*` → `{{JS_DIR}}page-template.js` →
      `{{SCRIPT_TAGS}}` → `{{BUILTIN_APPS_JS}}` → `app.js`.

---

## Phase 1 — Core engine (`app.js`)

- [x] **T1.1** State + persistence: `state` object, `STORAGE_KEY` namespaced by
      `APP_NAME`, `save()`, migration of older fields (`watchedIds`, `playlists`,
      `expandedGroups`). _Artifact: `app.js` · `state`, `save()`._
- [x] **T1.2** YouTube helpers: `extractVideoId()` (watch / youtu.be / shorts /
      `?list=`), `extractPlaylistId()`, `getThumbnail()`, `getWatchUrl()`,
      `isYouTubeUrl()`, `generateId()`, `formatDate()`. _Artifact: `app.js`._
- [x] **T1.3** Sidebar: `renderSidebar()` (Library / Collections / Playlists),
      counts, inline rename, delete, drag-reorder via `makeSortable()`. _Artifact: `app.js`._
- [x] **T1.4** Cards: `renderCards()`, `getFilteredVideos()`, `renderGroupedByTitle()`,
      `renderCard()`, grouping collection→group, search, grid/list view,
      `attachCardDrag()` + `saveCardOrder()`. _Artifact: `app.js`._
- [x] **T1.5** Collections/groups: `saveCollection()`, `slugifyCollectionName()`,
      `saveGroup()`, rename/delete group, `moveGroup*`, `getGroupsForCollection()`,
      `renderQuickAddLocation()`. _Artifact: `app.js`._
- [x] **T1.6** Playlists: `savePlaylist()`, `addVideoToPlaylist()`,
      `removeVideoFromPlaylist()`, `isVideoInPlaylist()` (match by YouTube videoId),
      group/collection → playlist batch add. _Artifact: `app.js`._
- [x] **T1.7** Playlist split-view player: `openPlaylistView()`, `pvRenderList()`,
      `pvPlayIndex()`, `pvSetMode()` (sequential/random), `pvToggleAutoplay()`,
      `pvSaveOrderToPlaylist()`, YouTube IFrame API integration,
      `onYtPlayerStateChange` auto-advance. _Artifact: `app.js`._
- [x] **T1.8** Export: `exportData()`, `buildCollectionsJsExport()`, `buildWatchedJsExport()`,
      `buildPlaylistJsExport()`, `exportAllJs()`, `saveToFolderOrDownload()`
      (File System Access API + IndexedDB `TubeVaultExportFolders`). _Artifact: `app.js`._
- [x] **T1.9** Seed + init: `seedData()` (flatten `DEFAULT_COLLECTIONS` → `state.videos`),
      `remapPlaylistIds()`, `restoreExportFolder()`, `applyAppBranding()`, init block. _Artifact: `app.js`._
- [x] **T1.10** Shared drag helper `makeSortable()` (reused by sidebar collections,
      sidebar playlists, cards, playlist tracks). _Artifact: `app.js`._
- [x] **T1.11** Category system: `APPS_REGISTRY_KEY`, `BUILTIN_APPS` (last-resort
      fallback), `loadBuiltinsFromJson()` (fetch `categories.json` over HTTP),
      `getAppsRegistry()`, `getAppsRegistryAsync()`, `getFallbackBuiltins()`
      (prefers `window.__BUILTIN_APPS__`), `renderCategorySwitcher()`,
      `createCategory()` + `buildCategoryHtml()` + `buildCategory*Seed()`,
      `PAGE_TEMPLATE` usage. _Artifact: `app.js` · preserves **Fix 7.2**._

> **V1 — Engine sanity (named verification).** Load a built category page in a
> browser over HTTP: confirm New Collection / New Playlist / Add Video buttons
> work, sidebar renders `state.collections`, cards == videos, drag-reorder
> persists. _Validates: T1.1–T1.11, Fix 7.1._

---

## Phase 2 — Build script (`build.js`)

- [x] **T2.1** `loadCategories()` — parse `categories.json` (`data.collections`),
      validate ids (`/^[a-z0-9-]+$/i`), exit non-zero on bad/missing file.
- [x] **T2.2** `configScriptTags(id, dir)` — emit the three seed `<script>` tags.
- [x] **T2.3** `render(template, app)` — substitute all tokens incl. `{{BUILTIN_APPS_JS}}`.
- [x] **T2.4** `buildCollectionsSeed()` / `buildPlaylistSeed()` / `buildWatchedSeed()`
      — starter seeds (empty collection + `COLLECTION_COLORS`, `[]`, `[]`).
- [x] **T2.5** `buildBuiltinAppsJs(apps)` — `<script>window.__BUILTIN_APPS__ = [...]</script>`
      from the full category list.
- [x] **T2.6** `writeCategorySeeds(app)` — **skip-if-exists** (preserve curated data
      on re-run). _Preserves **Fix 7.1 / 7.3**._
- [x] **T2.7** `main()` — build **module-level `let BUILTIN_APPS_JS`** once, loop
      categories: write `<id>.html`, `<id>/page-template.js`, seeds; then build
      `tests.html` + `test/` (preserve `test/` fixtures).

> ⚠️ **Gotcha (Fix 7.1-adjacent):** `BUILTIN_APPS_JS` must be a **module-level
> `let`** assigned in `main()`, not a `const` inside `main()` — block scoping
> made it invisible to `render()` (ReferenceError at build time).

> **V2 — Build determinism (named verification).** `node build.js` twice; second
> run reports `kept existing … (preserve)` for seeds; no `{{…}}` tokens remain in
> output; `window.__BUILTIN_APPS__` present before `app.js` in every page.
> _Validates: T2.1–T2.7, Fix 7.2._

---

## Phase 3 — Delete script (`delete-category.js`)

- [x] **T3.1** `loadManifestIds()` — read `categories.json`, return lowercased ids;
      `PROTECTED = new Set([...ids, 'test'])`. _Preserves **Fix 7.2**._
- [x] **T3.2** Validate id format; refuse protected + unknown; interactive confirm
      (type id) unless `--force`.
- [x] **T3.3** Remove `<id>.html` + `<id>/` folder; print guidance to also clear the
      browser `localStorage` registry if created in-app.

---

## Phase 4 — Maintain tool (`maintain.html`)

- [x] **T4.1** Browser-only generator: fetch `page-template.html` + `categories.json`
      (HTTP); edit template; add/remove category rows.
- [x] **T4.2** `FALLBACK_APPS` (hardcoded `file://` fallback) kept in sync with
      `categories.json`.
- [x] **T4.3** "Generate & download" produces `<id>.html` + `page-template.js`
      (download only — cannot delete; use `delete-category.js` for removal).

---

## Phase 5 — Seed data (first build)

- [x] **T5.1** `categories.json` — list shipped categories:
      ```json
      { "collections": [
        { "id": "unity3d",    "name": "Unity3D",    "color": "#EC407A" },
        { "id": "gamedesign", "name": "GameDesign", "color": "#29B6F6" },
        { "id": "blender",    "name": "Blender",    "color": "#AB47BC" },
        { "id": "csharp",     "name": "CSharp",     "color": "#AB46BC" }
      ] }
      ```
- [x] **T5.2** `node build.js` → generates every `<id>.html`, `<id>/page-template.js`,
      and **starter** seed files (skip-if-exists) for each category + `test/`.

---

## Phase 6 — Feature tests

- [x] **T6.1** `tests.js` — in-browser harness asserting pure helpers, seed/state
      integrity, sidebar/card rendering, export-pipeline (confirm modals), and
      `PAGE_TEMPLATE` correctness; renders a report + `window.__TEST_RESULTS__`.
- [x] **T6.2** `test/` seed fixtures (`test-collections.js` with demo videos + `pl1`
      playlist, `test-playlist.js`, `test-watched.js`) — **hand-maintained,
      preserved** by `build.js`.

> **V6 — Test suite (named verification).** Serve over HTTP, open `tests.html`;
> all assertions pass (extractVideoId variants, slugify uniqueness, seed
> populated, cards == videos, each export opens confirm, PAGE_TEMPLATE has no
> leftover tokens). _Validates: T6.1–T6.2._

---

## Phase 7 — Bug fixes applied this session (recreate-aware — must be preserved)

- [x] **T7.1 — Fix 7.1 (Missing seeds broke pages).** Root cause: `build.js`
      originally generated only `page-template.js`; `<id>/` seed files absent →
      `app.js` threw on undefined `COLLECTION_COLORS` → all buttons dead.
      **Fix:** `build.js` generates starter seeds (skip-if-exists). _Preserved by
      T2.4 / T2.6 / T5.2._
- [x] **T7.2 — Fix 7.2 (Stale category list).** `BUILTIN_APPS` (app.js +
      delete-category.js) and docs referenced old `music/electronics/astrology`,
      not real `unity3d/gamedesign/blender/csharp`. Bottom menu linked to
      non-existent pages. **Fix:** every surface reads `categories.json`;
      `build.js` injects generated `window.__BUILTIN_APPS__` (eliminates even the
      `file://` fallback drift); literal `BUILTIN_APPS` is last-resort only.
      _Preserved by T1.11 / T2.5 / T3.1 / T4.2._
- [x] **T7.3 — Fix 7.3 (Build dead-end).** Generated page + no seeds = broken.
      **Fix:** `build.js` owns full folder contents; re-run preserves curated data.
      _Preserved by T2.6._

---

## Phase 8 — Documentation

- [x] **T8.1** `workflow.md` — file map, canonical CLI workflow, add/remove
      category, seed data (generated + preserved), caveats.
- [x] **T8.2** `MAINTAIN.md` — browser-only generator usage, delete guards, file
      layout (updated to real categories).
- [x] **T8.3** `PRD.md` — product requirements + known issues (session fixes logged).
- [x] **T8.4** `TDD.md` — technical design (build pipeline, runtime, data model,
      category system, security, testing).
- [x] **T8.5** `Tasks.md` — this file.
- [x] **T8.6** `phase0-scaffold.md` … `phase7-bugs-docs-verify.md` — per-phase
      implementation docs. `INDEX.md` + `bundle.md` for model ingestion.
      `Prompt.md` with recommended test prompts. `Ref-tasks.md` (reference example).

---

## Phase 9 — Verification (after any rebuild)

- [ ] **T9.1** `node -c app.js && node -c build.js && node -c delete-category.js`
      (syntax). _PowerShell: run separately, check `$LASTEXITCODE` (`&&` unsupported)._
- [ ] **T9.2** `node build.js` runs clean; no leftover `{{...}}` tokens in output.
- [ ] **T9.3** Each `<id>.html` contains injected `window.__BUILTIN_APPS__` (all
      categories) before `app.js`.
- [ ] **T9.4** Open `tests.html` (served over HTTP) — feature suite green.
- [ ] **T9.5** Open a category page → New Collection / New Playlist buttons work
      (regression check for the original bug, **Fix 7.1**).
- [ ] **T9.6** Re-run `node build.js` → existing seed files reported as
      `kept existing … (preserve)` (no data loss, **Fix 7.3**).

---

## Checkpoints

- **C1 — Engine + build complete.** After Phases 0–5: `node build.js` succeeds,
  pages boot with working buttons, seeds generated (skip-if-exists). Run **V1**,
  **V2**, **V6**. _Validates Fix 7.1 / 7.3._
- **C2 — Full system + docs.** After Phases 6–9: tests green, category list
  drift-free across all surfaces, all docs present. Run **T9.1–T9.6**.
  _Validates Fix 7.2._

---

## Quick recreate checklist (minimal)

1. `style.css` + `page-template.html` (with all 6 tokens). _T0._
2. `app.js` (T1.1–T1.11). _V1._
3. `build.js` (T2.1–T2.7) + `delete-category.js` (T3.1–T3.3) + `maintain.html`. _V2._
4. `categories.json` (T5.1) → `node build.js` (T5.2).
5. `tests.js` + `test/` fixtures (T6). _V6._
6. Docs (T8). Verify (T9 / C1 / C2).

---

## Task Dependency Waves (for parallel execution)

```json
{
  "waves": [
    { "id": 0, "tasks": ["T0.1", "T0.2", "T0.3"] },
    { "id": 1, "tasks": ["T1.1", "T1.2", "T2.1", "T2.2", "T3.1", "T5.1"] },
    { "id": 2, "tasks": ["T1.3", "T1.4", "T1.5", "T1.6", "T1.7", "T1.8", "T1.9", "T1.10", "T1.11",
                         "T2.3", "T2.4", "T2.5", "T2.6", "T2.7", "T3.2", "T3.3", "T4.1", "T4.2", "T4.3"] },
    { "id": 3, "tasks": ["T5.2", "T6.1", "T6.2", "T7.1", "T7.2", "T7.3"] },
    { "id": 4, "tasks": ["T8.1", "T8.2", "T8.3", "T8.4", "T8.5", "T8.6",
                         "T9.1", "T9.2", "T9.3", "T9.4", "T9.5", "T9.6", "V1", "V2", "V6", "C1", "C2"] }
  ]
}
```

_Notes: tasks are marked `[x]` (already implemented here) vs `[ ]` (verify).
Verification tasks (V1/V2/V6, T9.x) are placed adjacent to the code they
validate. The dependency waves reflect that docs/verification (wave 4) depend on
all implementation waves._
