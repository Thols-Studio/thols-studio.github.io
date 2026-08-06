import { chromium } from 'playwright';

const mermaidCode = `sequenceDiagram
    participant A
    A->>B bad syntax
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5505');
  
  const result = await page.evaluate(async (code) => {
    try {
      await window.mermaid.parse(code);
      return { success: true };
    } catch (err) {
      // Return the error properties
      const errProps = Object.getOwnPropertyNames(err).reduce((acc, prop) => {
        acc[prop] = err[prop];
        return acc;
      }, {});
      return { success: false, err: errProps, str: err.toString() };
    }
  }, mermaidCode);
  
  console.log('RESULT:', JSON.stringify(result, null, 2));
  await browser.close();
})();
