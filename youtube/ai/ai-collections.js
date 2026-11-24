// ──────────────────────────────────────────────────────────────
// COLLECTIONS CONFIG
// Exported from TubeVault on 11/24/2026, 10:36:06 AM
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
    groups: {
      'ADLC': [
        {
          url: 'https://www.youtube.com/watch?v=OjSkVPD-geg',
          videoId: 'OjSkVPD-geg',
          title: 'Coding is Changing FOREVER! 🤯 SDLC vs ADLC (தமிழில்)',
          channel: 'The AI Dude - Tamil',
          note: ''
        },
        {
          url: 'https://www.youtube.com/watch?v=6CaQ9ZFuuKI',
          videoId: '6CaQ9ZFuuKI',
          title: 'YouTube Video',
          channel: '',
          note: ''
        },
      ],
      'AI Agents': [
        {
          url: 'https://www.youtube.com/watch?v=QU9kDHxG9-w',
          videoId: 'QU9kDHxG9-w',
          title: 'YouTube Video',
          channel: '',
          note: ''
        },
      ],
      'Second Brain': [
        {
          url: 'https://www.youtube.com/watch?v=wb1oJ4L0nQg',
          videoId: 'wb1oJ4L0nQg',
          title: 'YouTube Video',
          channel: '',
          note: ''
        },
      ]
    },
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
    name: 'Claude',
    color: '#FF7043',
    groups: {
      'Code Medin': [
        {
          url: 'https://www.youtube.com/watch?v=PMOnd8T7Py0',
          videoId: 'PMOnd8T7Py0',
          title: 'Is Learning to Build Software Still Worth It with AI? (My Honest Take)',
          channel: 'Cole Medin',
          note: 'Reverse Engineering Anything'
        },
        {
          url: 'https://www.youtube.com/watch?v=NZq88JAJSag',
          videoId: 'NZq88JAJSag',
          title: 'AI Coding Rate Limits are RIDICULOUS Now - Here\'s How You Keep Scaling Anyway',
          channel: '',
          note: 'R'
        },
      ],
      'RuralBytesTamil': [
        {
          url: 'https://www.youtube.com/watch?v=SgPvtTaSSZE',
          videoId: 'SgPvtTaSSZE',
          title: 'Anthropic\'s New Playbook: The 6-Stage AI-Native SDLC Every Dev Team Needs in 2026',
          channel: 'RuralBytesTamil',
          note: ''
        },
        {
          url: 'https://www.youtube.com/watch?v=f_Kbux-pH-E',
          videoId: 'f_Kbux-pH-E',
          title: 'This Claude Code Setting Cuts Your Token Bill by 40x',
          channel: 'RuralBytesTamil',
          note: ''
        },
      ]
    },
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=phuBfn3pqJU',
        videoId: 'phuBfn3pqJU',
        title: 'EVERYTHING I Learned Using Claude Code For 1 Year (2026 Full Guide)',
        channel: 'AI with Avthar',
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
  },
  {
    id: 'skills',
    name: 'Skills',
    color: '#78909C',
    groups: {},
    ungrouped: [
      {
        url: 'https://www.youtube.com/watch?v=-QFHIoCo-Ko',
        videoId: '-QFHIoCo-Ko',
        title: 'Full Walkthrough: Workflow for AI Coding — Matt Pocock',
        channel: 'AI Engineer',
        note: ''
      },
      {
        url: 'https://www.youtube.com/watch?v=M6mYodf0dJM',
        videoId: 'M6mYodf0dJM',
        title: 'mattpocock/skills: A complete AI Coding workflow, end-to-end',
        channel: 'Matt Pocock',
        note: ''
      },
    ]
  },
  {
    id: 'antigravity',
    name: 'AntiGravity',
    color: '#66BB6A',
    groups: {
      'Commands': [
        {
          url: 'https://www.youtube.com/watch?v=irq-elQEHuY',
          videoId: 'irq-elQEHuY',
          title: 'YouTube Video',
          channel: '',
          note: ''
        },
      ],
      'Subagents-Hooks-Automation': [
        {
          url: 'https://www.youtube.com/watch?v=92Fcxr1XEFw',
          videoId: '92Fcxr1XEFw',
          title: '',
          channel: '',
          note: ''
        },
      ],
      'Skills': [
        {
          url: 'https://www.youtube.com/watch?v=DjJbAHis1uQ',
          videoId: 'DjJbAHis1uQ',
          title: 'YouTube Video',
          channel: '',
          note: ''
        },
      ],
      'Flow': [
        {
          url: 'https://www.youtube.com/watch?v=LrTL_-_ZlLc',
          videoId: 'LrTL_-_ZlLc',
          title: 'YouTube Video',
          channel: '',
          note: ''
        },
      ]
    },
    ungrouped: []
  }
];
