// Floating panels: settings, theme/styling, snippets, export modal, and the
// show/hide editor toggle.

import { D, currentSvg, getConfig } from './dom.js';
import { S, PALETTE } from './state.js';
import { DIAGRAMS, SNIPPETS } from './data.js';
import {
  applyDiagramStyle, applyDiagramFont, applyDiagramThickness, colorizeSequence,
} from './coloring.js';
import { syncPreviewContainerPosition } from './zoom.js';

// ---- Hide / show the source editor ----
function toggleEditor() {
  const sourceCol = D.sourceCol;
  const hidden = sourceCol.style.display === 'none';
  sourceCol.style.display = hidden ? '' : 'none';
  document.body.classList.toggle('src-hidden', !hidden);
  syncPreviewContainerPosition();
}

export function initEditorToggle() {
  D.toggleSrcBtn.addEventListener('click', toggleEditor);
  if (D.openEditorBtn) D.openEditorBtn.addEventListener('click', toggleEditor);
}

function syncDiagramThemeToggleState() {
  const btn = D.diagramThemeToggleBtn;
  if (btn) {
    const isNonDefault = document.documentElement.classList.contains('theme-teal') ||
      document.documentElement.classList.contains('theme-dark') ||
      (D.theme && D.theme.value !== 'default');
    btn.checked = isNonDefault;
  }
}

export function initSettingsPanel() {
  D.settingsToggleBtn.addEventListener('click', () => {
    D.settingsPanel.classList.toggle('show');
    D.themePanel.classList.remove('show');
    if (D.shapesPanel) D.shapesPanel.classList.remove('show');
  });

  D.colorWheelBtn.addEventListener('click', () => {
    D.themePanel.classList.toggle('show');
    D.settingsPanel.classList.remove('show');
    if (D.shapesPanel) D.shapesPanel.classList.remove('show');

    if (D.themePanel.classList.contains('show') && D.theme) {
      const currentTheme = D.theme.value || 'default';
      document.querySelectorAll('.theme-btn').forEach((b) => {
        if (b.getAttribute('data-theme') === currentTheme) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
  });

  if (D.shapesToolbarBtn && D.shapesPanel) {
    D.shapesToolbarBtn.addEventListener('click', () => {
      D.shapesPanel.classList.toggle('show');
      D.settingsPanel.classList.remove('show');
      D.themePanel.classList.remove('show');
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#settingsToggleBtn') && !e.target.closest('#settingsPanel')) {
      D.settingsPanel.classList.remove('show');
    }
    if (!e.target.closest('#colorWheelBtn') && !e.target.closest('#themePanel')) {
      D.themePanel.classList.remove('show');
    }
    if (!e.target.closest('#shapesToolbarBtn') && !e.target.closest('#shapesPanel') && D.shapesPanel) {
      D.shapesPanel.classList.remove('show');
    }
  });

  // Theme palette buttons -> change the diagram theme.
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const newTheme = e.currentTarget.getAttribute('data-theme');
      if (D.theme && D.theme.value !== newTheme) {
        D.theme.value = newTheme;
        D.theme.dispatchEvent(new Event('change'));
      }
    });
  });

  // Diagram style / font / thickness buttons.
  document.querySelectorAll('.style-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.style-btn').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      applyDiagramStyle();
    });
  });
  document.querySelectorAll('.font-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.font-btn').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      applyDiagramFont();
    });
  });
  document.querySelectorAll('.thickness-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.thickness-btn').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const slider = D.diagramThicknessSlider;
      if (slider) slider.value = e.currentTarget.getAttribute('data-thickness');
      applyDiagramThickness();
    });
  });

  const thicknessSlider = D.diagramThicknessSlider;
  if (thicknessSlider) {
    thicknessSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      document.querySelectorAll('.thickness-btn').forEach((b) => {
        if (b.getAttribute('data-thickness') === val) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      applyDiagramThickness();
    });
  }

  // Sequence number / circle colours.
  if (D.numberColorPicker && D.circleColorPicker && D.syncNumberColor) {
    D.syncNumberColor.addEventListener('change', (e) => {
      const disabled = e.target.checked;
      D.numberColorPicker.disabled = disabled;
      D.numberColorPicker.style.opacity = disabled ? '0.5' : '1';
      D.circleColorPicker.disabled = disabled;
      D.circleColorPicker.style.opacity = disabled ? '0.5' : '1';
      colorizeSequence();
    });
    D.numberColorPicker.addEventListener('input', () => colorizeSequence());
    D.circleColorPicker.addEventListener('input', () => colorizeSequence());
  }

  // Diagram theme toggle (dark/light switch in the theme panel).
  const diagramThemeToggleBtn = D.diagramThemeToggleBtn;
  if (diagramThemeToggleBtn) {
    diagramThemeToggleBtn.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? (localStorage.getItem('mermaid-last-dark-theme') || 'teal') : 'default';
      if (D.theme && D.theme.value !== newTheme) {
        if (e.target.checked && newTheme !== 'default') {
          localStorage.setItem('mermaid-last-dark-theme', newTheme);
        }
        D.theme.value = newTheme;
        D.theme.dispatchEvent(new Event('change'));
      }
    });
  }
  if (D.theme) {
    D.theme.addEventListener('change', () => {
      if (D.theme.value !== 'default') {
        localStorage.setItem('mermaid-last-dark-theme', D.theme.value);
      }
      syncDiagramThemeToggleState();
    });
  }
  syncDiagramThemeToggleState();

  // Editor font size slider.
  const textSizeBtn = D.textSizeBtn;
  const textSizePopup = D.textSizePopup;
  const textSizeSlider = D.textSizeSlider;
  if (textSizeBtn && textSizePopup) {
    textSizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      textSizePopup.style.display = textSizePopup.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#textSizePopup') && !e.target.closest('#textSizeBtn')) {
        textSizePopup.style.display = 'none';
      }
    });
  }
  if (textSizeSlider) {
    const savedFontSize = localStorage.getItem('editorFontSize');
    if (savedFontSize) {
      document.documentElement.style.setProperty('--editor-font-size', savedFontSize + 'px');
      textSizeSlider.value = savedFontSize;
    }
    textSizeSlider.addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--editor-font-size', e.target.value + 'px');
      localStorage.setItem('editorFontSize', e.target.value);
    });
  }
}

// ---- Snippets panel ----
function updateSnippetsVisibility() {
  const elSrc = D.src;
  const src = elSrc.value.trim();
  const cleanSrc = src.replace(/^---[\s\S]*?---\s*/, '');
  let currentType = 'other';
  if (/^(flowchart|graph)\b/i.test(cleanSrc)) currentType = 'flowchart';
  else if (/^sequenceDiagram\b/i.test(cleanSrc)) currentType = 'sequence';
  else if (/^classDiagram\b/i.test(cleanSrc)) currentType = 'class';
  else if (/^stateDiagram\b/i.test(cleanSrc)) currentType = 'state';
  else if (/^erDiagram\b/i.test(cleanSrc)) currentType = 'er';
  else if (/^gantt\b/i.test(cleanSrc)) currentType = 'gantt';
  else if (/^pie\b/i.test(cleanSrc)) currentType = 'pie';
  else if (/^gitGraph\b/i.test(cleanSrc)) currentType = 'git';
  else if (/^mindmap\b/i.test(cleanSrc)) currentType = 'mindmap';
  else if (D.type && D.type.value) {
    currentType = D.type.value;
  }

  if (D.diagramTypeBadge) {
    D.diagramTypeBadge.textContent = DIAGRAMS[D.type.value]?.label || 'Diagram';
  }

  const fcTools = D.flowchartTools;
  if (fcTools) fcTools.style.display = (currentType === 'flowchart') ? 'flex' : 'none';

  let hasVisible = false;
  const children = D.snippetsPanel.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (el.classList.contains('no-snippets-msg')) {
      el.style.display = hasVisible ? 'none' : 'block';
      continue;
    }
    const type = el.getAttribute('data-type');
    if (type === currentType || type === 'all') {
      el.style.display = '';
      if (el.classList.contains('snippet-grid')) hasVisible = true;
    } else {
      el.style.display = 'none';
    }
  }
}

export function initSnippets() {
  const cfg = getConfig();
  let snippetsHtml = '';
  for (const cat of SNIPPETS) {
    if (cfg && cfg.allowedDiagramTypes && cat.type !== 'all') {
      const allowed = cfg.allowedDiagramTypes;
      const matchesType = allowed.includes(cat.type) ||
        (cat.type === 'sequence' && allowed.includes('sequenceDiagram')) ||
        (cat.type === 'sequenceDiagram' && allowed.includes('sequence'));
      if (!matchesType) continue;
    }
    const typeAttr = cat.type || 'all';
    snippetsHtml += `<div class="snippet-category" data-type="${typeAttr}">${cat.cat}</div><div class="snippet-grid" data-type="${typeAttr}">`;
    for (const item of cat.items) {
      const svg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>`;
      const copySvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      const insertSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      snippetsHtml += `<div class="snippet-btn" data-text="${encodeURIComponent(item.text)}">
        <div class="snippet-label">${svg}${item.name}</div>
        <div class="snippet-actions">
          <button class="action-btn action-copy" title="Copy to clipboard">${copySvg}</button>
          <button class="action-btn action-insert" title="Insert snippet">${insertSvg}</button>
        </div>
      </div>`;
    }
    snippetsHtml += `</div>`;
  }
  snippetsHtml += `<div class="no-snippets-msg" style="padding: 1rem; color: var(--text-muted); text-align: center; width: 100%; display: none;">No snippets available for this diagram type.</div>`;
  D.snippetsPanel.innerHTML = snippetsHtml;

  D.snippetsBtn.addEventListener('click', () => {
    D.snippetsContainer.classList.toggle('expanded');
  });

  D.snippetsPanel.addEventListener('click', async (e) => {
    const btn = e.target.closest('.snippet-btn');
    if (!btn) return;
    let text = decodeURIComponent(btn.getAttribute('data-text') || '');
    text = text.replace(/\n+$/, '');

    if (e.target.closest('.action-copy')) {
      try {
        await navigator.clipboard.writeText(text.trim());
      } catch (e) { }
      return;
    }

    const elSrc = D.src;
    elSrc.focus();
    const start = elSrc.selectionStart;
    const end = elSrc.selectionEnd;
    elSrc.setRangeText(text, start, end, 'end');
    elSrc.dispatchEvent(new Event('input'));
  });

  D.src.addEventListener('input', updateSnippetsVisibility);
  if (D.type) D.type.addEventListener('change', updateSnippetsVisibility);
  updateSnippetsVisibility();
}

// ---- Export modal ----
function serializeSvg(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  const w = svg.getAttribute('width') || svg.viewBox?.baseVal?.width || 800;
  const h = svg.getAttribute('height') || svg.viewBox?.baseVal?.height || 600;
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);

  const activeBgSwatch = document.querySelector('.bg-swatch.active');
  if (activeBgSwatch && activeBgSwatch.dataset.bg && activeBgSwatch.dataset.bg !== 'transparent') {
    const bg = activeBgSwatch.style.background || activeBgSwatch.dataset.bg;
    clone.style.background = bg;
  }
  return new XMLSerializer().serializeToString(clone);
}

function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function updateExportPreview() {
  const svg = currentSvg();
  const box = D.exportPreviewBox;
  if (!svg) {
    box.innerHTML = '<div style="color:var(--text-muted)">No diagram to preview</div>';
    return;
  }
  const clone = svg.cloneNode(true);
  clone.style.width = '100%';
  clone.style.height = '100%';
  clone.style.maxWidth = '100%';

  const activeBgSwatch = document.querySelector('.bg-swatch.active');
  if (activeBgSwatch && activeBgSwatch.dataset.bg !== 'transparent') {
    box.style.background = activeBgSwatch.style.background || activeBgSwatch.dataset.bg;
  } else {
    box.style.background = 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 10px 10px';
  }

  box.innerHTML = '';
  box.appendChild(clone);
}

export function initExport() {
  if (!D.exportMenuBtn) return;

  const formatOptions = document.querySelectorAll('.format-option');
  const bgSwatches = document.querySelectorAll('.bg-swatch');

  D.exportMenuBtn.addEventListener('click', () => {
    D.exportModalOverlay.style.display = 'flex';
    updateExportPreview();
  });

  const closeExportModal = () => { D.exportModalOverlay.style.display = 'none'; };
  if (D.closeExportBtn) D.closeExportBtn.addEventListener('click', closeExportModal);
  if (D.exportCancelBtn) D.exportCancelBtn.addEventListener('click', closeExportModal);
  if (D.exportModalOverlay) {
    D.exportModalOverlay.addEventListener('click', (e) => {
      if (e.target === D.exportModalOverlay) closeExportModal();
    });
  }

  formatOptions.forEach((opt) => {
    if (opt.querySelector('input').disabled) return;
    opt.addEventListener('click', () => {
      formatOptions.forEach((o) => o.classList.remove('active'));
      opt.classList.add('active');
      opt.querySelector('input').checked = true;
    });
  });

  bgSwatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      bgSwatches.forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      updateExportPreview();
    });
  });

  if (D.exportConfirmBtn) {
    D.exportConfirmBtn.addEventListener('click', () => {
      const formatInput = document.querySelector('input[name="exportFormat"]:checked');
      if (!formatInput) return;
      const format = formatInput.value;
      const svg = currentSvg();
      if (!svg) return;

      const oldText = D.exportConfirmBtn.textContent;
      D.exportConfirmBtn.textContent = 'Exporting...';

      setTimeout(() => {
        if (format === 'svg') {
          download(`mermaid-${D.type.value}.svg`, new Blob([serializeSvg(svg)], { type: 'image/svg+xml' }));
        } else if (format === 'mmd') {
          download(`mermaid-${D.type.value}.mmd`, new Blob([D.src.value], { type: 'text/plain' }));
        } else if (format === 'png') {
          const vb = svg.viewBox?.baseVal;
          const w = Math.max(1, vb?.width || svg.clientWidth || 800);
          const h = Math.max(1, vb?.height || svg.clientHeight || 600);
          const scale = 2;
          const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(serializeSvg(svg))));
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = w * scale; canvas.height = h * scale;
            const ctx = canvas.getContext('2d');
            const activeBgSwatch = document.querySelector('.bg-swatch.active');
            if (activeBgSwatch && activeBgSwatch.dataset.bg !== 'transparent') {
              ctx.fillStyle = activeBgSwatch.dataset.bg === 'white' ? '#ffffff' : (activeBgSwatch.dataset.bg === 'black' ? '#000000' : activeBgSwatch.style.background);
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) download(`mermaid-${D.type.value}.png`, blob);
              D.exportConfirmBtn.textContent = 'Done ✓';
              setTimeout(() => { D.exportConfirmBtn.textContent = oldText; closeExportModal(); }, 1000);
            }, 'image/png');
          };
          img.onerror = () => { D.exportConfirmBtn.textContent = 'Failed'; setTimeout(() => D.exportConfirmBtn.textContent = oldText, 1000); };
          img.src = dataUrl;
          return;
        }
        D.exportConfirmBtn.textContent = 'Done ✓';
        setTimeout(() => { D.exportConfirmBtn.textContent = oldText; closeExportModal(); }, 1000);
      }, 50);
    });
  }
}
