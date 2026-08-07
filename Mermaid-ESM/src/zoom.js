// Zoom, pan (hand tool), fullscreen, and editor-panel resize logic.

import { D } from './dom.js';
import { S, ZOOM_MIN, ZOOM_MAX, ZOOM_STEPS } from './state.js';

const naturalSize = () => {
  const svg = D.target.querySelector('svg');
  if (!svg) return { w: 0, h: 0 };
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) return { w: vb.width, h: vb.height };
  const parts = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
  if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) return { w: parts[2], h: parts[3] };
  return { w: 0, h: 0 };
};

const fitScale = () => {
  const { w, h } = naturalSize();
  if (!w || !h) return 1;
  const cs = getComputedStyle(D.preview);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  return Math.min(Math.max(1, D.preview.clientWidth - padX) / w, Math.max(1, D.preview.clientHeight - padY) / h, 1);
};

const clampPan = (scale) => {
  const { w, h } = naturalSize();
  if (!w || !h) return;
  const cs = getComputedStyle(D.preview);
  const padTop = parseFloat(cs.paddingTop) || 0;
  const padBottom = parseFloat(cs.paddingBottom) || 0;
  const padLeft = parseFloat(cs.paddingLeft) || 0;
  const padRight = parseFloat(cs.paddingRight) || 0;
  const vw = D.preview.clientWidth - padLeft - padRight;
  const vh = D.preview.clientHeight - padTop - padBottom;
  const cw = w * scale, ch = h * scale;

  const minPanX = padLeft + Math.min(100 - cw, (vw - cw) / 2);
  const maxPanX = padLeft + Math.max(vw - 100, (vw - cw) / 2);
  const minPanY = padTop + Math.min(100 - ch, (vh - ch) / 2);
  const maxPanY = padTop + Math.max(vh - 100, (vh - ch) / 2);

  S.panX = Math.max(minPanX, Math.min(maxPanX, S.panX));
  S.panY = Math.max(minPanY, Math.min(maxPanY, S.panY));
};

const applyZoom = () => {
  const zoomWrap = D.zoomWrap;
  if (!zoomWrap) return;
  const { w, h } = naturalSize();
  const scale = S.currentZoom === 'fit' ? fitScale() : S.currentZoom;
  const svg = D.target.querySelector('svg');
  if (svg) {
    svg.style.width = (w || 0) + 'px';
    svg.style.height = (h || 0) + 'px';
    svg.style.maxWidth = 'none';
  }
  zoomWrap.style.width = (w || 0) + 'px';
  zoomWrap.style.height = (h || 0) + 'px';
  clampPan(scale);
  zoomWrap.style.transform = `translate(${S.panX}px, ${S.panY}px) scale(${scale})`;
};

export const setZoom = (z) => {
  if (z !== 'fit') {
    const val = parseFloat(z);
    if (isNaN(val) || val < ZOOM_MIN || val > ZOOM_MAX) return;
  }
  S.currentZoom = z;
  applyZoom();
};

export const resetZoom = () => {
  S.currentZoom = 'fit';
  const scale = fitScale();
  const { w, h } = naturalSize();
  if (w && h) {
    const cs = getComputedStyle(D.preview);
    const padTop = parseFloat(cs.paddingTop) || 0;
    const padBottom = parseFloat(cs.paddingBottom) || 0;
    const padLeft = parseFloat(cs.paddingLeft) || 0;
    const padRight = parseFloat(cs.paddingRight) || 0;
    const vw = D.preview.clientWidth - padLeft - padRight;
    const vh = D.preview.clientHeight - padTop - padBottom;
    S.panX = padLeft + (vw - w * scale) / 2;
    S.panY = padTop + (vh - h * scale) / 2;
  } else {
    S.panX = 0; S.panY = 0;
  }
  applyZoom();
};

export function syncPreviewContainerPosition() {
  const previewContainerEl = D.previewContainer;
  if (previewContainerEl && D.sourceCol) {
    if (document.body.classList.contains('src-hidden') || D.sourceCol.style.display === 'none') {
      previewContainerEl.style.left = '0';
    } else {
      const actualRight = D.sourceCol.getBoundingClientRect().right;
      previewContainerEl.style.left = (actualRight + 16) + 'px';
    }
  }
}

export function initZoom() {
  const { zoomWrap, preview } = D;
  D.zoomWrap = zoomWrap;
  D.preview = preview;

  D.zoomInBtn.addEventListener('click', () => {
    const base = S.currentZoom === 'fit' ? fitScale() : S.currentZoom;
    setZoom(ZOOM_STEPS.find((s) => s > base + 0.001) ?? (base + 0.25));
  });
  D.zoomOutBtn.addEventListener('click', () => {
    const base = S.currentZoom === 'fit' ? fitScale() : S.currentZoom;
    setZoom([...ZOOM_STEPS].reverse().find((s) => s < base - 0.001) ?? (base - 0.25));
  });
  D.zoomFitBtn.addEventListener('click', resetZoom);
  preview.addEventListener('wheel', (e) => {
    if (e.shiftKey) return;
    e.preventDefault();
    const base = S.currentZoom === 'fit' ? fitScale() : S.currentZoom;
    setZoom(base + (e.deltaY < 0 ? 0.1 : -0.1));
  }, { passive: false });

  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const cs = getComputedStyle(entry.target);
      const padY = parseFloat(cs.paddingTop) || 0;
      const vw = entry.contentRect.width;
      const vh = entry.contentRect.height - padY;

      if (S.lastVw && S.lastVh) {
        S.panX += (vw - S.lastVw) / 2;
        S.panY += (vh - S.lastVh) / 2;
      }
      S.lastVw = vw;
      S.lastVh = vh;
      applyZoom();
    }
  });
  if (preview) resizeObserver.observe(preview);

  // Hand tool (pan mode)
  D.panBtn.addEventListener('click', () => {
    S.isPanMode = !S.isPanMode;
    S.isPanning = false;
    D.panBtn.classList.toggle('active', S.isPanMode);
    preview.classList.toggle('pan-mode', S.isPanMode);
    if (!S.isPanMode) {
      preview.style.cursor = '';
    }
  });
  preview.addEventListener('mousedown', (e) => {
    if (!S.isPanMode) return;
    e.preventDefault();
    S.isPanning = true;
    S.panStartX = e.clientX; S.panStartY = e.clientY;
    S.panOrigX = S.panX; S.panOrigY = S.panY;
    preview.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!S.isPanning) return;
    e.preventDefault();
    S.panX = S.panOrigX + (e.clientX - S.panStartX);
    S.panY = S.panOrigY + (e.clientY - S.panStartY);
    applyZoom();
  });
  window.addEventListener('mouseup', () => {
    if (!S.isPanning) return;
    S.isPanning = false;
    if (S.isPanMode) preview.style.cursor = 'grab';
  });

  // Fullscreen
  D.fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      D.previewContainer.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    D.fullscreenBtn.classList.toggle('active', isFs);
    setTimeout(() => { if (S.currentZoom === 'fit') applyZoom(); }, 50);
  });

  // Editor panel resize
  const handle = D.editorResizeHandle;
  handle.addEventListener('mousedown', (e) => {
    S.isResizingEditor = true;
    S.resizeStartX = e.clientX;
    S.editorStartWidth = D.sourceCol.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!S.isResizingEditor) return;
    e.preventDefault();

    const minW = window.innerWidth * 0.35;
    const maxW = window.innerWidth * 0.60;

    let newWidth = S.editorStartWidth + (e.clientX - S.resizeStartX);
    newWidth = Math.max(minW, Math.min(maxW, newWidth));

    D.sourceCol.style.width = newWidth + 'px';
    syncPreviewContainerPosition();
  });
  window.addEventListener('mouseup', () => {
    if (S.isResizingEditor) {
      S.isResizingEditor = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
    }
  });
  window.addEventListener('resize', () => {
    syncPreviewContainerPosition();
  });

  syncPreviewContainerPosition();
}
