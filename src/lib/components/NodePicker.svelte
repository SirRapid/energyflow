<script lang="ts">
  import type { NodeDefinition } from '../types';
  let { catalog, onchoose, onclose }: {
    catalog: NodeDefinition[]; onchoose: (node: NodeDefinition) => void; onclose: () => void;
  } = $props();
</script>

<aside class="node-picker" aria-label="Add a node">
  <header class="toolbar"><h2>Add a node</h2><button onclick={onclose}>Close</button></header>
  {#each ['Built-in', 'Custom'] as source}
    <h3>{source}</h3>
    {#each catalog.filter(node => node.source === source) as node (node.id)}
      <button class="choice" onclick={() => onchoose(node)}>
        <strong>{node.name}</strong><span>{node.description}</span>
      </button>
    {/each}
  {/each}
</aside>
