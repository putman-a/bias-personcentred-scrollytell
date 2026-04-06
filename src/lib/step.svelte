<!--
  step.svelte
  -----------
  A single narrative step card. Must keep class="step" on the root
  element so Scrollama can find it via `.step` selector.

  Props:
    index   — step number (shown as a small badge)
    active  — whether this is the current step (highlighted border)
-->
<script>
  export let index = 0;
  export let active = false;
</script>

<div class="step" class:active data-step={index}>
  <div class="step-index">{String(index + 1).padStart(2, '0')}</div>
  <div class="step-content">
    <slot />
  </div>
</div>

<style>
  .step {
    min-height: 50vh; /* minimum height is 50% of view height */
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 2rem 1.5rem;
    margin-bottom: 1.5rem;
    background: var(--surface);
    border: 0.5px solid var(--border);
    border-radius: 12px;
    transition: border-color 0.3s ease, background 0.3s ease;
  }

  .step.active {
    border-color: rgba(201, 240, 255, 0.25);
    background: var(--surface2);
  }

  .step-index {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.1em;
    padding-top: 3px;
    flex-shrink: 0;
    width: 28px;
  }

  .step.active .step-index {
    color: var(--accent);
  }

  .step-content {
    flex: 1;
  }

  .step-content :global(h2) {
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text);
    margin-bottom: 0.6rem;
    line-height: 1.3;
  }

  .step-content :global(p) {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.7;
    margin-bottom: 0.5rem;
  }

  .step-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .step-content :global(strong) {
    color: var(--strong-color, var(--text));
    font-weight: 600;
  }
</style>
