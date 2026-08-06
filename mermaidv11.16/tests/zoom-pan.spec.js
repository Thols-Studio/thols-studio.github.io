const { test, expect } = require('@playwright/test');

test.describe('Zoom & Pan Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5505/index.html');
    // Wait for initial render to establish a base transform
    await page.waitForSelector('.preview svg');
  });

  test('zoom in and zoom out buttons adjust the transform scale', async ({ page }) => {
    const zoomWrap = page.locator('#zoomWrap');
    const zoomInBtn = page.locator('#zoomInBtn');
    const zoomOutBtn = page.locator('#zoomOutBtn');

    // Get initial transform
    const initialStyle = await zoomWrap.getAttribute('style') || '';
    const initialScaleMatch = initialStyle.match(/scale\(([\d.]+)\)/);
    const initialScale = initialScaleMatch ? parseFloat(initialScaleMatch[1]) : 1;

    // Zoom Out
    await zoomOutBtn.click();
    await page.waitForTimeout(100); // give it a tiny bit of time to apply
    
    let style = await zoomWrap.getAttribute('style');
    let scaleMatch = style.match(/scale\(([\d.]+)\)/);
    let zoomedOutScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    
    expect(zoomedOutScale).toBeLessThan(initialScale);

    // Zoom In twice
    await zoomInBtn.click();
    await zoomInBtn.click();
    await page.waitForTimeout(100);
    
    style = await zoomWrap.getAttribute('style');
    scaleMatch = style.match(/scale\(([\d.]+)\)/);
    let zoomedInScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    
    expect(zoomedInScale).toBeGreaterThan(zoomedOutScale);
  });
});
