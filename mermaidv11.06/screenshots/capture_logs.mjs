import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[error] ${err.message}`));
  
  await page.goto('http://localhost:5505');
  await page.waitForTimeout(2000);
  
  fs.writeFileSync('d:\\Mermaid\\console.log', logs.join('\n'));
  await browser.close();
})();
