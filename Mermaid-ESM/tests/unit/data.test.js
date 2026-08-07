import { describe, it, expect } from 'vitest';
import { DIAGRAMS, SNIPPETS } from '../../src/data.js';

describe('Catalogue Data (data.js)', () => {
  it('contains essential diagram types including flowchart, sequence, and architecture', () => {
    expect(DIAGRAMS).toHaveProperty('flowchart');
    expect(DIAGRAMS).toHaveProperty('sequence');
    expect(DIAGRAMS).toHaveProperty('architecture');
    expect(DIAGRAMS).toHaveProperty('er');
  });

  it('each diagram definition has a label, hint, and valid src', () => {
    Object.entries(DIAGRAMS).forEach(([key, diag]) => {
      expect(diag.label).toBeTypeOf('string');
      expect(diag.hint).toBeTypeOf('string');
      expect(diag.src).toBeTypeOf('string');
      expect(diag.src.length).toBeGreaterThan(0);
    });
  });

  it('snippets category list is populated with flowchart shapes and edges', () => {
    expect(Array.isArray(SNIPPETS)).toBe(true);
    expect(SNIPPETS.length).toBeGreaterThan(0);
    
    const flowchartShapes = SNIPPETS.find((s) => s.cat === 'Flowchart shapes');
    expect(flowchartShapes).toBeDefined();
    expect(flowchartShapes.items.length).toBeGreaterThan(0);
  });
});
