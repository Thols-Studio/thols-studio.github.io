const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('mermaid-hl-mode', 'off');
  });
  
  const fileUrl = 'http://localhost:8080/index.html';
  console.log('Navigating to', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  // Set sequence diagram
  await page.evaluate(() => {
    document.getElementById('source').value = 'sequenceDiagram\\nparticipant Alice\\nAlice->>John: Hello John, how are you?\\n';
    document.getElementById('source').dispatchEvent(new Event('input'));
  });
  
  // Wait for mermaid to render
  await new Promise(r => setTimeout(r, 2000));
  
  const svgHTML = await page.evaluate(() => document.querySelector('.preview').innerHTML);
  fs.writeFileSync('test-svg.html', svgHTML);
  console.log('Wrote to test-svg.html');
  await browser.close();
})();
