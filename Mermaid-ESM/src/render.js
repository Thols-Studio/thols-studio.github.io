// Core rendering pipeline: parse + run the diagram, apply colorization and
// post-render styling, surface errors/warnings.

import mermaid from '../mermaid-11.16.0/package/dist/mermaid.esm.min.mjs';
import { D, currentSvg, getConfig } from './dom.js';
import { S } from './state.js';
import {
  colorizeSequence, colorizeClass, colorizeDiagram, colorizeFlowchart,
  applyDiagramStyle, applyDiagramFont, applyDiagramThickness,
} from './coloring.js';
import {
  showEditorError, clearEditorError, checkSequenceDiagramWarnings, showEditorWarnings,
  applyColors, syncGutter,
} from './editor.js';
import { resetZoom } from './zoom.js';
import { DIAGRAMS } from './data.js';

export { mermaid };

export async function renderOne(text) {
  if (text.trim() === '') {
    D.btnRender.classList.remove('rendered');
    D.target.removeAttribute('data-processed');
    D.target.innerHTML = `<div style="padding:2rem;color:var(--text-muted);text-align:center;display:flex;flex-direction:column;align-items:center;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:1rem;opacity:0.5;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      Start typing to create a diagram, or choose a snippet.</div>`;
    return;
  }

  const cfg = getConfig();
  if (cfg && cfg.allowedDiagramTypes) {
    const match = text.trim().match(/^[a-zA-Z0-9-]+/);
    if (match && !cfg.allowedDiagramTypes.includes(match[0])) {
      D.btnRender.classList.remove('rendered');
      D.target.removeAttribute('data-processed');
      showEditorError(`Diagram type '${match[0]}' is not permitted`);
      return;
    }
  }
  D.btnRender.classList.remove('rendered');
  D.target.removeAttribute('data-processed');
  D.target.textContent = text;
  S.lastRenderedSrc = text;
  try {
    const isValid = await mermaid.parse(text);
    if (isValid === false) {
      showEditorError('Syntax error: invalid diagram syntax');
      D.btnRender.classList.remove('rendered');
      return;
    }
    await mermaid.run({ nodes: [D.target], suppressErrors: false });
    D.btnRender.classList.add('rendered');
    resetZoom();
    clearEditorError();

    const warnings = checkSequenceDiagramWarnings(text);
    if (warnings && warnings.length > 0) {
      showEditorWarnings(warnings);
    }

    const mySeq = ++S.renderSeq;
    const apply = () => {
      if (mySeq !== S.renderSeq) return;
      applyColors();
    };
    apply();
    setTimeout(apply, 150);
  } catch (e) {
    D.btnRender.classList.remove('rendered');
    console.error(e);
    showEditorError(e);
  }
}

export function loadExample(key) {
  const d = DIAGRAMS[key];
  elSrc.value = d.src;
  syncGutter();
  renderOne(d.src);
}

const { src: elSrc } = D;

export function initRender() {
  mermaid.parseError = (err, hash) => {
    showEditorError(err);
  };

  D.btnRender.addEventListener('click', () => renderOne(elSrc.value));
  D.btnReset.addEventListener('click', () => loadExample(D.type.value));
}
