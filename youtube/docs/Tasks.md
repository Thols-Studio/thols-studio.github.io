# Tasks — TubeVault / TholsStudio (Recreate-from-Scratch Guide)

_Compiled 2026-07-18 from the actual work session. Each task is a concrete,
ordered step. Follow top-to-bottom to rebuild the project in a clean repo._

_Companion docs: `PRD.md` (product), `TDD.md` (design), `workflow.md` /
`MAINTAIN.md` (maintenance)._

---

## Phase 0 — Project scaffold

- [ ] **T0.1** Create repo root `youtube/` (served as static site on GitHub Pages).
- [ ] **T0.2** Add `style.css` — shared stylesheet (sidebar, cards, modals,
      playlist split-view, toasts, category switcher). Drives CSS vars
      `--indigo`, `--indigo-bright`, `--text-dim`, `--surface-raised`, `--mono`, etc.
- [ ] **T0.3** Add `page-template.html` — the **single source of truth** for page
      markup, with tokens:
      `{{APP_NAME}}`, `{{APP_LABEL}}`, `{{APP_COLOR}}`, `{{JS_DIR}}`,
      `{{SCRIPT_TAGS}}`, `{{BUILTIN_APPS_JS}}`.
      Loads scripts in this order:
      `iframe_api` → inline `APP_*` → `{{JS_DIR}}page-template.js` →
      `{{SCRIPT_TAGS}}` → `{{BUILTIN_APPS_JS}}` → `app.js`.

---

## Phase 1 — Core engine (`app.js`)

- [ ] **T1.1** Implement **state + persistence**: `state` object, `STORAGE_KEY`
      namespaced by `APP_NAME`, `save()`, migration of older fields
      (`watchedIds`, `playlists`, `expandedGroups`).
- [ ] **T1.2** Implement **YouTube helpers**: `extractVideoId()` (watch /
      youtu.be / shorts / `?list=`), `extractPlaylistId()`, `getThumbnail()`,
      `getWatchUrl()`, `isYouTubeUrl()`, `generateId()`, `formatDate()`.
- [ ] **T1.3** Implement **sidebar**: `renderSidebar()` (Library / Collections /
      Playlists sections), counts, inline rename, delete, drag-reorder via
      `makeSortable()`.
- [ ] **T1.4** Implement **cards**: `renderCards()`, `getFilteredVideos()`,
      `renderGroupedByTitle()`, `renderCard()`, grouping by collection→group,
      search, grid/list view, `attachCardDrag()` + `saveCardOrder()`.
- [ ] **T1.5** Implement **collections/groups**: `saveCollection()`,
      `slugifyCollectionName()`, `saveGroup()`, rename/delete group,
      `moveGroup*`, `getGroupsForCollection()`, `renderQuickAddLocation()`.
- [ ] **T1.6** Implement **playlists**: `savePlaylist()`,
      `addVideoToPlaylist()`, `removeVideoFromPlaylist()`,
      `isVideoInPlaylist()` (match by YouTube videoId), group/collection →
      playlist batch add.
- [ ] **T1.7** Implement **playlist split-view player**: `openPlaylistView()`,
      `pvRenderList()`, `pvPlayIndex()`, `pvSetMode()` (sequential/random),
      `pvToggleAutoplay()`, `pvSaveOrderToPlaylist()`, YouTube IFrame API
      integration, `onYtPlayerStateChange` auto-advance.
- [ ] **T1.8** Implement **export**: `exportData()`, `buildCollectionsJsExport()`,
      `buildWatchedJsExport()`, `buildPlaylistJsExport()`, `exportAllJs()`,
      `saveToFolderOrDownload()` (File System Access API + IndexedDB
      `TubeVaultExportFolders`).
- [ ] **T1.9** Implement **seed + init**: `seedData()` (flatten
      `DEFAULT_COLLECTIONS` → `state.videos`), `remapPlaylistIds()`,
      `restoreExportFolder()`, `applyAppBranding()`, and the `init` block.
- [ ] **T1.10** Implement **shared drag helper** `makeSortable()` (reused by
      sidebar collections, sidebar playlists, cards, playlist tracks).
- [ ] **T1.11** Implement **category system**: `APPS_REGISTRY_KEY`,
      `BUILTIN_APPS` (last-resort fallback), `loadBuiltinsFromJson()` (fetch
      `categories.json` over HTTP), `getAppsRegistry()`,
      `getAppsRegistryAsync()`, `getFallbackBuiltins()` (prefers
      `window.__BUILTIN_APPS__`), `renderCategorySwitcher()`,
      `createCategory()` + `buildCategoryHtml()` + `buildCategory*Seed()`,
      `PAGE_TEMPLATE` usage.

---

## Phase 2 — Build script (`build.js`)

- [ ] **T2.1** `loadCategories()` — parse `categories.json`
      (`data.collections`), validate ids (`/^[a-z0-9-]+$/i`), exit non-zero on
      bad/missing file.
- [ ] **T2.2** `configScriptTags(id, dir)` — emit the three seed `<script>` tags.
- [ ] **T2.3** `render(template, app)` — substitute all tokens incl.
      `{{BUILTIN_APPS_JS}}`.
- [ ] **T2.4** `buildCollectionsSeed()` / `buildPlaylistSeed()` /
      `buildWatchedSeed()` — starter seeds (empty collection + `COLLECTION_COLORS`,
      `[]`, `[]`).
- [ ] **T2.5** `buildBuiltinAppsJs(apps)` — `<script>window.__BUILTIN_APPS__ =
      [...]</script>` from the full category list.
- [ ] **T2.6** `writeCategorySeeds(app)` — **skip-if-exists** (preserve curated
      data on re-run).
- [ ] **T2.7** `main()` — build module-level `BUILTIN_APPS_JS` once, loop
      categories: write `<id>.html`, `<id>/page-template.js`, seeds; then build
      `tests.html` + `test/` (preserve `test/` fixtures).

> ⚠️ Gotcha fixed in session: `BUILTIN_APPS_JS` must be a **module-level `let`**
> assigned in `main()`, not a `const` inside `main()` (block scoping made it
> invisible to `render()`).

---

## Phase 3 — Delete script (`delete-category.js`)

- [ ] **T3.1** `loadManifestIds()` — read `categories.json`, return lowercased
      ids; `PROTECTED = new Set([...ids, 'test'])`.
- [ ] **T3.2** Validate id format; refuse protected + unknown; interactive
      confirm (type id) unless `--force`.
- [ ] **T3.3** Remove `<id>.html` + `<id>/` folder; print guidance to also clear
      the browser `localStorage` registry if created in-app.

---

## Phase 4 — Maintain tool (`maintain.html`)

- [ ] **T4.1** Browser-only generator: fetch `page-template.html` +
      `categories.json` (HTTP); edit template; add/remove category rows.
- [ ] **T4.2** `FALLBACK_APPS` (hardcoded `file://` fallback) kept in sync with
      `categories.json`.
- [ ] **T4.3** "Generate & download" produces `<id>.html` + `page-template.js`
      (download only — cannot delete; use `delete-category.js` for removal).

---

## Phase 5 — Seed data (first build)

- [ ] **T5.1** `categories.json` — list shipped categories, e.g.
      ```json
      { "collections": [
        { "id": "unity3d",    "name": "Unity3D",    "color": "#EC407A" },
        { "id": "gamedesign", "name": "GameDesign", "color": "#29B6F6" },
        { "id": "blender",    "name": "Blender",    "color": "#AB47BC" },
        { "id": "csharp",     "name": "CSharp",     "color": "#AB46BC" }
      ] }
      ```
- [ ] **T5.2** `node build.js` → generates every `<id>.html`, `<id>/page-template.js`,
      and **starter** seed files (skip-if-exists) for each category + `test/`.

---

## Phase 6 — Feature tests

- [ ] **T6.1** `tests.js` — in-browser harness asserting pure helpers, seed/state
      integrity, sidebar/card rendering, export-pipeline (confirm modals), and
      `PAGE_TEMPLATE` correctness; renders a report + `window.__TEST_RESULTS__`.
- [ ] **T6.2** `test/` seed fixtures (`test-collections.js` with demo videos +
      `pl1` playlist, `test-playlist.js`, `test-watched.js`) — **hand-maintained,
      preserved** by `build.js`.

---

## Phase 7 — Bug fixes applied this session (recreate-aware)

- [ ] **T7.1** **Missing seeds broke pages.** Root cause: `build.js` originally
      generated only `page-template.js`; `<id>/` seed files were absent →
      `app.js` threw on undefined `COLLECTION_COLORS` → all buttons dead.
      **Fix:** `build.js` now generates starter seeds (skip-if-exists).
- [ ] **T7.2** **Stale category list.** `BUILTIN_APPS` (app.js +
      delete-category.js) and docs referenced old `music/electronics/astrology`,
      not the real `unity3d/gamedesign/blender/csharp`. Bottom menu linked to
      non-existent pages. **Fix:** every surface now reads `categories.json`;
      `build.js` injects generated `window.__BUILTIN_APPS__` (eliminates even the
      `file://` fallback drift); literal `BUILTIN_APPS` is last-resort only.
- [ ] **T7.3** **Build dead-end.** Generated page + no seeds = broken. **Fix:**
      `build.js` owns full folder contents; re-run preserves curated data.

---

## Phase 8 — Documentation

- [ ] **T8.1** `workflow.md` — file map, canonical CLI workflow, add/remove
      category, seed data (generated + preserved), caveats.
- [ ] **T8.2** `MAINTAIN.md` — browser-only generator usage, delete guards, file
      layout (updated to real categories).
- [ ] **T8.3** `PRD.md` — product requirements + known issues (this session's
      fixes logged).
- [ ] **T8.4** `TDD.md` — technical design (build pipeline, runtime, data model,
      category system, security, testing).
- [ ] **T8.5** `Tasks.md` — this file.

---

## Phase 9 — Verification (after any rebuild)

- [ ] **T9.1** `node -c app.js && node -c build.js && node -c delete-category.js`.
- [ ] **T9.2** `node build.js` runs clean; no leftover `{{...}}` tokens in output.
- [ ] **T9.3** Each `<id>.html` contains injected
      `window.__BUILTIN_APPS__` (all categories) before `app.js`.
- [ ] **T9.4** Open `tests.html` (served over HTTP) — feature suite green.
- [ ] **T9.5** Open a category page → New Collection / New Playlist buttons work
      (regression check for the original bug).
- [ ] **T9.6** Re-run `node build.js` → existing seed files reported as
      `kept existing … (preserve)` (no data loss).

---

## Quick recreate checklist (minimal)

1. `style.css` + `page-template.html` (with all 6 tokens).
2. `app.js` (T1.1–T1.11).
3. `build.js` (T2.1–T2.7) + `delete-category.js` (T3.1–T3.3) + `maintain.html`.
4. `categories.json` (T5.1) → `node build.js` (T5.2).
5. `tests.js` + `test/` fixtures (T6).
6. Docs (T8). Verify (T9).
