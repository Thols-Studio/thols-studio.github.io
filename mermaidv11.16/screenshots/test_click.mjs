import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5505');
  await page.waitForTimeout(2000);
  
  const box = await page.evaluate(() => {
    const btn = document.getElementById('exportMenuBtn');
    if (!btn) return 'not found';
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    return {
      x: rect.x, y: rect.y, w: rect.width, h: rect.height,
      pointerEvents: style.pointerEvents,
      visibility: style.visibility,
      display: style.display,
      zIndex: style.zIndex
    };
  });
  console.log('Export button:', box);
  
  // Try to click it
  try {
    await page.click('#exportMenuBtn', { timeout: 2000 });
    console.log('Clicked export button successfully');
    await page.waitForTimeout(500);
    const modalDisplay = await page.evaluate(() => document.getElementById('exportModalOverlay').style.display);
    console.log('Modal display:', modalDisplay);
  } catch (e) {
    console.log('Click failed:', e.message);
  }

  await browser.close();
})();
