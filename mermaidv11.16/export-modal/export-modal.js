/**
 * =================================================================
 * MERMAID / SVG EXPORT MODAL POPUP MODULE
 * Framework-agnostic JavaScript module for exporting SVG diagrams.
 * =================================================================
 */

export class ExportModal {
  /**
   * Initialize Export Modal
   * @param {Object} options
   * @param {string} [options.overlayId='exportModalOverlay'] - ID of modal overlay element
   * @param {string} [options.previewBoxId='exportPreviewBox'] - ID of preview container element
   * @param {Function} [options.getSvg] - Function returning SVGElement to export
   * @param {Function} [options.getSourceCode] - Function returning raw Mermaid code string
   * @param {Function} [options.getFilename] - Function returning default filename without extension
   */
  constructor(options = {}) {
    this.overlayId = options.overlayId || 'exportModalOverlay';
    this.previewBoxId = options.previewBoxId || 'exportPreviewBox';
    this.getSvg = options.getSvg || (() => document.querySelector('.preview svg, #target svg'));
    this.getSourceCode = options.getSourceCode || (() => '');
    this.getFilename = options.getFilename || (() => 'diagram');

    this.overlayEl = null;
    this.previewBoxEl = null;
    this.confirmBtnEl = null;
    this.cancelBtnEl = null;
    this.closeBtnEl = null;
    this.colorPickerEl = null;

    this.activeBgColor = 'white'; // 'white' | 'black' | 'transparent' | hex code
    this.activeFormat = 'png';   // 'png' | 'svg' | 'mmd'

    this._bindEvents();
  }

  /**
   * Bind event listeners to DOM elements
   * @private
   */
  _bindEvents() {
    // Wait for DOM to be ready if called before DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._setupElements());
    } else {
      this._setupElements();
    }
  }

  /**
   * Cache DOM elements and attach listeners
   * @private
   */
  _setupElements() {
    this.overlayEl = document.getElementById(this.overlayId);
    if (!this.overlayEl) return;

    this.previewBoxEl = document.getElementById(this.previewBoxId);
    this.confirmBtnEl = document.getElementById('exportConfirmBtn');
    this.cancelBtnEl = document.getElementById('exportCancelBtn');
    this.closeBtnEl = document.getElementById('closeExportBtn');
    this.colorPickerEl = document.getElementById('exportCustomColorPicker');

    // Close button listeners
    if (this.closeBtnEl) {
      this.closeBtnEl.addEventListener('click', () => this.close());
    }
    if (this.cancelBtnEl) {
      this.cancelBtnEl.addEventListener('click', () => this.close());
    }

    // Backdrop click close
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.close();
    });

    // Keyboard ESC key to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Format radio buttons
    const formatOptions = this.overlayEl.querySelectorAll('.format-option');
    formatOptions.forEach((opt) => {
      const input = opt.querySelector('input[type="radio"]');
      if (!input || input.disabled) return;

      opt.addEventListener('click', () => {
        formatOptions.forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        input.checked = true;
        this.activeFormat = input.value;
      });
    });

    // Background color swatches
    const bgSwatches = this.overlayEl.querySelectorAll('.bg-swatch');
    bgSwatches.forEach((swatch) => {
      swatch.addEventListener('click', (e) => {
        // If clicking custom color picker label, don't double trigger
        if (swatch.classList.contains('color-picker-swatch') && e.target !== this.colorPickerEl) {
          if (this.colorPickerEl) this.colorPickerEl.click();
        }

        bgSwatches.forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');

        this.activeBgColor = swatch.dataset.bg || swatch.style.background || 'white';
        this.updatePreview();
      });
    });

    // Custom Color Picker input listener
    if (this.colorPickerEl) {
      this.colorPickerEl.addEventListener('input', (e) => {
        const hex = e.target.value;
        const pickerSwatch = this.colorPickerEl.closest('.bg-swatch');
        if (pickerSwatch) {
          bgSwatches.forEach((s) => s.classList.remove('active'));
          pickerSwatch.classList.add('active');
          pickerSwatch.style.background = hex;
          pickerSwatch.dataset.bg = hex;
        }
        this.activeBgColor = hex;
        this.updatePreview();
      });
    }

    // Confirm / Export action button
    if (this.confirmBtnEl) {
      this.confirmBtnEl.addEventListener('click', () => this.handleExport());
    }
  }

  /**
   * Check if modal is currently open
   * @returns {boolean}
   */
  isOpen() {
    return this.overlayEl ? this.overlayEl.classList.contains('active') : false;
  }

  /**
   * Open export modal
   * @param {Object} [overrideOptions]
   * @param {SVGElement} [overrideOptions.svg]
   * @param {string} [overrideOptions.sourceCode]
   * @param {string} [overrideOptions.filename]
   */
  open(overrideOptions = {}) {
    if (!this.overlayEl) this._setupElements();
    if (!this.overlayEl) return;

    if (overrideOptions.svg) this._overrideSvg = overrideOptions.svg;
    if (overrideOptions.sourceCode) this._overrideSource = overrideOptions.sourceCode;
    if (overrideOptions.filename) this._overrideFilename = overrideOptions.filename;

    this.overlayEl.classList.add('active');
    this.overlayEl.setAttribute('aria-hidden', 'false');
    this.updatePreview();
  }

  /**
   * Close export modal
   */
  close() {
    if (!this.overlayEl) return;
    this.overlayEl.classList.remove('active');
    this.overlayEl.setAttribute('aria-hidden', 'true');
    this._overrideSvg = null;
    this._overrideSource = null;
    this._overrideFilename = null;
  }

  /**
   * Get current target SVG element
   * @returns {SVGElement|null}
   */
  getTargetSvg() {
    if (this._overrideSvg) return this._overrideSvg;
    return typeof this.getSvg === 'function' ? this.getSvg() : null;
  }

  /**
   * Update live diagram preview inside export preview box
   */
  updatePreview() {
    if (!this.previewBoxEl) return;

    const svg = this.getTargetSvg();
    if (!svg) {
      this.previewBoxEl.innerHTML = '<div class="export-preview-placeholder">No diagram available to preview</div>';
      return;
    }

    const clone = svg.cloneNode(true);
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.maxWidth = '100%';
    clone.style.maxHeight = '100%';

    // Set background on preview box
    if (this.activeBgColor === 'transparent') {
      this.previewBoxEl.style.background = 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 10px 10px';
    } else if (this.activeBgColor === 'white') {
      this.previewBoxEl.style.background = '#ffffff';
    } else if (this.activeBgColor === 'black') {
      this.previewBoxEl.style.background = '#000000';
    } else {
      this.previewBoxEl.style.background = this.activeBgColor;
    }

    this.previewBoxEl.innerHTML = '';
    this.previewBoxEl.appendChild(clone);
  }

  /**
   * Serialize SVG element to XML string with XMLNS attributes and background style
   * @param {SVGElement} svg
   * @returns {string}
   */
  serializeSvg(svg) {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const vb = svg.viewBox?.baseVal;
    const w = Math.max(1, vb?.width || svg.clientWidth || 800);
    const h = Math.max(1, vb?.height || svg.clientHeight || 600);
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));

    if (this.activeBgColor !== 'transparent') {
      const bg = this.activeBgColor === 'white' ? '#ffffff' : (this.activeBgColor === 'black' ? '#000000' : this.activeBgColor);
      clone.style.background = bg;
    } else {
      clone.style.background = 'none';
    }

    return new XMLSerializer().serializeToString(clone);
  }

  /**
   * Trigger file download in browser
   * @param {string} filename
   * @param {Blob} blob
   */
  downloadFile(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Handle Export confirmation click
   */
  handleExport() {
    const svg = this.getTargetSvg();
    const sourceCode = this._overrideSource || (typeof this.getSourceCode === 'function' ? this.getSourceCode() : '');
    const filename = this._overrideFilename || (typeof this.getFilename === 'function' ? this.getFilename() : 'diagram');

    if (!svg && this.activeFormat !== 'mmd') {
      alert('No diagram SVG found to export.');
      return;
    }

    const origText = this.confirmBtnEl ? this.confirmBtnEl.textContent : 'Export';
    if (this.confirmBtnEl) {
      this.confirmBtnEl.textContent = 'Exporting...';
      this.confirmBtnEl.disabled = true;
    }

    setTimeout(() => {
      try {
        if (this.activeFormat === 'svg') {
          const serialized = this.serializeSvg(svg);
          const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
          this.downloadFile(`${filename}.svg`, blob);
          this._finishExport(origText);
        } else if (this.activeFormat === 'mmd') {
          const blob = new Blob([sourceCode], { type: 'text/plain;charset=utf-8' });
          this.downloadFile(`${filename}.mmd`, blob);
          this._finishExport(origText);
        } else if (this.activeFormat === 'png') {
          this._exportPng(svg, filename, origText);
        }
      } catch (err) {
        console.error('Export failed:', err);
        if (this.confirmBtnEl) {
          this.confirmBtnEl.textContent = 'Error!';
          setTimeout(() => {
            this.confirmBtnEl.textContent = origText;
            this.confirmBtnEl.disabled = false;
          }, 1500);
        }
      }
    }, 50);
  }

  /**
   * Export SVG diagram as high-resolution PNG
   * @private
   */
  _exportPng(svg, filename, origText) {
    const vb = svg.viewBox?.baseVal;
    const w = Math.max(1, vb?.width || svg.clientWidth || 800);
    const h = Math.max(1, vb?.height || svg.clientHeight || 600);
    const scale = 2; // 2x Retina resolution

    const serialized = this.serializeSvg(svg);
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(serialized)));
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');

      // Draw background if not transparent
      if (this.activeBgColor !== 'transparent') {
        ctx.fillStyle = this.activeBgColor === 'white' ? '#ffffff' : (this.activeBgColor === 'black' ? '#000000' : this.activeBgColor);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          this.downloadFile(`${filename}.png`, blob);
          this._finishExport(origText);
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      console.error('PNG conversion failed:', err);
      if (this.confirmBtnEl) {
        this.confirmBtnEl.textContent = 'Failed';
        setTimeout(() => {
          this.confirmBtnEl.textContent = origText;
          this.confirmBtnEl.disabled = false;
        }, 1500);
      }
    };

    img.src = dataUrl;
  }

  /**
   * Reset confirmation button and close modal after export
   * @private
   */
  _finishExport(origText) {
    if (this.confirmBtnEl) {
      this.confirmBtnEl.textContent = 'Done ✓';
      setTimeout(() => {
        this.confirmBtnEl.textContent = origText;
        this.confirmBtnEl.disabled = false;
        this.close();
      }, 800);
    } else {
      this.close();
    }
  }

  /**
   * Static helper for quick setup
   * @param {Object} options
   * @returns {ExportModal}
   */
  static init(options) {
    const instance = new ExportModal(options);
    return instance;
  }
}

export default ExportModal;
