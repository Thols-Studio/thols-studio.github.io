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
