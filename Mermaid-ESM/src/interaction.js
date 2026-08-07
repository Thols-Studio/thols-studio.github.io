// Interactive diagram selection: click a node in the preview to highlight it,
// and click/select a source line to find & highlight the matching diagram node.

import { D, currentSvg } from './dom.js';
import { S } from './state.js';
import { renderOne } from './render.js';

export function clearDiagramSelection() {
  const oldBox = document.getElementById('diagram-selection-box');
  if (oldBox) oldBox.remove();
  document.querySelectorAll('.inner-loop-message').forEach((el) => el.classList.remove('inner-loop-message'));
}

export function getMessagesInLoop(loopNode) {
  if (!loopNode) return [];
  const svg = loopNode.closest ? loopNode.closest('svg') : document.querySelector('.preview svg');
  if (!svg) return [];

  const loopGroup = loopNode.closest ? (loopNode.closest('g') ? (loopNode.closest('g').querySelector('.loopLine, .loopText') ? loopNode.closest('g') : (loopNode.querySelector && loopNode.querySelector('.loopLine, .loopText') ? loopNode : null)) : null) : null;
  if (!loopGroup) return [];

  const allEls = loopGroup.querySelectorAll('polygon, text, line, rect, path, tspan');
  let minY = Infinity, maxY = -Infinity;

  const getSVGOffset = (el) => {
    let y = 0;
    let current = el;
    while (current && current !== svg) {
      const transform = current.getAttribute('transform');
      if (transform) {
        const translateMatch = transform.match(/translate\s*\(\s*[\d.-]+\s*(?:[,\s]+\s*([\d.-]+)\s*)?\)/);
        if (translateMatch) y += parseFloat(translateMatch[1] || 0);
      }
      current = current.parentElement;
    }
    return y;
  };

  allEls.forEach((el) => {
    const b = el.getBBox();
    const offY = getSVGOffset(el);
    minY = Math.min(minY, offY + b.y);
    maxY = Math.max(maxY, offY + b.y + b.height);
  });

  const messages = Array.from(svg.querySelectorAll('.messageText, .noteText, .edgeLabel'));
  return messages.filter((msg) => {
    const b = msg.getBBox();
    const offY = getSVGOffset(msg);
    const y = offY + b.y;
    return y >= minY && y <= maxY;
  });
}

export function highlightDiagramNode(node) {
  if (!node) return;
  clearDiagramSelection();

  try {
    const svg = node.closest('svg');
    if (!svg) return;

    const getSVGOffset = (el) => {
      let x = 0, y = 0;
      let current = el;
      while (current && current !== svg) {
        const transform = current.getAttribute('transform');
        if (transform) {
          const translateMatch = transform.match(/translate\s*\(\s*([\d.-]+)\s*(?:[,\s]+\s*([\d.-]+)\s*)?\)/);
          if (translateMatch) {
            x += parseFloat(translateMatch[1] || 0);
            y += parseFloat(translateMatch[2] || 0);
          } else {
            const matrixMatch = transform.match(/matrix\s*\(\s*[^,]+,[^,]+,[^,]+,[^,]+,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
            if (matrixMatch) {
              x += parseFloat(matrixMatch[1] || 0);
              y += parseFloat(matrixMatch[2] || 0);
            }
          }
        }
        current = current.parentElement;
      }
      return { x, y };
    };

    let nodeBBox = node.getBBox();
    let nodeOffset = getSVGOffset(node);

    let minX = nodeOffset.x + nodeBBox.x;
    let minY = nodeOffset.y + nodeBBox.y;
    let maxX = minX + nodeBBox.width;
    let maxY = minY + nodeBBox.height;

    const noteGroup = node.closest('.note, g.note, g[class*="note"], .noteGroup') || (node.classList.contains('note') ? node : null);
    if (noteGroup) {
      try {
        const allEls = noteGroup.querySelectorAll('rect, text, path, tspan');
        for (const el of allEls) {
          const elBBox = el.getBBox();
          const elOffset = getSVGOffset(el);
          const ex1 = elOffset.x + elBBox.x;
          const ey1 = elOffset.y + elBBox.y;
          const ex2 = ex1 + elBBox.width;
          const ey2 = ey1 + elBBox.height;

          minX = Math.min(minX, ex1);
          minY = Math.min(minY, ey1);
          maxX = Math.max(maxX, ex2);
          maxY = Math.max(maxY, ey2);
        }
      } catch (e) { }
    }

    const loopGroup = node.closest('g') ? (node.closest('g').querySelector('.loopLine, .loopText') ? node.closest('g') : (node.querySelector && node.querySelector('.loopLine, .loopText') ? node : null)) : null;
    if (loopGroup) {
      try {
        const allEls = loopGroup.querySelectorAll('polygon, text, line, rect, path, tspan');
        for (const el of allEls) {
          const elBBox = el.getBBox();
          const elOffset = getSVGOffset(el);
          const ex1 = elOffset.x + elBBox.x;
          const ey1 = elOffset.y + elBBox.y;
          const ex2 = ex1 + elBBox.width;
          const ey2 = ey1 + elBBox.height;

          minX = Math.min(minX, ex1);
          minY = Math.min(minY, ey1);
          maxX = Math.max(maxX, ex2);
          maxY = Math.max(maxY, ey2);
        }

        const innerMsgs = getMessagesInLoop(loopGroup);
        innerMsgs.forEach((msg) => msg.classList.add('inner-loop-message'));
      } catch (e) { }
    }

    const actorElement = node.closest('.actor') || (node.classList && node.classList.contains('actor') ? node : null);
    if (actorElement) {
      const actorText = actorElement.textContent.trim();
      const allActors = svg.querySelectorAll('.actor');
      for (const a of allActors) {
        const aText = a.textContent.trim();
        if (aText === actorText) {
          try {
            const aBBox = a.getBBox();
            const aOffset = getSVGOffset(a);
            const ax1 = aOffset.x + aBBox.x;
            const ay1 = aOffset.y + aBBox.y;
            const ax2 = ax1 + aBBox.width;
            const ay2 = ay1 + aBBox.height;

            minX = Math.min(minX, ax1);
            minY = Math.min(minY, ay1);
            maxX = Math.max(maxX, ax2);
            maxY = Math.max(maxY, ay2);
          } catch (e) { }
        }
      }
    }

    let boxX = minX - 4;
    let boxY = minY - 4;
    let boxW = (maxX - minX) + 8;
    let boxH = (maxY - minY) + 8;

    if (isNaN(boxX) || isNaN(boxY) || isNaN(boxW) || isNaN(boxH) ||
      !isFinite(boxX) || !isFinite(boxY) || !isFinite(boxW) || !isFinite(boxH) ||
      boxW <= 0 || boxH <= 0) {
      return;
    }

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.id = 'diagram-selection-box';
    rect.classList.add('selection-box');
    rect.setAttribute('x', boxX);
    rect.setAttribute('y', boxY);
    rect.setAttribute('width', boxW);
    rect.setAttribute('height', boxH);
    rect.setAttribute('rx', 6);
    svg.appendChild(rect);
  } catch (e) { }
}

export function highlightDiagramNodeByText(lineText, occurrenceIndex = 0) {
  if (!lineText) return;
  const previewEl = document.querySelector('.preview');
  if (!previewEl) return;

  let labelToFind = lineText;
  if (lineText.includes(':') && !lineText.toLowerCase().startsWith('note')) {
    labelToFind = lineText.split(':').slice(1).join(':').trim();
  } else if (/^\s*(?:participant|actor)\s+/i.test(lineText)) {
    let pText = lineText.replace(/^\s*(?:participant|actor)\s+/i, '').trim();
    if (/\s+as\s+/i.test(pText)) {
      labelToFind = pText.split(/\s+as\s+/i)[1].trim();
    } else {
      labelToFind = pText;
    }
  } else if (/^\s*(?:loop|alt|opt|par|critical|break|rect|subgraph)\b/i.test(lineText)) {
    labelToFind = lineText.replace(/^\s*(?:loop|alt|opt|par|critical|break|rect|subgraph)\s*/i, '').trim();
  } else {
    labelToFind = lineText.trim();
  }

  const rawNodes = previewEl.querySelectorAll('.messageText, .edgeLabel, .node, .actor, .note, .classGroup, .loopText, .labelText, .cluster, .labelBox, g');
  const filteredNodes = Array.from(rawNodes).filter((n) => {
    if (n.querySelector && (n.querySelector('.loopLine') || n.querySelector('.loopText'))) return true;
    return !n.parentElement.closest('.messageText, .edgeLabel, .node, .actor, .note, .classGroup');
  });

  const matchingNodes = [];

  for (const n of filteredNodes) {
    let nodeText = n.textContent.trim();
    if (nodeText) {
      const cleanNodeText = nodeText.replace(/^[a-z]+\[|\]$/gi, '').trim();
      if (cleanNodeText === labelToFind || nodeText === labelToFind || (labelToFind && nodeText.includes(labelToFind))) {
        matchingNodes.push(n);
      }
    }
  }

  clearDiagramSelection();

  if (matchingNodes.length > 0) {
    const targetNode = matchingNodes[occurrenceIndex] || matchingNodes[0];
    highlightDiagramNode(targetNode);
  }
}

function updateTextareaActiveBg(linesBefore) {
  const elSrc = D.src;
  const computed = getComputedStyle(elSrc);
  const lineHeight = parseFloat(computed.lineHeight) || 20;
  const paddingTop = parseFloat(computed.paddingTop) || 0;

  let activeBg = document.getElementById('textarea-active-bg');
  if (!activeBg) {
    activeBg = document.createElement('div');
    activeBg.id = 'textarea-active-bg';
    Object.assign(activeBg.style, {
      position: 'absolute', top: 0, left: 0, right: 0, height: lineHeight + 'px',
      backgroundColor: 'color-mix(in srgb, var(--text-main) 15%, transparent)', pointerEvents: 'none', zIndex: 1,
    });
    D.textareaWrap.appendChild(activeBg);
  }
  activeBg.style.display = 'block';
  activeBg.dataset.top = (linesBefore - 1) * lineHeight + paddingTop;
  activeBg.style.transform = `translateY(${activeBg.dataset.top - elSrc.scrollTop}px)`;
}

function BLOCK_OPENER_MATCH(line) {
  return /^\s*(?:loop|alt|else|opt|par|critical|break|rect|subgraph)\b/i.test(line);
}

function resolveEndToBlock(val, endLineStart) {
  const BLOCK_CLOSER = /^\s*end\b/i;

  const upTo = val.substring(0, endLineStart);
  const lines = upTo.split('\n');

  let depth = 1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (BLOCK_CLOSER.test(l)) {
      depth++;
    } else if (BLOCK_OPENER_MATCH(l)) {
      depth--;
      if (depth === 0) return l.trim();
    }
  }
  return null;
}

function handleTextareaSelection() {
  const elSrc = D.src;
  const val = elSrc.value;
  const pos = elSrc.selectionStart;
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
  let lineEnd = val.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = val.length;
  let lineText = val.substring(lineStart, lineEnd).trim();

  if (/^\s*end\s*$/.test(lineText)) {
    const resolved = resolveEndToBlock(val, lineStart);
    if (resolved) lineText = resolved;
    else {
      clearDiagramSelection();
      const textBefore = val.substring(0, lineStart);
      const linesBefore = textBefore.split('\n').length;
      updateTextareaActiveBg(linesBefore);
      return;
    }
  }

  let occurrenceIndex = 0;
  if (lineText) {
    let searchPos = 0;
    while (searchPos < lineStart) {
      const found = val.indexOf(lineText, searchPos);
      if (found !== -1 && found < lineStart) {
        occurrenceIndex++;
        searchPos = found + lineText.length;
      } else {
        break;
      }
    }
  }

  highlightDiagramNodeByText(lineText, occurrenceIndex);

  const textBefore = val.substring(0, lineStart);
  const linesBefore = textBefore.split('\n').length;
  updateTextareaActiveBg(linesBefore);
}

export function initInteraction() {
  const elSrc = D.src;

  elSrc.addEventListener('keyup', handleTextareaSelection);
  elSrc.addEventListener('mouseup', handleTextareaSelection);

  const previewElForClick = document.querySelector('.preview');
  previewElForClick.addEventListener('click', (e) => {
    let node = e.target.closest('.node, .actor, .classGroup, .edgeLabel, .note, g[id]');
    if (!node) node = e.target.closest('text, rect, polygon, circle, path');
    if (!node) return;

    highlightDiagramNode(node);

    const targetGroup = node.closest('g') || node;

    const isLoopElement = !!(
      node.classList.contains('loopLine') || node.classList.contains('loopText') ||
      node.classList.contains('labelText') || node.classList.contains('labelBox') ||
      targetGroup.querySelector('.loopLine, .loopText')
    );

    const sourceText = elSrc.value;
    let startIndex = -1;

    if (isLoopElement) {
      const loopTextEl = targetGroup.querySelector('.loopText, .labelText');
      const labelEl = targetGroup.querySelector('.labelText');
      const keyword = labelEl ? labelEl.textContent.trim() : 'loop';
      const loopLabel = loopTextEl ? loopTextEl.textContent.replace(/^\[|\]$/g, '').trim() : '';
      const loopLine = loopLabel
        ? new RegExp(`^\\s*${keyword}\\s+${loopLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im')
        : new RegExp(`^\\s*${keyword}\\b`, 'im');
      const m = sourceText.match(loopLine);
      if (m) startIndex = m.index;
    } else {
      let textEls = targetGroup.querySelectorAll('text, .label-container');
      if (textEls.length === 0) textEls = node.querySelectorAll('text, .label-container');

      let searchText = '';
      if (textEls.length > 0) {
        searchText = Array.from(textEls).map((el) => el.textContent).join(' ').trim();
      } else {
        searchText = (targetGroup.textContent || node.textContent || '').trim();
      }

      if (searchText) {
        const escaped = searchText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const declRegex = new RegExp(`(?:participant|actor|subgraph|class)\\s+${escaped}\\b`, 'i');
        const declMatch = sourceText.match(declRegex);
        if (declMatch) {
          startIndex = declMatch.index;
        } else {
          const allSvgNodes = Array.from(document.querySelectorAll('.preview .messageText, .preview .node, .preview .note, .preview .edgeLabel, .preview g, .preview text'));
          const matchingSvgNodes = allSvgNodes.filter((n) => {
            const txt = (n.textContent || '').trim();
            return txt === searchText || txt.includes(searchText);
          });

          let svgOccurrenceIndex = 0;
          for (let i = 0; i < matchingSvgNodes.length; i++) {
            if (matchingSvgNodes[i] === targetGroup || matchingSvgNodes[i] === node || matchingSvgNodes[i].contains(node)) {
              svgOccurrenceIndex = i;
              break;
            }
          }

          let currPos = 0;
          let matchCount = 0;
          while (currPos < sourceText.length) {
            const foundIdx = sourceText.indexOf(searchText, currPos);
            if (foundIdx !== -1) {
              if (matchCount === svgOccurrenceIndex) {
                startIndex = foundIdx;
                break;
              }
              matchCount++;
              currPos = foundIdx + searchText.length;
            } else {
              break;
            }
          }
          if (startIndex === -1) {
            startIndex = sourceText.indexOf(searchText);
          }
        }
      }
    }

    if (startIndex !== -1) {
      const lineStart = sourceText.lastIndexOf('\n', startIndex) + 1;
      let lineEnd = sourceText.indexOf('\n', startIndex);
      if (lineEnd === -1) lineEnd = sourceText.length;

      const selStart = lineStart;

      if (S.cmView && window.CMEditorView) {
        S.cmView.dispatch({
          selection: { anchor: selStart },
          effects: window.CMEditorView.scrollIntoView(selStart, { y: 'center' }),
        });
        S.cmView.focus();
      } else {
        elSrc.focus();
        elSrc.setSelectionRange(selStart, selStart);
        const textBefore = sourceText.substring(0, selStart);
        const linesBefore = textBefore.split('\n').length;
        const computed = getComputedStyle(elSrc);
        const lineHeight = parseFloat(computed.lineHeight) || 20;
        const paddingTop = parseFloat(computed.paddingTop) || 0;
        elSrc.scrollTop = Math.max(0, (linesBefore - 1) * lineHeight + paddingTop - (elSrc.clientHeight / 2));
        updateTextareaActiveBg(linesBefore);
      }
    }
  });

  window.highlightDiagramNode = highlightDiagramNode;
  window.highlightDiagramNodeByText = highlightDiagramNodeByText;
  window.getMessagesInLoop = getMessagesInLoop;
  window.forceRenderOne = function (txt) {
    S.lastRenderedSrc = null;
    return renderOne(txt || elSrc.value);
  };
}
