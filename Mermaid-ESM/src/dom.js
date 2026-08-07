// Centralized DOM references for the Mermaid Explorer.
// All element lookups live here so feature modules share a single source of truth.

import { CONFIG } from '../Config.js';

const $ = (id) => document.getElementById(id);

export const D = {
  type: $('diagramType'),
  theme: $('theme'),
  src: $('source'),
  target: $('target'),
  btnRender: $('renderBtn'),
  btnReset: $('resetBtn'),
  diagramTypeBadge: $('diagramTypeBadge'),

  // Zoom / preview (reassigned at runtime, kept on D).
  zoomWrap: $('zoomWrap'),
  zoomSel: $('zoomSel'),
  preview: document.querySelector('.preview'),
  previewContainer: document.querySelector('.preview-container'),

  gutter: $('gutter'),
  autocompletePanel: $('autocompletePanel'),

  editorErrorBar: $('editorErrorBar'),
  editorErrorText: $('editorErrorText'),

  validateBtn: $('validateBtn'),
  fixBtn: $('fixBtn'),
  copyBtn: $('copyBtn'),
  clearBtn: $('clearBtn'),

  autoAlignBtn: $('autoAlignBtn'),
  autoUpdateToggle: $('autoUpdateToggle'),
  canvasDocsBtn: $('canvasDocsBtn'),

  exportMenuBtn: $('exportMenuBtn'),
  exportModalOverlay: $('exportModalOverlay'),
  closeExportBtn: $('closeExportBtn'),
  exportCancelBtn: $('exportCancelBtn'),
  exportConfirmBtn: $('exportConfirmBtn'),
  exportPreviewBox: $('exportPreviewBox'),

  toggleSrcBtn: $('toggleSrcBtn'),
  openEditorBtn: $('openEditorBtn'),
  sourceCol: $('sourceCol'),

  settingsToggleBtn: $('settingsToggleBtn'),
  settingsPanel: $('settingsPanel'),
  shapesPanel: $('shapesPanel'),
  colorWheelBtn: $('colorWheelBtn'),
  themePanel: $('themePanel'),
  shapesToolbarBtn: $('shapesToolbarBtn'),

  textSizeBtn: $('textSizeBtn'),
  textSizePopup: $('textSizePopup'),
  textSizeSlider: $('textSizeSlider'),

  diagramThemeToggleBtn: $('diagramThemeToggleBtn'),
  numberColorPicker: $('numberColorPicker'),
  circleColorPicker: $('circleColorPicker'),
  syncNumberColor: $('syncNumberColor'),
  diagramThicknessSlider: $('diagramThicknessSlider'),

  snippetsContainer: $('snippetsContainer'),
  snippetsBtn: $('snippetsBtn'),
  snippetsPanel: $('snippetsPanel'),

  zoomInBtn: $('zoomInBtn'),
  zoomOutBtn: $('zoomOutBtn'),
  zoomFitBtn: $('zoomFitBtn'),
  panBtn: $('panBtn'),
  fullscreenBtn: $('fullscreenBtn'),

  hlMode: $('hlMode'),
  hlLayer: $('hlLayer'),
  textareaWrap: $('textareaWrap'),

  editorResizeHandle: $('editorResizeHandle'),

  flowchartTools: $('flowchartTools'),
};

// Returns the currently rendered <svg> inside the preview target (or null).
export const currentSvg = () => D.target.querySelector('svg');

// Resolve the app CONFIG (now an ES module: ../Config.js).
export const getConfig = () => CONFIG;
