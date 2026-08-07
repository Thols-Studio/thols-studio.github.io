// Application entry point.  Wires the shared state/DOM together, initializes
// every feature module, and boots the first render.

// Styles are imported here (not via <link>) so Vite bundles them with the
// module graph — keeping CSS as modular as the JS. Split by functionality to
// mirror the src/ module layout: theme, toolbar, panels, editor, export.
import '../css/theme.css';
import '../css/toolbar.css';
import '../css/panels.css';
import '../css/editor.css';
import '../css/export.css';

import { D, getConfig } from './dom.js';
import { S } from './state.js';
import { DIAGRAMS } from './data.js';
import { injectHLPaletteColors } from './coloring.js';
import { renderOne, loadExample, initRender, mermaid } from './render.js';
import {
  initGutter, initAutocomplete, initValidateFix, initEditActions, syncGutter,
} from './editor.js';
import { initZoom } from './zoom.js';
import { initHighlight } from './highlight.js';
import { initInteraction } from './interaction.js';
import {
  initEditorToggle, initSettingsPanel, initSnippets, initExport,
} from './panels.js';

const { type: elType, theme: elTheme, src: elSrc } = D;

// ---- Populate Diagram Type dropdown ----
for (const key in DIAGRAMS) {
  const cfg = getConfig();
  if (cfg && cfg.allowedDiagramTypes) {
    const typeMatch = DIAGRAMS[key].src.trim().match(/^[a-zA-Z0-9-]+/);
    if (typeMatch && !cfg.allowedDiagramTypes.includes(typeMatch[0])) continue;
  }
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = DIAGRAMS[key].label;
  elType.appendChild(opt);
}

elType.addEventListener('change', () => {
  elSrc.value = DIAGRAMS[elType.value].src + '\n';
  elSrc.dispatchEvent(new Event('input'));
});
elType.addEventListener('change', () => {
  loadExample(elType.value);
});

// ---- Theme change -> re-initialize mermaid with the chosen theme ----
elTheme.addEventListener('change', async () => {
  document.documentElement.classList.toggle('theme-light', elTheme.value === 'default');
  document.documentElement.classList.toggle('theme-teal', elTheme.value === 'teal');

  const isLight = elTheme.value === 'default';
  document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';

  const diagramThemeToggleBtn = D.diagramThemeToggleBtn;
  if (diagramThemeToggleBtn) diagramThemeToggleBtn.checked = !isLight;

  let mmTheme = elTheme.value;
  if (mmTheme === 'teal') mmTheme = 'dark';

  await mermaid.initialize({ startOnLoad: false, theme: mmTheme, securityLevel: 'loose' });
  renderOne(elSrc.value);
});

// ---- Boot ----
injectHLPaletteColors();

initGutter();
initAutocomplete();
initValidateFix(mermaid);
initEditActions(mermaid);
initHighlight();
initInteraction();
initEditorToggle();
initSettingsPanel();
initSnippets();
initExport();
initZoom();
initRender();

await mermaid.initialize({
  startOnLoad: false,
  theme: elTheme.value === 'teal' ? 'dark' : elTheme.value,
  securityLevel: 'loose',
});
loadExample(elType.value);

// Expose a couple of helpers for debugging / console use.
window.mermaid = mermaid;
window.renderOne = renderOne;
