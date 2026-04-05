<script>
  export let label = '';
  export let value = '';
</script>

<div class="stat-card">
  <div class="label">{label}</div>
  <div class="value">{value}</div>
</div>

<style>
  .stat-card {
    background: var(--surface);
    border: 0.5px solid var(--border);
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }

  .label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
  }

  .value {
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--accent);
  }
</style>
