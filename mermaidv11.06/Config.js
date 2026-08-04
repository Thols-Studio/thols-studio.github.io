/**
 * Configuration for the Mermaid Editor
 * 
 * You can restrict which diagram types are permitted by adding or removing them 
 * from the `allowedDiagramTypes` array below.
 * 
 * Available Mermaid Diagram Types:
 * - 'flowchart' (also covers 'graph')
 * - 'sequence' (or 'sequenceDiagram')
 * - 'classDiagram'
 * - 'stateDiagram' (and 'stateDiagram-v2')
 * - 'erDiagram'
 * - 'journey'
 * - 'gantt'
 * - 'pie'
 * - 'quadrantChart'
 * - 'requirementDiagram'
 * - 'gitGraph'
 * - 'C4Context'
 * - 'mindmap'
 * - 'timeline'
 * - 'zenuml'
 * - 'sankey-beta'
 */

const CONFIG = {
  // Only the diagram types listed here will be allowed to render. 
  // The shapes/snippets toolbar will also filter based on this list.
  allowedDiagramTypes: [
    'flowchart',
    'sequenceDiagram',
    'classDiagram'
    // 'stateDiagram',
    // 'stateDiagram-v2',
    // 'erDiagram',
    // 'gantt'
  ]
};
