// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Exported from TubeVault on 11/24/2026, 10:52:19 AM
//
// STRUCTURE — easy to browse/edit in any JSON editor:
//   DEFAULT_COLLECTIONS
//     └─ collection (e.g. "Unity Tutorials")
//          ├─ groups: { "Character Movement": [ ...videos ], "Performance": [ ...videos ] }
//          └─ ungrouped: [ ...videos ]   (videos with no sub-group)
//
// To apply this snapshot:
//   1. Replace your existing git-collections.js with this file
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
    id: 'git',
    name: 'Git',
    color: '#AB47BC',
    groups: {
      'Setup': [
        {
          url: 'https://www.youtube.com/watch?v=c5TSRxrDEK8&t=677s',
          videoId: 'c5TSRxrDEK8',
          title: 'you need to learn Git RIGHT NOW!!',
          channel: 'NetworkChuck',
          note: ''
        },
        {
          url: 'https://www.youtube.com/shorts/oZPcwkaR6TQ',
          videoId: 'oZPcwkaR6TQ',
          title: 'YouTube Video',
          channel: '',
          note: ''
        },
      ],
      'Claude': [
        {
          url: 'https://www.youtube.com/watch?v=nFMGnHdpoXY',
          videoId: 'nFMGnHdpoXY',
          title: 'YouTube Video',
          channel: '',
          note: 'Claude Githib Integration'
        },
      ]
    },
    ungrouped: []
  },
  {
    id: 'claude',
    name: 'Claude',
    color: '#EF5350',
    groups: {
      'Skills': [
        {
          url: 'https://www.youtube.com/watch?v=pQzTCClR5hU',
          videoId: 'pQzTCClR5hU',
          title: 'ADHD',
          channel: '',
          note: 'https://github.com/UditAkhourii/adhd'
        },
      ]
    },
    ungrouped: []
  }
];
