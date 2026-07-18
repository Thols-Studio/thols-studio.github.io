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
