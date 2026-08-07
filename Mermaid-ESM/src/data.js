// Static catalogue data: example diagrams (DIAGRAMS) and the snippet palette.

export const DIAGRAMS = {
  'architecture': { label: 'Architecture', hint: 'architecture — cloud topology', src: `architecture-beta\n    group core(cloud)[Core]\n    service db(database)[DB] in core\n    service api(server)[API] in core\n    db:R -- L:api` },
  'block': { label: 'Block', hint: 'block-beta — nested blocks', src: `block-beta\n  columns 3\n  doc["Document"]\n  space\n  process["Process"]:2\n  doc --> process\n  process --> result["Result"]` },
  'c4': { label: 'C4 Context', hint: 'C4Context — architecture', src: `C4Context\n    title Banking system\n    Person(customer, "Customer", "A customer")\n    System(banking, "Banking System", "Allows deposits")\n    Rel(customer, banking, "Uses")` },
  'class': { label: 'Class', hint: 'classDiagram — OOP classes & relations', src: `classDiagram\n    class Animal {\n      +String name\n      +int age\n      +makeSound() void\n    }\n    class Dog {\n      +fetch() void\n    }\n    class Cat {\n      +purr() void\n    }\n    Animal <|-- Dog\n    Animal <|-- Cat` },
  'er': { label: 'Entity Relationship', hint: 'erDiagram — DB schema', src: `erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    CUSTOMER {\n      string name\n      string email\n    }\n    ORDER {\n      int id\n      string status\n    }` },
  'flowchart': { label: 'Flowchart', hint: 'graph / flowchart — nodes & edges', src: `flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Do it]\n    B -->|No| D[Skip]\n    C --> E([Done])\n    D --> E` },
  'gantt': { label: 'Gantt', hint: 'gantt — project schedule', src: `gantt\n    title Project plan\n    dateFormat YYYY-MM-DD\n    section Design\n    Spec      :done, a1, 2024-01-01, 7d\n    Mockups   :active, a2, after a1, 5d\n    section Build\n    Implement :b1, after a2, 10d\n    Test      :b2, after b1, 5d` },
  'gitGraph': { label: 'Git Graph', hint: 'gitGraph — branch history', src: `gitGraph\n    commit\n    commit\n    branch develop\n    checkout develop\n    commit\n    commit\n    checkout main\n    merge develop` },
  'ishikawa': { label: 'Ishikawa', hint: 'ishikawa / mindmap', src: `mindmap\n  root((Problem))\n    Cause 1\n      Detail\n    Cause 2\n      Detail` },
  'journey': { label: 'Journey', hint: 'journey — user journey map', src: `journey\n    title Buying a coffee\n    section Morning\n      Arrive: 5: Me\n      Order: 4: Me\n      Pay: 3: Me, Barista\n    section Done\n      Receive coffee: 5: Me` },
  'kanban': { label: 'Kanban', hint: 'kanban', src: `kanban\n  Todo\n    [Create Task]\n  In Progress\n    [Working]` },
  'mindmap': { label: 'Mindmap', hint: 'mindmap — radial ideas', src: `mindmap\n  root((Ideas))\n    A\n      B\n      C\n    D\n      E\n      F` },
  'packet': { label: 'Packet', hint: 'packet-beta', src: `packet-beta\n  0-15: "Source Port"\n  16-31: "Destination Port"\n  32-63: "Sequence Number"\n  64-95: "Acknowledgment Number"` },
  'pie': { label: 'Pie', hint: 'pie — proportion chart', src: `pie title Browser share\n    "Chrome" : 65\n    "Safari" : 18\n    "Firefox" : 5\n    "Other" : 12` },
  'quadrant': { label: 'Quadrant', hint: 'quadrantChart — 2x2 matrix', src: `quadrantChart\n    title Reach vs. Effort\n    x-axis Low Reach --> High Reach\n    y-axis Low Effort --> High Effort\n    quadrant-1 Plan\n    quadrant-2 Skip\n    quadrant-3 Reconsider\n    quadrant-4 Do now\n    "Feature A": [0.8, 0.25]\n    "Feature B": [0.3, 0.75]` },
  'requirement': { label: 'Requirement', hint: 'requirementDiagram — req engineering', src: `requirementDiagram\n    requirement TestReq {\n      id: 1\n      text: the test req\n      risk: high\n      verifymethod: test\n    }\n    element TestEntity {\n      type: simulation\n    }\n    TestReq - satisfies -> TestEntity` },
  'sankey': { label: 'Sankey', hint: 'sankey-beta — flow magnitude', src: `sankey-beta\n    Energy, Electricity, 5\n    Electricity, Homes, 3\n    Electricity, Industry, 2\n    Energy, Transport, 4\n    Transport, Road, 3\n    Transport, Air, 1` },
  'sequence': { label: 'Sequence', hint: 'sequenceDiagram — message lifelines', src: `sequenceDiagram\n    participant Alice\n    participant Bob\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi there\n    Alice->>Bob: How are you?\n    Bob-->>Alice: Great!` },
  'state': { label: 'State', hint: 'stateDiagram-v2 — state machines', src: `stateDiagram-v2\n    [*] --> Idle\n    Idle --> Processing: event\n    Processing --> Done: success\n    Processing --> Failed: error\n    Done --> [*]\n    Failed --> [*]` },
  'timeline': { label: 'Timeline', hint: 'timeline — chronological events', src: `timeline\n    title Project history\n    section 2023\n      Q1 : Kickoff\n      Q2 : Prototype\n    section 2024\n      Q1 : Launch\n      Q2 : Scale` },
};

export const SNIPPETS = [
  {
    cat: 'Flowchart shapes', type: 'flowchart', items: [
      { name: 'Rectangle', icon: '<rect x="4" y="6" width="16" height="12"/>', text: 'id1[Node]' },
      { name: 'Rounded', icon: '<rect x="4" y="6" width="16" height="12" rx="4"/>', text: 'id1(Node)' },
      { name: 'Stadium', icon: '<rect x="4" y="6" width="16" height="12" rx="6"/>', text: 'id1([Node])' },
      { name: 'Subroutine', icon: '<rect x="4" y="6" width="16" height="12"/><line x1="7" y1="6" x2="7" y2="18"/><line x1="17" y1="6" x2="17" y2="18"/>', text: 'id1[[Node]]' },
      { name: 'Database', icon: '<path d="M4 9c0-1.7 3.6-3 8-3s8 1.3 8 3v6c0 1.7-3.6 3-8 3s-8-1.3-8-3V9z"/><path d="M4 9c0 1.7 3.6 3 8 3s8-1.3 8-3"/>', text: 'id1[(Database)]' },
      { name: 'Decision', icon: '<polygon points="12 4 20 12 12 20 4 12"/>', text: 'id1{Decision}' },
      { name: 'Circle', icon: '<circle cx="12" cy="12" r="8"/>', text: 'id1((Circle))' },
      { name: 'Asymmetric', icon: '<path d="M4 6h12l4 6-4 6H4z"/>', text: 'id1>Asymmetric]' },
      { name: 'Hexagon', icon: '<polygon points="8 6 16 6 20 12 16 18 8 18 4 12"/>', text: 'id1{{Hexagon}}' },
      { name: 'Parallelogram', icon: '<polygon points="6 6 20 6 18 18 4 18"/>', text: 'id1[/Parallelogram/]' },
      { name: 'Parallelogram reversed', icon: '<polygon points="4 6 18 6 20 18 6 18"/>', text: 'id1[\\Parallelogram\\]' },
      { name: 'Trapezoid', icon: '<polygon points="6 6 18 6 20 18 4 18"/>', text: 'id1[/Trapezoid\\]' },
      { name: 'Trapezoid reversed', icon: '<polygon points="4 6 20 6 18 18 6 18"/>', text: 'id1[\\Trapezoid/]' },
      { name: 'Double Circle', icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/>', text: 'id1(((Double Circle)))' },
    ],
  },
  {
    cat: 'Flowchart edges', type: 'flowchart', items: [
      { name: 'Arrow', icon: '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>', text: 'A --> B' },
      { name: 'Thick Arrow', icon: '<line x1="4" y1="10" x2="18" y2="10"/><line x1="4" y1="14" x2="18" y2="14"/><polyline points="14 6 20 12 14 18"/>', text: 'A ==> B' },
      { name: 'Dashed arrow', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-dasharray="4 4"/><polyline points="14 6 20 12 14 18"/>', text: 'A -.-> B' },
      { name: 'Arrow with Label', icon: '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/><rect x="10" y="9" width="4" height="6" fill="var(--bg-body)" stroke="none"/>', text: 'A -->|Label| B' },
      { name: 'Thick Arrow with Label', icon: '<line x1="4" y1="10" x2="18" y2="10"/><line x1="4" y1="14" x2="18" y2="14"/><polyline points="14 6 20 12 14 18"/><rect x="10" y="7" width="4" height="10" fill="var(--bg-body)" stroke="none"/>', text: 'A ==>|Label| B' },
      { name: 'Dashed arrow with Label', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-dasharray="4 4"/><polyline points="14 6 20 12 14 18"/><rect x="10" y="9" width="4" height="6" fill="var(--bg-body)" stroke="none"/>', text: 'A -.->|Label| B' },
    ],
  },
  {
    cat: 'Flowchart other', type: 'flowchart', items: [
      { name: 'Subgraph', icon: '<rect x="4" y="6" width="16" height="12" rx="2" stroke-dasharray="2 2"/><rect x="6" y="10" width="12" height="6" rx="1"/>', text: 'subgraph Title\n  direction TB\n  node1\nend' },
      { name: 'Add class to a node', icon: '<rect x="4" y="8" width="16" height="8" rx="2"/><circle cx="20" cy="8" r="3" fill="currentColor"/>', text: 'class id className' },
      { name: 'Add class definition', icon: '<rect x="4" y="8" width="16" height="8" rx="2" stroke-dasharray="2 2"/><circle cx="20" cy="8" r="3" fill="currentColor"/>', text: 'classDef className fill:#f9f,stroke:#333,stroke-width:4px;' },
    ],
  },
  {
    cat: 'Sequence diagram actors', type: 'sequence', items: [
      { name: 'Participant', icon: '<rect x="4" y="6" width="16" height="10" rx="2"/><path d="M12 16v4"/><path d="M8 20h8"/>', text: 'participant Name' },
      { name: 'Actor', icon: '<circle cx="12" cy="7" r="4"/><path d="M12 11v6"/><path d="M8 21l4-4 4 4"/><path d="M8 15h8"/>', text: 'actor Name' },
    ],
  },
  {
    cat: 'Sequence diagram notes', type: 'sequence', items: [
      { name: 'Note left of', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8l3-3m-3 3 3 3"/>', text: 'Note left of Name: text' },
      { name: 'Note over life line', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/>', text: 'Note over Name: text' },
      { name: 'Note right of', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8l-3-3m3 3-3 3"/>', text: 'Note right of Name: text' },
    ],
  },
  {
    cat: 'Sequence diagram messages', type: 'sequence', items: [
      { name: 'Solid Line', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2"/>', text: 'A->B: message' },
      { name: 'Dotted Line', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2" stroke-dasharray="4 4"/>', text: 'A-->B: message' },
      { name: 'Solid Line Arrow', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2"/><polyline points="14 6 20 12 14 18"/>', text: 'A->>B: message' },
      { name: 'Dotted Line Arrow', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2" stroke-dasharray="4 4"/><polyline points="14 6 20 12 14 18"/>', text: 'A-->>B: message' },
      { name: 'Solid Line Cross', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2"/><path d="M16 8l4 8M20 8l-4 8"/>', text: 'A-xB: message' },
      { name: 'Dotted Line Cross', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2" stroke-dasharray="4 4"/><path d="M16 8l4 8M20 8l-4 8"/>', text: 'A--xB: message' },
      { name: 'Solid Line Async', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2"/><path d="M16 6l4 6-4 6"/>', text: 'A-)B: message' },
      { name: 'Dotted Line Async', icon: '<line x1="4" y1="12" x2="20" y2="12" stroke-width="2" stroke-dasharray="4 4"/><path d="M16 6l4 6-4 6"/>', text: 'A--)B: message' },
    ],
  },
  {
    cat: 'Sequence diagram other', type: 'sequence', items: [
      { name: 'Loop', icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/>', text: 'loop text\n  \nend' },
      { name: 'Alt', icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 12h16"/>', text: 'alt text\n  \nelse text\n  \nend' },
      { name: 'Opt', icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/>', text: 'opt text\n  \nend' },
      { name: 'Par', icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 12h16"/>', text: 'par text\n  \nand text\n  \nend' },
      { name: 'Highlight', icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/>', text: 'rect rgb(200, 255, 200)\n  \nend' },
      { name: 'Critical Region', icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 12h16"/>', text: 'critical text\n  \noption text\n  \nend' },
      { name: 'Break', icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/>', text: 'break text\n  \nend' },
    ],
  },
];
