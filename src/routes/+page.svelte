<script>
  import '../app.css';
  import { onMount, tick } from 'svelte';
  import { loadData, DOMAINS } from '$lib/incidentData';
  import StatCard from '$lib/incidentStatCard.svelte';
  import Legend from '$lib/incidentLegend.svelte';
  import IncidentChart from '$lib/IncidentChart.svelte';
  import Tooltip from '$lib/incidentTooltip.svelte';
  import Scroller from '$lib/scoller.svelte';
  import Step from '$lib/step.svelte';
  import { color } from 'chart.js/helpers';

  // ── Data ──────────────────────────────────────────────────────────────────
  let years = [];
  let yearDomain = {};
  let totalRows = 0;
  let loading = true;

  // ── Chart state (driven by scroll) ────────────────────────────────────────
  let activeChart = 'incidents'; // sets incidents chart as intial chart
  let mode = 'bar';
  let hidden = new Set();
  let isTransitioning = false;
  let currentStep = -1;

  // ── Tooltip state ─────────────────────────────────────────────────────────
  let ttVisible = false;
  let ttYear = null;
  let ttX = 0;
  let ttY = 0;

  // ── Derived stats ─────────────────────────────────────────────────────────
  $: totalIncidents = Object.values(yearDomain).reduce(
    (s, v) => s + Object.values(v).reduce((a, b) => a + b, 0), 0
  );
  $: peakYear = years.reduce((best, y) => {
    const t = Object.values(yearDomain[y] || {}).reduce((a, b) => a + b, 0);
    return t > (best.count || 0) ? { year: y, count: t } : best;
  }, {});
  $: yearRange = years.length ? `${years[0]}–${years[years.length - 1]}` : '—';
  $: classifiedCount = Object.values(yearDomain).reduce((s, v) => {
    return s + Object.entries(v).filter(([k]) => k !== 'NA').reduce((a, [, n]) => a + n, 0);
  }, 0);

  // ── Step config ───────────────────────────────────────────────────────────
  // Each entry defines exactly what the chart should show when that step is active.
  // To add a new chart: add a step with `chart: 'myChart'` and add the corresponding
  // {:else if activeChart === 'myChart'} block in the graphic slot below.
  const STEPS = [
    {
      chart: 'incidents',
      mode: 'bar',
      hidden: new Set(),
      title: 'The rise of AI incidents',
      body: 'Since 2008, documented instances of AI-related harms have grown year on year, dramatically so over since the release of large language models like OpenAI\'s ChatGPT, Google\'s Gemini and Anthropic\'s Claude in the early 2020s. <br><br><br> <i>Each bar represents the number of AI harm incidents recorded in the AI Incident Database during that year. Hover over each bar to see a breakdown those incidients using the MIT Risk Repository classification system</i>.',
    },
    {
      chart: 'incidents',
      mode: 'stacked',
      hidden: new Set(DOMAINS.map(d => d.key).filter(k => k !== '1. Discrimination and Toxicity')),
      title: 'Automated discrimination; early and often',
      color: DOMAINS.find(d => d.key === '1. Discrimination and Toxicity').color,
      body: '<strong>Discrimination & Toxicity</strong> was the most common type of harm athroughout the first years of reports documented in the AI Incident Database and continues to this day. These harms include racial bias in search results, unfair hiring tools, and content recommendation systems designed to prioritize toxic content and hate to its users. <br><br>Importantly, while these harms happen when AI technologies impact our lives, these systems do not magickly pop into existence devoid of influence from the humans who created them. AI systems reflect our biases, stereotypes, blind-spots and ignorances just like any other form of technology.<br><br><br> <i>You can click on the categories in the legend below the bar chart to explore other classifications of AI harms as well</i>.',
    },
/*     {
      chart: 'incidents',
      mode: 'stacked',
      hidden: new Set(DOMAINS.map(d => d.key).filter(k => k !== '2. Privacy & Security')),
      title: 'Privacy concerns compound',
      color: DOMAINS.find(d => d.key === '2. Privacy & Security').color,
      body: '<strong>Privacy & Security</strong> incidents have climbed steadily as AI systems process ever-larger volumes of personal data, and begin to be used commercially for tasks from facial recognition in policing to personalized health rommendation systems and beyond.',
    }, */
    {
      chart: 'incidents',
      mode: 'line',
      hidden: new Set(DOMAINS.map(d => d.key).filter(k =>
        !['7. AI system safety, failures, and limitations', '4. Malicious Actors & Misuse'].includes(k)
      )),
      title: 'Safety failures and malicous use surges',
      body: 'After 2019, <strong style="color: #2dcca0;}">AI System Safety failures</strong> and <strong style="color: #e24b4a;}">Malicious Actors & Misuse</strong> have accelerated sharply in the wake of the introduction of publicly available large language models and generative AI tools.<br><br>This new era of rapid genAI adoption has so far seen a similarly rapid rise in unintentional harms from poor system design. These genAI tools have also simulatenously empowered bad actors all over the world to wreak harm upon their fellow human beings with seemingly little to no consequences.<br><br><br> <i>You can click on the categories in the legend below the bar chart to explore other classifications of AI harms as well</i>.',
    },
/*     {
      chart: 'incidents',
      mode: 'total',
      hidden: new Set(),
      title: 'The full picture',
      body: 'Taken together, the total incident count has roughly <strong>doubled every two years</strong> since 2015. Unclassified incidents in the most recent years reflect ongoing classification work.',
    }, */
    // ── Add future steps here ─────────────────────────────────────────────
    // {
    //   chart: 'heatmap',
    //   title: 'A different lens',
    //   body: 'Looking at the same data as a heatmap reveals...',
    // },
  ];

  // ── Scroll handler ────────────────────────────────────────────────────────
  async function handleStepEnter({ detail }) {
    const { index } = detail;
    currentStep = index;
    const step = STEPS[index];
    if (!step) return;

    // Fade out briefly if swapping to a different chart component
    if (step.chart !== activeChart) {
      isTransitioning = true;
      await tick();
      await new Promise(r => setTimeout(r, 200));
    }

    activeChart = step.chart;
    if (step.mode   !== undefined) mode   = step.mode;
    if (step.hidden !== undefined) hidden = step.hidden;

    isTransitioning = false;
  }

  function handleStepExit({ detail }) {
    if (detail.index === 0 && detail.direction === 'up') {
      currentStep = -1;
    }
  }

  // ── Chart event handlers ──────────────────────────────────────────────────
  function handleHover(e) {
    const { visible, year, x, y } = e.detail;
    ttVisible = visible;
    ttYear = year ?? ttYear;
    ttX = x ?? ttX;
    ttY = y ?? ttY;
  }

  function handleMousemove(e) {
    if (ttVisible) { ttX = e.clientX; ttY = e.clientY; }
  }

  function handleLegendChange(e) {
    hidden = e.detail;
  }

  // ── Data load ─────────────────────────────────────────────────────────────
  onMount(async () => {
    const data = await loadData();
    years = data.years;
    yearDomain = data.yearDomain;
    totalRows = data.total;
    loading = false;
  });
</script>

<svelte:window on:mousemove={handleMousemove} />

<!-- Page Layout -->
<div class="page">

  <!-- Full-width header -->
  <header>
    <h1>Who Says <span>It's Fair?</span></h1>
    <p class="subtitle">
      A look at how AI "fairness" is determined.
    </p>
  </header>

  {#if loading}
    <div class="loading">
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
    </div>
  {:else}

   <!--- Intro section -->
   <div class="intro">
    <h2>What's Happening Now</h2>
    <p>
        As AI and other prediction-baesd technologies have been rapidly incorporated into nearly every industry and aspect of life we often see scifi-esque speculation about "AIs evolving beyond human control" or disucssions of the "extistential threat" that AI will pose in the at some unspecified point in our future.
        <br><br>
        However, despite the seeming urgence of these concerns, what is rarely talked about in these discussions of the dangers of AI are the <strong style="color: #e05c8a;">real harms</strong> that these technologies are causing <strong style="color: #e05c8a;">right now</strong>.
        <br><br>
    </p>
    <br>
   </div> 

   <div></div>

   <div class="eyebrow">The AI <span>Incident Database</span></div>

    <!-- Summary stats above scroll section -->
    <div class="stats-row">
      <StatCard label="Total Incidents" value={totalIncidents.toLocaleString()} />
      <StatCard label="Years Covered"   value={yearRange} />
      <StatCard label="Peak Year"       value={String(peakYear.year ?? '—')} />
      <StatCard label="MIT Classified"  value={classifiedCount.toLocaleString()} />
    </div>

    <!-- Scrollytelling section -->
    <Scroller offset={0.5} on:stepenter={handleStepEnter} on:stepexit={handleStepExit}>

      <!-- LEFT: sticky graphic panel -->
      <div slot="graphic" class="graphic-inner" class:transitioning={isTransitioning}>

        {#if activeChart === 'incidents'}
          {#if mode === 'bar' || mode === 'stacked'}
            <div class="chart-toggle">
              <button class:active={mode === 'bar'} on:click={() => mode = 'bar'}>Total</button>
              <button class:active={mode === 'stacked'} on:click={() => mode = 'stacked'}>By domain</button>
            </div>
          {/if}
          <IncidentChart
            {years}
            {yearDomain}
            {mode}
            {hidden}
            on:hover={handleHover}
          />
          <Legend {hidden} on:change={handleLegendChange} />

        <!-- Future charts slot in here, e.g.:
        {:else if activeChart === 'heatmap'}
          <HeatmapChart {years} {yearDomain} />
        -->

        {/if}
      </div>

      <!-- RIGHT: narrative steps -->
      <div slot="steps">
        {#each STEPS as step, i}
          <Step index={i} active={currentStep === i}>
            <h2>{step.title}</h2>
            <p style="{step.color ? '--strong-color: ' + step.color : undefined}">{@html step.body}</p>
          </Step>
        {/each}
      </div>

    </Scroller>

    <footer>
      <span>Source: MIT AI Incident Database · MIT Risk Classification</span>
      <span>{totalRows.toLocaleString()} records loaded</span>
    </footer>

  {/if}
</div>

<!-- Tooltip lives outside the scroll layout so it's never clipped -->
<Tooltip year={ttYear} {yearDomain} x={ttX} y={ttY} visible={ttVisible} />

<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 3rem 2rem 4rem;
  }

  header {
    margin-bottom: 2.5rem;
    border-bottom: 0.5px solid var(--border);
    padding-bottom: 2rem;
  }

  .eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.75rem;
  }

  h1 {
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    color: var(--text);
    margin-bottom: 0.75rem;
  }

  h1 :global(span) {
    color: var(--accent);
  }

  .subtitle {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
    max-width: 560px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 2.5rem;
  }

  .graphic-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: opacity 0.2s ease;
  }

  .chart-toggle {
    display: flex;
    gap: 4px;
    margin-bottom: 0.75rem;
    align-self: flex-end;
  }

  .chart-toggle button {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .chart-toggle button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .chart-toggle button.active {
    background: rgba(201, 240, 255, 0.1);
    border-color: var(--accent);
    color: var(--accent);
  }

  .graphic-inner.transitioning {
    opacity: 0;
  }

  footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 0.5px solid var(--border);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.06em;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .loading {
    display: flex;
    gap: 8px;
    justify-content: center;
    padding: 4rem;
  }

  .loading-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.4;
    animation: pulse 1.2s ease-in-out infinite;
  }

  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes pulse {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.1); }
  }
</style>
