// Shared mutable state and shared constants used across the Mermaid Explorer
// feature modules.  ES module imports are read-only, so all mutable state is
// held on the exported `S` object (and on `window` where the original code
// relied on a global).

// ---- Global error-line set (was window.hlErrorLines in the original) ----
if (typeof window !== 'undefined') {
  window.hlErrorLines = window.hlErrorLines || new Set();
}

export const S = {
  lastRenderedSrc: '',
  renderSeq: 0, // incremented each render; cancels stale colorize passes

  // Autocomplete
  acItems: [],
  filteredAcItems: [],
  acSelectedIndex: 0,

  // Zoom / pan
  currentZoom: 'fit',
  panX: 0,
  panY: 0,
  isPanMode: false,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  panOrigX: 0,
  panOrigY: 0,

  // Editor resize
  isResizingEditor: false,
  editorStartWidth: 500,
  resizeStartX: 0,

  // Syntax highlighting (CodeMirror)
  cmView: null,
  hlActive: false,

  // Actor colour map (populated from the SVG after each render)
  actorColorMap: {},

  // Editor error / warning lines
  editorErrorLines: new Set(),
  editorWarningLines: new Set(),

  // Auto-render debounce
  inputTimer: null,
  inputSeq: 0,

  // Last measured preview size (for resize-observer pan compensation)
  lastVw: 0,
  lastVh: 0,
};

export const PALETTE = [
  '#8b7ff0', '#e2795b', '#3fb8af', '#e2a23b', '#5b9fe2', '#5cb896',
  '#d36ba1', '#7d8cf0', '#e2824a', '#5bc0de', '#a98bd9', '#6abe5c',
];

export const VALID_DIAGRAM_TYPES = [
  'flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram-v2', 'stateDiagram',
  'erDiagram', 'gantt', 'pie', 'gitGraph', 'mindmap', 'quadrantChart', 'timeline',
  'zenuml', 'requirementDiagram', 'sankey-beta', 'block-beta', 'architecture-beta',
  'C4Context', 'kanban', 'xychart-beta', 'packet-beta',
];

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 5;
export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];

export const VALIDATE_DEFAULT_HTML = `
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  Validate
`;
