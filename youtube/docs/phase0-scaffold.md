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
