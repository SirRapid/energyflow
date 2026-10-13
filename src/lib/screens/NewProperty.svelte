<script lang="ts">
  import type { Template } from '../types';
  let { templates, oncreate, onback }: {
    templates: Template[]; oncreate: (name: string, template: Template) => void; onback: () => void;
  } = $props();
  let name = $state('');
</script>

<section class="page">
  <header class="toolbar"><h1>New property</h1><button onclick={onback}>Back</button></header>
  <label>Property name<input bind:value={name} placeholder="e.g. Office building" /></label>
  <p>Start blank or choose a template. Existing properties are also available as starting points.</p>
  {#each ['Built-in', 'My flows'] as source}
    <h2>{source}</h2>
    <div class="choice-grid">
      {#each templates.filter(template => template.source === source) as template (template.id)}
        <button class="choice" disabled={!name.trim()} onclick={() => oncreate(name.trim(), template)}>
          <strong>{template.name}</strong><span>Use this starting point</span>
        </button>
      {/each}
    </div>
  {/each}
</section>
