import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });

  // Add event listener to capture when fullscreen is entered
  await page.evaluate(() => {
    return new Promise(resolve => {
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) resolve();
      });
      // trigger fullscreen
      document.getElementById('fullscreenBtn').click();
      // fallback in case of no fullscreen API in headless
      setTimeout(resolve, 1000); 
    });
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'd:\\Mermaid\\screenshots\\25_fullscreen.png' });

  await browser.close();
})();
