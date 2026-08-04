import { chromium } from 'playwright';

const mermaidCode = `sequenceDiagram
    participant Alice
    alt foo
    else bar
    end
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5505');
  
  const result = await page.evaluate(async (code) => {
    try {
      const match = code.match(/(?:participant|actor)\s+([A-Za-z0-9_]+)/);
      const dummyActor = match ? match[1] : 'Dummy';
      const fixedCode = code.replace(/((?:alt|opt|else)[^\n]*\n)(?=\s*(?:else|end))/g, \`$1    Note over \${dummyActor}: (empty block auto-fix)\n\`);
      
      const renderObj = await window.mermaid.render('test_id', fixedCode);
      return { fixedCode, hasNaN: renderObj.svg.includes('NaN') };
    } catch (err) {
      return { fixedCode: null, hasNaN: false, error: err.message };
    }
  }, mermaidCode);
  
  console.log('RESULT:', result);
  await browser.close();
})();
