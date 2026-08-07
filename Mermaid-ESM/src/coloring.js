// Diagram coloring: per-actor / per-node colouring plus the diagram
// style / font / line-thickness controls.  Colours are injected as inline
// !important styles so they survive mermaid 11.x async theme re-injection.

import { D, currentSvg } from './dom.js';
import { PALETTE } from './state.js';

// Inject syntax-highlight token colours explicitly for light and dark themes.
export function injectHLPaletteColors() {
  const style = document.createElement('style');
  style.id = 'hl-palette-colors';
  style.textContent = [
    `:root, :root.theme-teal {`,
    `  --hl-kw: #c792ea;`,
    `  --hl-bi: #82d4f5;`,
    `  --hl-str: #b5e8a0;`,
    `  --hl-num: #f0a45d;`,
    `  --hl-arr: #35d0c0;`,
    `  --hl-cmt: #46656f;`,
    `}`,
    `:root.theme-light {`,
    `  --hl-kw: #a33f9b;`,
    `  --hl-bi: #0d7ea3;`,
    `  --hl-str: #147a52;`,
    `  --hl-num: #b4560f;`,
    `  --hl-arr: #123c36;`,
    `  --hl-cmt: #8fa9a5;`,
    `}`,
    `.hl-keyword { color: var(--hl-kw); font-weight:700; }`,
    `.hl-builtin { color: var(--hl-bi); }`,
    `.hl-string  { color: var(--hl-str); }`,
    `.hl-number  { color: var(--hl-num); }`,
    `.hl-arrow   { color: var(--hl-arr); }`,
    `.hl-comment { color: var(--hl-cmt); font-style:italic; }`,
    `textarea.hl-on { caret-color: var(--hl-kw); }`,
  ].join('\n');
  document.head.appendChild(style);
}

export function contrastText(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#1a1a1a' : '#ffffff';
}

export function tint(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.18)`;
}

export function tintStrong(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.55)`;
}

// Set/merge inline style props with !important on an element.
export function setInline(el, props) {
  const keep = (el.getAttribute('style') || '')
    .split(';').map((s) => s.trim()).filter(Boolean)
    .filter((s) => !Object.keys(props).some((k) => s.toLowerCase().startsWith(k.toLowerCase() + ':')));
  for (const [k, v] of Object.entries(props)) keep.push(`${k}:${v}!important`);
  el.setAttribute('style', keep.join(';'));
}

// Vivid per-actor coloring for sequence diagrams.
export function colorizeSequence() {
  const svg = currentSvg();
  if (!svg) return false;
  const actorRects = svg.querySelectorAll('rect.actor');
  if (!actorRects.length) return false;

  const xCentres = [];
  actorRects.forEach((rect) => {
    const x = parseFloat(rect.getAttribute('x')) || 0;
    const w = parseFloat(rect.getAttribute('width')) || 0;
    xCentres.push(Math.round(x + w / 2));
  });
  const laneByX = new Map();
  [...new Set(xCentres)].sort((a, b) => a - b).forEach((cx, i) => laneByX.set(cx, i));
  const sortedX = [...laneByX.keys()];
  const laneXOf = (x) => {
    let best = 0, bestDist = Infinity;
    sortedX.forEach((cx, idx) => { const d = Math.abs(cx - x); if (d < bestDist) { bestDist = d; best = idx; } });
    return best;
  };

  actorRects.forEach((rect, i) => {
    const lane = laneByX.get(xCentres[i]) ?? 0;
    rect.setAttribute('data-lane', String(lane));
    setInline(rect, { fill: tint(PALETTE[lane]), stroke: PALETTE[lane], 'stroke-width': '2' });
  });
  svg.querySelectorAll('text.actor').forEach((t) => {
    const x = parseFloat(t.getAttribute('x')) || 0;
    const lane = laneXOf(x);
    setInline(t, { fill: PALETTE[lane], 'font-weight': '700' });
    t.querySelectorAll('tspan').forEach((ts) => setInline(ts, { fill: PALETTE[lane], 'font-weight': '700' }));
  });

  svg.querySelectorAll('line.actor-line').forEach((line) => {
    const x1 = parseFloat(line.getAttribute('x1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    if (!isNaN(x1) && !isNaN(x2) && Math.abs(x1 - x2) < 1) {
      const lane = laneXOf(x1);
      setInline(line, { fill: 'none', stroke: PALETTE[lane] });
    }
  });

  const msgLines = svg.querySelectorAll('line[class*="messageLine"], path[class*="messageLine"]');
  const arrows = [];
  msgLines.forEach((el) => {
    let x1, x2, y1;
    if (el.tagName.toLowerCase() === 'line') {
      x1 = parseFloat(el.getAttribute('x1')) || 0;
      x2 = parseFloat(el.getAttribute('x2')) || 0;
      y1 = parseFloat(el.getAttribute('y1')) || 0;
    } else {
      const m = (el.getAttribute('d') || '').match(/M\s*([\d.]+),([\d.]+)/);
      if (!m) return;
      x1 = x2 = parseFloat(m[1]);
      y1 = parseFloat(m[2]);
    }
    const lane = laneXOf(x1);
    setInline(el, { stroke: PALETTE[lane] });
    arrows.push({ midX: (x1 + x2) / 2, y: y1, lane });
  });

  svg.querySelectorAll('text.messageText').forEach((t) => {
    const tx = parseFloat(t.getAttribute('x')) || 0;
    const ty = parseFloat(t.getAttribute('y')) || 0;
    let bestLane = null, bestScore = Infinity;
    arrows.forEach((a) => {
      const dx = Math.abs(a.midX - tx);
      if (dx > 14) return;
      const dy = a.y - ty;
      const penalty = dy < 0 ? 500 : 0;
      const score = dx * 5 + Math.abs(dy) + penalty;
      if (score < bestScore) { bestScore = score; bestLane = a.lane; }
    });
    if (bestLane !== null) {
      setInline(t, { fill: PALETTE[bestLane], stroke: 'none', 'font-weight': '600' });
      t.querySelectorAll('tspan').forEach((ts) => setInline(ts, { fill: PALETTE[bestLane] }));
    }
  });

  const syncNumColor = D.syncNumberColor?.checked !== false;
  const customNumColor = D.numberColorPicker?.value || '#ffffff';
  const customCircleColor = D.circleColorPicker?.value || '#000000';

  svg.querySelectorAll('text.sequenceNumber').forEach((t) => {
    const tx = parseFloat(t.getAttribute('x')) || 0;
    const lane = laneXOf(tx);
    const textColor = syncNumColor ? '#ffffff' : customNumColor;
    const circleColor = syncNumColor ? PALETTE[lane] : customCircleColor;

    setInline(t, { fill: textColor });

    const prev = t.previousElementSibling;
    if (prev && prev.tagName.toLowerCase() === 'line') {
      const markerUrl = prev.getAttribute('marker-start');
      if (markerUrl && markerUrl.includes('sequencenumber')) {
        const markerId = markerUrl.replace('url(#', '').replace(')', '');
        const marker = svg.querySelector(`marker#${markerId}`);
        if (marker) {
          const uniqueId = markerId + '-' + lane + '-' + circleColor.replace('#', '');
          let newMarker = svg.querySelector(`marker#${uniqueId}`);
          if (!newMarker) {
            newMarker = marker.cloneNode(true);
            newMarker.id = uniqueId;
            marker.parentNode.appendChild(newMarker);
          }
          const circle = newMarker.querySelector('circle');
          if (circle) setInline(circle, { fill: circleColor, stroke: circleColor });
          prev.setAttribute('marker-start', `url(#${uniqueId})`);
        }
      }
    }
  });

  return true;
}

// Class diagram coloring — pill treatment per class box + inheritance arrows.
export function colorizeClass() {
  const svg = currentSvg();
  if (!svg) return false;
  const relPaths = svg.querySelectorAll('path.relation, path[class*=" relation"]');
  const nodes = svg.querySelectorAll('g.node');
  if (!nodes.length || !relPaths.length) return false;

  const nodeCentres = [];
  nodes.forEach((n, i) => {
    const t = n.getAttribute('transform') || '';
    const m = t.match(/translate\(([-\d.]+)/);
    nodeCentres.push({ node: n, cx: m ? parseFloat(m[1]) : 0, lane: i });
  });
  const laneOf = (x) => {
    let best = 0, bestDist = Infinity;
    nodeCentres.forEach((nc) => { const d = Math.abs(nc.cx - x); if (d < bestDist) { bestDist = d; best = nc.lane; } });
    return best;
  };

  nodes.forEach((n, i) => {
    const lane = i;
    const c = PALETTE[lane % PALETTE.length];
    n.setAttribute('data-lane', String(lane));
    n.querySelectorAll('g.outer-path path, g.label-container path').forEach((p, pi) => {
      if (pi === 0) setInline(p, { fill: tint(c), stroke: c, 'stroke-width': '2' });
      else setInline(p, { stroke: c });
    });
    const titleGroup = n.querySelector('g.label-group text');
    if (titleGroup) {
      setInline(titleGroup, { fill: c, 'font-weight': '700' });
      titleGroup.querySelectorAll('tspan').forEach((ts) => setInline(ts, { fill: c, 'font-weight': '700' }));
    }
    const fo = n.querySelector('foreignObject');
    if (fo) {
      const foTitle = fo.querySelector('div > b, div > p, div > span, p, span, b') || fo.firstElementChild;
      if (foTitle) {
        setInline(foTitle, { color: c, 'font-weight': '700' });
        foTitle.querySelectorAll('span, p, b').forEach((ch) => setInline(ch, { color: c, 'font-weight': '700' }));
      }
    }
  });

  const NS = 'http://www.w3.org/2000/svg';
  let defs = svg.querySelector('defs');
  if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.insertBefore(defs, svg.firstChild); }
  svg.querySelectorAll('[data-class-clone]').forEach((el) => el.remove());

  const markerIds = [...svg.querySelectorAll('marker')].map((m) => m.getAttribute('id'));
  const extStart = markerIds.find((id) => /-extensionStart$/.test(id));
  const extEnd = markerIds.find((id) => /-extensionEnd$/.test(id));

  const cloneMarker = (baseId, lane) => {
    if (!baseId) return null;
    const base = svg.querySelector(`marker[id="${baseId}"]`);
    if (!base) return null;
    const clone = base.cloneNode(true);
    const id = baseId + '-l' + lane;
    clone.setAttribute('id', id);
    clone.setAttribute('data-class-clone', '1');
    const c = PALETTE[lane % PALETTE.length];
    clone.querySelectorAll('path, polygon').forEach((el) => { el.setAttribute('fill', c); el.setAttribute('stroke', c); });
    (base.parentNode || defs).appendChild(clone);
    return id;
  };

  relPaths.forEach((path) => {
    const d = path.getAttribute('d') || '';
    const m = d.match(/M\s*([-\d.]+)/);
    const startX = m ? parseFloat(m[1]) : 0;
    const lane = laneOf(startX);
    const c = PALETTE[lane % PALETTE.length];
    setInline(path, { stroke: c, 'stroke-width': '1.5' });
    const ms = path.getAttribute('marker-start');
    const me = path.getAttribute('marker-end');
    if (ms && extStart) { const id = cloneMarker(extStart, lane); if (id) path.setAttribute('marker-start', `url(#${id})`); }
    if (me && extEnd) { const id = cloneMarker(extEnd, lane); if (id) path.setAttribute('marker-end', `url(#${id})`); }
  });
  return true;
}

// Flowchart coloring — match edges & labels to their source node.
export function colorizeFlowchart() {
  const svg = currentSvg();
  if (!svg || !svg.classList.contains('flowchart')) return false;
  const edges = svg.querySelectorAll('path.flowchart-link');
  if (!edges.length) return false;

  const nodeCentres = [];
  svg.querySelectorAll('g.node').forEach((n) => {
    const cnode = n.getAttribute('data-cnode');
    if (cnode != null) {
      const t = n.getAttribute('transform') || '';
      const m = t.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      if (m) {
        nodeCentres.push({
          cx: parseFloat(m[1]),
          cy: parseFloat(m[2]),
          cindex: parseInt(cnode, 10),
        });
      }
    }
  });
  if (!nodeCentres.length) return false;

  let defs = svg.querySelector('defs');
  if (!defs) {
    const NS = 'http://www.w3.org/2000/svg';
    defs = document.createElementNS(NS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  edges.forEach((edge) => {
    const d = edge.getAttribute('d') || '';
    const m = d.match(/M\s*([-\d.]+)[,\s]+([-\d.]+)/);
    if (m) {
      const startX = parseFloat(m[1]);
      const startY = parseFloat(m[2]);
      let bestDist = Infinity, bestCNode = 0;
      nodeCentres.forEach((nc) => {
        const dist = Math.hypot(nc.cx - startX, nc.cy - startY);
        if (dist < bestDist) { bestDist = dist; bestCNode = nc.cindex; }
      });

      const c = PALETTE[bestCNode % PALETTE.length];
      setInline(edge, { stroke: c, 'stroke-width': '2' });

      const me = edge.getAttribute('marker-end');
      if (me) {
        const idMatch = me.match(/url\(#([^)]+)\)/);
        if (idMatch) {
          const baseId = idMatch[1];
          const newId = baseId + '-c' + bestCNode;
          if (!svg.querySelector(`marker[id="${newId}"]`)) {
            const base = svg.querySelector(`marker[id="${baseId}"]`);
            if (base) {
              const clone = base.cloneNode(true);
              clone.setAttribute('id', newId);
              clone.setAttribute('data-class-clone', '1');
              clone.querySelectorAll('path, polygon, circle').forEach((el) => {
                setInline(el, { fill: c, stroke: c });
              });
              (base.parentNode || defs).appendChild(clone);
            }
          }
          edge.setAttribute('marker-end', `url(#${newId})`);
        }
      }

      const dataId = edge.getAttribute('data-id');
      if (dataId) {
        const label = svg.querySelector(`g.label[data-id="${dataId}"]`);
        if (label) {
          label.querySelectorAll('span, p, div, text').forEach((el) => {
            setInline(el, { color: c, fill: c, 'font-weight': '700' });
          });
        }
      }
    }
  });
  return true;
}

// Generic per-node coloring for every other diagram type.
export function colorizeDiagram() {
  const svg = currentSvg();
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  if (svg.querySelector('rect.actor')) return;
  if (svg.querySelector('path.relation, path[class*=" relation"]')) return;

  const groups = [];
  svg.querySelectorAll('g.node').forEach((el) => groups.push(el));
  svg.querySelectorAll('g.mindmap-node').forEach((el) => groups.push(el));
  const shapes = [];
  svg.querySelectorAll('rect.outer.title-state').forEach((el) => shapes.push(el));
  svg.querySelectorAll('.er.entityBox').forEach((el) => shapes.push(el));
  svg.querySelectorAll('path.pieCircle').forEach((el) => shapes.push(el));
  svg.querySelectorAll('rect.section, rect.journey-section').forEach((el) => shapes.push(el));
  svg.querySelectorAll('circle.commit').forEach((el) => shapes.push(el));
  svg.querySelectorAll('.quadrant').forEach((el) => shapes.push(el));
  svg.querySelectorAll('rect.background').forEach((el) => { if (!el.closest('g.mindmap-node')) shapes.push(el); });
  if (!groups.length && !shapes.length) {
    svg.querySelectorAll('g > rect:not([class])').forEach((el) => shapes.push(el));
  }

  const seen = new Set();
  const uniqG = [];
  groups.forEach((el) => { if (!seen.has(el)) { seen.add(el); uniqG.push(el); } });
  if (!uniqG.length && !shapes.length) return;

  uniqG.forEach((el, i) => el.setAttribute('data-cnode', String(i % PALETTE.length)));
  shapes.forEach((el, i) => el.setAttribute('data-cshape', String(i % PALETTE.length)));

  svg.querySelector('style#diagram-colors')?.remove();
  const rules = PALETTE.map((c, i) => {
    return [
      `svg [data-cnode="${i}"] rect,svg [data-cnode="${i}"] polygon,svg [data-cnode="${i}"] circle,svg [data-cnode="${i}"] ellipse{fill:${tint(c)}!important;stroke:${c}!important;stroke-width:2!important;}`,
      `svg [data-cnode="${i}"] text{fill:${c}!important;color:${c}!important;font-weight:600!important;}`,
      `svg [data-cnode="${i}"] text>tspan{fill:${c}!important;color:${c}!important;}`,
      `svg [data-cnode="${i}"] p,svg [data-cnode="${i}"] span,svg [data-cnode="${i}"] div{color:${c}!important;font-weight:600!important;}`,
      `svg [data-cshape="${i}"]{fill:${tintStrong(c)}!important;stroke:${c}!important;stroke-width:2!important;}`,
    ].join('\n');
  }).join('\n');
  const style = document.createElementNS(NS, 'style');
  style.setAttribute('id', 'diagram-colors');
  style.textContent = rules;
  svg.insertBefore(style, svg.firstChild);
}

const cleanFirstWord = (text) =>
  text.trim().replace(/^---[\s\S]*?---\s*/, '').split(/[ \n]/)[0] || '';

export function applyDiagramStyle() {
  const activeStyleBtn = document.querySelector('.style-btn.active');
  const style = activeStyleBtn ? activeStyleBtn.getAttribute('data-style') : 'pill';

  const svg = currentSvg();
  if (!svg) return;

  const isFlowchart = svg.classList.contains('flowchart') ||
    /^(flowchart|graph)\b/i.test(cleanFirstWord(D.src.value));
  const isSequence = /^(sequenceDiagram)\b/i.test(cleanFirstWord(D.src.value));

  if (isSequence) {
    const rects = svg.querySelectorAll('rect.actor');
    rects.forEach((rect) => {
      if (style === 'sharp') {
        rect.setAttribute('rx', '0');
        rect.setAttribute('ry', '0');
        setInline(rect, { rx: '0px', ry: '0px' });
      } else if (style === 'rounded') {
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
        setInline(rect, { rx: '8px', ry: '8px' });
      } else if (style === 'pill') {
        const h = parseFloat(rect.getAttribute('height')) || rect.getBoundingClientRect().height || 40;
        const radius = Math.round(h / 2) || 20;
        rect.setAttribute('rx', String(radius));
        rect.setAttribute('ry', String(radius));
        setInline(rect, { rx: radius + 'px', ry: radius + 'px' });
      }
    });
  }

  if (!isFlowchart) return;

  const rects = svg.querySelectorAll('g.node rect, g.node .label-container');
  rects.forEach((rect) => {
    if (style === 'sharp') {
      rect.setAttribute('rx', '0');
      rect.setAttribute('ry', '0');
      setInline(rect, { rx: '0px', ry: '0px' });
    } else if (style === 'rounded') {
      rect.setAttribute('rx', '8');
      rect.setAttribute('ry', '8');
      setInline(rect, { rx: '8px', ry: '8px' });
    } else if (style === 'pill') {
      const h = parseFloat(rect.getAttribute('height')) || rect.getBoundingClientRect().height || 40;
      const radius = Math.round(h / 2) || 18;
      rect.setAttribute('rx', String(radius));
      rect.setAttribute('ry', String(radius));
      setInline(rect, { rx: radius + 'px', ry: radius + 'px' });
    }
  });

  const shapes = svg.querySelectorAll('g.node polygon, g.node path');
  shapes.forEach((shape) => {
    if (style === 'sharp') {
      setInline(shape, { 'stroke-linejoin': 'miter', 'stroke-linecap': 'square' });
    } else {
      setInline(shape, { 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    }
  });
}

const FONT_MAP = {
  'sans': 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  'serif': 'Georgia, Cambria, "Times New Roman", Times, serif',
  'mono': 'ui-monospace, "SFMono-Regular", Consolas, monospace',
  'comic': '"Comic Sans MS", "Comic Sans", cursive',
  'system': 'system-ui, sans-serif',
};

export function applyDiagramFont() {
  const activeFontBtn = document.querySelector('.font-btn.active');
  const fontKey = activeFontBtn ? activeFontBtn.getAttribute('data-font') : 'sans';
  const fontFamily = FONT_MAP[fontKey] || FONT_MAP['sans'];
  const svg = currentSvg();
  if (!svg) return;

  svg.querySelectorAll('text, tspan, foreignObject div, foreignObject span, foreignObject p').forEach((el) => {
    setInline(el, { 'font-family': fontFamily });
  });
}

export function applyDiagramThickness() {
  const slider = D.diagramThicknessSlider;
  const thickness = slider ? slider.value : '2';

  const svg = currentSvg();
  if (!svg) return;

  const rects = svg.querySelectorAll('g.node rect, g.node polygon, g.node path, g.node circle, g.node ellipse, g.node .label-container');
  rects.forEach((el) => {
    setInline(el, { 'stroke-width': thickness + 'px' });
  });
  const edges = svg.querySelectorAll('.edgePath .path, .edgePath path');
  edges.forEach((el) => {
    setInline(el, { 'stroke-width': thickness + 'px' });
  });

  const sequenceRects = svg.querySelectorAll('rect.actor, rect.note, rect.loopLine');
  sequenceRects.forEach((el) => {
    setInline(el, { 'stroke-width': thickness + 'px' });
  });
  const sequenceLines = svg.querySelectorAll('line.actor-line, .messageLine0, .messageLine1');
  sequenceLines.forEach((el) => {
    setInline(el, { 'stroke-width': thickness + 'px' });
  });
}
