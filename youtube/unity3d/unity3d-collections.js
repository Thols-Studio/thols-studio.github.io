// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Exported from TubeVault on 8/4/2026, 12:25:59 PM
//
// STRUCTURE — easy to browse/edit in any JSON editor:
//   DEFAULT_COLLECTIONS
//     └─ collection (e.g. "Unity Tutorials")
//          ├─ groups: { "Character Movement": [ ...videos ], "Performance": [ ...videos ] }
//          └─ ungrouped: [ ...videos ]   (videos with no sub-group)
//
// To apply this snapshot:
//   1. Replace your existing unity3d-collections.js with this file
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
    id: 'unity3d',
    name: 'Unity3D',
    color: '#EC407A',
    groups: {},
    ungrouped: []
  },
  {
    id: 'unity2d',
    name: 'Unity2D',
    color: '#29B6F6',
    groups: {
      'Spline': [
        {
          url: 'https://www.youtube.com/watch?v=AYXViWy2N6g&list=PLZ1QII7yudbdsmhI3xLaoNAHiFXYztjkX&index=7',
          videoId: 'AYXViWy2N6g',
          playlistId: 'PLZ1QII7yudbdsmhI3xLaoNAHiFXYztjkX',
          title: 'Spline Waypoints for AI Pathfinding — Unity 2D Racer (#7)',
          channel: 'Bluefever Software',
          note: 'Creating Spline. From the spline to waypoints'
        },
      ]
    },
    ungrouped: []
  },
  {
    id: 'unity3d-maths',
    name: 'Unity3D Maths',
    color: '#FFA726',
    groups: {
      'Projectiles': [
        {
          url: 'https://www.youtube.com/watch?v=DwGdoURXZag',
          videoId: 'DwGdoURXZag',
          title: 'Parabolic Trajectories | Cool ways to use Animation Curves in Unity',
          channel: 'Tycro Dev',
          note: ''
        },
        {
          url: 'https://www.youtube.com/watch?v=OPDl2uVaN_Q',
          videoId: 'OPDl2uVaN_Q',
          title: 'YouTube Video',
          channel: '',
          note: 'Projectiles with features - Change Shape, Change Speed'
        },
      ]
    },
    ungrouped: []
  },
  {
    id: 'unity-cli',
    name: 'Unity CLI',
    color: '#66BB6A',
    groups: {
      'CLI': [
        {
          url: 'https://www.youtube.com/watch?v=IDKpGHg6BVc',
          videoId: 'IDKpGHg6BVc',
          title: 'YouTube Video',
          channel: '',
          note: 'Vibe Coding'
        },
      ]
    },
    ungrouped: []
  },
  {
    id: 'tiled',
    name: 'Tile Map Editor',
    color: '#FF7043',
    groups: {
      'Tiled': [
        {
          url: 'https://www.youtube.com/watch?v=N6xqCwblyiw&t=10s',
          videoId: 'N6xqCwblyiw',
          title: 'A Guide to Level Creation with Tiled',
          channel: '',
          note: 'Basic 2D Level creation for Match 2 Games with Tiled'
        },
        {
          url: 'https://www.youtube.com/watch?v=WEtml6DuwqQ',
          videoId: 'WEtml6DuwqQ',
          title: 'Using the Terrain Brush in Tiled',
          channel: 'AET 304 Arts and Entertainment Technologies',
          note: 'Terrain Brush in Tiled'
        },
        {
          url: 'https://www.youtube.com/watch?v=uaIQau4woSM',
          videoId: 'uaIQau4woSM',
          title: 'Tiled 1.11.0 Automapping',
          channel: '',
          note: 'How to Create Rules Set using Tiled'
        },
      ]
    },
    ungrouped: []
  },
  {
    id: 'ui-tookkit',
    name: 'UI TookKit',
    color: '#AB47BC',
    groups: {
      'Tutorial': [
        {
          url: 'https://www.youtube.com/watch?v=qmEYjJL7jQg&list=PLUQd-0PkiOI5bwRXa6yug5kzIGSUf1i1n&index=2',
          videoId: 'qmEYjJL7jQg',
          playlistId: 'PLUQd-0PkiOI5bwRXa6yug5kzIGSUf1i1n',
          title: 'Design an Inventory Panel with Unity UI Toolkit | Inventory & Equipment Pt. 2',
          channel: 'Stacey Haffner',
          note: ''
        },
        {
          url: 'https://www.youtube.com/watch?v=r39vSzh4iR8',
          videoId: 'r39vSzh4iR8',
          title: '7 Reasons Why UI Toolkit Is Better Than UGUI',
          channel: 'Game Dev Guide',
          note: ''
        },
        {
          url: 'https://www.youtube.com/watch?v=i85OSs0fYvI&list=PLX2vGYjWbI0S3Zx5Dv7htBcWLBfKWf2qI',
          videoId: 'i85OSs0fYvI',
          playlistId: 'PLX2vGYjWbI0S3Zx5Dv7htBcWLBfKWf2qI',
          title: 'YouTube Video',
          channel: '',
          note: 'UI Took Kit Tutorial'
        },
      ]
    },
    ungrouped: []
  }
];
