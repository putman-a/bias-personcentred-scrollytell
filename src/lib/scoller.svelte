<!--
  Scroller.svelte
  ---------------
  A thin Scrollama wrapper. Renders two named slots:
    <div slot="graphic"> — the sticky left panel
    <div slot="steps">   — the scrolling right steps (each child must have class="step")

  Emits:
    on:stepenter  → { index, element, direction }
    on:stepexit   → { index, element, direction }
-->
<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import scrollama from 'scrollama';

  /** How far down the viewport (0–1) the trigger fires */
  export let offset = 0.5;
  /** Show the trigger line (useful during development) */
  export let debug = false;

  const dispatch = createEventDispatcher();

  let stepsEl;
  let scroller;

  onMount(() => {
    scroller = scrollama();
    scroller
      .setup({
        step: '.step',
        offset,
        debug,
      })
      .onStepEnter((response) => dispatch('stepenter', response))
      .onStepExit((response) => dispatch('stepexit', response));

    const onResize = () => scroller.resize();
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  });

  onDestroy(() => {
    if (scroller) scroller.destroy();
  });
</script>

<div class="scroll-root">
  <!-- Sticky graphic panel -->
  <div class="sticky-graphic">
    <slot name="graphic" />
  </div>

  <!-- Scrolling narrative steps -->
  <div class="scroll-steps" bind:this={stepsEl}>
    <slot name="steps" />
  </div>
</div>

<style>
  .scroll-root {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    position: relative;
  }

  .sticky-graphic {
    position: sticky;
    top: 2rem;
    width: 58%;
    height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
    transition: opacity 0.25s ease;
  }

  .scroll-steps {
    width: 42%;
    /* top/bottom padding so first and last steps trigger at centre-screen */
    padding: 50vh 0 50vh;
  }

  /* ── Mobile: stack vertically ── */
  @media (max-width: 768px) {
    .scroll-root {
      flex-direction: column;
      gap: 0;
    }

    .sticky-graphic {
      position: sticky;
      top: 0;
      width: 100%;
      height: 48vh;
      z-index: 10;
      /* slight shadow so steps slide under cleanly */
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    }

    .scroll-steps {
      width: 100%;
      padding: 2rem 0 50vh;
    }
  }
</style>
