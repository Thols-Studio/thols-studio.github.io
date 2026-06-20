// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Exported from TubeVault on 20/6/2026, 10:53:03 am
//
// STRUCTURE — easy to browse/edit in any JSON editor:
//   DEFAULT_COLLECTIONS
//     └─ collection (e.g. "Unity Tutorials")
//          ├─ groups: { "Character Movement": [ ...videos ], "Performance": [ ...videos ] }
//          └─ ungrouped: [ ...videos ]   (videos with no sub-group)
//
// To apply this snapshot:
//   1. Replace your existing collections.js with this file
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
    id: 'unity',
    name: 'Unity Tutorials',
    color: '#5C6BC0',
    groups: {
      'Animation Curves': [
        {
          url: 'https://www.youtube.com/watch?v=OPDl2uVaN_Q',
          videoId: 'OPDl2uVaN_Q',
          title: 'Projectile using Animation Curves',
          channel: '',
          note: '2D Projectiles using three animation curves 1. shape. 2. Speed'
        },
        {
          url: 'https://www.youtube.com/watch?v=roWiGo1Hpfk&t=55s',
          videoId: 'roWiGo1Hpfk',
          title: 'YouTube Video',
          channel: '',
          note: 'Animation Curves for 2D'
        },
        {
          url: 'https://www.youtube.com/watch?v=Tcvwh1tkyQw',
          videoId: 'Tcvwh1tkyQw',
          title: 'Curved Movement Patterns With Animation Curves',
          channel: '',
          note: 'Move a Kinematic Body with an Animation Curve |'
        },
        {
          url: 'https://www.youtube.com/watch?v=ajn9iMUXZYI',
          videoId: 'ajn9iMUXZYI',
          title: 'Smoth Movement with Curves',
          channel: '',
          note: 'A Cool Way to Move Your Player with Animation Curves'
        },
        {
          url: 'https://www.youtube.com/watch?v=ddakS7BgHRI',
          videoId: 'ddakS7BgHRI',
          title: 'Moving Object Along a Parabola',
          channel: '',
          note: 'Moving Object Along A Parabola with path visualization'
        },
        {
          url: 'https://www.youtube.com/watch?v=Nc9x0LfvJhI&t=321s',
          videoId: 'Nc9x0LfvJhI',
          title: 'The Power of Animation Curves',
          channel: '',
          note: 'Basics of Animation Curves'
        },
      ],
      'C Sharp': [
        {
          url: 'https://www.youtube.com/watch?v=m0s3IUrWzVQ&t=151s',
          videoId: 'm0s3IUrWzVQ',
          title: 'YouTube Video',
          channel: '',
          note: 'How to Write High Quality Code that doesn\'t fall apart.'
        },
      ],
      'Maths': [
        {
          url: 'https://www.youtube.com/watch?v=fjOdtSu4Lm4&list=PLImQaTpSAdsArRFFj8bIfqMk2X7Vlf3XF&index=1',
          videoId: 'fjOdtSu4Lm4',
          playlistId: 'PLImQaTpSAdsArRFFj8bIfqMk2X7Vlf3XF',
          title: 'YouTube Video',
          channel: '',
          note: 'Basic to start learn Unity3D as a beginner. Starting Point'
        },
      ],
      'Character Movement': [
        {
          url: 'https://www.youtube.com/watch?v=XtQMytORBmM',
          videoId: 'XtQMytORBmM',
          title: 'Unity Character Controller from Scratch',
          channel: 'Brackeys',
          note: 'Great foundation for the platformer project. Check timestamp 12:30 for slope handling.'
        },
      ],
      'Physics': [
        {
          url: 'https://www.youtube.com/watch?v=bFOAipGJGA0',
          videoId: 'bFOAipGJGA0',
          title: 'Unity Physics — Rigidbody & Colliders',
          channel: 'Unity',
          note: 'Revisit for slope controller refactor'
        },
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
        },
      ],
      'Level Design': [
        {
          url: 'https://www.youtube.com/watch?v=9tFSyMdnuQk',
          videoId: '9tFSyMdnuQk',
          title: 'Level Design Patterns for Platformers',
          channel: 'GMTK',
          note: ''
        },
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
  }
];
