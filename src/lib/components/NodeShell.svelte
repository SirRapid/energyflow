<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { useNodes, useSvelteFlow } from '@xyflow/svelte';

  let { id, label = 'Node', children }: { id: string; label?: string; children: Snippet } = $props();
  const nodes = useNodes();
  const { getNode, deleteElements } = useSvelteFlow();
  let menu: HTMLDivElement;
  let optionsDialog: HTMLDialogElement;
  let menuX = $state(0);
  let menuY = $state(0);

  async function openMenu(event: MouseEvent) {
    const bounds = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
    menuX = Math.max(8, Math.min(bounds.right - 180, window.innerWidth - 188));
    menuY = Math.max(8, Math.min(bounds.bottom + 4, window.innerHeight - 152));
    await tick();
    menu.showPopover();
    menu.querySelector('button')?.focus();
  }

  function duplicateNode() {
    const node = getNode(id);
    menu.hidePopover();
    if (!node) return;
    const copy = {
      ...node,
      id: crypto.randomUUID(),
      data: structuredClone(node.data),
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
      dragging: false,
    };
    nodes.update(current => [...current, copy]);
  }

  async function deleteNode() {
    menu.hidePopover();
    await deleteElements({ nodes: [{ id }] });
  }
</script>

<div class="node-shell">
  <header class="node-tools">
    <button class="node-menu-button nodrag nopan" aria-label={`Node menu for ${label}`} aria-haspopup="true" title="Node menu" onclick={openMenu}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h12" />
      </svg>
    </button>
  </header>
  <div class="node-body">{@render children()}</div>
</div>

<div bind:this={menu} popover="auto" class="node-menu nodrag nopan nowheel" style:left={`${menuX}px`} style:top={`${menuY}px`} aria-label="Node actions">
  <button onclick={duplicateNode}>Duplicate</button>
  <button onclick={() => { menu.hidePopover(); optionsDialog.showModal(); }}>Options</button>
  <button class="danger" onclick={deleteNode}>Delete</button>
</div>

<dialog bind:this={optionsDialog} class="node-options nodrag nopan nowheel" aria-labelledby={`node-options-${id}`}>
  <h2 id={`node-options-${id}`}>Node options</h2>
  <p>{label}</p>
  <!-- Add node-specific settings here later. -->
  <p>Options will be available here.</p>
  <button onclick={() => optionsDialog.close()}>Close</button>
</dialog>

<style>
  .node-shell { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; border-radius: inherit; }
  .node-tools { display: flex; justify-content: flex-end; flex-shrink: 0; padding: 4px 8px; }
  .node-menu-button { display: grid; place-items: center; width: 28px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: #526575; }
  .node-menu-button:hover { background: #eaf6f2; color: var(--accent, #0f766e); }
  .node-body { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  .node-menu { position: fixed; margin: 0; width: 180px; padding: 6px; border: 1px solid var(--border, #d5dfe6); border-radius: 10px; background: white; color: #193344; box-shadow: 0 8px 32px #19334426; }
  .node-menu button { display: block; width: 100%; border: 0; padding: 10px; text-align: left; font-size: 13px; }
  .node-menu .danger { color: #b42318; }
  .node-options { width: min(380px, calc(100vw - 32px)); padding: 24px; border: 1px solid var(--border, #d5dfe6); border-radius: 14px; color: #193344; }
  .node-options::backdrop { background: #19334455; }
</style>
