import type { Node, Edge } from '@xyflow/svelte';

export type Flow = { nodes: Node[]; edges: Edge[] };
export type Property = { id: string; name: string; flow: Flow };
export type Template = { id: string; name: string; source: 'Built-in' | 'My flows'; flow: Flow };
export type NodeDefinition = { id: string; name: string; source: 'Built-in' | 'Custom'; description: string; nodeType?: string; initialData?: Record<string, unknown>; width?: number; height?: number };

// File objects are temporary browser storage. Replace with server file IDs later.
export type BankFile = {
  id: string;
  file: File;
  addedAt: string;
  folderId?: string | null;
};

export type BankFolder = {
  id: string;
  name: string;
  parentId: string | null;
  addedAt: string;
};
