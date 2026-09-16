// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Exported from TubeVault on 9/16/2026, 7:00:41 PM
//
// STRUCTURE — easy to browse/edit in any JSON editor:
//   DEFAULT_COLLECTIONS
//     └─ collection (e.g. "Unity Tutorials")
//          ├─ groups: { "Character Movement": [ ...videos ], "Performance": [ ...videos ] }
//          └─ ungrouped: [ ...videos ]   (videos with no sub-group)
//
// To apply this snapshot:
//   1. Replace your existing ai-collections.js with this file
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
    id: 'ai',
    name: 'AI',
    color: '#AB45BC',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=xkStXH3UwtQ&t=280s',
        videoId: 'xkStXH3UwtQ',
        title: 'AI மூலம் பாடத்தை வீடியோவாக மாற்றுவது எப்படி?FREE AI Tool 🔥 Teachers-க்கு Super AI Tool! 🤩',
        channel: 'Educreator Hub',
        note: ''
      },
    ]
  },
  {
    id: 'claude-workflow',
    name: 'Claude Workflow',
    color: '#FF7043',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=phuBfn3pqJU',
        videoId: 'phuBfn3pqJU',
        title: 'EVERYTHING I Learned Using Claude Code For 1 Year (2026 Full Guide)',
        channel: 'AI with Avthar',
        note: ''
      },
      {
        url: 'https://www.youtube.com/watch?v=M6mYodf0dJM',
        videoId: 'M6mYodf0dJM',
        title: 'mattpocock/skills: A complete AI Coding workflow, end-to-end',
        channel: 'Matt Pocock',
        note: ''
      },
      {
        url: 'https://www.youtube.com/watch?v=-QFHIoCo-Ko',
        videoId: '-QFHIoCo-Ko',
        title: 'Full Walkthrough: Workflow for AI Coding — Matt Pocock',
        channel: 'AI Engineer',
        note: ''
      },
      {
        url: 'https://www.youtube.com/watch?v=SgPvtTaSSZE',
        videoId: 'SgPvtTaSSZE',
        title: 'Anthropic\'s New Playbook: The 6-Stage AI-Native SDLC Every Dev Team Needs in 2026',
        channel: 'RuralBytesTamil',
        note: ''
      },
    ]
  },
  {
    id: 'computer-hardware',
    name: 'Computer Hardware',
    color: '#FF7043',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=t2x9GAOgsjA',
        videoId: 't2x9GAOgsjA',
        title: '',
        channel: '',
        note: ''
      },
    ]
  }
];
