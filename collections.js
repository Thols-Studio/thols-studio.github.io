// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Edit this file to change the default collections, colors, and
// the starter ("seed") videos that appear on first load.
//
// STRUCTURE — easy to browse/edit in any JSON editor:
//   DEFAULT_COLLECTIONS
//     └─ collection (e.g. "Unity Tutorials")
//          ├─ groups: { "Character Movement": [ ...videos ], "Performance": [ ...videos ] }
//          └─ ungrouped: [ ...videos ]   (videos with no sub-group)
//
// This only affects FIRST LOAD — once the app has saved data to
// localStorage, this file is ignored. To reset and re-apply your
// changes, clear the site's localStorage (or use a private window).
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
//              — each key becomes a sub-section inside the collection
// - ungrouped: [ video, video, ... ] — videos with no sub-group
//
// Each video:
// - url:        full YouTube URL (watch, youtu.be, or shorts link)
// - videoId:    the 11-character YouTube video ID
// - title:      display title
// - channel:    channel name (optional)
// - note:       personal note shown on the card (optional)
// - playlistId: optional — if the original URL had a "?list=" param,
//               the play button will open it within that playlist
const DEFAULT_COLLECTIONS = [
  {
    id: 'unity',
    name: 'Unity Tutorials',
    color: '#5C6BC0',
    groups: {
      'Character Movement': [
        {
          url: 'https://www.youtube.com/watch?v=XtQMytORBmM',
          videoId: 'XtQMytORBmM',
          title: 'Unity Character Controller from Scratch',
          channel: 'Brackeys',
          note: 'Great foundation for the platformer project. Check timestamp 12:30 for slope handling.'
        }
      ],
      'Performance': [
        {
          url: 'https://www.youtube.com/watch?v=vFWnv9aRhT8',
          videoId: 'vFWnv9aRhT8',
          title: 'Unity Mobile Performance Deep Dive',
          channel: 'Unity',
          note: ''
        }
      ],
      'Physics': [
        {
          url: 'https://www.youtube.com/watch?v=bFOAipGJGA0',
          videoId: 'bFOAipGJGA0',
          title: 'Unity Physics — Rigidbody & Colliders',
          channel: 'Unity',
          note: 'Revisit for slope controller refactor'
        }
      ]
    },
    ungrouped: []
  },
  {
    id: 'gamedesign',
    name: 'Game Design',
    color: '#26A69A',
    groups: {
      'Polish': [
        {
          url: 'https://www.youtube.com/watch?v=K0fbBFKuMoE',
          videoId: 'K0fbBFKuMoE',
          title: 'Game Feel — How to Make Games Fun',
          channel: 'Extra Credits',
          note: 'Must revisit for juice/polish pass'
        }
      ],
      'Level Design': [
        {
          url: 'https://www.youtube.com/watch?v=9tFSyMdnuQk',
          videoId: '9tFSyMdnuQk',
          title: 'Level Design Patterns for Platformers',
          channel: 'GMTK',
          note: ''
        }
      ]
    },
    ungrouped: []
  },
  {
    id: 'music',
    name: 'Music',
    color: '#EC407A',
    groups: {},
    ungrouped: []
  },
];
