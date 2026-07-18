

# ============ FILE: PRD.md ============

# Product Requirements Document — TubeVault / TholsStudio

_Last updated: 2026-07-18_
_Status: Implemented (static, client-only MVP). This PRD documents the current
system as built in `youtube/`, and flags the gaps/risks found during review._

---

## 1. Overview

**TubeVault** (branded **TholsStudio**) is a free, dependency-free, **client-side
YouTube video vault**. It lets a user bookmark YouTube videos into nested
**Collections → Groups → Videos**, build **Playlists** with an immersive player,
track **watched** history, and export/import their data — all stored locally in
the browser (no backend, no accounts).

It is distributed as a set of **static pages** served on GitHub Pages. A single
shared engine (`app.js` + `style.css`) is rendered once per "category" via a
template (`page-template.html`) that `build.js` stamps out. Each category is an
independent mini-app namespaced by `APP_NAME`.

### Goals
- Let users organize saved YouTube videos without a server or login.
- Make the same UI reusable across many topic "categories" (Unity3D, GameDesign, Blender, CSharp, …).
- Keep the whole project buildable with **plain Node / browser** — zero dependencies.
- Allow end users to spin up new categories entirely in-browser ("Create category…").

### Non-goals
- No server, no accounts, no cross-device sync (beyond manual export).
- No video hosting or downloading of YouTube media.
- No collaborative/sharing features.

---

## 2. Users & Personas

| Persona | Description | Primary needs |
|---------|-------------|---------------|
| **Curator** | Saves tutorials/references by topic | Quick add, grouping, search, notes |
| **Learner** | Works through playlists of tutorials | Immersive player, sequential/random, autoplay |
| **Maintainer** | Maintains the published site | `build.js`, `categories.json`, seed generation |
| **End visitor** | Opens a shared category page | Browse, create their own category, export data |

---

## 3. Terminology

| Term | Meaning |
|------|---------|
| **Category** | A top-level topic page (e.g. `unity3d`). Its own HTML page + `<id>/` folder. |
| **Collection** | A user-made grouping inside a category (sidebar item, colored dot). |
| **Group** | A sub-section within a collection (e.g. "Physics"). |
| **Video** | A saved YouTube link with metadata (title, channel, note, watched). |
| **Playlist** | An ordered list of videos with a split-view player. |
| **Seed file** | `<id>-collections.js` / `-playlist.js` / `-watched.js` — default data. |
| **Registry** | `localStorage["tholsstudio_categories"]` — custom categories created in-app. |

---

## 4. Functional Requirements

### 4.1 Save & Organize
- **FR-1** Paste a YouTube URL (watch / youtu.be / shorts, with optional `?list=`) → extract video ID and save.
- **FR-2** Quick-add bar saves to a chosen Collection/Group (location picker); defaults remembered from last use.
- **FR-3** Add Video modal: URL (with live duplicate detection), title (auto-fetched via noembed.com), collection, group (existing or new), note.
- **FR-4** Import modal: paste many URLs (one per line) into a collection/group at once.
- **FR-5** Hierarchical organization: Collection → Group → Video; drag-reorder within a group and across the sidebar.
- **FR-6** Rename / delete collections, groups, playlists (inline rename; confirm on destructive delete).

### 4.2 Browse & Search
- **FR-7** Library views: All Videos, Recently Added (≤7 days), Watched.
- **FR-8** Full-text search across title / channel / note / group / url.
- **FR-9** Grid and List view toggle; collapsible sections in sidebar.
- **FR-10** Per-video actions: play (opens YouTube), edit title, edit note, copy URL, mark watched, move to group, add to playlist, delete.

### 4.3 Playlists & Player
- **FR-11** Create playlists (named, colored); add/remove individual videos, whole groups, or whole collections.
- **FR-12** Immersive split-view player: track list (left) + YouTube iframe (right).
- **FR-13** Playback modes: sequential / random; auto-play next on end; drag-reorder tracks (order persisted).
- **FR-14** Playlist search filters the visible track list without disturbing play order.

### 4.4 Watched Tracking
- **FR-15** Mark watched on play and via toggle; watched videos dimmed; "Watched" view and counts.
- **FR-16** Watched history persisted via `WATCHED_VIDEO_IDS` seed + `state.watchedIds`.

### 4.5 Export / Import / Portability
- **FR-17** Export as JSON (full state) or as JS config files (`-collections.js`, `-playlist.js`, `-watched.js`) for committing as seeds.
- **FR-18** Export target: download, or a chosen folder via the File System Access API (handle persisted in IndexedDB per app).
- **FR-19** "Create category…" generates a full standalone page + 4 JS files client-side and registers it in the shared registry.

### 4.6 Multi-Category & Build
- **FR-20** `categories.json` is the single source of truth for the category list.
- **FR-21** `build.js` regenerates every `<id>.html`, `<id>/page-template.js`, and starter seed files (skip-if-exists) from `page-template.html` + `categories.json`.
- **FR-22** In-app category switcher, `delete-category.js` guard, and `maintain.html` all read `categories.json` (HTTP) and fall back to a hardcoded list on `file://`.
- **FR-23** `delete-category.js` removes a category's `<id>.html` + `<id>/` folder; refuses `categories.json` entries and `test`.

---

## 5. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Dependencies** | Zero runtime/build deps; plain Node + vanilla browser JS. |
| **Portability** | Works on GitHub Pages **and** opened via `file://` (no fetch assumed). |
| **Storage** | Per-app `localStorage` namespace `tholsstudio_<app>`; export-folder handles in IndexedDB. |
| **Performance** | Client-only; renders from in-memory `state`; thumbnails lazy-loaded. |
| **Security** | No secrets; all user data local. HTML escaped (`escHtml`/`escAttr`) to prevent injection from titles/notes. |
| **Accessibility** | Keyboard-operable modals (Enter/Esc), SVG icon buttons with titles. (No formal audit done.) |
| **Maintainability** | Single template source; shared engine; documented `workflow.md` / `MAINTAIN.md`. |

---

## 6. Architecture (as built)

```
youtube/
  page-template.html     ← single source of truth ({{APP_*}} / {{JS_DIR}} / {{SCRIPT_TAGS}})
  categories.json        ← category manifest (id, name, color) — SINGLE SOURCE OF TRUTH
  build.js               ← Node: generates pages + starter seeds (skip-if-exists)
  delete-category.js     ← Node: removes a category (guarded by categories.json + test)
  maintain.html          ← browser-only generator (HTTP; file:// fallback)
  app.js                 ← shared engine (~3.2k lines)
  style.css              ← shared styles
  <id>.html              ← generated category page
  <id>/
    <id>-collections.js  ← DEFAULT_COLLECTIONS + COLLECTION_COLORS (seed)
    <id>-playlist.js     ← DEFAULT_PLAYLISTS (seed)
    <id>-watched.js      ← WATCHED_VIDEO_IDS (seed)
    page-template.js     ← window.PAGE_TEMPLATE (runtime template for Create category)
  tests.html / tests.js  ← in-browser feature test harness
```

**Data flow:** `page-template.html` placeholders → `build.js` substitution →
`<id>.html` → loads `<id>/` seeds (defines globals) → `app.js` seeds `state` →
renders UI. Runtime changes persist to `localStorage`; "Export" can rewrite the
seed files for committing.

---

## 7. Current State & Known Issues (from review)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Category pages were broken on first load because `<id>/` seed files were missing (only `page-template.js` existed); `app.js` threw on undefined `COLLECTION_COLORS`, disabling all buttons. | High | **Fixed** — `build.js` now generates starter seeds (skip-if-exists). |
| 2 | `BUILTIN_APPS` (in `app.js` + `delete-category.js`) and docs listed stale `music/electronics/astrology`, not the real `unity3d/gamedesign/blender/csharp`. Bottom menu pointed at non-existent pages. | High | **Fixed** — every surface reads `categories.json`. `build.js` also injects a generated `window.__BUILTIN_APPS__` (from `categories.json`) into each page, eliminating even the `file://` fallback drift; the literal `BUILTIN_APPS` in `app.js` is now last-resort only. |
| 3 | `build.js` originally did **not** generate seeds, creating a dead-end (generated page but no data → broken). | High | **Fixed** — seeds generated as starters, preserved on re-run. |
| 4 | No `package.json`, no lint/CI, no automated test runner (tests are manual `tests.html`). | Medium | Open — see §9. |
| 5 | `app.js` is a large monolithic file (~3.2k lines); no module splitting. | Low | Open — acceptable for MVP. |
| 6 | `categories.json` id/color can drift from actual `<id>/` seed `id`/color (no validation). | Low | Open. |

---

## 8. Success Metrics

- A freshly `build.js`-generated category page loads with **all buttons working** on first open (no manual seed commit required). ✅ (achieved post-fix)
- Adding a category to `categories.json` makes it appear in the in-app switcher, `delete-category.js` guard, and `maintain.html` with **no other edits**. ✅ (achieved)
- Re-running `build.js` never destroys curated seed data. ✅ (achieved)
- `tests.html` feature suite is green after a build. (Manual check, no regression.)

---

## 9. Future Work / Roadmap

1. **Automated checks** — add `package.json` with `test`/`build` scripts; run `tests.html` in CI (e.g. headless browser) and a JSON-schema lint on `categories.json`.
2. **Validation** — `build.js` should warn when a `<id>/` seed's `id`/`color` diverges from `categories.json`.
3. **Cross-device sync** — optional export to a user-chosen cloud/remote store (out of current scope).
4. **Accessibility pass** — formal audit (focus order, ARIA, contrast).
5. **Engine modularization** — split `app.js` into focused modules (if build tooling is ever introduced). Keep zero-dep constraint.
6. **Bulk operations** — multi-select videos for move/delete/add-to-playlist.

---

## 10. Open Questions

- Should `build.js` also rewrite the `app.js` `file://` fallback `BUILTIN_APPS` from `categories.json` to fully eliminate drift? (Currently out of scope since HTTP is the deploy path.)
- Should `categories.json` carry an optional `storageKey`/`order` to control sidebar sequence and namespaces centrally?
- Is the `test/` page's hand-maintained fixtures approach sustainable, or should fixtures be generated and the tests seed their own data?


# ============ FILE: TDD.md ============

# Technical Design Document — TubeVault / TholsStudio

_Last updated: 2026-07-18_
_Companion to: `PRD.md`, `workflow.md`, `MAINTAIN.md`._

---

## 1. Purpose & Scope

This document describes the **technical design** of TubeVault (branded
TholsStudio): a dependency-free, client-side YouTube video vault distributed as
static pages on GitHub Pages. It covers the build pipeline, runtime architecture,
data model, key modules, and the decisions made during the 2026-07 review (seed
generation, `categories.json`-driven category list, drift-free `file://` fallback).

It does **not** repeat product rationale (see `PRD.md`) or step-by-step
maintenance (see `workflow.md`).

---

## 2. Design Principles

1. **Zero dependencies.** No npm packages, no bundler, no framework. Plain Node
   for build; vanilla browser JS + CSS for runtime.
2. **Single source of truth for markup** — `page-template.html` (with
   `{{PLACEHOLDER}}` tokens) is the only page layout that should ever be edited.
3. **Single source of truth for the category list** — `categories.json`. Every
   surface (build, delete-guard, in-app switcher, maintain tool) reads it.
4. **Static output, no backend.** All state lives in the browser
   (`localStorage` + IndexedDB). Pages are pre-rendered shells.
5. **`file://` compatibility.** The runtime must work when opened directly from
   disk, where `fetch` is unavailable — hence generated inline globals and a
   hardcoded last-resort fallback.

---

## 3. Build Pipeline

### 3.1 Inputs
- `page-template.html` — full page with tokens:
  `{{APP_NAME}}`, `{{APP_LABEL}}`, `{{APP_COLOR}}`, `{{JS_DIR}}`,
  `{{SCRIPT_TAGS}}`, `{{BUILTIN_APPS_JS}}`.
- `categories.json` — `{ "collections": [ { id, name, color } ] }`.

### 3.2 `build.js` responsibilities
For **each** entry in `categories.json`:
1. Substitute tokens → `<id>.html` at repo root.
2. Write `<id>/page-template.js` = `window.PAGE_TEMPLATE = "<!DOCTYPE …>"`
   (the runtime template reused by "Create category…").
3. Write starter **seed files** into `<id>/` **only if missing** (skip-if-exists):
   - `<id>-collections.js` → `COLLECTION_COLORS` + one empty `DEFAULT_COLLECTIONS`.
   - `<id>-playlist.js` → `DEFAULT_PLAYLISTS = []`.
   - `<id>-watched.js` → `WATCHED_VIDEO_IDS = []`.
4. Build `BUILTIN_APPS_JS` = `<script>window.__BUILTIN_APPS__ = [...]</script>`
   from the **full** `categories.json` list, injected into every page.

Plus a `test/` harness (HTML at root, JS in `test/`) with **preserved**
hand-maintained fixtures.

### 3.3 Why skip-if-exists on seeds
Seeds are **source data** the user edits/curates in-browser. `build.js` must
never clobber them on re-run. Only the HTML + `page-template.js` are fully
regenerated. `test/` fixtures are likewise preserved. The inline
`window.__BUILTIN_APPS__` is **always** rewritten (it must never go stale).

### 3.4 Determinism / idempotence
`build.js` is idempotent: re-running produces identical HTML and never destroys
seed data. New categories appear; existing data is untouched.

---

## 4. Runtime Architecture

### 4.1 Page load order (per `<id>.html`)
```
youtube iframe API
  → inline APP_NAME / APP_LABEL / APP_COLOR
  → <id>/page-template.js        (defines window.PAGE_TEMPLATE)
  → <id>-collections.js          (COLLECTION_COLORS, DEFAULT_COLLECTIONS)
  → <id>-playlist.js             (DEFAULT_PLAYLISTS)
  → <id>-watched.js              (WATCHED_VIDEO_IDS)
  → window.__BUILTIN_APPS__      (generated, file:// fallback)
  → app.js                       (engine: reads the globals above)
```

Global load order matters: seeds + `PAGE_TEMPLATE` + `__BUILTIN_APPS__` must be
defined **before** `app.js` evaluates (it reads them at module-init time).

### 4.2 Module map (`app.js`, ~3.2k lines, single file)
| Area | Key functions |
|------|---------------|
| State & persistence | `state`, `save()`, `seedData()`, `remapPlaylistIds()` |
| YouTube helpers | `extractVideoId()`, `extractPlaylistId()`, `getThumbnail()`, `getWatchUrl()` |
| Sidebar | `renderSidebar()`, `renderPlaylistsSidebar()`, `renderCategorySwitcher()` |
| Cards | `renderCards()`, `renderGroupedByTitle()`, `renderCard()`, `attachCardDrag()` |
| Collections/Groups | `saveCollection()`, `saveGroup()`, rename/delete, `moveGroup*` |
| Playlists | `savePlaylist()`, `addVideoToPlaylist()`, `isVideoInPlaylist()` |
| Playlist player | `openPlaylistView()`, `pvRenderList()`, `pvPlayIndex()`, `pvSaveOrderToPlaylist()` |
| Export | `exportData()`, `buildCollectionsJsExport()`, `saveToFolderOrDownload()` |
| Category creation | `createCategory()`, `buildCategoryHtml()`, `buildCategory*Seed()` |
| Drag helper | `makeSortable()` (shared by sidebar, cards, tracks) |
| Init | `applyAppBranding()`, `seedData()`, `renderSidebar()`, `renderCards()`, `renderCategorySwitcher()` |

### 4.3 Shared drag-and-drop
`makeSortable(container, itemSelector, opts)` is the single drag-reorder
implementation, reused for: sidebar collections, sidebar playlists, in-group
video cards, and playlist split-view tracks. Behaviour preserved across all four:
top/bottom drop indicators, `was-dragging` click suppression, and
`onDropToEnd` for empty-space drops.

---

## 5. Data Model

### 5.1 `state` (runtime, persisted to `localStorage["tholsstudio_<app>"]`)
```js
{
  videos:      [ { id, url, videoId, playlistId, title, channel, note,
                  collection, group, added, watched } ],
  collections: [ { id, name, color } ],
  playlists:   [ { id, name, color, videoIds: [...] } ],
  selectedColor, lastUsedCollection, lastUsedGroup,
  videoOrder:  { "<colId>__<group>": [videoId, ...] },  // drag-reorder
  watchedIds:  [ youtubeVideoId, ... ],
  expandedGroups: [ ... ],
  pendingGroups: { [colId]: [groupName, ...] }           // empty groups
}
```

### 5.2 Seed shape (committed source data)
- `DEFAULT_COLLECTIONS` — nested: collection → `groups: { name: [videos] }` +
  `ungrouped: [videos]`. `seedData()` **flattens** this into `state.videos`
  (each video gets `collection` + `group` fields) on first load.
- `DEFAULT_PLAYLISTS` — `{ id, name, color, videoIds: [ytId...] }`.
  `remapPlaylistIds()` maps YouTube IDs → internal video IDs after seeding.
- `WATCHED_VIDEO_IDS` — `[ytId...]`; applied to `watched` flags during seed.

### 5.3 Namespacing
`APP_NAME` → `localStorage` key `tholsstudio_<app>` + IndexedDB export-folder
store per app. Each category page is an independent vault.

### 5.4 Cross-cutting de-duplication
`isVideoInPlaylist()` and `remapPlaylistIds()` match by **underlying YouTube
videoId**, not just internal id, so the same video saved into two collections
isn't added to a playlist twice.

---

## 6. Category System (drift-free by design)

| Surface | Source of category list | Fallback |
|---------|------------------------|----------|
| In-app switcher (HTTP) | `fetch('categories.json')` | — |
| In-app switcher (`file://`) | `window.__BUILTIN_APPS__` (generated) | literal `BUILTIN_APPS` |
| `delete-category.js` | `categories.json` (read by Node) | `test` always protected |
| `maintain.html` (HTTP) | `fetch('categories.json')` | — |
| `maintain.html` (`file://`) | `FALLBACK_APPS` (hardcoded) | — |

**`window.__BUILTIN_APPS__`** is generated by `build.js` from `categories.json`
and inlined into every page before `app.js`. `getFallbackBuiltins()` prefers it,
then the literal `BUILTIN_APPS`. This eliminates the last manual list — changing
`categories.json` updates every surface with no other edits.

---

## 7. Export & Portability

- **JSON export** — full `state` serialized; download or write to a chosen
  folder (File System Access API).
- **JS export** — regenerates the three seed files (`collections`/`playlist`/
  `watched`) so they can be committed as new defaults.
- **Folder persistence** — chosen directory handle stored in IndexedDB
  (`TubeVaultExportFolders` / `folders` store) per app; restored on load with
  permission re-request.
- **"Create category…"** — builds a standalone page + 4 JS files client-side
  from `window.PAGE_TEMPLATE`, registers it in the shared
  `localStorage["tholsstudio_categories"]` registry.

---

## 8. Security & Correctness

- **HTML escaping** — `escHtml()` / `escAttr()` on all user-derived strings
  (titles, notes, group names) before injecting into `innerHTML`, preventing
  injection from saved video metadata.
- **No secrets** — all data is local; no API keys (title fetch uses public
  noembed.com).
- **URL validation** — `extractVideoId()` enforces the 11-char YouTube ID
  pattern; `isYouTubeUrl()` gates quick-add/import.
- **Deletion guards** — `delete-category.js` refuses `categories.json` entries
  and `test`; destructive UI actions use a confirm modal.

---

## 9. Testing

- **`tests.html` / `tests.js`** — in-browser feature harness (no framework).
  Loaded after `app.js`; asserts on pure helpers (`extractVideoId`, `jsStr`,
  `chunk`, `slugifyCollectionName`), seed/state integrity, sidebar/card
  rendering, export-pipeline (opens confirm modals), and `PAGE_TEMPLATE`
  correctness. Results shown on-page + `window.__TEST_RESULTS__`.
- **Fixtures** — `test/` seeds are hand-maintained and **preserved** by
  `build.js` (skip-if-exists) because the tests assert against their demo data.
- **Gap** — no automated/CI runner; `tests.html` is opened manually after a
  build. (See `PRD.md` §9, roadmap item 1.)

---

## 10. Known Constraints & Trade-offs

| Constraint | Decision |
|-----------|----------|
| No bundler/framework | Single `app.js` (~3.2k lines). Acceptable for MVP; modularize only if tooling added. |
| `file://` support | Generated inline globals + hardcoded last-resort fallback; no runtime `fetch` assumed. |
| Seeds must survive rebuilds | `build.js` skip-if-exists on seeds; HTML/`page-template.js` always regenerated. |
| No backend | All state client-side; portability via export/import only. |
| Performance at scale | Linear static generation; inline category list (~KB) is negligible even at 50+ pages. |

---

## 11. Extension Points

- **New category:** edit `categories.json` + `node build.js`. No engine changes.
- **New collection/group/video field:** extend `state` + seed shape + render
  functions; keep `seedData()` flattening in sync.
- **New export format:** add a `buildXxxExport()` + menu entry + confirm flow
  (mirror `exportCollectionsJs`).
- **CI:** add `package.json` with `build` + a headless `tests.html` runner.


# ============ FILE: Tasks.md ============

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


# ============ FILE: workflow.md ============

# Workflow — TubeVault / TholsStudio

How the static site is built, regenerated, and maintained. Everything is
plain Node / browser — **no build dependencies**.

---

## File map

| File | Role |
|------|------|
| `page-template.html` | Single source of truth for page markup. Uses `{{APP_NAME}}`, `{{APP_LABEL}}`, `{{APP_COLOR}}`, `{{JS_DIR}}`, `{{SCRIPT_TAGS}}` placeholders. |
| `categories.json` | **Single source of truth for the category list** (`id`, `name`, `color`). Read by `build.js`, `delete-category.js`, `maintain.html`, and (over HTTP) the in-app category switcher in `app.js`. Add/remove a category here and every surface follows. |
| `build.js` | Node script: reads `page-template.html` + `categories.json` and **writes** all pages + seed files into the repo. |
| `delete-category.js` | Node script: removes a category's `<id>.html` + `<id>/` folder. Its protected-set is derived from `categories.json`. |
| `app.js` / `style.css` | Shared engine, loaded by every category page. The bottom category switcher fetches `categories.json` over HTTP and falls back to a hardcoded list on `file://`. |
| `maintain.html` | Optional browser-only generator (reads `categories.json` over HTTP; falls back to a hardcoded list on `file://`). |
| `*-collections.js` / `*-playlist.js` / `*-watched.js` | Per-category seed data inside `<id>/`. **Generated by `build.js` as starter files** (empty collections + `COLLECTION_COLORS`) if missing, and thereafter edited/committed as source data. |
| `tests.html` / `tests.js` | Feature-test harness (regenerated by `build.js`). |

---

## Canonical workflow (terminal)

```bash
cd youtube

# 1. Edit the template (layout / styles / markup) in page-template.html
# 2. Add / remove a category in categories.json
# 3. Regenerate everything:
node build.js

# 4. (optional) Remove a category entirely:
node delete-category.js <id> --force
```

`build.js` writes, for **each** category in `categories.json`:

```
<id>.html                 ← root, references the seeds below
<id>/page-template.js
<id>/<id>-collections.js   ← starter seed (empty collection + COLLECTION_COLORS)
<id>/<id>-playlist.js      ← starter seed (DEFAULT_PLAYLISTS = [])
<id>/<id>-watched.js       ← starter seed (WATCHED_VIDEO_IDS = [])
```

plus the feature-test harness (HTML at root, JS in `test/`):

```
tests.html
test/page-template.js
test/test-collections.js   (hand-maintained fixtures — preserved, never overwritten)
test/test-playlist.js
test/test-watched.js
```

The seed files (`*-collections.js`, `-playlist.js`, `-watched.js`) are **generated
by `build.js` as empty starters** so every freshly built page initializes and all
buttons work on first load. `build.js` **only writes them when they are missing** —
re-running it never overwrites a category's curated collections / videos /
playlists / watched history you built up in the app. The HTML and `page-template.js`
are always regenerated. The `test/` fixtures are also preserved (skip-if-exists).

Commit & push. GitHub Pages serves the `youtube/` folder.

`build.js` derives its page list from `categories.json` (via `loadCategories()`);
only the `test` page is hardcoded, because it is the feature-test harness, not a
user category.

---

## Add a new category

1. Append an entry to `categories.json`:
   ```json
   { "id": "cooking", "name": "Cooking", "color": "#FFA726" }
   ```
2. `node build.js` → creates `cooking.html`, `cooking/page-template.js`, and the
   three starter seed files (`cooking/cooking-collections.js` etc.). If those
   seed files already exist they are preserved (skip-if-exists).
3. (Optional) Open `cooking.html` in the app and use **Add Video / Import /
   Create category…** to populate the seeds, then commit your edits. Or just
   leave the empty starters and build up data in the browser — it persists to
   `localStorage` per app.

Because the in-app category switcher, `delete-category.js`, and `maintain.html`
**all read `categories.json`**, the new category appears everywhere
automatically. No hardcoded list to update.

## Remove a category

```bash
node delete-category.js cooking --force   # deletes cooking.html + cooking/
```

`delete-category.js` derives its protected-set from `categories.json` (plus
`test`), so it refuses any shipped category and `test`; to remove a shipped
category, remove its entry from `categories.json` first, then re-run `build.js`.
If the category was created in the app, also clear it from the browser
`localStorage` registry (`tholsstudio_categories`) via the in-app category
switcher.

---

## Browser-only workflow — `maintain.html`

Serve the folder over HTTP, then open `maintain.html`:

```bash
python3 -m http.server        # then visit http://localhost:8000/maintain.html
```

- Loads `page-template.html` and `categories.json` via `fetch` (HTTP only;
  on `file://` it falls back to a built-in category list and logs a warning).
- Add / Remove rows in the table, then **Generate** downloads `<id>.html` +
  `page-template.js` to your Downloads folder — copy them into the repo manually.
- It can only **download**, never delete. Use `delete-category.js` for removal.

---

## Seed data

The actual videos/playlists/watched history live in the per-category seed
files, not in the template or `categories.json`:

```
<id>/
  <id>-collections.js   → const COLLECTION_COLORS = [ … ]   (color picker swatches, required by app.js)
                           const DEFAULT_COLLECTIONS = [ { id, name, color, groups, ungrouped } ]
  <id>-playlist.js      → const DEFAULT_PLAYLISTS = [ … ]
  <id>-watched.js       → const WATCHED_VIDEO_IDS = [ … ]
  page-template.js      → window.PAGE_TEMPLATE = "<!DOCTYPE …>"
```

`build.js` **generates the three seed files as empty starters** the first time
it runs for a category (so the page boots and every button works). After that
they are **source data you edit/commit** — `build.js` won't overwrite existing
seeds on re-run. You can also populate them in the app (Add Video / Import /
Create category… → exports the same files) or copy another category's seeds.

`categories.json` is intentionally just a **category manifest** (`id` / `name`
/ `color`) — it does not and should not carry group/video data, since
`build.js` and `maintain.html` ignore those fields and they would be misleading.

---

## Fresh deploy (no categories shipped)

Edit `categories.json` to remove the shipped entries (keep it as an empty
`{ "collections": [] }` or just the ones you want), then:

```bash
node build.js                 # regenerates pages; existing seeds are preserved
```

Keep `app.js`, `style.css`, `page-template.html`, `categories.json`,
`tests.html`. Visitors create their own categories in-app via
"Create category…".

---

## Caveats

- **`categories.json` is the single source of truth for the category list.**
  The in-app switcher (`app.js`), `delete-category.js`, and `maintain.html` all
  read it (over HTTP). Change it once and every surface follows — no separate
  hardcoded list to maintain.
- **`categories.json` drives the in-app `file://` fallback too.** `build.js`
  injects `window.__BUILTIN_APPS__` (generated from `categories.json`) into every
  page before `app.js`, so even pages opened directly via `file://` show the
  correct category list with no hardcoded maintenance. The literal `BUILTIN_APPS`
  array in `app.js` is now only a last-resort fallback.
- **`build.js` generates seed files as empty starters (skip-if-exists).** It
  never overwrites an existing `<id>-collections.js` / `-playlist.js` /
  `-watched.js`, so curated data survives re-builds. The `test/` fixtures are
  likewise preserved.
- **Open `tests.html` after a build** to confirm the feature suite still passes.


# ============ FILE: MAINTAIN.md ============

# Maintaining the TubeVault Pages

`maintain.html` is a no-terminal, browser-based tool for keeping the category
pages in sync. It edits the shared `page-template.html`, manages the list of
categories, and generates the individual pages + `page-template.js`.

There are **two equivalent ways** to regenerate the pages:

| Method | When to use |
|--------|-------------|
| `maintain.html` (this tool) | Quick edits in the browser, no install — great on GitHub Pages. |
| `node build.js` | Scripted / CI builds from the terminal. |

Both use the **same substitution logic** and produce byte-identical output.

---

## 1. Open the tool

Serve the `youtube/` folder over HTTP (e.g. GitHub Pages, or a local server
like `python3 -m http.server`) and open:

```
maintain.html
```

> Opening it directly via `file://` also works, but the template is then loaded
> with the **“Load file…”** button instead of being fetched automatically.

---

## 2. Edit the page template

The **Page template** box shows the contents of `page-template.html` — the
single source of truth for every category page. It uses these placeholders:

| Placeholder | Replaced with |
|-------------|---------------|
| `{{APP_NAME}}` | category id (also the `localStorage` namespace) |
| `{{APP_LABEL}}` | human-readable title shown in the tab/sidebar |
| `{{APP_COLOR}}` | accent / branding color |
| `{{SCRIPT_TAGS}}` | the three `<id>-collections.js` / `-playlist.js` / `-watched.js` tags |

To change the layout, styles, or any markup, edit this box (or the underlying
`page-template.html`) — **not** the individual `*.html` files.

- **Reload from repo** — re-fetches `page-template.html`.
- **Load file…** — picks a local `page-template.html` (for `file://` use).
- **Save edited template** — downloads your edited version back as
  `page-template.html`.

---

## 3. Manage categories

The **Categories** table lists every page that will be generated. It is
seeded from `categories.json` (the same build manifest `build.js` reads), so it
always matches the terminal workflow.

- `id` — filename stem and storage namespace (e.g. `unity3d` → `unity3d.html`).
- `label` — title shown to users.
- `color` — accent color (color picker).

Use **+ Add category** to add a row and **Remove** to delete one.

---

## 4. Generate the pages

Click **Generate & download all pages**. For each category the tool downloads:

- `<id>.html` — the full category page
- `page-template.js` — the runtime template string used by “Create category…”

The downloaded `<id>.html` files reference `page-template.js` plus their
`<id>-collections.js` / `<id>-playlist.js` / `<id>-watched.js` seed files.

> The per-category **seed files** (`*-collections.js`, `*-playlist.js`,
> `*-watched.js`) are still created inside the app via **Create category…**,
> or by copying an existing category’s seeds. `maintain.html` only produces
> the HTML shell + `page-template.js`.

Save the downloaded files into the `youtube/` folder next to `app.js` and
`style.css`, then commit/push.

---

## 5. Using the terminal instead (optional)

If you prefer a script / CI step, `build.js` does the same thing:

```bash
node build.js
```

It reads the category list from `categories.json` (the same `collections`
shape as the per-category `*-collections.js` files) and regenerates each
category's `<id>.html`, its `<id>/` seed files + `page-template.js`, plus
`tests.html` and `test/page-template.js`, all from `page-template.html`. No
dependencies required (plain Node).

To add a category, append an entry to the `collections` array in
`categories.json` and re-run `node build.js` (e.g.
`{ "id": "cooking", "name": "Cooking", "color": "#FFA726", "groups": {}, "ungrouped": [] }`).
To remove one, delete its entry — or use `node delete-category.js <id> --force`
to also remove the generated files.

---

## 6. Deleting a category (removes files)

`maintain.html` can only *download* pages — it can never delete anything from
the repo. To actually remove a category's generated artifacts, use the
terminal script:

```bash
node delete-category.js <id> [--force]
```

It removes `<id>.html` (at the root) and the `<id>/` folder (JS seeds +
`page-template.js`). It is interactive by default — it lists the files and
asks you to type the id to confirm — and `--force` skips the prompt.

Guards (refuses and exits non-zero):
- unknown / missing id,
- invalid ids (only letters, digits, dashes),
- the categories listed in `categories.json` and `test`
  — those are shipped pages; remove one by editing `categories.json`
  first.

> If the category was created in the app (via "Create category…"), it is also
> recorded in the shared `localStorage` registry (`tholsstudio_categories`).
> `delete-category.js` only touches the repo's files; clear that registry entry
> in the browser (or remove it from the in-app category switcher) so the deleted
> page stops showing up in the category menu.

---

## File layout

After generating, the repo looks like:

```
youtube/
  unity3d.html            ← category page (at root; one per entry in categories.json)
  gamedesign.html
  blender.html
  csharp.html
  app.js, style.css       ← shared engine (at root)
  page-template.html      ← single source of truth
  categories.json         ← category manifest (single source of truth for the list)
  unity3d/
    unity3d-collections.js   ← seed (generated by build.js if missing; otherwise preserved)
    unity3d-playlist.js
    unity3d-watched.js
    page-template.js
  gamedesign/ …          ← same shape
  blender/ …
  csharp/ …
  test/ …                ← feature-test seeds (preserved)
```

Each category's JS config files live in their own `<id>/` folder. The `.html`
page stays at the root and references them with a relative path
(e.g. `unity3d/unity3d-collections.js`, `unity3d/page-template.js`). `app.js` and
`style.css` are shared and stay at the root.
- After editing `page-template.html`, regenerate **all** pages so they stay
  consistent (the `tests.html` feature-test page is regenerated too).
- The tool cannot run `node`; it only produces static files for you to upload.
- Open `tests.html` after generating to confirm the feature suite still passes.


# ============ FILE: phase0-scaffold.md ============

# Phase 0 — Project Scaffold (TubeVault / TholsStudio)

## 1. Purpose & Shape

TubeVault (branded "TholsStudio") is a **static, zero-dependency single-page web app** served from the
`youtube/` folder of this GitHub Pages repository. There is no bundler, no npm install, and no runtime
framework. The browser loads plain HTML + one shared CSS file + a handful of plain `<script>` files.

- Static site, served on GitHub Pages from `youtube/`.
- **Zero build dependencies** at runtime. The only "build" step is a `build.js` (run by the developer)
  that consumes `page-template.html` as the single source of truth and emits a per-category page plus its
  config/seed files.
- Pages are *generated* from the template rather than hand-written, so every page (e.g. each "category")
  shares identical structure and only differs by the substituted `{{...}}` tokens.

The most important invariant of Phase 0 is this:

> **`page-template.html` is the SINGLE SOURCE OF TRUTH for all page markup.** Every generated page is a
> token-substituted copy of it. Any markup change belongs in the template, never in the generated output.

---

## 2. `page-template.html` — the single source of truth

The template is a complete HTML document. It contains six `{{...}}` substitution tokens that `build.js`
replaces at generate time. Each token and where it is substituted:

| Token | Substituted by `build.js` with | Meaning |
|-------|--------------------------------|---------|
| `{{APP_NAME}}` | e.g. `"youtube"`, `"cooking"` | Machine/namespace id. Drives localStorage key prefix + the IndexedDB export-folder store name. Set as a global `const APP_NAME` in an inline script. |
| `{{APP_LABEL}}` | e.g. `"YouTube"` | Human-facing product label. Used in `<title>` and branding. Set as `const APP_LABEL`. |
| `{{APP_COLOR}}` | e.g. `"#F5C518"` | Brand/accent color for this category. Set as `const APP_COLOR`. |
| `{{JS_DIR}}` | e.g. `"js/"` or `""` | Path prefix to the shared engine scripts (relative to the generated page). Used only for `page-template.js`. |
| `{{SCRIPT_TAGS}}` | rendered `<script src="...">` tags | The **three seed/config files** for this category (e.g. `collections.js`, `watched.js`, `playlist.js`). These populate the runtime data before `app.js` initializes. |
| `{{BUILTIN_APPS_JS}}` | rendered `<script src="...">` tag(s) | File(s) that define `window.__BUILTIN_APPS__` — the registry of built-in categories used by the category switcher. |

All three of `{{APP_NAME}}`, `{{APP_LABEL}}`, `{{APP_COLOR}}` appear inside a single inline `<script>` block
(near the bottom of the file) that assigns them to top-level `const`s so that every later script can read
them. `{{JS_DIR}}` and `{{SCRIPT_TAGS}}` and `{{BUILTIN_APPS_JS}}` appear only in the footer script block
(see §3).

---

## 3. Script load order (critical)

At the very bottom of `<body>`, the template declares scripts in **exactly this order**:

```html
<script src="https://www.youtube.com/iframe_api"></script>
<script>
  // Identifies this page to the shared engine (app.js): namespaces
  // localStorage + the export-folder IndexedDB store, and drives branding.
  const APP_NAME  = '{{APP_NAME}}';
  const APP_LABEL = '{{APP_LABEL}}';
  const APP_COLOR = '{{APP_COLOR}}';
</script>
<script src="{{JS_DIR}}page-template.js"></script>
{{SCRIPT_TAGS}}
{{BUILTIN_APPS_JS}}
<script src="app.js"></script>
```

Load order and **why it matters**:

1. **YouTube `iframe_api`** — loads the IFrame Player API (defines `YT` and the global `onYouTubeIframeAPIReady`
   hook). Required before any playlist player iframe is constructed.
2. **Inline `APP_NAME` / `APP_LABEL` / `APP_COLOR`** — defines the three branding/namespace globals as
   `const`s. These must exist *before* `app.js` evaluates, because `app.js` reads them at module-init time
   to namespace storage and set colors.
3. **`{{JS_DIR}}page-template.js`** — assigns `window.PAGE_TEMPLATE = "<!DOCTYPE …>"`. This is the runtime
   string copy of the entire page HTML. `app.js` (and the "Create category…" feature) rely on
   `window.PAGE_TEMPLATE` existing *before* `app.js` runs.
4. **`{{SCRIPT_TAGS}}`** — the three seed/config files for this category. They populate the in-memory data
   model (collections, watched set, playlists). `app.js` reads these globals at init, so they must load
   first.
5. **`{{BUILTIN_APPS_JS}}`** — defines `window.__BUILTIN_APPS__`, the registry of built-in categories used
   by the sidebar category switcher. `app.js` consumes this at init to render the switcher.
6. **`app.js`** — the shared engine. It runs **last** and assumes *all* of the above already exist: the
   `APP_*` globals, `window.PAGE_TEMPLATE`, the seed data from `{{SCRIPT_TAGS}}`, and
   `window.__BUILTIN_APPS__`.

**Why order is non-negotiable:** scripts are parsed and executed in document order, and `app.js` performs
its initialization at load (top-level) rather than deferring. If any earlier global is missing —
`APP_NAME`, `window.PAGE_TEMPLATE`, the seed configs, or `window.__BUILTIN_APPS__` — `app.js` will throw or
render an empty/broken page. The three seeds, `PAGE_TEMPLATE`, and `__BUILTIN_APPS__` **must exist before
`app.js` evaluates at module-init.**

---

## 4. Layout regions in the template

The template defines the full UI shell. Regions (by `id` / class):

### Topbar (`#topbar` … `.topbar`)
- `.logo` — app icon + `TholsStudio` title and `#appSubtitle` (set from `APP_LABEL`/color at runtime).
- `.search-bar` — `#searchInput` with `oninput="handleSearch()"` (global search across videos/channels/notes).
- `.topbar-actions` — `#openImportModal()` (Import) and `#openAddModal()` (Add Video) buttons.

### Sidebar (`#sidebar` … `.sidebar`)
- `#sidebarResizer` — draggable width handle (resets on double-click).
- **Library section** (`#librarySection`) — fixed filters: All Videos, Recently Added, Watched
  (`filterByCollection(...)`), each with a live count badge (`#count-all`, `#count-recent`, `#count-watched`).
- **Collections section** (`#collectionsSection`) — `#collectionsList` (rendered at runtime) + "New collection"
  (`startNewCollection()`).
- **Playlists section** (`#playlistsSection`) — `#playlistsList` (rendered at runtime) + "New playlist"
  (`openPlaylistModal()`).
- `.sidebar-footer#categorySwitcher` — pinned category switcher (built from `window.__BUILTIN_APPS__`).

### Playlist split-view (`#playlistView` … `.playlist-view`, `display:none` by default)
Shown *instead of* `.main` when a playlist is opened.
- Left: `.pv-list#pvList` — header (`#pvDot`, `#pvName`, `#pvCount`), mode buttons
  (`#pvSeqBtn` sequential, `#pvRndBtn` random, `#pvAutoBtn` autoplay), `#pvSearchInput`
  (`pvHandleSearch()`), and `#pvTracks` (track list).
- Right: `.pv-player#pvPlayer` — `#pvCloseBtn` (`closePvView()`) and `#pvIframeContainer` (YT iframe host).

### Main (`#mainView` … `.main`)
- Quick-add location chip (`#quickAddLocation`, `#quickAddLocationDot`, `#quickAddLocationText`) with
  `#locationPicker` dropdown (`toggleLocationPicker()`).
- `.add-url-bar` — `#quickAddInput` + Save button (`quickAdd()`), Enter-to-save.
- Section header (`#sectionTitle`, `#sectionCount`) with `.section-header-right`:
  - export folder location (`#exportLocationWrap`, `#exportLocationLabel`, `clearExportFolder()`),
  - `#browseExportFolder()`, and the `.export-dropdown` menu (`toggleExportMenu()`, `exportData()`,
    `exportCollectionsJs()`, `exportWatchedJs()`, `exportPlaylistJs()`, `exportAllJs()`).
  - view-toggle (`#gridBtn`/`#listBtn` → `setView('grid'|'list')`).
- `#cardsGrid` (`.cards-grid-container`) — runtime-rendered video cards.

### Modals (all `.modal-overlay`, closed via `closeModal(id)` / `closeConfirmModal()`)
- `#addModal` — Add YouTube Video (URL, title, collection, group, note; `saveVideo()`).
- `#collectionModal` — New Collection (`#colorPicker`, `saveCollection()`).
- `#playlistModal` — New Playlist (`#playlistColorPicker`, `savePlaylist()`).
- `#groupModal` — New Group (`saveGroup()`).
- `#exportConfirmModal` — Export confirm (`#exportConfirmTitle/Message/Details`, `confirmExport()`).
- `#importModal` — Import URLs (`#importText`, `#importCollection`, `#importGroup`, `importUrls()`).
- `#moveGroupModal` — Move to Group (`#moveGroupSelect`, `#moveGroupNewInput`, `saveMoveGroup()`).
- `#createCategoryModal` — New Category (`#newCategoryName`, `#categoryColorPicker`, `createCategory()`).
- `#confirmModal` — generic confirm (`#confirmTitle/Message`, `#confirmOkBtn`, `confirmOk()`).

### Toast
- `#toast` — transient status notifications (`.show` class toggled at runtime).

---

## 5. `style.css` — shared stylesheet

`style.css` is the **single shared stylesheet** (~41 KB, no build step) linked directly from every page's
`<head>` (`<link href="style.css" rel="stylesheet">`). It is *not* generated per category — all pages share
the same file.

Key responsibilities:

- **CSS variables (`:root`)** — color/theme tokens consumed throughout the template and engine:
  - Brand/surface: `--bg`, `--surface`, `--surface-hover`, `--surface-raised`, `--border`,
    `--border-subtle`, `--text`, `--text-muted`, `--text-dim`.
  - Accents: `--red`, `--indigo`, `--indigo-bright`, `--indigo-glow`, `--green`, `--green-bright`,
    `--violet-light`, `--amber`.
  - Fonts/shape: `--mono` (`'Space Mono'`), `--sans` (`'Inter'`), `--radius`, `--radius-sm`.
  - (Per-category branding is layered on top via the inline `APP_COLOR`; `--indigo*` are the engine defaults.)
- **Layout** — flex column shell (`body` → `.topbar` + `.app-body`); `.app-body` is a flex row of sidebar +
  main/playlist-view. Sidebar width is driven by `--sidebar-w` and the `.sidebar-resizer` drag handle.
- **Sidebar** — sections, collapsible labels (`.section-chev`), collection dots/counts, drag-and-drop
  states (`.dragging`, `.drag-over-top/bottom`), inline rename, and the pinned **category switcher**
  (`.sidebar-footer`, `.category-toggle-btn`, `.category-menu`).
- **Cards** — `.cards-grid` (auto-fill grid) and `.list-view` variant; `.video-card` thumb/title/note/meta,
  hover/play overlay, drag-and-drop states, and group sections (`.group-header`, `.group-body`).
- **Playlist split-view** — `.playlist-view`, `.pv-list` (track list + mode buttons + search), `.pv-player`
  (iframe host + close button), and `.pv-track` active/drag states.
- **Modals & toasts** — `.modal-overlay`/`.modal` (centered, blurred backdrop, open state), `.field`,
  `.color-picker-row`, and `.toast` (bottom-right, `.show`).
- **Misc** — export dropdown/menu, location picker, scrollbars, empty states.

Because there is no build step, the CSS is authored directly and loaded as-is; the only per-category visual
difference comes from runtime JS applying `APP_COLOR` (template global) on top of these defaults.

---

## 6. Generated `page-template.js` (runtime copy)

`build.js` emits **`page-template.js`** alongside each generated page. Its entire purpose is:

```js
window.PAGE_TEMPLATE = "<!DOCTYPE html> … </html>";
```

This string is the **full HTML of the page itself**, produced by running the template through token
substitution. At runtime, `window.PAGE_TEMPLATE` is the source the engine uses when the user invokes
**"Create category…"** (`#createCategoryModal` → `createCategory()`): it clones the current page's markup,
re-applies the new category's tokens, and downloads the 4 starter files (new page + 3 config/seed files).

So the relationship is circular-by-design and is why the template is the single source of truth:

> `page-template.html` → (build.js, with tokens) → `page-template.js` (`window.PAGE_TEMPLATE`) → used at
> runtime by "Create category…" to spawn the next category's page, which itself embeds its own
> `page-template.js`.

The file is loaded early (step 3 in §3) so `window.PAGE_TEMPLATE` is guaranteed present before `app.js`
initializes.


# ============ FILE: phase1-appjs.md ============

# TubeVault / TholsStudio — `app.js` Core Engine (Phase 1)

Client-side YouTube vault shared engine (~3260 lines, single file). Drives every TholsStudio category page (Music, Electronics, Astrology, etc.). Namespaces localStorage and the export-folder IndexedDB store per app via `APP_NAME`, and loads defaults (`DEFAULT_COLLECTIONS`, `DEFAULT_PLAYLISTS`, `COLLECTION_COLORS`, `WATCHED_VIDEO_IDS`) supplied by each page's injected `collections.js` / `playlist.js` / `watched.js` scripts plus the inline `APP_NAME` / `APP_LABEL` / `APP_COLOR` block.

---

## 1. Top-of-file globals

### `STORAGE_KEY` (app.js:12)
Namespaced localStorage key. If `APP_NAME` is undefined, falls back to `'default'`.
```js
const STORAGE_KEY = 'tholsstudio_' + (typeof APP_NAME !== 'undefined' ? APP_NAME : 'default');
```

### Initial `state` shape (app.js:14-24)
Loaded from localStorage, or seeded from the page defaults:
```js
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
  videos: [],
  collections: DEFAULT_COLLECTIONS.map(c => ({ id: c.id, name: c.name, color: c.color })),
  playlists: DEFAULT_PLAYLISTS.map(p => ({ id: p.id, name: p.name, color: p.color, videoIds: [...p.videoIds] })),
  selectedColor: COLLECTION_COLORS[0],
  lastUsedCollection: '',
  lastUsedGroup: '',
  videoOrder: {},
  watchedIds: [],   // YouTube videoId strings of watched videos
  expandedGroups: [],
};
```
- `videos[]` — flat list of library entries, each `{ id, url, videoId, playlistId?, title, channel, note, collection, group, added, watched }`.
- `collections[]` — `{ id, name, color }` only (nested video data lives flattened in `videos`).
- `playlists[]` — `{ id, name, color, videoIds: [...] }` (internal video ids).
- `videoOrder` — `key -> [videoId...]` map; key = `` `${colId}__${groupName}` `` sanitized via `/[^a-z0-9_]/gi` → `_` (ungrouped uses `` `${colId}__` ``).
- `watchedIds` — YouTube videoId strings (not internal ids) so watched state survives re-seeding.
- `expandedGroups` — array of group/collection keys currently expanded.
- `lastUsedCollection` / `lastUsedGroup` — drive quick-add target + the "Saving to:" label.

### Migration guards (app.js:26-42)
Applied after load to keep old saved states compatible:
- `lastUsedCollection` — if `undefined`, set `''`.
- `lastUsedGroup` — if `undefined`, set `''`.
- `videoOrder` — if falsy, set `{}`.
- `watchedIds` — if missing, **built from existing `video.watched` flags** (migrates legacy `watched` bool to the id list):
  ```js
  state.watchedIds = state.videos.filter(v => v.watched && v.videoId).map(v => v.videoId);
  ```
- `playlists` — if missing, **seeded from `DEFAULT_PLAYLISTS`** (playlist.js).
- Playlist colors — any playlist without `color` gets `COLLECTION_COLORS[i % COLLECTION_COLORS.length]`.
- `expandedGroups` — if missing, set `[]`.

### Other module-level globals
- `currentFilter` (`'all'` | `'recent'` | `'watched'` | collection id | `'playlist:<id>'`) — app.js:44.
- `currentView` (`'grid'` | `'list'`) — app.js:45.
- `searchQuery`, `newGroupColId` — app.js:46-47.
- `pvState` (split-view player state) — app.js:2576.
- `ytPlayer`, `ytReady` — YT IFrame API handles — app.js:2595-2596.
- `exportFolderHandle`, `_exportCallback`, `_confirmCallback` — app.js:1707, 1784, 2278.

### `save()` (app.js:49-51)
```js
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

---

## 2. YouTube helpers (app.js:56-110)

### `extractVideoId(url)` — app.js:56
Returns an 11-char YouTube video id or `null`. Tries `URL` parsing first (youtu.be, youtube.com shorts, `?v=`), then a fallback regex.
```js
function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1).split('/')[0];
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
      const v = u.searchParams.get('v');
      if (v) return v;
    }
  } catch {}
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
```

### `extractPlaylistId(url)` — app.js:78
Returns the `list=` query-param value or `null` (regex fallback `/[?&]list=([A-Za-z0-9_-]+)/`).

### `getThumbnail(videoId)` — app.js:89
Returns `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`.

### `getWatchUrl(videoId, playlistId)` — app.js:93
Returns `https://www.youtube.com/watch?v=${videoId}` or with `&list=${playlistId}` when a playlist id is passed.

### `isYouTubeUrl(url)` — app.js:99
```js
return url && (url.includes('youtube.com') || url.includes('youtu.be'));
```

### `generateId()` — app.js:103
`Date.now().toString(36) + Math.random().toString(36).slice(2, 6)` — unique internal id (distinct from YouTube `videoId`).

### `formatDate(ts)` — app.js:107
`new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`.

---

## 3. Sidebar (app.js:115-457)

### `renderSidebar()` — app.js:115
Builds the **Library** section (All Videos / Recently Added / Watched with live counts) + **Collections** list. Per collection button: collection dot, drag handle, name, count, and action buttons (add-to-playlist, rename, delete). `makeSortable` is wired for drag-reorder (with `onDrop`/`onDropToEnd` splices on `state.collections`). Also refreshes `#addCollection`/`#importCollection` selects and calls `renderPlaylistsSidebar()` + `renderQuickAddLocation()`. Counts: `count-all` = all videos; `count-recent` = added within 7 days; `count-watched` = `v.watched`.

### Inline rename — `startRename` / `confirmRename` / `cancelRename` (app.js:319, 353, 370)
- `startRename(e, colId)` — replaces the sidebar button HTML with an `<input class="col-rename-input">` (+ ✓ confirm button); disables `draggable`.
- `handleRenameKey(e, colId)` (app.js:348) — Enter commits, Escape cancels.
- `confirmRename(e, colId)` — trims, skips if empty, updates `col.name`, `save()`, re-renders. `cancelRename(colId)` — just re-renders.
- Playlist rename mirrors this: `startPlaylistRename` / `handlePlaylistRenameKey` / `confirmPlaylistRename` / `cancelPlaylistRename` (app.js:378, 405, 410, 426).

### `deleteCollection(e, colId)` — app.js:430
Confirm modal → filters out all videos with `v.collection === colId`, removes the collection, resets `currentFilter` to `'all'` if needed, `save()` + re-render.

### Drag-reorder via `makeSortable` (sidebar) (app.js:167-193)
`makeSortable(list, '.sidebar-item.draggable', { dragClass:'dragging', overTopClass:'drag-over-top', overBottomClass:'drag-over-bottom', wasDraggingClass:'was-dragging', stopPropagation:true, onDrop, onDropToEnd })` — both handlers `splice` the moved item into the new index and re-render.

### `renderPlaylistsSidebar()` — app.js:216
Builds the **Playlists** section. Each playlist button: dot (fallback `#78909C`), drag handle, count (filtered to videos that still exist), and actions (rename, clear, delete). Active state when `currentFilter === 'playlist:<id>'`. Wired to `makeSortable` for reorder (app.js:266-290). Click → `filterByCollection('playlist:<id>', btn)`, which routes to `openPlaylistView` (split view).

### `renderQuickAddLocation()` — app.js:298
Updates `#quickAddLocationText` / `#quickAddLocationDot` to show the resolved "Saving to: <collection>/<group>" (or Uncollected) based on `lastUsedCollection`/`lastUsedGroup`.

### `getGroupsForCollection(colId)` — app.js:447
Returns sorted unique group names from `state.videos` (where `v.collection === colId && v.group`) merged with `state.pendingGroups[colId]` (groups created with no videos yet).

### `refreshGroupSelect(collectionSelectId, groupSelectId)` — app.js:459
Repopulates a group `<select>` from `getGroupsForCollection(currentCollectionValue)`, keeping a leading "— No group —" option.

---

## 4. Cards (app.js:471-750)

### `getFilteredVideos()` — app.js:471
Clones `state.videos`, then filters by `currentFilter`:
- `'all'` → no filter; `'recent'` → `now - v.added < 7*24*3600*1000`; `'watched'` → `v.watched`; otherwise `v.collection === currentFilter`.
- If `searchQuery` set, case-insensitive match on `title`, `channel`, `note`, `group`, `url`.
- Returns sorted by `b.added - a.added` (newest first).

### `renderCards()` — app.js:494
- Single-collection view (`currentFilter` is a collection id): calls `renderGroupedByTitle(vids, currentFilter, colColor)`.
- Multi-collection views (`all`/`recent`/`watched`): iterates `state.collections` in sidebar order, calling `buildCollectionBlock(...)` per collection that has videos (so drag-reorder is reflected), then an `Uncollected` block (`__none__`) last. `watched` view forces `expanded = true`.
- Empty state shown when no videos. Finally calls `attachCardDrag()`.

### `buildCollectionBlock(colId, colName, colColor, colVids, isFirst, expanded)` — app.js:553
Wraps a collection in a collapsible `group-section` (`toggleGroup`) and delegates to `renderGroupedByTitle(colVids, colId, colColor, true, expanded)`.

### `renderGroupedByTitle(vids, colId, colColor, nested=false, expanded=false)` — app.js:577
- Splits videos into `grouped{}` (by trimmed `v.group`) and `ungrouped[]`.
- For top-level (non-nested) calls, injects empty **pending groups** from `state.pendingGroups[colId]` so they appear even with 0 videos.
- Per group: order key = `` `${colId}__${gName}`.replace(/[^a-z0-9_]/gi,'_') ``; if `state.videoOrder[orderKey]` exists, sorts group videos by it (unknown ids → `9999`, appended last).
- Ungrouped videos likewise ordered by `` `${colId}__` `` key.
- Renders group headers with actions: `openGroupPlaylistPicker`, `renameGroupPrompt`, `deleteGroupPrompt`.
- Appends an "Add group" button only when not nested.

### `renderCard(v)` — app.js:683
Renders a single `.video-card` with: thumbnail (`getThumbnail`, lazy + placeholder fallback), play overlay (`getWatchUrl` + `markWatched` on click), collection/group breadcrumb tag (only in multi-collection views), editable title (`startTitleEdit`), channel, note, and the action bar:
- `openMoveGroupModal` (move to group)
- `toggleNote` (edit note)
- `copyUrl` (copy URL)
- `toggleWatched` (watched eye toggle; filled icon when watched)
- `openPlaylistPicker` (add to playlist)
- `deleteVideo` (delete)
- `card-date` via `formatDate(v.added)`.

### `attachCardDrag()` + `saveCardOrder(grid)` — app.js:2540, 2559
`attachCardDrag` calls `makeSortable(grid, ':scope > .video-card', {...})` per `.cards-grid`, and on drop reorders the DOM then calls `saveCardOrder`. `saveCardOrder` reads the card ids in DOM order, derives `colId`/`group` from the first card, builds the sanitized key, stores the order in `state.videoOrder[key]`, and `save()`.

---

## 5. Collections / Groups (app.js:447-857)

### `slugifyCollectionName(name)` — app.js:1262
Lowercases and replaces non-alphanumerics with `-`, trims hyphens (fallback `'collection'`), then appends `-2`, `-3`, … until unique against `state.collections` ids.
```js
let base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
if (!base) base = 'collection';
let id = base, n = 2;
while (state.collections.some(c => c.id === id)) { id = `${base}-${n}`; n++; }
return id;
```

### `saveCollection()` — app.js:1277
Pushes `{ id: slugifyCollectionName(name), name, color: state.selectedColor }`, `save()`, re-render.

### `saveGroup()` (via `openGroupModal`/`newGroupColId`) — app.js:770, 777
Adds the new group name to `state.pendingGroups[newGroupColId]` (creates the array if needed), prevents duplicates, `save()`, re-render. Pending groups let empty groups exist before any video is assigned.

### `renameGroupPrompt(colId, oldName)` — app.js:792
Prompts for a new name; rewrites `v.group` on every matching video and updates `state.pendingGroups[colId]`; re-renders and `refreshGroupSelect('addCollection','addGroup')`.

### `deleteGroupPrompt(colId, groupName)` — app.js:806
Confirm → removes all videos in that group (and the pending-group entry), `save()` + re-render.

### `openMoveGroupModal(videoId)` / `saveMoveGroup()` — app.js:823, 842
`openMoveGroupModal` populates `#moveGroupSelect` from `getGroupsForCollection` + pending groups (pre-selecting the video's current group) plus a "new group" input. `saveMoveGroup` sets `v.group = newGroupInput || selected`, registers it as a pending group if it's new, `save()`, re-render.

### `getGroupsForCollection` / `refreshGroupSelect`
Documented in §3.

---

## 6. Playlists (app.js:1345-1632)

### `savePlaylist()` — app.js:1372
Validates non-empty + case-insensitive name uniqueness, pushes `{ id: generateId(), name, color: state.selectedPlaylistColor, videoIds: [] }`, `save()`, re-render. Color picker avoids already-used colors.

### `addVideoToPlaylist(videoId, playlistId)` — app.js:1426
If `!isVideoInPlaylist(pl, v)`, pushes `videoId` and `save()`. Closes any open `.playlist-picker`.

### `removeVideoFromPlaylist(videoId, playlistId)` — app.js:1441
Filters the playlist's `videoIds`, removing the internal id **and** any other entry whose underlying YouTube `videoId` matches (covers legacy duplicates). Re-renders; toast.

### `isVideoInPlaylist(pl, v)` — app.js:1417
Matches **by internal id OR by YouTube videoId**:
```js
function isVideoInPlaylist(pl, v) {
  if (!pl || !v) return false;
  return pl.videoIds.some(id => {
    if (id === v.id) return true;
    const ev = state.videos.find(ev => ev.id === id);
    return !!(ev && v.videoId && ev.videoId === v.videoId);
  });
}
```
**Why:** the same YouTube video can be saved as two separate library entries (e.g. in two collections). Matching only by internal id would allow it to be added twice to one playlist under different ids; matching on the YouTube `videoId` collapses that. The same logic is mirrored in `removeVideoFromPlaylist` and `remapPlaylistIds`.

### `openGroupPlaylistPicker(e, colId, groupName)` / `addGroupToPlaylist(colId, groupName, playlistId)` — app.js:1460, 1506
Floating `.playlist-picker` listing every playlist with an all-in / partial ("Add remaining") / add-all state (computed via `isVideoInPlaylist`). `addGroupToPlaylist` adds each group member not already present; re-render; toast.

### `openCollectionPlaylistPicker(e, colId)` / `addCollectionToPlaylist(colId, playlistId)` — app.js:1522, 1567
Same pattern across all videos in a collection.

### `openPlaylistPicker(videoId, anchorEl)` — app.js:1584
Floating picker anchored to a card's "+" button; clicking a playlist toggles add/remove (toggles `addVideoToPlaylist` / `removeVideoFromPlaylist`).

### `clearPlaylist(id)` — app.js:1385
Empties `pl.videoIds` (no-op toast if already empty), `save()` + re-render.

### `deletePlaylist(id)` — app.js:1397
Confirm → removes the playlist; if it was the active filter, resets to `'all'`.

---

## 7. Playlist split-view player (app.js:2576-2909)

### `openPlaylistView(plId)` — app.js:2603
Sets `pvState.plId`, builds order (`pvBuildOrder`), shows `#playlistView` and hides `#mainView` + `#sidebar`, renders the list, and auto-plays index 0.

### `pvBuildOrder(pl)` — app.js:2629
Filters `pl.videoIds` to existing videos; if `mode === 'random'`, Fisher–Yates shuffles a copy; stores result in `pvState.order`.

### `pvRenderList()` — app.js:2640
Sets header meta (dot, name, count), toggles the `sequential`/`random` mode buttons, and renders `#pvTracks` rows. A `pvSearchQuery` filters which rows are **shown** but does **not** alter `pvState.order` (so indices stay valid). Each row: drag handle, number, play icon, thumbnail, title + collection/group path. Calls `pvAttachTrackDrag()`.

### `pvTrackClick(event, i)` — app.js:2706
Suppresses the click if the row has `was-dragging` class (set by `makeSortable`), otherwise calls `pvPlayIndex(i)`.

### `pvAttachTrackDrag()` — app.js:2715
`makeSortable(tracks, '.pv-track', { wasDraggingClass:'was-dragging', ... })`. `onDrop`/`onDropToEnd` splice `pvState.order` and carefully adjust `pvState.index` (the currently playing track) to follow the moved item; then `pvSaveOrderToPlaylist()` + re-render.

### `pvPlayIndex(i)` — app.js:2790
Sets `pvState.index`, resolves the video, calls `markWatched`, then plays via the best available path (in priority order):
1. If `ytPlayer.loadVideoById` exists → `ytPlayer.loadVideoById(v.videoId)`.
2. Else if `ytReady && window.YT.Player` → create `new window.YT.Player('ytPlayerEl', { videoId, playerVars:{autoplay:1,rel:0,modestbranding:1}, events:{ onReady→playVideo, onStateChange: onYtPlayerStateChange } })`.
3. Else → inject a plain `<iframe …embed/${v.videoId}?autoplay=1&enablejsapi=1>` fallback; if the IFrame API later becomes ready, a `setInterval` (500ms, 15s cap) upgrades the iframe to a `YT.Player`.
Also highlights the active row and scrolls it into view.

### `onYtPlayerStateChange(event)` — app.js:2858
If `event.data === 0` (YT `ENDED`) and `pvState.autoplay`, advances to `pvState.index + 1`.

### `pvSetMode(mode)` — app.js:2875
Switches `sequential`/`random`, rebuilds order, resets index to 0, re-renders, and replays index 0.

### `pvToggleAutoplay()` — app.js:2868
Flips `pvState.autoplay` and toggles the button's `active` class.

### `pvSaveOrderToPlaylist()` — app.js:2762
Writes `pl.videoIds = [...pvState.order]` and `save()`. If the playlist matches a `DEFAULT_PLAYLISTS` entry, also writes back `defPl.videoIds` and a rebuilt `defPl.videos` array (full video details + `collectionPath`).

### `closePvView(restoreAll)` — app.js:2885
Hides split view, restores main/sidebar, stops + destroys `ytPlayer`, clears `#pvIframeContainer`, nulls `pvState.plId`. If `restoreAll === false` (called from `filterByCollection`), it stops there without changing the filter; otherwise it resets `currentFilter='all'` and re-renders.

---

## 8. Export (app.js:1654-2164, plus 1784-1802)

### Export-folder persistence (IndexedDB `TubeVaultExportFolders`)
- `DB_NAME`/`DB_VERSION`/`DB_STORE` constants — app.js:1654-1656.
- `openExportFolderDb()` — opens the DB (creates `folders` store on upgrade) — app.js:1658.
- `saveExportFolderHandle(appName, handle)` / `loadExportFolderHandle(appName)` / `clearExportFolderHandle(appName)` — put/get/delete the `FileSystemDirectoryHandle` keyed by app name — app.js:1667, 1681, 1696.
- `browseExportFolder()` — calls `showDirectoryPicker`, stores handle, persisting it — app.js:1709. `clearExportFolder()` — app.js:1728.
- `restoreExportFolder()` — app.js:1736: reloads the saved handle and re-requests permission (`queryPermission`/`requestPermission`); activates it if granted, else clears it.

### `saveToFolderOrDownload(filename, text, mimeType)` — app.js:1759
If `exportFolderHandle` is set, writes via `getFileHandle(filename,{create:true})` → `createWritable()` → `write` → `close()` (returns `true`). On any error, falls back to a Blob download (`URL.createObjectURL` + temporary `<a download>`), returns `false`.

### `exportData()` — app.js:1804
Confirm → `saveToFolderOrDownload('tubevault-export.json', JSON.stringify(state, null, 2), 'application/json')` (full state dump).

### `buildCollectionsJsExport()` — app.js:1822
Serializes the live vault back into the nested `collections.js` format (collection → groups → ungrouped videos):
- Emits a `COLLECTION_COLORS` block (chunked rows of 4 via `chunk`).
- Per collection, groups videos by `v.group`, applies any saved drag order from `state.videoOrder`, and emits `groups: { "Name": [video,...] }` + `ungrouped: [...]`. Videos omit `collection`/`group` (implied by nesting).
- An `Uncollected` pseudo-collection (`id:'__none__'`, `color:'var(--text-dim)'`) captures videos with no collection.
- Returns `{ fileName: <appName>-collections.js, fileContents, details }`. Helpers: `videoEntry`, `videoArray`, `chunk` (app.js:1998), `jsStr` (single-quoted literal escaper, app.js:2005).

### `buildWatchedJsExport()` — app.js:2009
Collects unique YouTube `videoId`s from watched videos **plus** any `state.watchedIds` not already present (covers deleted videos). Emits `const WATCHED_VIDEO_IDS = [...]` with inline title comments. Returns `{ fileName: <appName>-watched.js, fileContents, n }`.

### `buildPlaylistJsExport()` — app.js:2070
For each playlist, resolves `videoIds` → full video objects (with optional `collectionPath` = "Collection / Group"), and emits `const DEFAULT_PLAYLISTS = [{ id, name, color, videoIds:[...], videos:[...] }]`. Returns `{ fileName, fileContents, details, n, totalVideos }`.

### `exportAllJs()` — app.js:2142
Confirm → calls `doExportCollectionsJs()`, then `setTimeout` `doExportPlaylistJs` (+300ms) and `doExportWatchedJs` (+600ms). Each `*Js`/`doExport*Js` pair first shows a `showExportConfirm` summary then writes via `saveToFolderOrDownload`.

### Confirm-modals wiring
`showExportConfirm(title, message, details, callback)` (app.js:1786) sets `_exportCallback` and opens `#exportConfirmModal`; `confirmExport()` (app.js:1798) runs the callback. (`showConfirm`/`confirmOk` — app.js:2280/2288 — is the delete/confirm modal used elsewhere.)

---

## 9. Seed + init (app.js:2326-3260)

### `seedData()` — app.js:2332
Runs only if `state.videos.length === 0`. Flattens the nested `DEFAULT_COLLECTIONS` into flat `state.videos` entries:
```js
DEFAULT_COLLECTIONS.forEach(col => {
  Object.entries(col.groups || {}).forEach(([groupName, videos]) => {
    videos.forEach(v => {
      state.videos.push({
        id: generateId(),
        ...v,
        collection: col.id,
        group: groupName,
        added: baseTime - Math.random() * 5 * 24 * 3600 * 1000,
        watched: false,
      });
    });
  });
  (col.ungrouped || []).forEach(v => {
    state.videos.push({ id: generateId(), ...v, collection: col.id, group: '', added: ..., watched: false });
  });
});
```
Then, if `WATCHED_VIDEO_IDS` is defined, marks matching videos watched and backfills `state.watchedIds`. Finally calls `remapPlaylistIds()` and `save()`.

### `remapPlaylistIds()` — app.js:2372
Maps YouTube `videoId` → internal id (`ytIdMap`), then for each playlist:
- If a matching `DEFAULT_PLAYLISTS` entry has `videos`, remaps via `ytIdMap[dv.videoId]`, de-duped with `[...new Set(...)]`.
- Else keeps only `videoIds` that still resolve to a `state.videos` entry; if none but raw ids look like YouTube ids, remaps by `videoId`.
- Final safety net: de-dupe by internal id **and** by underlying YouTube `videoId` (catches legacy duplicate library entries).

### `applyAppBranding()` — app.js:3216
Uses `APP_NAME`/`APP_LABEL`/`APP_COLOR` (from the page's inline block) to set `document.title`, the `#appSubtitle`, the `--indigo` CSS variable, and the logo-icon background.

### INIT block (app.js:3248-3260) — call order
```js
applyAppBranding();        // title / logo / accent
seedData();                // first-load flatten + playlist remap
restoreExportFolder();     // re-acquire saved folder handle
renderSidebar();           // library + collections + playlists
renderCards();             // main grid (grouped)
renderCategorySwitcher();  // bottom category menu (sync fallback)
updateExportMenuLabels();  // app-prefixed export filenames
// async: upgrade switcher from categories.json when served over HTTP
getAppsRegistryAsync().then(apps => renderCategorySwitcher(apps));
```
(Other init-time side effects run earlier as IIFEs: the sidebar resizer at app.js:2404, the `.modal-overlay` click-to-close at app.js:2308, and the export-menu outside-click closer at app.js:2270.)

---

## 10. Shared drag helper `makeSortable(container, itemSelector, opts)` (app.js:2463)

One helper reused for **sidebar collections**, **sidebar playlists**, **cards**, and **playlist tracks**. Behaviour:
- Makes every matched item `draggable=true` and wires `dragstart`/`dragend`/`dragover`/`dragleave`/`drop`.
- `dragstart` sets `srcEl`, adds `dragClass`, sets `dataTransfer` (`effectAllowed:'move'`, `'text/plain':'sortable-drag'`), and re-adds `dragClass` on a `setTimeout(0)` so the drag ghost is a clean snapshot.
- `dragover` (per item) prevents default and, based on cursor Y vs the item midpoint, adds `overTopClass` (`e.clientY < midY`) or `overBottomClass`.
- `drop` (per item) computes `position` (`'top'`|`'bottom'`) and calls `opts.onDrop(dragged, target, position)`; `opts.stopPropagation` stops the event from bubbling.
- `dragend` removes `dragClass`, adds `wasDraggingClass` (so the subsequent click is suppressed), and clears indicators — **this `was-dragging` class is the click-suppression mechanism** used by all four consumers (`renderSidebar` click handler, playlist sidebar click, `pvTrackClick`, card clicks).
- A container-level `dragover`/`drop` catches drops on empty space and calls `opts.onDropToEnd(dragged)` when `srcEl` is still set.

```js
function makeSortable(container, itemSelector, opts) {
  opts = opts || {};
  const dragClass = opts.dragClass || 'sortable-dragging';
  const overTopClass = opts.overTopClass || 'sortable-over-top';
  const overBottomClass = opts.overBottomClass || 'sortable-over-bottom';
  const wasDraggingClass = opts.wasDraggingClass || null;
  let srcEl = null;

  function clearIndicators() {
    container.querySelectorAll('.' + overTopClass + ', .' + overBottomClass)
      .forEach(el => el.classList.remove(overTopClass, overBottomClass));
  }
  function items() { return Array.from(container.querySelectorAll(itemSelector)); }

  items().forEach(item => {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
      srcEl = item;
      item.classList.add(dragClass);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'sortable-drag');
      setTimeout(() => item.classList.add(dragClass), 0);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove(dragClass);
      if (wasDraggingClass) item.classList.add(wasDraggingClass);
      clearIndicators();
      srcEl = null;
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!srcEl || srcEl === item) return;
      clearIndicators();
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      item.classList.add(e.clientY < midY ? overTopClass : overBottomClass);
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (opts.stopPropagation) e.stopPropagation();
      clearIndicators();
      if (!srcEl || srcEl === item) return;
      const rect = item.getBoundingClientRect();
      const position = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
      const dragged = srcEl; srcEl = null;
      if (opts.onDrop) opts.onDrop(dragged, item, position);
    });
  });

  container.addEventListener('dragover', (e) => e.preventDefault());
  container.addEventListener('drop', (e) => {
    if (!srcEl) return;
    const dragged = srcEl; srcEl = null;
    clearIndicators();
    if (opts.onDropToEnd) opts.onDropToEnd(dragged);
  });
}
```

Reused at:
- `renderSidebar` — collections list (app.js:167).
- `renderPlaylistsSidebar` — playlists list (app.js:266).
- `attachCardDrag` — `.cards-grid > .video-card` (app.js:2542).
- `pvAttachTrackDrag` — `.pv-track` (app.js:2719).

---

## Appendix — cross-cutting notes
- **Escaping:** `escHtml` (app.js:859) escapes `& < > "`; `escAttr` (app.js:862) escapes `'` and `"` for inline `onclick` attributes.
- **`generateId` vs `videoId`:** internal `id` (random) is the playlist/videos join key; YouTube `videoId` is the stable dedupe/watched key (see `isVideoInPlaylist`, `quickAdd` duplicate check, `remapPlaylistIds`).
- **All app.js functions documented above are existing in the file; no APIs were invented.**


# ============ FILE: phase2-buildjs.md ============

# TubeVault / TholsStudio — Phase 2 Implementation Doc: The Build Script (`build.js`)

## 1. Title & Purpose

**File:** `youtube/build.js` (~243 lines, run as `node build.js`)

`build.js` is the static-site generator for the TubeVault / TholsStudio YouTube
vault. It is **plain Node.js with zero third-party dependencies** (`fs` and `path`
only) so that the build can run anywhere Node runs and so the output ships as
fully static pages on GitHub Pages.

It takes a single HTML template and a JSON manifest and emits:

- One self-contained HTML page per category (the `.html` lives at the repo root).
- Each category's supporting JS in a `<id>/` subfolder (config seeds + a
  `page-template.js` mirror of the template so the in-browser "Create category…"
  feature can reuse the exact same markup on GitHub Pages **and** via `file://`).
- A self-contained feature-test page (`tests.html` + `test/` folder) that
  preserves hand-maintained fixtures.

The template (`page-template.html`) is the single source of truth for page
markup; `categories.json` is the single source of truth for *which* pages exist.

---

## 2. Inputs

### 2.1 `page-template.html` — the `{{...}}` tokens

| Token | Substituted with |
|-------|------------------|
| `{{APP_NAME}}` | `app.id` (the category id, e.g. `music`) |
| `{{APP_LABEL}}` | `app.label` (display name; falls back to id) |
| `{{APP_COLOR}}` | `app.color` (hex brand color; default `#5C6BC0`) |
| `{{JS_DIR}}` | `app.dir` (the `<id>/` subfolder, so seeds resolve relative to the page) |
| `{{SCRIPT_TAGS}}` | the three per-category seed `<script src=...>` tags (see §4) |
| `{{BUILTIN_APPS_JS}}` | a single inline `<script>` defining `window.__BUILTIN_APPS__` (see §6) |

These appear in the template footer (lines 464–471 of `page-template.html`):

```html
<script>
  const APP_NAME  = '{{APP_NAME}}';
  const APP_LABEL = '{{APP_LABEL}}';
  const APP_COLOR = '{{APP_COLOR}}';
</script>
<script src="{{JS_DIR}}page-template.js"></script>
{{SCRIPT_TAGS}}
{{BUILTIN_APPS_JS}}
<script src="app.js"></script>
```

Note: `{{BUILTIN_APPS_JS}}` is injected **before** `app.js`, so the in-app
category switcher has its `file://` fallback list available at startup.

### 2.2 `categories.json` — the manifest

Shape consumed by `loadCategories()`:

```json
{
  "collections": [
    { "id": "music",   "name": "Music",   "color": "#5C6BC0" },
    { "id": "gaming",  "name": "Gaming",  "color": "#EF5350" }
  ]
}
```

`groups` / `ungrouped` (present in the *runtime* collections file) are **ignored**
here — only `id`, `name`, and `color` drive the build. `name` and `color` are
optional and default to the id / `#5C6BC0` respectively. The parser also accepts a
bare top-level array (`[ { id, name, color } ]`) for convenience.

---

## 3. `loadCategories()`

Reads `categories.json`, validates it, and returns the validated `apps` array.

- **Missing file** → `console.error` + `process.exit(1)` (non-zero).
- **Invalid JSON** → `console.error` + `process.exit(1)`.
- **No `"collections"` array** (and not a bare array) → `process.exit(1)`.
- Each entry's `id` must match `/^[a-z0-9-]+$/i`. Invalid ids are `console.warn`'d
  and **skipped**, not fatal.
- If **no valid categories** remain → `process.exit(1)`.

```js
function loadCategories() {
  if (!fs.existsSync(CATEGORIES_FILE)) {
    console.error('ERROR: categories.json not found next to build.js');
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
  } catch (e) {
    console.error('ERROR: categories.json is not valid JSON: ' + e.message);
    process.exit(1);
  }
  const list = Array.isArray(data) ? data : data.collections;
  if (!Array.isArray(list)) {
    console.error('ERROR: categories.json must contain a "collections" array');
    process.exit(1);
  }
  const apps = [];
  list.forEach((c, idx) => {
    const id = c.id;
    const label = c.name || id;
    const color = c.color || '#5C6BC0';
    if (!id || !/^[a-z0-9-]+$/i.test(id)) {
      console.warn(`! Skipping invalid category on entry ${idx + 1}: "${id}"`);
      return;
    }
    apps.push({ id, label, color });
  });
  if (!apps.length) {
    console.error('ERROR: categories.json contained no valid categories');
    process.exit(1);
  }
  return apps;
}
```

---

## 4. `configScriptTags(id, dir)`

Emits the three seed `<script>` tags that load the per-category config files.
`dir` defaults to `''` when not supplied.

```js
function configScriptTags(id, dir) {
  dir = dir || '';
  return [
    `<script src="${dir}${id}-collections.js"></script>`,
    `<script src="${dir}${id}-playlist.js"></script>`,
    `<script src="${dir}${id}-watched.js"></script>`,
  ].join('\n');
}
```

For category `music` with `dir = 'music/'`, this produces:

```html
<script src="music/music-collections.js"></script>
<script src="music/music-playlist.js"></script>
<script src="music/music-watched.js"></script>
```

---

## 5. `render(template, app)`

Performs all token substitutions against the raw template string. `app.dir` is
interpolated into `{{JS_DIR}}` and `{{SCRIPT_TAGS}}`; `{{BUILTIN_APPS_JS}}` pulls
from the **module-level** `BUILTIN_APPS_JS` variable (see §9 gotcha).

```js
function render(template, app) {
  const dir = app.dir || '';
  return template
    .replace(/\{\{APP_NAME\}\}/g, app.id)
    .replace(/\{\{APP_LABEL\}\}/g, app.label)
    .replace(/\{\{APP_COLOR\}\}/g, app.color)
    .replace(/\{\{JS_DIR\}\}/g, dir)
    .replace(/\{\{SCRIPT_TAGS\}\}/g, configScriptTags(app.id, dir))
    .replace(/\{\{BUILTIN_APPS_JS\}\}/g, BUILTIN_APPS_JS);
}
```

Replacements use the `g` flag so multiple occurrences (e.g. comments or the
`appSubtitle`/`categorySwitcher` logic) are all handled.

---

## 6. Seed Builders

### 6.1 `buildCollectionsSeed(app)` — `COLLECTION_COLORS` + one empty default collection

A shared `COLLECTION_COLORS_BLOCK` constant (10 hex swatches) plus a single empty
`DEFAULT_COLLECTIONS` entry keyed to the app's id / name / color. This mirrors the
shape produced by the in-app "Create category…" feature so a freshly built page is
self-sufficient on first load.

```js
const COLLECTION_COLORS_BLOCK = `[
  '#5C6BC0', '#EF5350', '#26A69A', '#FFA726',
  '#66BB6A', '#AB47BC', '#29B6F6', '#FF7043',
  '#78909C', '#EC407A'
]`;

function buildCollectionsSeed(app) {
  return `// ... header comment ...
const COLLECTION_COLORS = ${COLLECTION_COLORS_BLOCK};

const DEFAULT_COLLECTIONS = [
  {
    id: ${JSON.stringify(app.id)},
    name: ${JSON.stringify(app.label)},
    color: ${JSON.stringify(app.color)},
    groups: {},
    ungrouped: []
  }
];
`;
}
```

### 6.2 `buildPlaylistSeed()` — `DEFAULT_PLAYLISTS = []`

```js
function buildPlaylistSeed() {
  return `// ... header comment ...

const DEFAULT_PLAYLISTS = [];
`;
}
```

### 6.3 `buildWatchedSeed()` — `WATCHED_VIDEO_IDS = []`

```js
function buildWatchedSeed() {
  return `// ... header comment ...

const WATCHED_VIDEO_IDS = [];
`;
}
```

### 6.4 `buildBuiltinAppsJs(apps)` — the `{{BUILTIN_APPS_JS}}` payload

Maps the full `apps` list into a compact inline `<script>` that defines
`window.__BUILTIN_APPS__` — the `file://` fallback for the in-app category
switcher. It is sourced from `categories.json` exactly once so it can never drift
from the build manifest.

```js
function buildBuiltinAppsJs(apps) {
  const list = apps.map(a => ({
    id: a.id,
    name: a.label,
    color: a.color,
    file: `${a.id}.html`,
  }));
  return `<script>window.__BUILTIN_APPS__ = ${JSON.stringify(list)};</script>`;
}
```

Output example:

```html
<script>window.__BUILTIN_APPS__ = [{"id":"music","name":"Music","color":"#5C6BC0","file":"music.html"},{"id":"gaming","name":"Gaming","color":"#EF5350","file":"gaming.html"}]</script>
```

---

## 7. `writeCategorySeeds(app)` — skip-if-exists

Writes the three seed files into the category's `<id>/` folder, but **only when
they do not already exist**. Re-running the build therefore never clobbers a
category's curated data.

```js
function writeCategorySeeds(app) {
  const base = path.join(DIR, app.dir);
  const seeds = [
    [`${app.id}-collections.js`, buildCollectionsSeed(app)],
    [`${app.id}-playlist.js`, buildPlaylistSeed()],
    [`${app.id}-watched.js`, buildWatchedSeed()],
  ];
  seeds.forEach(([rel, contents]) => {
    const file = path.join(base, rel);
    if (!fs.existsSync(file)) {
      writeFileEnsureDir(file, contents);
      console.log(`✓ generated ${app.dir}${rel}`);
    } else {
      console.log(`• kept existing ${app.dir}${rel} (preserve)`);
    }
  });
}
```

**Why seeds must not be overwritten:** The `*‑collections.js` / `*‑playlist.js` /
`*‑watched.js` files are *source data*, not build artifacts. They accumulate the
user's real collections, videos, playlists, and watch history inside the app
(localStorage → export → committed). A naive overwrite on every build would erase
all curated data. The skip-if-exists guard makes the build **additive and
non-destructive**: it only supplies starter files the first time a category is
seen. This same philosophy is applied to the `test/` fixtures in `main()` (§9).

---

## 8. `writeFileEnsureDir(file, contents)`

Creates the parent directory tree (recursively) if missing, then writes the file.
Used for any file whose parent folder may not yet exist (`page-template.js`, and
any newly minted seed).

```js
function writeFileEnsureDir(file, contents) {
  const dir = path.dirname(file);
  if (dir && dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, contents);
}
```

---

## 9. `main()` — order of operations

1. **Locate + read the template.** Bail with `process.exit(1)` if
   `page-template.html` is missing.
2. **Load categories** via `loadCategories()` → `APPS`.
3. **Build `BUILTIN_APPS_JS` exactly once** from `APPS` and assign it to the
   *module-level* `let`.
4. **Loop categories:** for each app, set `app.dir = app.id + '/'`, `render()` the
   HTML and write `<id>.html` at root, write `<id>/page-template.js`
   (`window.PAGE_TEMPLATE = JSON.stringify(template)`), then `writeCategorySeeds(app)`.
5. **Build the test page:** a synthetic `testApp` (`id:'test', dir:'test/'`),
   `render()` it, inject `<script src="tests.js"></script>` immediately **before**
   `</body>`, write `tests.html` + `test/page-template.js`, then
   `writeCategorySeeds(testApp)` (preserves the committed `test/*` fixtures).
6. Log `done`.

```js
function main() {
  const templatePath = path.join(DIR, 'page-template.html');
  if (!fs.existsSync(templatePath)) {
    console.error('ERROR: page-template.html not found next to build.js');
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  const APPS = loadCategories();
  BUILTIN_APPS_JS = buildBuiltinAppsJs(APPS);   // built once, module-level

  APPS.forEach(app => {
    app.dir = app.id + '/';
    const html = render(template, app);
    fs.writeFileSync(path.join(DIR, `${app.id}.html`), html);
    writeFileEnsureDir(
      path.join(DIR, app.dir, 'page-template.js'),
      'window.PAGE_TEMPLATE = ' + JSON.stringify(template) + ';\n'
    );
    writeCategorySeeds(app);
  });

  const testApp = { id: 'test', label: 'Test', color: '#5C6BC0', dir: 'test/' };
  let testHtml = render(template, testApp);
  testHtml = testHtml.replace('</body>', '<script src="tests.js"></script>\n</body>');
  fs.writeFileSync(path.join(DIR, 'tests.html'), testHtml);
  writeFileEnsureDir(
    path.join(DIR, 'test', 'page-template.js'),
    'window.PAGE_TEMPLATE = ' + JSON.stringify(template) + ';\n'
  );
  writeCategorySeeds(testApp);

  console.log('done');
}
```

### The `BUILTIN_APPS_JS` module-level-`let` gotcha (fixed)

`render()` references `BUILTIN_APPS_JS` when substituting `{{BUILTIN_APPS_JS}}`.
This variable must be **declared at module scope with `let`** (line 173,
`let BUILTIN_APPS_JS = '';`) and **assigned inside `main()`** (line 204,
`BUILTIN_APPS_JS = buildBuiltinAppsJs(APPS);`).

We originally had it as a `const` declared *inside* `main()`:

```js
// BROKEN — do not do this:
function main() {
  ...
  const BUILTIN_APPS_JS = buildBuiltinAppsJs(APPS);  // block-scoped to main
  ...
}
```

Because `render()` (defined at module scope) closed over the name but the
`const` only existed inside `main()`'s block, every `render()` call that reached
the `{{BUILTIN_APPS_JS}}` replacement threw:

```
ReferenceError: BUILTIN_APPS_JS is not defined
```

The fix lifts the declaration to module scope as a `let` and assigns it once in
`main()` *before* the category loop. `render()` then reads the shared value.
Rules of thumb enforced by the fix:

- Declaration: module-level `let BUILTIN_APPS_JS = '';` (NOT `const`, NOT inside
  `main`).
- Assignment: exactly once in `main()`, before any `render()` call.
- `render()` must NOT take it as a parameter — it reads the closed-over module
  variable.

---

## 10. Output File Tree (per build)

For a manifest with `music` and `gaming`, plus the always-on test page:

```
youtube/
├── page-template.html              (input, untouched)
├── categories.json                 (input, untouched)
├── music.html                      (generated at root)
├── gaming.html                     (generated at root)
├── tests.html                      (generated at root, incl. <script src="tests.js">)
├── music/
│   ├── page-template.js            (generated: window.PAGE_TEMPLATE = "...")
│   ├── music-collections.js        (generated only if missing)
│   ├── music-playlist.js           (generated only if missing)
│   └── music-watched.js            (generated only if missing)
├── gaming/
│   ├── page-template.js            (generated)
│   ├── gaming-collections.js       (generated only if missing)
│   ├── gaming-playlist.js          (generated only if missing)
│   └── gaming-watched.js           (generated only if missing)
└── test/
    ├── page-template.js            (generated)
    ├── test-collections.js         (preserved — do NOT overwrite)
    ├── test-playlist.js            (preserved — do NOT overwrite)
    └── test-watched.js             (preserved — do NOT overwrite)
```

`app.js`, `style.css`, `tests.js`, and any pre-existing seed files are **not**
touched by the build.

---

## 11. Idempotence & Determinism

- **Idempotent:** Re-running `node build.js` reproduces the same output files and
  never destroys curated data — generated pages/seeds are fully overwritten (via
  `writeFileSync`) or skipped (`writeCategorySeeds` / fixture preservation),
  so a second run yields the same on-disk state as the first.
- **Deterministic:** Output depends only on `page-template.html` +
  `categories.json`. Replacements are ordered and global (`/g`), `JSON.stringify`
  is stable for fixed key order, and `window.PAGE_TEMPLATE` embeds the verbatim
  template string. No timestamps, no randomness, no network, no clocks.
- **Additive seeds:** Because seeds are skip-if-exists, a category built today and
  re-built next week keeps whatever real data was committed in between.
- **Single source of truth for the switcher list:** `window.__BUILTIN_APPS__` is
  derived once from `categories.json`, so the `file://` category switcher can
  never silently drift from the manifest.


# ============ FILE: phase3-delete-maintain.md ============

# TubeVault / TholsStudio — Implementation Notes

This document covers two maintenance components that operate on the same
generated output (a category's `<id>.html` page plus its `<id>/` folder of JS
seeds and `page-template.js`):

- **Phase 3 — `delete-category.js`**: a Node terminal script that *deletes*
  generated artifacts from the repository filesystem.
- **Phase 4 — `maintain.html`**: a browser-only tool that *edits templates,
  manages categories, and downloads* generated pages. It can never delete.

The two are deliberately complementary: `maintain.html` is the no-terminal
authoring surface, while `delete-category.js` is the only supported way to
actually remove a category from the repo.

---

## Phase 3 — delete-category.js (Node terminal script)

### 1. Purpose

Removes a category's generated artifacts from the repo:

- `<id>.html` — the page at the repo root.
- `<id>/` — the folder containing the JS seeds (`<id>-collections.js`,
  `-playlist.js`, `-watched.js`) and `page-template.js`.

It is the **filesystem counterpart** to the browser-only `maintain.html`, which
can only *download* pages and can never delete anything. Use this script when a
category must be physically removed from the repository. It ships with no
dependencies — plain Node `fs` / `path` / `readline`.

```
Usage:
  node delete-category.js <id> [--force]

  <id>        category id, e.g. `music` (also the <id>.html stem)
  --force     skip the interactive confirmation prompt
```

### 2. `loadManifestIds()` — read `categories.json`, return lowercased ids

This drives the protected set. It reads `categories.json` at runtime (so it
always matches the current build manifest) and normalizes every valid id to
lowercase. It accepts either a bare array or a `{ collections: [...] }` shape,
and filters out malformed ids before lowercasing.

```js
function loadManifestIds() {
  try {
    const raw = fs.readFileSync(path.join(DIR, 'categories.json'), 'utf8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : data.collections;
    if (Array.isArray(list)) {
      return list
        .filter(c => c && c.id && /^[a-z0-9-]+$/i.test(c.id))
        .map(c => c.id.toLowerCase());
    }
  } catch {}
  return [];
}
```

### 3. `PROTECTED` set — shipped categories + `test`

The protected set is the union of every manifest id plus the literal `'test'`
value (the category that `build.js` generates and which must never be deleted
here).

```js
const PROTECTED = new Set([...loadManifestIds(), 'test']);
```

Because the manifest ids are read at runtime, `PROTECTED` always reflects the
current `categories.json`. Refusing the shipped categories is intentional — to
remove a built-in, edit `APPS` in `build.js` first, not this script.

### 4. `main()` flow

1. **Parse args**: `--force` flag is detected; the first argument not starting
   with `--` is the `<id>`.
2. **Validate id format** with `/^[a-z0-9-]+$/i` (mirrors the slugify rules used
   by the generators — letters, digits, dashes only). This also prevents path
   traversal.
3. **Refuse protected / unknown / missing**: protected ids are blocked; if
   neither `<id>.html` nor `./<id>/` exist, it fails (unknown/missing).
4. **List targets**: build the list of files/folders that will be removed.
5. **Interactive confirm** unless `--force`: the user must type the exact id to
   proceed.
6. **Delete**: `fs.rmSync(folder, { recursive:true, force:true })` for the
   folder and `fs.unlinkSync(html)` for the page.
7. **Guidance**: print a note to also clear the browser `localStorage` registry
   key `tholsstudio_categories`.

```js
function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const id = args.find(a => !a.startsWith('--'));

  if (!id) fail('no category id given.\nUsage: node delete-category.js <id> [--force]');

  if (!/^[a-z0-9-]+$/i.test(id)) {
    fail(`"${id}" is not a valid category id (letters, digits, dashes only).`);
  }
  if (PROTECTED.has(id.toLowerCase())) {
    fail(`"${id}" is a protected category and cannot be deleted here. ` +
         `Edit APPS in build.js to remove a built-in.`);
  }

  const htmlPath = path.join(DIR, `${id}.html`);
  const folderPath = path.join(DIR, id);
  const htmlExists = fs.existsSync(htmlPath);
  const folderExists = fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();

  if (!htmlExists && !folderExists) {
    fail(`nothing found for "${id}" (looked for ${id}.html and ./${id}/).`);
  }

  const targets = [];
  if (htmlExists) targets.push(path.relative(DIR, htmlPath));
  if (folderExists) targets.push(path.relative(DIR, folderPath) + '/');

  const prompt = `About to DELETE:\n  - ${targets.join('\n  - ')}\nType the id "${id}" to confirm: `;

  const proceed = () => {
    try {
      if (folderExists) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`✓ removed ${path.relative(DIR, folderPath)}/`);
      }
      if (htmlExists) {
        fs.unlinkSync(htmlPath);
        console.log(`✓ removed ${path.relative(DIR, htmlPath)}`);
      }
      console.log(`done — "${id}" deleted.`);
      console.log('Note: if this category was created in the app, also clear it from the');
      console.log('shared registry (localStorage key "tholsstudio_categories") in the browser,');
      console.log('or run the app and remove it via the category switcher.');
    } catch (e) {
      fail(`could not delete: ${e.message}`);
    }
  };

  if (force) { proceed(); return; }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(prompt, (answer) => {
    rl.close();
    if (answer.trim() === id) proceed();
    else { console.log('Aborted — id did not match. Nothing deleted.'); process.exit(0); }
  });
}
```

### 5. Exit codes / guards table

`fail()` always prints `ERROR: <msg>` and calls `process.exit(1)`. A clean
abort (confirmation mismatch) exits `0`. A successful deletion also exits `0`.

| Condition | Guard | Result |
|---|---|---|
| No `<id>` argument supplied | `if (!id) fail(...)` | exit 1 |
| `<id>` not matching `/^[a-z0-9-]+$/i` | `if (!/^...$/i.test(id)) fail(...)` | exit 1 |
| `<id>` is in `PROTECTED` (any manifest id or `test`) | `if (PROTECTED.has(id.toLowerCase())) fail(...)` | exit 1 |
| Neither `<id>.html` nor `./<id>/` exists | `if (!htmlExists && !folderExists) fail(...)` | exit 1 |
| Confirmation prompt answer ≠ `<id>` | `else { ... process.exit(0) }` | exit 0 (abort) |
| `--force` supplied | skips prompt, runs `proceed()` | exit 0 on success |
| Filesystem error during delete | `catch (e) fail(...)` | exit 1 |

---

## Phase 4 — maintain.html (browser-only generator)

### 1. Purpose

A no-terminal, in-browser tool that edits the shared `page-template.html`,
manages the category list, and generates category pages. It runs entirely in the
browser — no build server. It reads `categories.json` and `page-template.html`
via `fetch`, so it requires being served over **HTTP** (GitHub Pages or a local
server). Everything is identical in shape to the rest of the app, and on
`file://` the category list falls back to hardcoded built-ins.

Unlike `delete-category.js`, this tool **can only download** — it never touches
the repository filesystem. Generated pages must be copied into the repo manually.

### 2. Category list

The list is seeded from `categories.json` (the same `collections` shape used by
the per-category `*-collections.js` files, matching `build.js` so the browser
tool and terminal build stay in sync). If the fetch fails — e.g. opened via
`file://` — it falls back to `FALLBACK_APPS`.

`+ Add category` appends a row; each row's `Remove` button splices it out.

```js
const FALLBACK_APPS = [
  { id: 'unity3d',    label: 'Unity3D',    color: '#EC407A' },
  { id: 'gamedesign', label: 'GameDesign', color: '#29B6F6' },
  { id: 'blender',    label: 'Blender',    color: '#AB47BC' },
  { id: 'csharp',     label: 'CSharp',     color: '#AB46BC' },
];
```

```js
function loadCategories() {
  return fetch('categories.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => {
      const list = Array.isArray(data) ? data : data.collections;
      if (!Array.isArray(list) || !list.length) throw new Error('no collections');
      apps = list.map(c => ({
        id: c.id,
        label: c.name || c.id,
        color: c.color || '#5C6BC0',
      }));
      renderApps();
      log('Loaded ' + apps.length + ' categor' + (apps.length === 1 ? 'y' : 'ies') + ' from categories.json', 'ok');
    })
    .catch(e => {
      apps = FALLBACK_APPS.map(a => ({ ...a }));
      renderApps();
      log('Could not load categories.json (' + e.message + '). Using built-in list — serve over HTTP to use categories.json.', 'err');
    });
}
```

### 3. Template editing

The `page-template.html` contents are shown in a textarea. Supported controls:

- **Reload from repo** — `fetch('page-template.html')` back into the textarea.
- **Load file…** — a hidden `<input type="file">` + `FileReader`, used mainly
  for `file://` where fetch is blocked.
- **Save edited template** — downloads the edited text as `page-template.html`.

Placeholders expected in the template are `{{APP_NAME}}`, `{{APP_LABEL}}`,
`{{APP_COLOR}}`, `{{JS_DIR}}`, and `{{SCRIPT_TAGS}}`.

```js
function loadTemplate() {
  fetch('page-template.html')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(t => { document.getElementById('template').value = t; log('Loaded page-template.html from repo', 'ok'); })
    .catch(e => log('Could not fetch page-template.html (' + e.message + '). Use “Load file…” or paste it manually.', 'err'));
}
function loadTemplateFile() { document.getElementById('fileInput').click(); }
function onFile(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { document.getElementById('template').value = r.result; log('Loaded ' + f.name, 'ok'); };
  r.readAsText(f);
}
```

### 4. Generate

`Generate & download all pages` iterates the category rows, renders each page by
substituting the placeholders, and downloads `<id>.html` per category plus a
single `page-template.js`. The three `<id>-*.js` seeds go in a `<id>/` folder
(built in the app via "Create category…", or copied from an existing category).
The tool can only **download**, never delete.

The render step also injects the script tags for the seeds via
`configScriptTags()` (the closing-tag token is split to avoid prematurely ending
the inline script).

```js
function configScriptTags(id, dir) {
  dir = dir || '';
  return [
    '<script src="' + dir + id + '-collections.js"></' + 'script>',
    '<script src="' + dir + id + '-playlist.js"></' + 'script>',
    '<script src="' + dir + id + '-watched.js"></' + 'script>',
  ].join('\n');
}

function generateAll() {
  const tpl = document.getElementById('template').value;
  if (!tpl.includes('{{APP_NAME}}')) { log('Template looks empty or missing placeholders — load page-template.html first.', 'err'); return; }
  document.getElementById('log').innerHTML = '';
  log('Generating ' + apps.length + ' page(s)…');

  apps.forEach(app => {
    if (!app.id || !app.label) { log('Skipped an app with missing id/label', 'err'); return; }
    const html = render(tpl, app);
    download(app.id + '.html', html, 'text/html');
    log('✓ ' + app.id + '.html', 'ok');
  });

  const tplJs = 'window.PAGE_TEMPLATE = ' + JSON.stringify(tpl) + ';\n';
  download('page-template.js', tplJs, 'text/javascript');
  log('✓ page-template.js', 'ok');
  log('Done. Save <id>.html at the root and the 4 .js files inside a <id>/ folder (next to app.js / style.css).', 'ok');
}
```

### 5. Relationship to `build.js`

Both `maintain.html` and `build.js` read `categories.json` as their source of
truth for the category list, and both render the same `page-template.html`
placeholders into `<id>.html` pages (with the matching `page-template.js`). Their
output is therefore **byte-identical** — the browser tool is a terminal-free
equivalent of the Node build, intended for authoring and downloading; the user
copies the downloaded files into the repo manually. Only `delete-category.js`
can remove those files afterward.


# ============ FILE: phase5-seed-tests.md ============

# TubeVault / TholsStudio — Implementation Notes (Phase 5 & Phase 6)

These notes document two build-time/runtime concerns:

- **Phase 5 — Seed data & `categories.json`**: how category metadata and per-category
  starter data are sourced, generated, and consumed at runtime.
- **Phase 6 — Feature tests**: the in-browser test harness and its hand-maintained
  fixtures.

All paths are relative to the `youtube/` folder.

---

## Phase 5 — Seed data & categories.json

### 5.1 `categories.json` is the single source of truth for the category list

`categories.json` is *only* a manifest of which category pages exist. It carries
**no video data** — just `id`, `name`, and `color`. `build.js` reads this file to
decide which `<id>.html` pages to generate and which `<id>/` folders to populate.

The `collections` array mirrors the shape of a per-category `*-collections.js`
file, but only `id`/`name`/`color` are consumed by the build (the `groups` /
`ungrouped` fields, if present, are ignored by `loadCategories()` — `build.js:49`).

Actual current content (`categories.json`):

```json
{
  "collections": [
    { "id": "unity3d",       "name": "Unity3D",       "color": "#EC407A" },
    { "id": "gamedesign", "name": "GameDesign", "color": "#29B6F6" },
    { "id": "blender",   "name": "Blender",   "color": "#AB47BC" },
    { "id": "csharp",   "name": "CSharp",   "color": "#AB46BC" }
  ]
}
```

`build.js` validates each entry: `id` must match `/^[a-z0-9-]+$/i` or the entry is
skipped with a warning (`build.js:59`). Invalid or missing `color` falls back to
`#5C6BC0`.

### 5.2 Per-category seed files live in `<id>/`

For each category, `build.js` writes three seed scripts into a folder named after
the category id. The generated page (`<id>.html`, at repo root) loads them via
`configScriptTags()` (`build.js:73`):

```html
<script src="unity3d/unity3d-collections.js"></script>
<script src="unity3d/unity3d-playlist.js"></script>
<script src="unity3d/unity3d-watched.js"></script>
```

The three files and their globals:

| File | Global(s) | Purpose |
| --- | --- | --- |
| `<id>-collections.js` | `COLLECTION_COLORS`, `DEFAULT_COLLECTIONS` | Palette + nested `collection → group → videos` seed |
| `<id>-playlist.js` | `DEFAULT_PLAYLISTS` | Starter playlists (YouTube videoIds) |
| `<id>-watched.js` | `WATCHED_VIDEO_IDS` | Pre-marked watched videoIds |

`COLLECTION_COLORS` is the shared palette used by the "add collection" picker.
`DEFAULT_COLLECTIONS` is an array of collection objects, each with:

- `id`, `name`, `color`
- `groups`: a map of `groupName → [video, …]` (videos carry `url`, `videoId`,
  `title`, `channel`, `note`)
- `ungrouped`: a flat array of the same video shape

The generated `unity3d/unity3d-collections.js` is the canonical starter example
(one empty default collection keyed to the app id/name/color):

```javascript
// --------------------------------------------------------------
// COLLECTIONS CONFIG — Unity3D
// Generated by build.js. Edit freely; to apply as defaults, clear localStorage.
// --------------------------------------------------------------

const COLLECTION_COLORS = [
  '#5C6BC0', '#EF5350', '#26A69A', '#FFA726',
  '#66BB6A', '#AB47BC', '#29B6F6', '#FF7043',
  '#78909C', '#EC407A'
];

const DEFAULT_COLLECTIONS = [
  {
    id: "unity3d",
    name: "Unity3D",
    color: "#EC407A",
    groups: {},
    ungrouped: []
  }
];
```

The matching `unity3d-playlist.js` and `unity3d-watched.js` are produced by
`buildPlaylistSeed()` and `buildWatchedSeed()` (`build.js:114`, `build.js:124`)
and both start empty:

```javascript
// PLAYLIST CONFIG — Generated by build.js. Create playlists in the app.
const DEFAULT_PLAYLISTS = [];

// WATCHED HISTORY — Generated by build.js.
const WATCHED_VIDEO_IDS = [];
```

### 5.3 `build.js` generates seeds only if missing (skip-if-exists)

`writeCategorySeeds()` (`build.js:152`) writes the three seed files into `<id>/`
**only when they do not already exist**. If a file is present, it is preserved
(`• kept existing … (preserve)`), so a category's curated collections, videos,
playlists, and watched history survive repeated `node build.js` runs. This is
what makes the generated seeds *starters*, not sources of truth — once a category
accumulates real data in the app, rebuilding never clobbers it.

The HTML page itself (`<id>.html`, `build.js:209`) and `page-template.js`
(`build.js:213`, holding `window.PAGE_TEMPLATE`) are always rewritten, because
they are pure build output derived from `page-template.html` + the manifest.

### 5.4 Runtime consumption: `seedData()` and `remapPlaylistIds()`

`app.js` calls `seedData()` on load (`app.js:3249`). It only seeds when the
library is empty (`state.videos.length === 0`), so a returning user's data is
never overwritten.

`seedData()` (`app.js:2332`) flattens `DEFAULT_COLLECTIONS` into `state.videos`:
for every video in every `group` and in `ungrouped`, it pushes a video record
augmented with:

- `id` — a fresh `generateId()`
- `collection` — the parent collection id
- `group` — the group name (or `''` for ungrouped)
- `added` — `baseTime - Math.random() * 5 * 24 * 3600 * 1000` (a random time
  within the last ~5 days, so sort order looks organic)
- `watched: false`

It then applies `WATCHED_VIDEO_IDS` (`app.js:2359`): any video whose `videoId`
appears in the list is marked `watched = true`, and its id is added to
`state.watchedIds`. Finally it calls `remapPlaylistIds()` and `save()`.

`remapPlaylistIds()` (`app.js:2372`) converts playlist references from **YouTube
videoIds** to the app's **internal video ids**:

1. Builds `ytIdMap` from `state.videos` (`videoId → id`).
2. For each playlist, if a matching `DEFAULT_PLAYLISTS` entry carries a `videos`
   array, it maps each `videoId` through `ytIdMap` and de-dupes via
   `new Set(...)`.
3. Otherwise it validates/repairs `pl.videoIds` against existing internal ids,
   falling back to a YouTube-id match.
4. Final safety net: de-dupes by internal id **and** by underlying YouTube id
   (`app.js:2390`), covering legacy duplicate library entries.

After this step, playlists reference internal `state.videos` ids only.

### 5.5 Why `categories.json` carries no video data

`categories.json` is intentionally a *category manifest*, deliberately excluding
any video/group/playlist data. That data belongs in each `<id>/<id>-*.js` seed
(or, in production, in the user's `localStorage`). Keeping metadata separate from
data means:

- Adding a category is a one-line JSON edit.
- The build manifest cannot drift from what `DEFAULT_COLLECTIONS` would imply.
- Per-category data can be curated/committed independently and preserved by the
  skip-if-exists rule.

---

## Phase 6 — Feature tests

### 6.1 `tests.html` + `tests.js` — plain in-browser harness

There is **no test framework and no build step**. `tests.html` is a generated page
(identical to a category page, with one extra injected `<script src="tests.js">`
before `</body>`, see `build.js:226`). Because it is rendered from the same
`page-template.html`, it loads `app.js` first, so every global —
`state`, `PAGE_TEMPLATE`, `extractVideoId`, `extractPlaylistId`, `isYouTubeUrl`,
`jsStr`, `chunk`, `escHtml`, `escAttr`, `formatDate`, `slugifyCollectionName`,
the `export*` functions, `renderSidebar`/`renderCards`, `closeModal`, etc. — is
already available when `tests.js` runs.

`tests.js` is loaded **after** `app.js` and runs immediately on page load.

### 6.2 `tests.js` structure

The harness is a single IIFE (`tests.js:11`) with three tiny assertion helpers:

- `record(name, pass, detail)` — pushes `{ name, pass, detail }` into `results`.
- `eq(name, a, b)` — passes when `a === b`; detail shows expected vs. got.
- `truthy(name, a)` — passes when `a` is truthy.

It first guarantees seed data exists for assertions (`tests.js:26`): if
`state.videos.length === 0` and `DEFAULT_COLLECTIONS` is defined, it calls
`seedData(); renderSidebar(); renderCards();`. This reuses the same
`test/` fixtures (below) the way any real category would.

It then asserts across five areas (actual snippets):

**Pure helpers / parsing**

```javascript
eq('extractVideoId: watch url', extractVideoId('https://www.youtube.com/watch?v=abcdefghijk'), 'abcdefghijk');
eq('extractVideoId: youtu.be', extractVideoId('https://youtu.be/abcdefghijk'), 'abcdefghijk');
eq('extractVideoId: shorts', extractVideoId('https://www.youtube.com/shorts/abcdefghijk'), 'abcdefghijk');
eq('extractVideoId: with list', extractVideoId('https://www.youtube.com/watch?v=abcdefghijk&list=PL123'), 'abcdefghijk');
eq('extractVideoId: invalid', extractVideoId('not a url'), null);
eq('extractVideoId: missing v param', extractVideoId('https://www.youtube.com/watch'), null);
eq('extractVideoId: short youtu.be', extractVideoId('https://youtu.be/abc'), null);

eq('extractPlaylistId: present', extractPlaylistId('https://www.youtube.com/watch?v=x&list=PLxyz'), 'PLxyz');
eq('extractPlaylistId: absent', extractPlaylistId('https://www.youtube.com/watch?v=x'), null);

truthy('isYouTubeUrl: youtube', isYouTubeUrl('https://www.youtube.com/watch?v=x'));
truthy('isYouTubeUrl: youtu.be', isYouTubeUrl('https://youtu.be/x'));
eq('isYouTubeUrl: other', isYouTubeUrl('https://example.com'), false);

eq("jsStr: quote", jsStr("it's"), "'it\\'s'");
eq('jsStr: newline', jsStr("a\nb"), "'a\\nb'");

const ch = chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4);
eq('chunk sizes', ch.map(function (a) { return a.length; }).join(','), '4,4,2');

eq('escHtml', escHtml('<a>&"'), '&lt;a&gt;&amp;&quot;');
eq('escAttr', escAttr("a'b"), "a\\'b");

truthy('formatDate returns string', typeof formatDate(Date.now()) === 'string');
```

**`slugifyCollectionName` uniqueness** (`tests.js:59`) — verifies a duplicate
base name gets a distinct, unused id:

```javascript
const s1 = slugifyCollectionName('Demo');
const before = state.collections.map(function (c) { return c.id; });
state.collections.push({ id: s1, name: 'Demo', color: '#fff' });
const s2 = slugifyCollectionName('Demo');
record('slugifyCollectionName unique', s1 !== s2 && before.indexOf(s2) === -1, s1 + ' / ' + s2);
state.collections = state.collections.filter(function (c) { return c.id !== s1; });
```

**Seed / state integrity** (`tests.js:67`) — verifies the flattened state and the
playlist remap. The `pl1` playlist (defined with 3 YouTube videoIds in the test
fixture) must map to exactly 3 internal videoIds:

```javascript
truthy('seedData populated videos', state.videos.length > 0);
truthy('seedData has collections', state.collections.length > 0);
eq('playlist remapped by yt id', (function () {
  const pl = state.playlists.find(function (p) { return p.id === 'pl1'; });
  return pl ? pl.videoIds.length : -1;
})(), 3);
```

**Rendering** (`tests.js:76`) — sidebar item count matches collection count, and a
video card exists per video, draggable:

```javascript
eq('sidebar renders collections',
   document.querySelectorAll('#collectionsList .sidebar-item').length,
   state.collections.length);

const cards = document.querySelectorAll('.video-card');
record('cards rendered', cards.length === state.videos.length,
       'cards=' + cards.length + ' videos=' + state.videos.length);
if (cards.length) {
  truthy('card is draggable (makeSortable)', cards[0].draggable === true);
}
```

**Export pipeline** (`tests.js:88`) — every `export*` function is exercised and
must open the confirm modal without throwing:

```javascript
exportCollectionsJs();
truthy('exportCollectionsJs opens confirm',
       document.getElementById('exportConfirmModal').classList.contains('open'));
closeModal('exportConfirmModal');

exportWatchedJs();
truthy('exportWatchedJs opens confirm',
       document.getElementById('exportConfirmModal').classList.contains('open'));
closeModal('exportConfirmModal');

exportPlaylistJs();
truthy('exportPlaylistJs opens confirm',
       document.getElementById('exportConfirmModal').classList.contains('open'));
closeModal('exportConfirmModal');

exportData();
truthy('exportData opens confirm',
       document.getElementById('exportConfirmModal').classList.contains('open'));
closeModal('exportConfirmModal');
```

**`PAGE_TEMPLATE` / runtime category page** (`tests.js:109`) — verifies the
generated category HTML is well-formed and fully substituted:

```javascript
truthy('PAGE_TEMPLATE defined', typeof PAGE_TEMPLATE !== 'undefined');
const page = buildCategoryHtml('cooking', 'Cooking', '#FFA726');
truthy('category page has DOCTYPE', page.indexOf('<!DOCTYPE html>') === 0);
truthy('category page sets APP_NAME', page.indexOf("const APP_NAME = 'cooking';") !== -1);
eq('category page no placeholders', /\{\{/.test(page), false);
```

### 6.3 `test/` fixtures are hand-maintained and preserved

The test category (`testApp` with `dir: 'test/'`, `build.js:224`) references
`test/test-collections.js`, `test/test-playlist.js`, and `test/test-watched.js`.
Unlike the generated real-category seeds, these are **committed, hand-written
fixtures** — the tests assert directly against their known data (3 demo videos,
the `pl1` playlist of those 3, and one watched id). `writeCategorySeeds()`'s
skip-if-exists logic (`build.js:161`) preserves them across rebuilds.

`test/test-collections.js` — one `demo` collection, two videos in group
`Basics` and one `ungrouped`:

```javascript
const COLLECTION_COLORS = [
  '#5C6BC0', '#EF5350', '#26A69A', '#FFA726',
  '#66BB6A', '#AB47BC', '#29B6F6', '#FF7043',
  '#78909C', '#EC407A'
];

const DEFAULT_COLLECTIONS = [
  {
    id: 'demo',
    name: 'Demo',
    color: '#26A69A',
    groups: {
      'Basics': [
        { url: 'https://www.youtube.com/watch?v=aaaaaaaaaa1', videoId: 'aaaaaaaaaa1', title: 'Demo One', channel: 'Demo Chan', note: 'first' },
        { url: 'https://www.youtube.com/watch?v=bbbbbbbbbb2', videoId: 'bbbbbbbbbb2', title: 'Demo Two', channel: 'Demo Chan', note: 'second' }
      ]
    },
    ungrouped: [
      { url: 'https://www.youtube.com/watch?v=cccccccccc3', videoId: 'cccccccccc3', title: 'Demo Three', channel: 'Demo Chan', note: '' }
    ]
  }
];
```

`test/test-playlist.js` — the `pl1` playlist, referencing the 3 demo videos by
YouTube id (which `remapPlaylistIds()` must remap to internal ids → the `pl1`
assertion expects `3`):

```javascript
const DEFAULT_PLAYLISTS = [
  {
    id: 'pl1',
    name: 'Test Playlist',
    color: '#EF5350',
    videoIds: ['aaaaaaaaaa1', 'bbbbbbbbbb2', 'cccccccccc3']
  }
];
```

`test/test-watched.js` — one watched video id:

```javascript
const WATCHED_VIDEO_IDS = ['aaaaaaaaaa1'];
```

### 6.4 Report output

When the IIFE finishes, it computes `passed`/`failed` and builds a fixed-position
`#test-report` panel (`tests.js:123`) appended to `document.body`, colour-coding
each result (green ✓ / red ✗ with detail). It also exposes the raw results on
`window.__TEST_RESULTS__` (`tests.js:143`) and logs a summary to the console.

```javascript
window.__TEST_RESULTS__ = results;
if (window.console) console.log('TubeVault tests:', passed + '/' + results.length + ' passed', results);
```

### 6.5 Gap — no automated / CI runner

There is **no headless or CI test runner**. `tests.js` depends on a real browser
DOM (`document`, `localStorage`, the rendered page). After a build, the suite is
run by **manually opening `tests.html`** (served from the same folder) and
reading the `#test-report` panel / `window.__TEST_RESULTS__`. Build step 2 in
`build.js` only generates `tests.html` + `test/page-template.js` + the (preserved)
fixtures; it does not execute the tests.

---

### Quick file reference

| Concern | File |
| --- | --- |
| Category manifest | `categories.json` |
| Seed generation + skip-if-exists | `build.js` (`writeCategorySeeds`, `build*.js`) |
| Runtime flatten/remap | `app.js` (`seedData` `app.js:2332`, `remapPlaylistIds` `app.js:2372`) |
| Test harness | `tests.js`, generated `tests.html` |
| Test fixtures (preserved) | `test/test-collections.js`, `test/test-playlist.js`, `test/test-watched.js` |
| Canonical starter seed | `unity3d/unity3d-collections.js` |


# ============ FILE: phase7-bugs-docs-verify.md ============

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

