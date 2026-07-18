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
