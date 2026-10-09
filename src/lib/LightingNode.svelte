<script lang="ts">
  import type { NodeProps } from "@xyflow/svelte";

  let {}: NodeProps = $props();

  let watts = $state<number | undefined>(60);
  let fixtures = $state<number | undefined>(100);
  let hours = $state<number | undefined>(3000);

  let valid = $derived(
    watts !== undefined &&
      Number.isFinite(watts) &&
      watts >= 0 &&
      fixtures !== undefined &&
      Number.isInteger(fixtures) &&
      fixtures > 0 &&
      hours !== undefined &&
      Number.isFinite(hours) &&
      hours >= 0 &&
      hours <= 8784,
  );

  let annualKwh = $derived(valid ? (watts! * fixtures! * hours!) / 1000 : null);
</script>

<section class="calculator">
  <h2>Lighting energy use</h2>

  <div class="nodrag nowheel">
    <label>
      Power per fixture (W)
      <input type="number" min="0" step="any" bind:value={watts} />
    </label>

    <label>
      Number of fixtures
      <input type="number" min="1" step="1" bind:value={fixtures} />
    </label>

    <label>
      Operating hours per year
      <input type="number" min="0" max="8784" step="any" bind:value={hours} />
    </label>
  </div>

  <div class="result" aria-live="polite">
    {#if annualKwh !== null}
      <strong>
        {annualKwh.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}
      </strong>
      <span>kWh/year</span>
    {:else}
      <span>Enter valid values in all three fields.</span>
    {/if}
  </div>
</section>
