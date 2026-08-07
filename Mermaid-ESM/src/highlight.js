// Syntax highlighting: a lightweight local-regex highlighter and an optional
// CodeMirror 6 highlighter loaded from a CDN (esm.sh).

import { D, currentSvg } from './dom.js';
import { S, PALETTE } from './state.js';
import { highlightDiagramNodeByText } from './interaction.js';

const _DKW = [
  'sequenceDiagram', 'flowchart', 'graph', 'classDiagram',
  'stateDiagram-v2', 'stateDiagram', 'erDiagram', 'gantt', 'pie',
  'journey', 'gitGraph', 'requirementDiagram', 'quadrantChart',
  'mindmap', 'timeline', 'sankey-beta', 'block-beta',
  'C4Context', 'C4Container', 'C4Component', 'C4Deployment',
  'architecture-beta',
].join('|');

const _BKW = [
  'participant', 'actor', 'loop', 'alt', 'else', 'opt', 'par', 'break', 'end',
  'Note', 'over', 'activate', 'deactivate', 'subgraph', 'section', 'title',
  'dateFormat', 'commit', 'branch', 'checkout', 'merge', 'autonumber',
  'as', 'in', 'columns', 'requirement', 'element', 'satisfies',
  'Person', 'System', 'Rel', 'Container', 'Component', 'Boundary',
  'group', 'service', 'junction', 'done', 'active', 'crit', 'after',
  'click', 'call', 'href', 'TD', 'TB', 'LR', 'RL', 'BT',
].join('|');

export function refreshActorColors() {
  if (!S.hlActive) return;
  const svg = currentSvg();
  if (!svg) { S.actorColorMap = {}; return; }
  const map = {};

  svg.querySelectorAll('text.actor').forEach((t) => {
    const name = t.textContent.trim();
    if (!name) return;
    const style = t.getAttribute('style') || '';
    const m = style.match(/fill:\s*(#[0-9a-fA-F]{6})/);
    if (m) map[name] = m[1];
  });

  svg.querySelectorAll('g.node').forEach((node) => {
    const cnode = node.getAttribute('data-cnode');
    if (cnode != null) {
      const color = PALETTE[parseInt(cnode, 10) % PALETTE.length];
      const idAttr = node.getAttribute('id') || '';
      const match = idAttr.match(/flowchart-(.+)-\d+$/);
      if (match && match[1]) {
        map[match[1]] = color;
      }
      const textEl = node.querySelector('.nodeLabel, text');
      if (textEl) {
        const label = textEl.textContent.trim();
        if (label) map[label] = color;
      }
    }
  });

  S.actorColorMap = map;
}

function replaceOutsideTags(html, regex, replacement) {
  return html.split(/(<[^>]*>)/).map((part, i) =>
    i % 2 === 0 ? part.replace(regex, replacement) : part
  ).join('');
}

function _escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightLine(line) {
  let s = _escHtml(line);
  const cm = s.match(/^(\s*)(%%.*)/);
  if (cm) return cm[1] + '<span class="hl-comment">' + cm[2] + '</span>';
  const safe = (rx, repl) => { s = replaceOutsideTags(s, rx, repl); };
  safe(new RegExp('(^\\s*)(' + _DKW + ')(\\s|$)'), '$1<span class="hl-keyword">$2</span>$3');
  safe(new RegExp('(\\s|^)(' + _BKW + ')(\\s|$|:|[(])', 'g'), '$1<span class="hl-builtin">$2</span>$3');
  safe(/"([^"]*?)"/g, '"<span class="hl-string">$1</span>"');
  safe(/\b(\d+\.?\d*[dw]?)\b/g, '<span class="hl-number">$1</span>');
  safe(/(--&gt;&gt;|--&gt;|-&gt;&gt;|-&gt;|==&gt;|&lt;--&gt;|&lt;--|~~~)/g,
    '<span class="hl-arrow">$1</span>');
  safe(/\|([^|\n]*)\|/g, '|<span class="hl-string">$1</span>|');
  for (const [name, color] of Object.entries(S.actorColorMap)) {
    if (!name) continue;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    safe(new RegExp('(?<![\\w-])(' + esc + ')(?![\\w-])', 'g'),
      '<span style="color:' + color + ';font-weight:700">$1</span>');
  }
  return s;
}

export function syncLocalHL() {
  if (!S.hlActive) return;
  const { src: elSrc, hlLayer: elHlLayer, gutter: elGutter } = D;
  elHlLayer.innerHTML = elSrc.value.split('\n').map((line, i) => {
    let hl = highlightLine(line);
    if (window.hlErrorLines.has(i)) {
      hl = `<span class="hl-error-line" style="background: rgba(226, 121, 91, 0.25); display: inline-block; width: 100%; border-radius: 2px;">${hl || ' '}</span>`;
    }
    return hl;
  }).join('\n') + '\n';
  elHlLayer.scrollTop = elSrc.scrollTop;
  elHlLayer.scrollLeft = elSrc.scrollLeft;
}

function teardownHL() {
  const { src: elSrc, hlLayer: elHlLayer, gutter: elGutter, textareaWrap } = D;
  if (S.cmView) {
    const doc = S.cmView.state.doc.toString();
    textareaWrap.querySelector('.cm-host')?.remove();
    S.cmView.destroy();
    S.cmView = null;
    elSrc.style.display = '';
    elSrc.value = doc;
    syncGutterLocal();
    elGutter.style.display = '';
  }
  elHlLayer.innerHTML = '';
  elHlLayer.style.display = 'none';
  elSrc.classList.remove('hl-on');
  S.hlActive = false;
}

function syncGutterLocal() {
  const { src: elSrc, gutter: elGutter } = D;
  const lines = elSrc.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) {
    const isErr = (window.hlErrorLines && window.hlErrorLines.has(i - 1)) || S.editorErrorLines.has(i);
    const isWarn = S.editorWarningLines.has(i);
    if (isErr) html += `<span class="gutter-error-line">${i}</span>`;
    else if (isWarn) html += `<span class="gutter-warning-line">${i}</span>`;
    else html += `<span>${i}</span>`;
  }
  elGutter.innerHTML = html;
  elGutter.scrollTop = elSrc.scrollTop;
}

function setupLocalHL() {
  teardownHL();
  S.hlActive = true;
  D.hlLayer.style.display = 'block';
  D.src.classList.add('hl-on');
  syncLocalHL();
}

async function setupCdnHL() {
  teardownHL();

  const loadEl = document.createElement('div');
  loadEl.className = 'hl-loading';
  loadEl.innerHTML = '<div class="hl-spinner"></div>Loading CodeMirror…';
  D.textareaWrap.appendChild(loadEl);
  D.src.style.display = 'none';
  D.gutter.style.display = 'none';

  try {
    const [
      cmView_mod,
      cmState_mod,
      cmCommands_mod,
      cmLanguage_mod,
      cmTheme_mod,
    ] = await Promise.all([
      import('https://esm.sh/@codemirror/view@6'),
      import('https://esm.sh/@codemirror/state@6'),
      import('https://esm.sh/@codemirror/commands@6'),
      import('https://esm.sh/@codemirror/language@6'),
      import('https://esm.sh/@codemirror/theme-one-dark@6'),
    ]);

    const { EditorView, keymap, drawSelection, highlightActiveLine,
      lineNumbers, highlightActiveLineGutter,
      WidgetType, Decoration, ViewPlugin, MatchDecorator } = cmView_mod;
    const { EditorState, RangeSetBuilder } = cmState_mod;
    const { defaultKeymap, history, historyKeymap, indentWithTab } = cmCommands_mod;
    const { StreamLanguage, indentUnit, syntaxHighlighting,
      defaultHighlightStyle } = cmLanguage_mod;
    const { oneDark } = cmTheme_mod;

    window.CMEditorView = EditorView;

    const mermaidLang = StreamLanguage.define({
      name: 'mermaid',
      startState: () => ({}),
      token(stream) {
        if (stream.match('%%')) { stream.skipToEnd(); return 'comment'; }
        if (stream.match(new RegExp(_DKW + '(?=\\s|$)'))) return 'keyword';
        if (stream.match(new RegExp(_BKW + '(?=\\s|$|[(])'))) return 'operatorKeyword';
        if (stream.match(/"(?:[^"\\]|\\.)*"/)) return 'string';
        if (stream.match(/\d+\.?\d*[dw]?/)) return 'number';
        if (stream.match(/-->>/) || stream.match(/-->/) || stream.match(/->>/) ||
          stream.match(/->/) || stream.match(/==>/) || stream.match(/~~~/)) return 'operator';
        stream.next(); return null;
      },
    });

    class ColorWidget extends WidgetType {
      constructor(colorStr) {
        super();
        this.colorStr = colorStr;
      }
      eq(other) { return other.colorStr === this.colorStr; }
      toDOM(view) {
        const span = document.createElement('span');
        span.className = 'cm-color-square';

        let hex = '#000000';
        const m = this.colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (m) {
          const r = parseInt(m[1]).toString(16).padStart(2, '0');
          const g = parseInt(m[2]).toString(16).padStart(2, '0');
          const b = parseInt(m[3]).toString(16).padStart(2, '0');
          hex = `#${r}${g}${b}`;
        } else if (this.colorStr.startsWith('#')) {
          if (this.colorStr.length === 4) {
            hex = '#' + this.colorStr[1].repeat(2) + this.colorStr[2].repeat(2) + this.colorStr[3].repeat(2);
          } else if (this.colorStr.length === 7) {
            hex = this.colorStr.toLowerCase();
          }
        }

        span.style.backgroundColor = this.colorStr;

        const input = document.createElement('input');
        input.type = 'color';
        input.value = hex;
        input.title = 'Change color';
        input.addEventListener('input', (e) => {
          const pos = view.posAtDOM(span);
          view.dispatch({
            changes: { from: pos, to: pos + this.colorStr.length, insert: e.target.value },
          });
        });
        span.appendChild(input);
        return span;
      }
      ignoreEvent() { return true; }
    }

    const colorPlugin = ViewPlugin.fromClass(class {
      constructor(view) {
        this.decorations = this.buildDeco(view);
      }
      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDeco(update.view);
        }
      }
      buildDeco(view) {
        const builder = new RangeSetBuilder();
        const regex = /(?:rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)|#[0-9a-fA-F]{3,8})/gi;

        for (let { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to);
          let match;
          while ((match = regex.exec(text))) {
            const pos = from + match.index;
            builder.add(pos, pos, Decoration.widget({
              widget: new ColorWidget(match[0]),
              side: -1,
            }));
          }
        }
        return builder.finish();
      }
    }, {
      decorations: (v) => v.decorations,
    });

    loadEl.remove();

    const cmHost = document.createElement('div');
    cmHost.className = 'cm-host';
    D.textareaWrap.appendChild(cmHost);

    S.cmView = new EditorView({
      state: EditorState.create({
        doc: D.src.value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          indentUnit.of('  '),
          mermaidLang,
          colorPlugin,
          syntaxHighlighting(defaultHighlightStyle),
          oneDark,
          EditorView.theme({
            '&': { fontSize: '.82rem', height: '100%' },
            '.cm-scroller': {
              fontFamily: 'ui-monospace,"SFMono-Regular",Consolas,monospace',
              minHeight: '320px', overflow: 'auto',
            },
          }),
          EditorView.updateListener.of((update) => {
            if (update.selectionSet) {
              try {
                const lineInfo = update.state.doc.lineAt(update.state.selection.main.head);
                highlightDiagramNodeByText(lineInfo.text.trim());
              } catch (e) { }
            }
            if (!update.docChanged) return;
            const val = update.state.doc.toString();
            D.src.value = val;
            D.src.dispatchEvent(new Event('input'));
          }),
        ],
      }),
      parent: cmHost,
    });

    S.hlActive = true;

  } catch (err) {
    console.error('CodeMirror CDN load failed:', err);
    loadEl.remove();
    D.src.style.display = '';
    D.gutter.style.display = '';
    D.hlMode.value = 'off';
    const errEl = document.createElement('div');
    errEl.style.cssText = 'padding:.5rem .75rem;color:#c0392b;font-size:.82rem;flex-shrink:0;';
    errEl.textContent = '⚠ CodeMirror failed to load. Check your internet connection.';
    D.textareaWrap.prepend(errEl);
    setTimeout(() => errEl.remove(), 4000);
  }
}

function applyHlMode(mode) {
  if (mode === 'local') setupLocalHL();
  else if (mode === 'cdn') setupCdnHL();
  else teardownHL();
  try { localStorage.setItem('mermaid-hl-mode', mode); } catch (_) { }
}

export function initHighlight() {
  D.hlMode.addEventListener('change', () => applyHlMode(D.hlMode.value));

  D.src.addEventListener('input', () => {
    syncLocalHL();
    const activeBg = document.getElementById('textarea-active-bg');
    if (activeBg) activeBg.style.display = 'none';
  });

  D.src.addEventListener('scroll', () => {
    if (S.hlActive && !S.cmView) {
      D.hlLayer.scrollTop = D.src.scrollTop;
      D.hlLayer.scrollLeft = D.src.scrollLeft;
    }
    const activeBg = document.getElementById('textarea-active-bg');
    if (activeBg && activeBg.style.display !== 'none') {
      activeBg.style.transform = `translateY(${activeBg.dataset.top - D.src.scrollTop}px)`;
    }
  });

  // Restore persisted mode on startup.
  try {
    const saved = localStorage.getItem('mermaid-hl-mode') || 'cdn';
    D.hlMode.value = saved;
    if (saved !== 'off') applyHlMode(saved);
  } catch (_) { }

  window.hlErrorLines = window.hlErrorLines || new Set();
}

// Allow other modules to tear down / rebuild on demand.
export { teardownHL, setupLocalHL, setupCdnHL, applyHlMode };
