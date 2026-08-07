// Editor responsibilities: line-number gutter, error/warning highlighting,
// auto-fix + auto-align, autocomplete, Validate / Auto-Fix buttons, and the
// Ctrl+/ comment toggle.

import { D, currentSvg } from './dom.js';
import { S, VALID_DIAGRAM_TYPES, VALIDATE_DEFAULT_HTML } from './state.js';
import { syncLocalHL, refreshActorColors } from './highlight.js';
import {
  colorizeSequence, colorizeClass, colorizeDiagram, colorizeFlowchart,
  applyDiagramStyle, applyDiagramFont, applyDiagramThickness,
} from './coloring.js';
import { renderOne } from './render.js';

const { src: elSrc } = D;

// ---- Line numbers in the editor & error highlighting ----
export function syncGutter() {
  const lines = elSrc.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) {
    const isErr = (window.hlErrorLines && window.hlErrorLines.has(i - 1)) || S.editorErrorLines.has(i);
    const isWarn = S.editorWarningLines.has(i);
    if (isErr) {
      html += `<span class="gutter-error-line">${i}</span>`;
    } else if (isWarn) {
      html += `<span class="gutter-warning-line">${i}</span>`;
    } else {
      html += `<span>${i}</span>`;
    }
  }
  D.gutter.innerHTML = html;
  D.gutter.scrollTop = elSrc.scrollTop;
}

export function extractErrorLineNumber(err, hash) {
  if (hash && typeof hash.line === 'number' && hash.line > 0) {
    return hash.line;
  }
  if (err && typeof err.line === 'number' && err.line > 0) {
    return err.line;
  }
  if (err && err.hash && typeof err.hash.line === 'number' && err.hash.line > 0) {
    return err.hash.line;
  }
  if (err && err.loc && typeof err.loc.first_line === 'number' && err.loc.first_line > 0) {
    return err.loc.first_line;
  }
  const msg = (typeof err === 'string' ? err : (err?.message || err?.str || String(err || '')));
  const m = msg.match(/line\s*:?\s*(\d+)/i) || msg.match(/on\s+line\s*:?\s*(\d+)/i) || msg.match(/:\s*(\d+)\s*:/);
  if (m) {
    return parseInt(m[1], 10);
  }
  if (/diagram type|no diagram|unknown diagram|lexical error/i.test(msg)) {
    return 1;
  }
  return null;
}

export function findAllErrorLines(text, mainErr, hash) {
  const errLines = new Set();

  const firstLineNum = extractErrorLineNumber(mainErr, hash);
  if (firstLineNum !== null && firstLineNum > 0) {
    errLines.add(firstLineNum);
  }

  const cleanText = (text || '').replace(/\r/g, '');
  const lines = cleanText.split('\n');

  const firstLineText = (lines[0] || '').trim();
  const firstWordMatch = firstLineText.match(/^---[\s\S]*?---\s*\n?([a-zA-Z0-9-]+)/) || firstLineText.match(/^([a-zA-Z0-9-]+)/);
  const firstWord = firstWordMatch ? firstWordMatch[1] : '';
  if (firstWord && !VALID_DIAGRAM_TYPES.some((t) => t.toLowerCase() === firstWord.toLowerCase())) {
    errLines.add(1);
  }

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) return;

    if (/[\w\-[\]()]+?\s*(?:-->|->>|->|==>|-\.-\|>|-\.->|--x|-x)\s*$/.test(trimmed)) {
      errLines.add(lineNum);
    }

    const quoteCount = (line.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      errLines.add(lineNum);
    }

    if (/[\w\-[\]()]+\s*\[[^\]\n]+$/.test(trimmed) || /[\w\-[\]()]+\s*\([^)\n]+$/.test(trimmed) || /[\w\-[\]()]+\s*\{[^}\n]+$/.test(trimmed)) {
      errLines.add(lineNum);
    }
  });

  return Array.from(errLines).sort((a, b) => a - b);
}

export function autoFixMermaidCode(code) {
  let fixed = (code || '').replace(/\r/g, '');

  const lines = fixed.split('\n');
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    const m = firstLine.match(/^([a-zA-Z0-9-]+)(\s.*)?$/);
    if (m) {
      const typeWord = m[1].toLowerCase();
      if (!VALID_DIAGRAM_TYPES.some((t) => t.toLowerCase() === typeWord)) {
        let bestMatch = 'flowchart';
        if (typeWord.includes('seq') || typeWord.includes('sequence')) bestMatch = 'sequenceDiagram';
        else if (typeWord.includes('class')) bestMatch = 'classDiagram';
        else if (typeWord.includes('state')) bestMatch = 'stateDiagram-v2';
        else if (typeWord.includes('er') || typeWord.includes('entity')) bestMatch = 'erDiagram';
        else if (typeWord.includes('gant')) bestMatch = 'gantt';
        else if (typeWord.includes('pie')) bestMatch = 'pie';
        else if (typeWord.includes('git')) bestMatch = 'gitGraph';
        else if (typeWord.includes('mind')) bestMatch = 'mindmap';
        else if (typeWord.includes('graph')) bestMatch = 'graph';
        else if (typeWord.includes('flow')) bestMatch = 'flowchart';

        lines[0] = bestMatch + (m[2] || '');
        fixed = lines.join('\n');
      }
    }
  }

  fixed = fixed.replace(/^(\s*)part[ic][a-z]*\b/gmi, '$1participant');
  fixed = fixed.replace(/^(\s*)act[or]*\b(?=\s+[A-Za-z0-9_])/gmi, '$1actor');
  fixed = fixed.replace(/^(\s*)subgrap[a-z]*\b/gmi, '$1subgraph');

  const isSeq = /^sequenceDiagram\b/i.test(fixed.trim().replace(/^---[\s\S]*?---\s*/, ''));

  if (isSeq) {
    const aliasMap = new Map();
    const aliasRegex = /^(?:\s*)(?:participant|actor)\s+([A-Za-z0-9_]+)\s+as\s+([A-Za-z0-9_]+)/gmi;
    let match;
    while ((match = aliasRegex.exec(fixed)) !== null) {
      aliasMap.set(match[2], match[1]);
    }

    if (aliasMap.size > 0) {
      const sLines = fixed.split('\n');
      for (let i = 0; i < sLines.length; i++) {
        let l = sLines[i];
        if (!/^\s*(?:participant|actor)\b/i.test(l)) {
          for (const [display, alias] of aliasMap.entries()) {
            const displayRegex = new RegExp(`\\b${display}\\b`, 'g');
            l = l.replace(displayRegex, alias);
          }
          sLines[i] = l;
        }
      }
      fixed = sLines.join('\n');
    }

    fixed = fixed.replace(/^(\s*[\w\-[\]()]+?\s*)->(\s*[\w\-[\]()]*\s*)$/gm, '$1->>$2');
    fixed = fixed.replace(/^(\s*[\w\-[\]()]+?\s*(?:->>|-->>))\s*$/gm, '$1 B: Message');
    fixed = fixed.replace(/^(\s*[\w\-[\]()]+?\s*(?:->>|-->>)\s*[\w\-[\]()]+)\s*$/gm, '$1: Message');
  } else {
    fixed = fixed.replace(/^(\s*[\w\-[\]()]+\s*)->\s*$/gm, '$1--> B');
    fixed = fixed.replace(/^(\s*[\w\-[\]()]+\s*(?:-->|==>|-\.-\|>|-\.->|--x|-x)\s*)$/gm, '$1 B');
  }
  const lineArr = fixed.split('\n');
  lineArr.forEach((line, i) => {
    const quoteCount = (line.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      lineArr[i] = line + '"';
    }
  });
  fixed = lineArr.join('\n');

  const lineArr2 = fixed.split('\n');
  lineArr2.forEach((line, i) => {
    let l = line.trimEnd();
    if (/[\w\-[\]()]+\s*\[[^\]]+$/.test(l) && !l.endsWith(']')) {
      lineArr2[i] = line + ']';
    } else if (/[\w\-[\]()]+\s*\([^)]+$/.test(l) && !l.endsWith(')')) {
      lineArr2[i] = line + ')';
    } else if (/[\w\-[\]()]+\s*\{[^}]+$/.test(l) && !l.endsWith('}')) {
      lineArr2[i] = line + '}';
    }
  });
  fixed = lineArr2.join('\n');

  const matchActor = fixed.match(/(?:participant|actor)\s+([A-Za-z0-9_]+)/);
  const dummyActor = matchActor ? matchActor[1] : 'System';
  fixed = fixed.replace(/((?:alt|opt|else)[^\n]*\n)(?=\s*(?:else|end))/g, `$1    Note over ${dummyActor}: (auto-fix empty block)\n`);

  const openCount = (fixed.match(/\b(subgraph|loop|alt|opt|par|rect)\b/gi) || []).length;
  const endCount = (fixed.match(/\bend\b/gi) || []).length;
  if (openCount > endCount) {
    for (let i = 0; i < (openCount - endCount); i++) {
      fixed += '\nend';
    }
  }

  if (fixed === code && S.editorErrorLines.size > 0) {
    const lArr = code.split('\n');
    S.editorErrorLines.forEach((errLine) => {
      if (errLine > 0 && errLine <= lArr.length) {
        const idx = errLine - 1;
        let line = lArr[idx];
        if (/\s*(?:-->|->>|->)\s*$/.test(line)) {
          lArr[idx] = line + ' TargetNode';
        } else if (line.trim()) {
          lArr[idx] = '%% ' + line;
        }
      }
    });
    fixed = lArr.join('\n');
  }

  return fixed;
}

export function updateParticipantAliasesInCode(code) {
  if (!code) return code;
  const lines = code.split('\n');
  const aliasMap = new Map();

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const match = l.match(/^\s*(participant|actor)\s+([A-Za-z0-9_]+)\s+as\s+(.+)$/i);
    if (match) {
      const alias = match[2].trim();
      const name = match[3].trim();
      if (alias && name && alias !== name) {
        aliasMap.set(name, alias);
      }
    }
  }

  if (aliasMap.size === 0) return code;

  const updatedLines = lines.map((line) => {
    if (/^\s*(participant|actor)\b/i.test(line)) {
      return line;
    }
    let modifiedLine = line;
    aliasMap.forEach((alias, name) => {
      const safeName = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('\\b' + safeName + '\\b', 'g');
      modifiedLine = modifiedLine.replace(regex, alias);
    });
    return modifiedLine;
  });

  return updatedLines.join('\n');
}

const INDENT_STR = '    ';

export function formatAndAlignMermaidCode(code) {
  if (!code) return code;
  const lines = code.split('\n');
  let indent = 0;
  const result = [];

  const isHeaderLine = (line) =>
    /^(?:sequenceDiagram|flowchart|graph|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|gitGraph|journey|mindmap|timeline|quadrantChart|sankey-beta)\b/i.test(line);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      result.push('');
      continue;
    }

    if (/^(?:end|else|option|and)\b/i.test(line)) {
      indent = Math.max(1, indent - 1);
    }

    let currentLineIndent = indent;
    if (isHeaderLine(line)) {
      currentLineIndent = 0;
    }

    const indented = INDENT_STR.repeat(currentLineIndent) + line;
    result.push(indented);

    if (isHeaderLine(line)) {
      indent = 1;
    } else if (/^(?:subgraph|loop|alt|opt|par|rect|critical|break)\b/i.test(line)) {
      indent++;
    }
  }
  return result.join('\n');
}

export function showEditorError(err, hash) {
  const text = elSrc.value;
  const linesArray = findAllErrorLines(text, err, hash);

  S.editorErrorLines.clear();
  linesArray.forEach((lineNum) => S.editorErrorLines.add(lineNum));

  if (window.hlErrorLines) {
    window.hlErrorLines.clear();
    linesArray.forEach((lineNum) => window.hlErrorLines.add(lineNum - 1));
  }

  syncGutter();
  syncLocalHL();

  let displayMsg = '';
  if (linesArray.length === 1) {
    displayMsg = `Error in line ${linesArray[0]}`;
  } else if (linesArray.length > 1) {
    displayMsg = `Errors in lines ${linesArray.join(', ')}`;
  } else {
    displayMsg = `Error in code editor`;
  }

  const errBar = D.editorErrorBar;
  const errText = D.editorErrorText;
  if (errBar && errText) {
    errText.textContent = displayMsg;
    errBar.style.display = 'flex';
  }

  const btnValidate = D.validateBtn;
  if (btnValidate) {
    btnValidate.innerHTML = '<span style="color: #e2795b; font-weight: 600;">Invalid ✗</span>';
  }

  const btnFix = D.fixBtn;
  if (btnFix) btnFix.style.display = 'inline-flex';
}

export function checkSequenceDiagramWarnings(text) {
  const cleanText = (text || '').replace(/\r/g, '');
  const lines = cleanText.split('\n');

  if (!/^sequenceDiagram\b/i.test(cleanText.trim().replace(/^---[\s\S]*?---\s*/, ''))) {
    return [];
  }

  const declared = new Set();
  lines.forEach((line) => {
    const trimmed = line.trim();
    const pMatch = trimmed.match(/^(?:participant|actor)\s+([A-Za-z0-9_]+)/i);
    if (pMatch) {
      declared.add(pMatch[1]);
    }
  });

  const warnings = [];
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || /^sequenceDiagram\b/i.test(trimmed) || /^(?:participant|actor|autonumber|title)\b/i.test(trimmed)) {
      return;
    }

    const lineUndeclared = new Set();

    const noteMatch = trimmed.match(/^Note\s+(?:over|left of|right of)\s+([A-Za-z0-9_,\s]+):/i);
    if (noteMatch) {
      const parts = noteMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (declared.size > 0 && !declared.has(p)) {
          lineUndeclared.add(p);
        } else if (declared.size === 0 && (p === 'S' || p === 'C' || /^[A-Z0-9_]+$/.test(p))) {
          lineUndeclared.add(p);
        }
      });
    }

    const arrowMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*(?:->>|->|-->>|-->)\s*([A-Za-z0-9_]+)/);
    if (arrowMatch && declared.size > 0) {
      const src = arrowMatch[1];
      const dest = arrowMatch[2];
      if (!declared.has(src)) lineUndeclared.add(src);
      if (!declared.has(dest)) lineUndeclared.add(dest);
    }

    if (lineUndeclared.size > 0) {
      warnings.push({
        line: lineNum,
        participants: Array.from(lineUndeclared),
      });
    }
  });

  return warnings;
}

export function showEditorWarnings(warnings) {
  S.editorWarningLines.clear();
  if (!warnings || warnings.length === 0) {
    return;
  }

  const allParts = new Set();
  const lineNums = [];
  warnings.forEach((w) => {
    S.editorWarningLines.add(w.line);
    lineNums.push(w.line);
    w.participants.forEach((p) => allParts.add(`'${p}'`));
  });

  syncGutter();

  const partsStr = Array.from(allParts).join(', ');
  const displayMsg = lineNums.length === 1
    ? `Warning in line ${lineNums[0]}: ${partsStr} not declared as participant`
    : `Warnings in lines ${lineNums.join(', ')}: ${partsStr} not declared as participant`;

  const errBar = D.editorErrorBar;
  const errText = D.editorErrorText;
  if (errBar && errText) {
    errText.textContent = displayMsg;
    errBar.classList.add('warning-mode');
    errBar.style.display = 'flex';
  }

  const btnFix = D.fixBtn;
  if (btnFix) btnFix.style.display = 'inline-flex';
}

export function clearEditorError() {
  S.editorErrorLines.clear();
  S.editorWarningLines.clear();
  if (window.hlErrorLines) {
    window.hlErrorLines.clear();
  }
  syncGutter();
  syncLocalHL();

  const errBar = D.editorErrorBar;
  if (errBar) {
    errBar.classList.remove('warning-mode');
    errBar.style.display = 'none';
  }

  const btnValidate = D.validateBtn;
  if (btnValidate) {
    btnValidate.innerHTML = VALIDATE_DEFAULT_HTML;
  }

  const btnFix = D.fixBtn;
  if (btnFix) btnFix.style.display = 'none';
}

// ---- Editor Autocomplete ----
import { DIAGRAMS } from './data.js';
import { getConfig } from './dom.js';

function buildAcItems() {
  return Object.keys(DIAGRAMS).map((k) => ({ key: k, ...DIAGRAMS[k] })).filter((item) => {
    const cfg = getConfig();
    if (cfg && cfg.allowedDiagramTypes) {
      const typeMatch = item.src.trim().match(/^[a-zA-Z0-9-]+/);
      if (typeMatch && !cfg.allowedDiagramTypes.includes(typeMatch[0])) return false;
    }
    return true;
  });
}

function renderAutocomplete() {
  let html = '';
  const cubeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
  S.filteredAcItems.forEach((item, i) => {
    const sel = i === S.acSelectedIndex ? 'selected' : '';
    html += `<div class="ac-item ${sel}" data-index="${i}">${cubeSvg}${item.label}</div>`;
  });
  D.autocompletePanel.innerHTML = html;
}

function checkAutocomplete() {
  const val = elSrc.value.trim().toLowerCase();

  if (document.activeElement === elSrc) {
    if (val === '') {
      S.filteredAcItems = S.acItems;
    } else {
      S.filteredAcItems = S.acItems.filter((item) => {
        const firstWord = item.src.split(/[ \n]/)[0].toLowerCase();
        return firstWord.startsWith(val);
      });
    }

    if (S.filteredAcItems.length > 0 && (val === '' || S.filteredAcItems.some((item) => {
      const firstWord = item.src.split(/[ \n]/)[0].toLowerCase();
      return firstWord.startsWith(val) && firstWord !== val;
    }))) {
      if (S.acSelectedIndex >= S.filteredAcItems.length) S.acSelectedIndex = 0;
      renderAutocomplete();
      D.autocompletePanel.classList.add('show');
    } else {
      D.autocompletePanel.classList.remove('show');
    }
  } else {
    D.autocompletePanel.classList.remove('show');
  }
}

export function initGutter() {
  elSrc.addEventListener('input', syncGutter);
  elSrc.addEventListener('scroll', () => { D.gutter.scrollTop = elSrc.scrollTop; });
}

export function initAutocomplete() {
  S.acItems = buildAcItems();
  S.filteredAcItems = S.acItems;
  S.acSelectedIndex = 0;

  elSrc.addEventListener('input', checkAutocomplete);
  elSrc.addEventListener('focus', checkAutocomplete);
  elSrc.addEventListener('blur', () => {
    setTimeout(() => D.autocompletePanel.classList.remove('show'), 150);
  });

  D.autocompletePanel.addEventListener('mousedown', (e) => e.preventDefault());
  D.autocompletePanel.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.ac-item');
    if (itemEl) {
      const idx = parseInt(itemEl.getAttribute('data-index'), 10);
      elSrc.value = S.filteredAcItems[idx].src + '\n';
      D.autocompletePanel.classList.remove('show');
      elSrc.dispatchEvent(new Event('input'));
      elSrc.focus();
      elSrc.selectionStart = elSrc.selectionEnd = elSrc.value.length;
    }
  });

  elSrc.addEventListener('keydown', (e) => {
    if (D.autocompletePanel.classList.contains('show')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        S.acSelectedIndex = (S.acSelectedIndex + 1) % S.filteredAcItems.length;
        renderAutocomplete();
        const sel = D.autocompletePanel.querySelector('.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        S.acSelectedIndex = (S.acSelectedIndex - 1 + S.filteredAcItems.length) % S.filteredAcItems.length;
        renderAutocomplete();
        const sel = D.autocompletePanel.querySelector('.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        elSrc.value = S.filteredAcItems[S.acSelectedIndex].src + '\n';
        D.autocompletePanel.classList.remove('show');
        elSrc.dispatchEvent(new Event('input'));
        elSrc.selectionStart = elSrc.selectionEnd = elSrc.value.length;
        return;
      } else if (e.key === 'Escape') {
        D.autocompletePanel.classList.remove('show');
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const s = elSrc.selectionStart, en = elSrc.selectionEnd;
      elSrc.value = elSrc.value.slice(0, s) + '  ' + elSrc.value.slice(en);
      elSrc.selectionStart = elSrc.selectionEnd = s + 2;
      syncGutter();
    }
  });
}

export function initValidateFix(mermaid) {
  const btnValidate = D.validateBtn;
  const btnFix = D.fixBtn;
  if (btnValidate) {
    btnValidate.addEventListener('click', async () => {
      try {
        window.hlErrorLines.clear();
        const isValid = await mermaid.parse(elSrc.value);
        const { svg } = await mermaid.render('validator_dummy', elSrc.value);
        if (svg.match(/="NaN"|NaN,|undefined,/)) {
          let match;
          const regex = /((?:alt|opt|else)[^\n]*\n)(?=\s*(?:else|end))/g;
          while ((match = regex.exec(elSrc.value)) !== null) {
            const lineNum = elSrc.value.substring(0, match.index).split('\n').length - 1;
            window.hlErrorLines.add(lineNum);
          }
          throw new Error('Layout failed (NaN coordinates)');
        }
        if (isValid) {
          btnValidate.innerHTML = '<span style="color: var(--accent); font-weight: 600;">Valid ✓</span>';
          if (btnFix) btnFix.style.display = 'none';
          clearEditorError();
          setTimeout(() => {
            if (S.editorErrorLines.size === 0) {
              btnValidate.innerHTML = VALIDATE_DEFAULT_HTML;
            }
          }, 1500);
        }
      } catch (err) {
        const m = err.message?.match(/Parse error on line (\d+)/);
        if (m) {
          window.hlErrorLines.add(parseInt(m[1], 10) - 1);
        }
        showEditorError(err);
      }
      syncLocalHL();
    });
  }
  if (btnFix) {
    btnFix.addEventListener('click', async () => {
      const code = elSrc.value;
      const fixedCode = autoFixMermaidCode(code);
      if (fixedCode !== code) {
        elSrc.value = fixedCode;
        clearTimeout(S.inputTimer);
        syncGutter();
        clearEditorError();
        await renderOne(fixedCode);
      } else {
        btnFix.style.display = 'none';
      }
    });
  }
}

export function autoAlignCode() {
  const val = elSrc.value;
  if (!val) return;

  let newVal = val;
  const cleanSrc = val.trim().replace(/^---[\s\S]*?---\s*/, '');
  if (/^sequenceDiagram\b/i.test(cleanSrc)) {
    newVal = updateParticipantAliasesInCode(newVal);
  }
  newVal = formatAndAlignMermaidCode(newVal);

  if (newVal !== val) {
    const start = elSrc.selectionStart;
    const end = elSrc.selectionEnd;
    elSrc.value = newVal;
    syncGutter();
    try {
      elSrc.setSelectionRange(Math.min(start, newVal.length), Math.min(end, newVal.length));
    } catch (e) { }
  }
}

export function initEditActions(mermaid) {
  const autoAlignBtn = D.autoAlignBtn;
  const autoUpdateToggle = D.autoUpdateToggle;

  elSrc.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      renderOne(elSrc.value);
    } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const start = elSrc.selectionStart;
      const end = elSrc.selectionEnd;
      const val = elSrc.value;

      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = val.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = val.length;

      const selectedText = val.substring(lineStart, lineEnd);
      const lines = selectedText.split('\n');

      const allCommented = lines.every((l) => l.trim().startsWith('%%'));

      const newLines = lines.map((l) => {
        if (allCommented) {
          return l.replace(/^(\s*)%%\s?/, '$1');
        } else {
          return l.replace(/^(\s*)/, '$1%% ');
        }
      });

      const newText = newLines.join('\n');
      elSrc.value = val.substring(0, lineStart) + newText + val.substring(lineEnd);

      elSrc.selectionStart = lineStart;
      elSrc.selectionEnd = lineStart + newText.length;

      syncGutter();
      elSrc.dispatchEvent(new Event('input'));
    }
  });

  if (autoUpdateToggle) {
    autoUpdateToggle.addEventListener('change', () => {
      if (autoUpdateToggle.checked) {
        S.lastRenderedSrc = null;
        renderOne(elSrc.value);
      }
    });
  }

  if (autoAlignBtn) {
    autoAlignBtn.addEventListener('click', () => {
      autoAlignCode();
      S.lastRenderedSrc = null;
      renderOne(elSrc.value);
    });
  }

  // Debounced auto-render on input.
  elSrc.addEventListener('input', () => {
    clearTimeout(S.inputTimer);
    const mySeq = ++S.inputSeq;
    S.inputTimer = setTimeout(async () => {
      if (mySeq !== S.inputSeq) return;
      const toggle = D.autoUpdateToggle;
      if (toggle && !toggle.checked) return;
      if (elSrc.value === S.lastRenderedSrc) return;
      await renderOne(elSrc.value);
      S.lastRenderedSrc = elSrc.value;
    }, 500);
  });

  const btnCopy = D.copyBtn;
  const btnClear = D.clearBtn;
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      elSrc.value = '';
      syncGutter();
      clearEditorError();
      elSrc.dispatchEvent(new Event('input'));
      elSrc.focus();
    });
  }

  const canvasDocsBtn = D.canvasDocsBtn;
  if (canvasDocsBtn) {
    canvasDocsBtn.addEventListener('click', () => {
      window.open('https://mermaid.js.org/intro/', '_blank');
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(elSrc.value); flashIcon(btnCopy); }
      catch (e) { elSrc.select(); document.execCommand('copy'); flashIcon(btnCopy); }
    });
  }
}

export function flashIcon(btn) {
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  setTimeout(() => { btn.innerHTML = originalHtml; }, 1200);
}

export const applyColors = () => {
  colorizeSequence();
  colorizeClass();
  colorizeDiagram();
  colorizeFlowchart();
  applyDiagramStyle();
  applyDiagramFont();
  applyDiagramThickness();
  refreshActorColors();
  syncLocalHL();
};
