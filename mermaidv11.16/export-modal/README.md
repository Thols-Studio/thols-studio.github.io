# Export Modal Popup Component

A modular, zero-dependency HTML/CSS/JS export modal popup component designed for exporting SVG diagrams into **PNG** (2x HD canvas rendering), **SVG** (vector format), or **MMD** (Mermaid syntax source code) with live background color swatches (White, Dark, Transparent, Custom Hex) and live preview.

---

## 📁 Component Files

| File | Description |
|---|---|
| [`export-modal.html`](file:///c:/Project/Mermaid/export-modal/export-modal.html) | Raw HTML modal markup structure |
| [`export-modal.css`](file:///c:/Project/Mermaid/export-modal/export-modal.css) | Standalone responsive stylesheet with fallback theme tokens |
| [`export-modal.js`](file:///c:/Project/Mermaid/export-modal/export-modal.js) | ES module class handling modal open/close, SVG cloning, live preview, canvas PNG export & downloads |
| [`demo.html`](file:///c:/Project/Mermaid/export-modal/demo.html) | Fully interactive standalone demonstration page |

---

## 🤖 Instructions for AI Agents & Developers

To implement this Export Modal component into **another project**, follow these 3 simple steps:

### Step 1: Copy CSS stylesheet & HTML markup

1. Include [`export-modal.css`](file:///c:/Project/Mermaid/export-modal/export-modal.css) in your target HTML `<head>`:
```html
<link rel="stylesheet" href="path/to/export-modal.css">
```

2. Copy the HTML markup snippet from [`export-modal.html`](file:///c:/Project/Mermaid/export-modal/export-modal.html) into your document body (preferably right before `</body>`).

---

### Step 2: Initialize JavaScript module

Import `ExportModal` from [`export-modal.js`](file:///c:/Project/Mermaid/export-modal/export-modal.js) and initialize it by passing getter functions for your SVG element, source code, and filename:

```javascript
import { ExportModal } from './path/to/export-modal.js';

// Initialize modal manager
const exportModal = ExportModal.init({
  // Return the active SVG element in your DOM
  getSvg: () => document.querySelector('#myDiagramContainer svg'),

  // Return raw Mermaid or diagram text code (used for MMD export format)
  getSourceCode: () => myCodeEditor.getValue(),

  // Return desired filename (without file extension)
  getFilename: () => 'my-diagram-export'
});
```

---

### Step 3: Trigger Modal Opening

Attach an event listener to your application's Export button:

```javascript
document.querySelector('#exportBtn').addEventListener('click', () => {
  exportModal.open();
});
```

Optionally, you can pass runtime overrides when opening:

```javascript
exportModal.open({
  svg: specificSvgElement,
  sourceCode: 'flowchart TD\n  A --> B',
  filename: 'custom-filename'
});
```

---

## ⚙️ Features Included

- **Format Export Support**:
  - **PNG**: High-definition 2x scale Canvas rendering with chosen background color fill.
  - **SVG**: Pure vector format with proper `xmlns` declarations and embedded styles.
  - **MMD**: Pure Mermaid source text file download.
- **Background Color Swatches**:
  - `#ffffff` (White background)
  - `#000000` (Dark background)
  - `transparent` (PNG transparency)
  - Color Picker `<input type="color">` for custom background shades.
- **Live Preview Box**: Auto-fits cloned SVG diagram on chosen background in real-time.
- **Keyboard & Backdrop Support**: Closes on `Esc` key press or backdrop overlay click.
