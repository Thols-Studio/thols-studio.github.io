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
