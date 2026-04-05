<script>
  import { DOMAINS } from '$lib/incidentData';
  import { createEventDispatcher } from 'svelte';

  export let hidden = new Set();
  const dispatch = createEventDispatcher();

  function toggle(key) {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    dispatch('change', next);
  }
</script>

<div class="legend">
  {#each DOMAINS as d}
    <button
      class="legend-item"
      class:faded={hidden.has(d.key)}
      on:click={() => toggle(d.key)}
      type="button"
    >
      <span class="swatch" style="background: {d.color}"></span>
      {d.label}
    </button>
  {/each}
</div>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
    padding: 0.75rem 0 0.25rem;
    border-top: 0.5px solid var(--border);
    margin-top: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.04em;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    transition: color 0.15s, opacity 0.15s;
  }

  .legend-item:hover {
    color: var(--text);
  }

  .legend-item.faded {
    opacity: 0.35;
  }

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
</style>
