# Coloring System — How Color Is Applied to the Editor & Diagrams

This document explains **all** the coloring logic in `mermaid-editor.html` so an agent (or developer) can port it into another project and understand exactly how colors flow from the palette definitions, into the code editor's syntax highlighting, and onto the rendered SVG diagrams.

There are **three independent coloring subsystems**:

1. **Editor syntax highlighting** — colors tokens in the code textarea
2. **Diagram colorization** — post-processes Mermaid's rendered SVG
3. **Palette / theme system** — the color source of truth + canvas/editor theming

---

## Table of Contents

1. [The Palette System (source of truth)](#1-the-palette-system-source-of-truth)
2. [Theme System (canvas + editor backgrounds)](#2-theme-system-canvas--editor-backgrounds)
3. [Editor Syntax Highlighting](#3-editor-syntax-highlighting)
4. [Diagram Colorization (SVG post-processing)](#4-diagram-colorization-svg-post-processing)
5. [The `badgeTint()` Helper](#5-the-badgetint-helper)
6. [Porting Checklist](#6-porting-checklist)

---

## 1. The Palette System (source of truth)

All diagram colors come from the `PALETTES` object. Every palette has **two** color arrays:

| Array | Length | Used by | Coloring strategy |
|-------|--------|---------|-------------------|
| `seq` | 10 | Sequence, Class, ER diagrams | **Index-based** — each entity gets the next color by declaration order |
| `flow` | 8 | Flowcharts, State diagrams | **Depth-based** — BFS depth from root determines color |

```js
const PALETTES = {
  default: {
    seq: [ { fill:'#e2795b', text:'#ffffff' }, ... 10 total ],
    flow: [ { fill:'#8b7ff0', text:'#ffffff' }, ... 8 total ],
  },
  sunset: { seq: [...], flow: [...] },
  ocean:  { seq: [...], flow: [...] },
  forest: { seq: [...], flow: [...] },
  mono:   { seq: [...], flow: [...] },
};
```

**Each color object has two fields:**
- `fill` — the hex color used for fills, borders, strokes, and text
- `text` — the contrast color (`#ffffff` or `#1a1a1a`) for text placed *on* that fill (kept in the palette so text stays legible regardless of fill brightness)

### Palette design philosophy

All palettes (including themed ones) use **distinct categorical hues per slot** — like a pie chart, not a heatmap. Each color is visually different from its neighbours so nodes at different indices or depths read as clearly separate colors, not steps in a smooth ramp.

**Adjacent-color constraint:** No two adjacent slots in any palette may share the same color family. Colors are ordered so each slot's hue is as far as possible from its neighbours on the color wheel — e.g. blue is never next to teal, red is never next to orange, and in the Mono palette blue-end purples strictly alternate with red-end magentas.

The **Default** palette uses a mixed variety of hues. The **themed palettes** (sunset, ocean, forest, mono) pull their distinct hues from real things in that theme:
- **Sunset** — coral, golden yellow, royal purple, burnt orange, dusk lavender, crimson, amber, twilight indigo, hot pink, peach (alternating warm/cool so no two adjacent hues are similar)
- **Ocean** — blue whale, coral fish, sandy shore, sea urchin purple, seaweed, turquoise, krill pink, deep sea, seafoam, jellyfish (no two blues/greens adjacent)
- **Forest** — pine, fox fur, autumn gold, evening sky, maple red, moss, wild berry, bark, blue jay, mushroom (no two greens/browns adjacent)
- **Mono** — deep indigo, pink blossom, electric blue-indigo, hot magenta, muted iris, vivid magenta, plum, deep fuchsia, violet, rose pink (blue-end and red-end purples strictly alternate so neighbours are maximally far apart on the hue wheel)

### Palette selection + reversal

Two getters read the active palette from the UI controls:

```js
function getSeqPalette()   // reads #palettePicker + #paletteReverse checkbox
function getFlowPalette()  // same controls, returns the .flow array
```

If the **Reverse palette** checkbox is on, the array is `.reverse()`d before use.

---

## 2. Theme System (canvas + editor backgrounds)

Themes do **not** change the palette colors — they change the **background** of the canvas and editor, and the **syntax token colors** in the editor. Four themes:

| Theme | Canvas class | Editor class | Description |
|-------|-------------|-------------|-------------|
| **Light** | *(none)* | *(none)* | Default teal-on-white |
| **Dark** | `canvas-dark` | `theme-dark` | Deep navy background |
| **Console** | `canvas-dark` + `canvas-console` | `theme-dark` + `theme-console-bg` | GitHub-dark; layers background-only overrides on Dark |
| **Classic** | `canvas-classic` | `theme-classic` | Original violet/pink/amber; fully independent |

**Key design principle:** Console and Classic are layered differently.
- **Console** = Dark + background-only overrides (shares Dark's text/token colors)
- **Classic** = fully independent (own backgrounds AND own token colors)

The theme also tells **Mermaid itself** to render with `theme: 'dark'` or `theme: 'default'` — this affects default colors on elements our colorizers don't touch.

```js
function applyCanvasTheme() {
  // toggles the CSS classes on #preview-pane and #main
  // calls mermaid.initialize({ theme: isDarkFamily ? 'dark' : 'default' })
}
```

**The theme also affects badge tint strength** — see [§5](#5-the-badgetint-helper).

---

## 3. Editor Syntax Highlighting

The editor is a `<textarea>` overlaid on a `<div id="highlight-layer">` (the highlight layer is `pointer-events:none`, sitting behind the transparent textarea). The textarea text is invisible (`color:transparent`); only the caret shows. The colored text you see is the highlight layer's HTML.

### Tokenization

A **single-pass regex tokenizer** (`TOKEN_RE`) scans each line left-to-right with named capture groups. Whatever matches (or plain text falling through) determines the CSS class:

```js
const TOKEN_RE = new RegExp(
  '(?<comment>%%.*)'          + '|' +
  '(?<string>"[^"]*")'        + '|' +
  '(?<arrow>-->>|-->|->|...)' + '|' +
  '(?<control>\\b(alt|loop|end|...))' + '|' +
  '(?<kw>\\b(sequenceDiagram|flowchart|...))' + '|' +
  '(?<alias>(?<=participant\\s)\\w+|...)' + '|' +
  '(?<number>\\b\\d+(?:\\.\\d+)?\\b)' + '|' +
  '(?<func>[A-Za-z_][\\w.]*(?=\\())'
, 'g');
```

### Token CSS classes (Light theme)

| Class | Color | Token type |
|-------|-------|------------|
| `.tok-kw` | `#a33f9b` | Keywords (`flowchart`, `participant`, ...) |
| `.tok-control` | `#b4560f` | Control flow (`alt`, `loop`, `end`, ...) |
| `.tok-arrow` | `#123c36` | Arrows (`-->`, `->>`, `==>`, ...) |
| `.tok-string` | `#147a52` | Strings (`"text"`) |
| `.tok-comment` | `#8fa9a5` | Comments (`%%`) |
| `.tok-alias` | `#0d7ea3` | Aliases / node names |
| `.tok-number` | `#0d7ea3` | Numbers |
| `.tok-func` | `#0d7ea3` | Function calls |

Each theme overrides these via editor classes (`#main.theme-dark .tok-kw`, etc.).

### Sequence-diagram special case (alias ↔ actor color matching)

This is the clever part. For **sequence diagrams only**, the editor builds an `aliasColors` map that assigns each actor a palette color in declaration order — **mirroring exactly what `colorizeSequence()` does on the SVG**. So the text you type and the diagram you see always agree on color.

```js
function buildAliasColorMap(sourceText, seqPalette) {
  // walks source top-to-bottom, assigns each actor the next palette color
  // via participant/actor declarations OR as source/target of a message line
}
```

Then two special highlighters override the generic tokenizer for participant/message lines:

- **`highlightParticipantLine()`** — `participant U as User` → colors alias `U` + name `User` with the actor's color
- **`highlightMessageLine()`** — `U->>A: Click Save` → colors source `U` & target `A` with their own colors, and the **message text** with the **source's** color (matching how the SVG colors the arrow + message label)

**For non-sequence diagrams**, `aliasColors` is empty, so every match falls through to the generic tokenizer.

---

## 4. Diagram Colorization (SVG post-processing)

After Mermaid renders the SVG into `#diagram-host`, **five colorizer functions** run in sequence (all are no-ops if the diagram type doesn't match):

```js
async function render() {
  const { svg } = await mermaid.render(id, src);
  hostEl.innerHTML = svg;
  colorizeSequence();      // 1
  colorizeFlowchart();     // 2
  colorizeState(src);      // 3
  colorizeClassDiagram();  // 4
  colorizeER();            // 5
}
```

### Why post-processing instead of Mermaid's theme?

Mermaid embeds a `<style>` block with rules like `#g2 .actor { fill:#ECECFF; }`. **CSS beats presentation attributes**, so setting `fill=""` attributes has no visible effect. The colorizers instead **tag elements with `data-*` attributes and inject their own `<style>` block with `!important`**, which wins over Mermaid's rules.

### Universal pattern (all 5 colorizers)

1. **Find** the diagram's elements via type-specific selectors
2. **Tag** each with a `data-*` attribute carrying its color index/depth/lane
3. **Inject** a `<style id="...">` block with CSS rules keyed off those attributes
4. (Where needed) **Clone SVG markers** per color, since `<marker>` elements render in an isolated context and don't inherit stroke color

---

### 4a. `colorizeSequence()` — Index-based (uses `seq` palette)

**Goal:** Each actor lane gets a distinct color; arrows + message labels match their source actor.

1. **Lane assignment:** Actor `<rect class="actor">` boxes are grouped by their x-centre → distinct columns become `data-lane="0"`, `"1"`, etc. (left-to-right)
2. **Lifelines:** Vertical `<line>` elements (`x1 === x2`) are matched to the nearest actor lane; lifeline y-coords are trimmed to the box edges (because tinted badges are semi-transparent, the hidden overlap behind opaque boxes becomes visible)
3. **Activation bars:** `rect[class^="activation"]` tagged by their owner lane
4. **Arrows + markers:** Message arrowheads are `<marker>` shapes that don't inherit color. So the code **clones** each marker template once per lane, tints it, and repoints every arrow's `marker-start`/`marker-end` to its source-lane clone
5. **Message labels:** Each `text.messageText` is geometrically matched to its arrow (by midpoint x + y proximity) and tagged with the source lane
6. **CSS injection:**
   ```css
   svg [data-lane="0"] { fill:#e2795b!important; stroke:#e2795b!important; }
   svg rect.actor[data-lane="0"] { fill:<14% tint>!important; stroke:#e2795b!important; rx:16px; }
   svg text.actor[data-lane="0"] { fill:#e2795b!important; font-weight:700; }
   svg text.messageText[data-lane="0"] { fill:#e2795b!important; }
   ```

---

### 4b. `colorizeFlowchart()` — Depth-based (uses `flow` palette)

**Goal:** BFS depth-based coloring from root nodes. Each depth level gets a distinct hue from the palette.

1. **Build graph:** Nodes are `g.node[id^="flowchart-"]`. Edges are `path[id^="L-"]` with `LS-<src>` / `LE-<tgt>` classes (classes are reliable since node names can contain hyphens)
2. **BFS depth:** Start from all zero-indegree nodes; disconnected clusters each get their own root
3. **Tag** each node with `data-depth="<d % flow.length>"`
4. **Edge arrowheads:** Same marker-cloning technique as sequence, one clone per depth
5. **Edge labels:** Paired by document order with their edge paths
6. **CSS injection:** Tinted badge fill + colored border + colored label per depth. **Subgraphs/clusters** (`g.cluster rect`) get a neutral violet tint since they're containers, not nodes.

---

### 4c. `colorizeState(sourceText)` — Depth-based (uses `flow` palette)

**Goal:** BFS depth from the `[*]` start state.

State diagrams are special: **Mermaid's SVG doesn't encode source/target on transition edges** (edges are just `id="edge0"`, `"edge1"`...), unlike flowcharts. So this colorizer **parses the raw source text** for `A --> B` lines to rebuild the transition graph.

1. **Parse source** for `[\w.]+|\[\*\]` → `[\w.]+|\[\*\]` transitions
2. **BFS** from all states that `[*]` transitions *to*
3. Exclude `[*]` pseudo-states (rendered as `state-start`/`state-end` solid dots) from coloring
4. Transition edge paths are paired by declaration order (edges render in source order)
5. Marker cloning + CSS injection, same as flowchart

---

### 4d. `colorizeClassDiagram()` — Index-based (uses `seq` palette)

**Goal:** Each class gets a distinct color by declaration order; relations tinted by source class.

1. Nodes are `g.node[id^="classId-"]`, tagged `data-idx` by declaration order
2. Edge paths `id="id_<Source>_<Target>_<n>"` → parsed for source class (assumes class names don't contain underscores)
3. Marker cloning per source-class index
4. CSS injection: tinted badge fill, colored border, **divider lines** inside class boxes tinted at 45% opacity

---

### 4e. `colorizeER()` — Index-based (uses `seq` palette)

**Goal:** Each entity box gets a distinct color by declaration order.

1. Entities are `g[id^="entity-"]`, tagged `data-idx`
2. CSS injection: entity box + `text.er.entityLabel` (real SVG `<text>`, not foreignObject span, so plain `fill` works)
3. **Limitation:** Relationship lines carry no entity reference in the SVG, so they can't be tinted per-entity — only entity boxes are colored

---

## 5. The `badgeTint()` Helper

Nodes/actors are rendered as **"outlined badges"** rather than solid-filled boxes: a light tinted fill + full-strength colored border + full-strength colored text. This needs theme-aware tinting:

```js
function badgeTint(hex) {
  const dark = ['dark', 'console', 'classic'].includes(themePicker.value);
  return withAlpha(hex, dark ? 0.30 : 0.14);  // 30% on dark, 14% on light
}
```

**Why:** A 14% tint reads as a soft pastel on white, but the same 14% on a dark canvas is nearly invisible. Dark themes need 30% to register as a visible tint. Both get equally legible badges, just calibrated differently.

`withAlpha(hex, alpha)` converts a hex color to an `rgba()` string.

---

## 6. Porting Checklist

To port the coloring system into another project:

### Required pieces (copy verbatim)
- [ ] The `PALETTES` object + `getSeqPalette()` / `getFlowPalette()` getters
- [ ] `withAlpha()` + `badgeTint()` helpers
- [ ] All 5 colorizer functions: `colorizeSequence`, `colorizeFlowchart`, `colorizeState`, `colorizeClassDiagram`, `colorizeER`
- [ ] Call them in sequence after `mermaid.render()` inside your render function
- [ ] The syntax tokenizer: `TOKEN_RE` + `highlightLine()` + `renderHighlight()`
- [ ] Sequence-specific highlighters: `buildAliasColorMap()`, `highlightParticipantLine()`, `highlightMessageLine()`

### CSS to copy
- [ ] `.tok-*` token classes (light theme) + per-theme overrides (`theme-dark`, `theme-console-bg`, `theme-classic`)
- [ ] Canvas theme classes (`canvas-dark`, `canvas-console`, `canvas-classic`)

### Assumptions to verify in your target project
- [ ] **Mermaid version ~0.16.x** — the selectors (`rect.actor`, `g.node[id^="flowchart-"]`, `path[id^="L-"]`, etc.) are version-specific. Different Mermaid versions emit different SVG structures.
- [ ] The rendered SVG lives in a known container (here `#diagram-host` / `hostEl`)
- [ ] A `<textarea>`-based editor with a `#highlight-layer` overlay (if you want editor coloring too)
- [ ] Controls named `#palettePicker`, `#paletteReverse`, `#themePicker` (or update the getter references)

### Gotchas
- **Don't try to set `fill` attributes directly** — Mermaid's embedded `<style>` block wins over attributes. Use injected `<style>` with `!important`.
- **Markers don't inherit color** — `<marker>` renders in an isolated context. Must clone + tint per color and repoint `marker-start`/`marker-end`.
- **Sequence diagram lifelines need y-trimming** — semi-transparent actor boxes reveal the lifeline overlap that opaque boxes used to hide.
- **State diagram edges have no source/target in the SVG** — must parse source text to build the transition graph.
- **Console theme layers on Dark** — apply both `canvas-dark` + `canvas-console` (and `theme-dark` + `theme-console-bg` for the editor).
- **Classic theme is fully independent** — don't layer it on Dark; it has its own token colors.
