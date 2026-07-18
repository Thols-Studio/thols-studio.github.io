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
