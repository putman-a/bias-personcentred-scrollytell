<!--
  PhotoScroller.svelte
  --------------------
  Full-bleed photo (or gradient placeholder) scrollytelling section.
  Each step gets a sticky background that crossfades as the user scrolls.
  Text cards float at the bottom-center of the viewport over the image.

  Props:
    steps  — array of { label, title, body, photo }
             photo: URL string, or null to use the built-in gradient placeholder
-->
<script>
  import { onMount, onDestroy } from 'svelte';
  import scrollama from 'scrollama';

  export let steps = [];

  let activeIndex = 0;
  let scroller;

  // Placeholder gradients used when step.photo is null
  const GRADIENTS = [
    'linear-gradient(160deg, #072535 0%, #0d4a5e 45%, #071e2e 100%)',
    'linear-gradient(160deg, #2e1205 0%, #6b3a10 45%, #1e0c03 100%)',
    'linear-gradient(160deg, #130828 0%, #3a1060 45%, #0c0620 100%)',
  ];

  onMount(() => {
    scroller = scrollama();
    scroller
      .setup({ step: '.photo-step', offset: 0.6 })
      .onStepEnter(({ index }) => { activeIndex = index; })
      .onStepExit(({ index, direction }) => {
        if (index === 0 && direction === 'up') activeIndex = 0;
      });

    const onResize = () => scroller.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  onDestroy(() => { if (scroller) scroller.destroy(); });
</script>

<div class="photo-scroll-section">

  <!-- Sticky full-bleed background — lives behind the steps via margin-bottom trick -->
  <div class="sticky-bg" aria-hidden="true">
    {#each steps as step, i}
      <div
        class="bg-layer"
        class:active={activeIndex === i}
        style="background: {step.photo
          ? `url('${step.photo}') center / cover no-repeat`
          : GRADIENTS[i % GRADIENTS.length]}"
      ></div>
    {/each}
    <!-- Bottom scrim so cards are always readable -->
    <div class="bg-scrim"></div>
  </div>

  <!-- Scrolling step cards (overlay the sticky bg) -->
  <div class="photo-steps">
    {#each steps as step, i}
      <div class="photo-step">
        <div class="photo-card" class:active={activeIndex === i}>
          <span class="person-label">{step.label}</span>
          {#if step.title}<h2>{step.title}</h2>{/if}
          <p>{@html step.body}</p>
        </div>
      </div>
    {/each}
  </div>

</div>

<style>
  /* ── Section wrapper ─────────────────────────────────────────── */
  .photo-scroll-section {
    position: relative;
    /* Break out of any parent max-width container to go full-bleed */
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    width: 100vw;
  }

  /* ── Sticky background ───────────────────────────────────────── */
  .sticky-bg {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 100%;
    /* Negative margin collapses its flow height so steps start at the same position */
    margin-bottom: -100vh;
    overflow: hidden;
    z-index: 0;
  }

  .bg-layer {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.7s ease;
    background-size: cover;
    background-position: center;
  }

  .bg-layer.active {
    opacity: 1;
  }

  /* Gradient scrim — darkens toward the bottom for card legibility */
  .bg-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(13, 14, 17, 0.15) 0%,
      rgba(13, 14, 17, 0.2)  40%,
      rgba(13, 14, 17, 0.72) 72%,
      rgba(13, 14, 17, 0.92) 100%
    );
    z-index: 1;
  }

  /* ── Scrolling steps ─────────────────────────────────────────── */
  .photo-steps {
    position: relative;
    z-index: 1;
  }

  .photo-step {
    min-height: 100vh;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0 1rem 8vh;
  }

  /* ── Text card ───────────────────────────────────────────────── */
  .photo-card {
    width: min(680px, 90vw);
    background: rgba(16, 18, 24, 0.80);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 1.75rem 2.25rem;
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.45s ease, transform 0.45s ease;
  }

  .photo-card.active {
    opacity: 1;
    transform: translateY(0);
  }

  .person-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    display: block;
    margin-bottom: 0.5rem;
  }

  .photo-card h2 {
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text);
    margin-bottom: 0.65rem;
    line-height: 1.25;
  }

  .photo-card p {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.7;
    margin: 0;
  }

  /* ── Mobile ──────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .photo-step {
      padding-bottom: 5vh;
    }

    .photo-card {
      padding: 1.4rem 1.5rem;
    }
  }
</style>
