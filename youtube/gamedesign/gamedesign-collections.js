// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Exported from TubeVault on 9/16/2026, 7:01:29 PM
//
// STRUCTURE — easy to browse/edit in any JSON editor:
//   DEFAULT_COLLECTIONS
//     └─ collection (e.g. "Unity Tutorials")
//          ├─ groups: { "Character Movement": [ ...videos ], "Performance": [ ...videos ] }
//          └─ ungrouped: [ ...videos ]   (videos with no sub-group)
//
// To apply this snapshot:
//   1. Replace your existing gamedesign-collections.js with this file
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
    id: 'gamedesign',
    name: 'Game Makers Toolkit',
    color: '#29B6F6',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=usF4cpcxbZc&t=354s',
        videoId: 'usF4cpcxbZc',
        title: '100 Steam Games that started life during GMTK Game Jam',
        channel: 'Game Maker\'s Toolkit',
        note: ''
      },
      {
        url: 'https://www.youtube.com/watch?v=XtQMytORBmM&t=4s',
        videoId: 'XtQMytORBmM',
        title: 'The Unity Tutorial For Complete Beginners',
        channel: 'Game Maker\'s Toolkit',
        note: 'Game Maker\'s Toolkit'
      },
    ]
  },
  {
    id: 'design-doc-s',
    name: 'Design Doc\'s',
    color: '#FFA726',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=2OExw7PyPlQ&list=PL8K0_g1wdQerwF_C2aL_ruzIJ9KG0in6h',
        videoId: '2OExw7PyPlQ',
        playlistId: 'PL8K0_g1wdQerwF_C2aL_ruzIJ9KG0in6h',
        title: 'Good Design, Bad Design Vol. 14 - Great and Terrible Graphic Design in Games',
        channel: 'Design Doc',
        note: ''
      },
    ]
  },
  {
    id: 'ask-gamedev',
    name: 'Ask GameDev',
    color: '#78909C',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=aZCku6RxBnA&list=PLqlV9u4jszMfJ-_9SyS16Qcab_5e9uj8V',
        videoId: 'aZCku6RxBnA',
        playlistId: 'PLqlV9u4jszMfJ-_9SyS16Qcab_5e9uj8V',
        title: 'Game Publishers That Solo Devs Should Check Out pt.10 - Versus Evil',
        channel: 'Ask Gamedev',
        note: ''
      },
    ]
  },
  {
    id: 'game-design-skills',
    name: 'Game Design Skills',
    color: '#EF5350',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=AYqZSvi3i9E&list=PLMf8EBa1Z9dBtyoB6lqxULVT1FcMRZExD',
        videoId: 'AYqZSvi3i9E',
        playlistId: 'PLMf8EBa1Z9dBtyoB6lqxULVT1FcMRZExD',
        title: '20+ Year Riot & Blizzard dev shares game design job interview prep tips',
        channel: 'Game Design Skills',
        note: ''
      },
    ]
  },
  {
    id: 'gdc-festival-of-gaming',
    name: 'GDC Festival of Gaming',
    color: '#26A69A',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=-jM9Tx6AVIE',
        videoId: '-jM9Tx6AVIE',
        title: 'The Marketing Money Talk: How to Budget Your Indie Game\'s Promotion Campaign',
        channel: 'GDC Festival of Gaming',
        note: ''
      },
    ]
  }
];
