<script>
  import { DOMAINS } from '$lib/incidentData';

  export let year = null;
  export let yearDomain = {};
  export let x = 0;
  export let y = 0;
  export let visible = false;

  $: breakdown = year ? (yearDomain[year] || {}) : {};
  $: total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  $: rows = DOMAINS.map(d => ({ ...d, count: breakdown[d.key] || 0 })).filter(d => d.count > 0);

  $: left = Math.min(x + 16, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 300);
  $: top = Math.max(y - 20, 8);
</script>

{#if visible && year}
  <div class="tooltip" style="left: {left}px; top: {top}px;">
    <div class="tt-year">{year}</div>
    <div class="tt-total">{total} incident{total === 1 ? '' : 's'} total</div>
    <div class="tt-rows">
      {#each rows as row}
        <div class="tt-row">
          <span class="tt-dot" style="background: {row.color}"></span>
          <span class="tt-name">{row.label}</span>
          <span class="tt-count">{row.count}</span>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    background: #1a1c24;
    border: 0.5px solid var(--border2);
    border-radius: 10px;
    padding: 12px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text);
    pointer-events: none;
    z-index: 9999;
    min-width: 200px;
    max-width: 280px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .tt-year {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent);
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  .tt-total {
    color: var(--muted);
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 0.5px solid var(--border);
  }

  .tt-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 3px 0;
  }

  .tt-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .tt-name {
    flex: 1;
    color: var(--muted);
    font-size: 10px;
  }

  .tt-count {
    font-weight: 500;
    color: var(--text);
  }
</style>
