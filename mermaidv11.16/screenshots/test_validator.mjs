import { chromium } from 'playwright';

const mermaidCode = `sequenceDiagram
    participant A
    alt foo
    else bar
    end
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:5505');
  
  const result = await page.evaluate(async (code) => {
    try {
      const isValid = await window.mermaid.parse(code);
      const renderObj = await window.mermaid.render('test_id', code);
      const hasNaN = renderObj.svg.includes('NaN');
      return { isValid, hasNaN, error: null };
    } catch (err) {
      return { isValid: false, hasNaN: false, error: err.message };
    }
  }, mermaidCode);
  
  console.log('RESULT:', result);
  
  await browser.close();
})();
