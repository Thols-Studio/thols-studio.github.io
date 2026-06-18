// ──────────────────────────────────────────────────────────────
// PLAYLIST CONFIG
// Edit this file to define default playlists that appear on
// first load (when localStorage is empty).
//
// Each playlist:
// - id:       unique slug (lowercase, hyphens)
// - name:     display name shown in the sidebar
// - color:    hex color for the playlist dot
// - videoIds: array of videoId strings (YouTube 11-char IDs)
//             matching videos already in collections.js
//
// This only affects FIRST LOAD — once the app has saved data
// to localStorage, this file is ignored. To reset, clear
// localStorage or open in a private window.
// ──────────────────────────────────────────────────────────────

const DEFAULT_PLAYLISTS = [
  {
    id: 'watch-later',
    name: 'Watch Later',
    color: '#5C6BC0',
    videoIds: []
  },
  {
    id: 'favourites',
    name: 'Favourites',
    color: '#EC407A',
    videoIds: []
  },
];
