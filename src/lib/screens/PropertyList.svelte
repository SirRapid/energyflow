<script lang="ts">
  import type { Property } from '../types';
  let { properties, onopen, onnew }: {
    properties: Property[]; onopen: (id: string) => void; onnew: () => void;
  } = $props();
</script>

<section class="page">
  <header class="toolbar"><div><h1>Properties</h1><p>Choose a property to open its flow.</p></div>
    <button class="primary" onclick={onnew}>New property</button>
  </header>
  <div class="property-list">
    {#each properties as property (property.id)}
      <article class="property-row">
        <button class="property-open" onclick={() => onopen(property.id)}>{property.name}</button>
        <details class="settings">
          <summary aria-label={`Settings for ${property.name}`}>Settings</summary>
          <div class="menu">
            <button disabled>Rename — coming later</button>
            <button disabled>Save as template — coming later</button>
            <button disabled>Delete — coming later</button>
          </div>
        </details>
      </article>
    {/each}
  </div>
</section>
