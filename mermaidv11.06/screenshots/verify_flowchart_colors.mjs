import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5505');
  await page.waitForSelector('#target svg', { state: 'attached' });
  
  // Set to flowchart
  await page.evaluate(() => {
    const el = document.getElementById('diagramType');
    el.value = 'flowchart';
    el.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(1000);
  
  // Enable local syntax
  await page.evaluate(() => {
    const hlMode = document.getElementById('hlMode');
    hlMode.value = 'local';
    hlMode.dispatchEvent(new Event('change'));
  });
  
  await page.waitForTimeout(500);
  
  // Refresh actor colors
  await page.evaluate(() => {
    window.refreshActorColors();
  });
  
  const map = await page.evaluate(() => window.actorColorMap);
  console.log(JSON.stringify(map, null, 2));
  
  await browser.close();
})();
