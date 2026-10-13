<script lang="ts">
  import { untrack } from "svelte";
  import {
    SvelteFlow,
    Background,
    Controls,
    type Node,
    type Edge,
  } from "@xyflow/svelte";
  import FlowNode from "../components/FlowNode.svelte";
  import FileBankNode from "../components/FileBankNode.svelte";
  import NodePicker from "../components/NodePicker.svelte";
  import { nodeCatalog } from "../catalog";
  import type { Flow, NodeDefinition } from "../types";

  let {
    name,
    flow,
    onback,
  }: { name: string; flow: Flow; onback: (flow: Flow) => void } = $props();
  // Each canvas mounts fresh; App retains its working copy when Back is clicked.
  let nodes = $state.raw<Node[]>(untrack(() => structuredClone(flow.nodes)));
  let edges = $state.raw<Edge[]>(untrack(() => structuredClone(flow.edges)));
  let pickerOpen = $state(false);
  const nodeTypes = { card: FlowNode, fileBank: FileBankNode };

  function addNode(definition: NodeDefinition) {
    nodes = [
      ...nodes,
      {
        id: crypto.randomUUID(),
        type: definition.nodeType ?? "card",
        width: definition.width,
        height: definition.height,
        position: { x: 100 + nodes.length * 40, y: 100 + nodes.length * 40 },
        data: {
          ...structuredClone(definition.initialData ?? {}),
          label: definition.name,
          description: definition.description,
          definitionId: definition.id,
        },
      },
    ];
    pickerOpen = false;
  }
</script>

<section class="canvas-screen">
  <header class="toolbar canvas-toolbar">
    <div class="toolbar">
      <button onclick={() => onback({ nodes, edges })}>Properties</button>
      <h1>{name}</h1>
    </div>
    <button
      class="primary"
      aria-label="Add node"
      onclick={() => (pickerOpen = !pickerOpen)}>＋ Add node</button
    >
  </header>
  <div class="canvas">
    <SvelteFlow bind:nodes bind:edges {nodeTypes} fitView>
      <Background /><Controls />
    </SvelteFlow>
  </div>
  {#if pickerOpen}
    <NodePicker
      catalog={nodeCatalog}
      onchoose={addNode}
      onclose={() => (pickerOpen = false)}
    />
  {/if}
</section>
