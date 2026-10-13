<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import NodeShell from './NodeShell.svelte';
  let { id, data }: NodeProps = $props();
</script>

<NodeShell {id} label={String(data.label ?? 'Node')}>
<section class="node-content">
  <h3>{String(data.label ?? 'Node')}</h3>
  <p>{String(data.description ?? '')}</p>
</section>
</NodeShell>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
