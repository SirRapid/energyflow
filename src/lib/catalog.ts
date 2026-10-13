import type { Property, Template, NodeDefinition } from './types';

// Mock data only. Replace with API responses later.
export const properties: Property[] = [
  { id: 'demo', name: 'Demo property', flow: {
    nodes: [{ id: 'equipment-1', type: 'card', position: { x: 100, y: 100 },
      data: { label: 'Equipment', description: 'Example saved node', definitionId: 'equipment' } }],
    edges: [],
  } },
];

export const templates: Template[] = [
  { id: 'blank', name: 'Blank flow', source: 'Built-in', flow: { nodes: [], edges: [] } },
  { id: 'audit', name: 'Energy audit starter', source: 'Built-in', flow: {
    nodes: [{ id: 'audit-1', type: 'card', position: { x: 100, y: 100 },
      data: { label: 'Energy audit', description: 'Template placeholder', definitionId: 'audit' } }],
    edges: [],
  } },
];

export const nodeCatalog: NodeDefinition[] = [
  { id: 'file-bank', name: 'File Bank', source: 'Built-in',
    description: 'Keep property files together.', nodeType: 'fileBank',
    initialData: { files: [] }, width: 560, height: 320 },
  { id: 'equipment', name: 'Equipment', source: 'Built-in', description: 'Equipment inputs will go here.' },
  { id: 'calculation', name: 'Calculation', source: 'Built-in', description: 'Calculation settings will go here.' },
  { id: 'report', name: 'Report', source: 'Built-in', description: 'Report output will go here.' },
  { id: 'custom-example', name: 'Custom node example', source: 'Custom', description: 'Your custom node placeholder.' },
];
