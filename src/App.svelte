<script lang="ts">
  import {
    SvelteFlow,
    Background,
    Controls,
    type Node,
    type Edge,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import LightingNode from "./lib/LightingNode.svelte";

  const nodeTypes = {
    lighting: LightingNode,
  };

  let nodes = $state.raw<Node[]>([
    {
      id: "lighting-1",
      type: "lighting",
      position: { x: 0, y: 0 },
      data: {},
    },
  ]);

  let edges = $state.raw<Edge[]>([]);
</script>

<main>
  <SvelteFlow bind:nodes bind:edges {nodeTypes} fitView maxZoom={1.5}>
    <Background />
    <Controls />
  </SvelteFlow>
</main>

<style>
  :global(html),
  :global(body),
  :global(#app) {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  main {
    width: 100vw;
    height: 100dvh;
  }
</style>
