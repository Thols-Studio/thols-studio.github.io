// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Exported from TubeVault on 7/28/2026, 12:14:43 PM
//
// STRUCTURE — easy to browse/edit in any JSON editor:
//   DEFAULT_COLLECTIONS
//     └─ collection (e.g. "Unity Tutorials")
//          ├─ groups: { "Character Movement": [ ...videos ], "Performance": [ ...videos ] }
//          └─ ungrouped: [ ...videos ]   (videos with no sub-group)
//
// To apply this snapshot:
//   1. Replace your existing blender-collections.js with this file
//   2. Clear the app's localStorage (or open in a private window)
//      so the new defaults are picked up on next load
// ──────────────────────────────────────────────────────────────

// Color swatches offered in the "New Collection" color picker.
const COLLECTION_COLORS = [
  '#5C6BC0', '#EF5350', '#26A69A', '#FFA726',
  '#66BB6A', '#AB47BC', '#29B6F6', '#FF7043',
  '#78909C', '#EC407A'
];

// Default collections + their videos, shown in the sidebar on first load.
//
// Each collection:
// - id:        unique, lowercase, no spaces (used internally)
// - name:      display name shown in the sidebar
// - color:     hex color for the collection's dot / accent
// - groups:    { "Group Name": [ video, video, ... ], ... }
// - ungrouped: [ video, video, ... ] — videos with no sub-group
//
// Each video:
// - url, videoId, title, channel, note
// - playlistId: optional — present if the original URL had a "?list=" param
const DEFAULT_COLLECTIONS = [
  {
    id: 'blender',
    name: 'Blender',
    color: '#AB47BC',
    groups: {
      'Animation': [
        {
          url: 'https://www.youtube.com/watch?v=udGXiu-ciXM',
          videoId: 'udGXiu-ciXM',
          title: 'YouTube Video',
          channel: '',
          note: 'Arrow Animation'
        },
      ],
      'Curves': [
        {
          url: 'https://www.youtube.com/watch?v=Id_LWU7eT8w',
          videoId: 'Id_LWU7eT8w',
          title: 'YouTube Video',
          channel: '',
          note: 'Place Objects along the Circle using Array Modifier'
        },
        {
          url: 'https://www.youtube.com/watch?v=Qo5AWay7pYk',
          videoId: 'Qo5AWay7pYk',
          title: 'YouTube Video',
          channel: '',
          note: 'Shape : Curve\nFill Objects along the Curves using Array Modifier'
        },
      ]
    },
    ungrouped: []
  }
];
