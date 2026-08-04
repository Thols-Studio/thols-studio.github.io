import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

await page.goto('http://localhost:5505');
await page.waitForSelector('#renderBtn.rendered', { timeout: 10000 });
await page.waitForTimeout(400);

// Switch to sequence so actors are visible
await page.selectOption('#diagramType', 'sequence');
await page.waitForSelector('#renderBtn.rendered', { timeout: 10000 });
await page.waitForTimeout(400);

// Turn on local HL
await page.selectOption('#hlMode', 'local');
await page.waitForTimeout(500);

// === DIAGNOSTICS ===
const diagnostics = await page.evaluate(() => {
  const textarea = document.getElementById('source');
  const hlLayer  = document.getElementById('hlLayer');
  const wrap     = document.getElementById('textareaWrap');
  const cs       = window.getComputedStyle(textarea);
  const csLayer  = window.getComputedStyle(hlLayer);

  return {
    // Textarea state
    textarea_classList:    textarea.className,
    textarea_color:        cs.color,
    textarea_bg:           cs.backgroundColor,
    textarea_zIndex:       cs.zIndex,
    textarea_position:     cs.position,
    textarea_value_first50: textarea.value.substring(0, 80),

    // HL layer state  
    hlLayer_display:       csLayer.display,
    hlLayer_zIndex:        csLayer.zIndex,
    hlLayer_position:      csLayer.position,
    hlLayer_bg:            csLayer.backgroundColor,
    hlLayer_innerHTML_80:  hlLayer.innerHTML.substring(0, 120),

    // Wrap
    wrap_position:         window.getComputedStyle(wrap).position,
    wrap_display:          window.getComputedStyle(wrap).display,
    wrap_flexDir:          window.getComputedStyle(wrap).flexDirection,

    // hl-on class present?
    has_hl_on_class:       textarea.classList.contains('hl-on'),

    // injectHLPaletteColors applied?
    palette_style_tag:     !!document.getElementById('hl-palette-colors'),
    palette_style_content: (document.getElementById('hl-palette-colors') || {}).textContent?.substring(0, 200),
  };
});

console.log('=== DIAGNOSTICS ===');
for (const [k, v] of Object.entries(diagnostics)) {
  console.log(`${k}: ${JSON.stringify(v)}`);
}

await page.screenshot({ path: 'd:/Mermaid/screenshots/05_diag_sequence.png' });

await browser.close();
