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
  import PhotoScroller from '$lib/PhotoScroller.svelte';
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
      body: 'Since 2008, documented instances of AI-related harms have grown year-on-year. Dramatically so since the release of large language models like OpenAI\'s ChatGPT, Google\'s Gemini and Anthropic\'s Claude in the early 2020s. <br><br><br> <i>Each bar represents the number of AI harm incidents recorded in the <a href="https://incidentdatabase.ai/" style="color: #9b7fe8">AI Incident Database</a> during that year. <br><br>  <i>Hover over each bar to see a breakdown those incidents using the <a href="https://airisk.mit.edu/ai-incident-tracker" style="color: #9b7fe8">MIT Risk Repository</a> classification system.</i> <br><br> <b>Note:</b> the high number of unclassified incidents in 2025 is reflective of the MIT classification system having not processed many of those incidents yet.</i> ',
    },
    {
      chart: 'incidents',
      mode: 'stacked',
      hidden: new Set(DOMAINS.map(d => d.key).filter(k => k !== '1. Discrimination and Toxicity')),
      title: 'Automated discrimination; early and often',
      color: DOMAINS.find(d => d.key === '1. Discrimination and Toxicity').color,
      body: '<strong>Discrimination & Toxicity</strong> was the most common type of harm throughout the first years of reports documented in the AI Incident Database and has not slowed down since. These harms include racial bias in search results, unfair hiring tools, and content recommendation systems designed to prioritize toxic content and hate to its users. <br><br> Importantly, while these harms happen when AI technologies impact our lives, these systems do not magically pop into existence devoid of influence from the humans who created them. AI systems reflect our biases, stereotypes, blind-spots, and ignorances just like any other form of technology. <br><br><br> <i>You can click on the categories in the legend below the bar chart to explore other classifications of AI harms.</i>',
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
      title: 'Safety failures and malicious use surges',
      body: 'After 2019, <strong style="color: #2dcca0;}">AI System Safety failures</strong> and <strong style="color: #e24b4a;}">Malicious Actors & Misuse</strong> incidents have accelerated sharply in the wake of the introduction of publicly available large language models and generative AI tools. <br><br> This new era of rapid genAI adoption has so far seen a similarly rapid rise in unintentional harms from poor system design. These genAI tools have also simultaneously empowered bad actors all over the world to wreak harm upon their fellow humans with seemingly little to no consequences. <br><br><br> <i>You can click on the categories in the legend below the line chart to explore other classifications of AI harms.</i>',
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

  // ── Case studies ──────────────────────────────────────────────────────────
  const CASE_STUDIES = [
    {
      label: 'Searching for his first "real" job',
      title: 'Amir',
      body: 'Amir has recently graduated from university with a bachelor\'s of commerce and is looking to get his start in industry and be able to better support his mother as she reaches retirement as well as his future kids - he hopes to have 3. <br><br> Amir knows the job market is particularly tough for new grads right now, and has heard from his friends that the AI resume screening tools that many companies aren\'t exactly fair. In fact his friend Sayan told him that she only started getting interviews after changing her name on her resume to Sarah. She said that once you get an interview everything is just fine, but that gaming the resume screening AI by pretending to seem more "white" is "just what you have to do" to get an interview nowadays. <br><br> Amir feels strongly that no company in 2026 would really use such a system. And even if they did, that would definitely not be the type of company that <i>he</i> would want to work for. At the same time he is really starting to feel anxious about his lack of interview offers...',
      photo: null,
    },
    {
      label: 'Keeping his head above water in a torrent of job applications',
      title: 'Joel',
      body: 'Joel is in his 40s and left his previous position to become the HR manager of a brand new financial firm for just over 3 years ago. The company now has more than 50 employees and Joel is really loving working for a company where he knows everybody\'s name. Joel takes special pride in the new grads he hires, seeing them grow into the professionals he saw in them when he interviewed them. But handling HR and finding new candidates in today\'s job landscape is no easy task. <br><br> Joel cares deeply about fair hiring practices, inspired greatly by his aunt who was a human rights lawyer. He learned from her all about how biases and stereotypes can subconsciously influence a person\'s decision-making, and this knowledge sparked his interested in AI resume sorting systems in the first place. <br><br> In the mid 2010s the first commercially available AI resume filtering systems were being sold as a way to "remove the human bias" from the screening process. While Joel had quickly grown disillusioned by the reality of these so-called "human bias-free" AI systems, he also saw the potential for these tools as a way to help navigate the seemingly endless number of applications that companies were receiving - last month alone he had received more than 8,000 resumes for just 3 positions! <br><br> After all, if Joel made sure he was being really diligent in not letting his pre-existing biases influence his hiring decisions, surely that could make up for the AI\'s limitations... especially considering the alternative of not having the time to even look at most of the resumes he received!',
      photo: null,
    },
    {
      label: 'Concerned AI researcher',
      title: 'Katya',
      body: 'Katya, a scientist in her early 30s, earned her PhD studying advanced algorithm design. She has prided herself in her creativity and unique puzzle-solving ability ever since she was given her first LEGO set as hand-me-down from her older sister. Katya has never shied away from being herself and looks back fondly on her work as a member of her school\'s Women in STEM society throughout her graduate studies. It was one of her big inspirations for setting up an "anyone can code" workshop with her local library shortly after moving cities to take start her current position as Chief Computer Scientist for an up-and-coming tech company. <br><br> Katya\'s work has given her the opportunity to collaborate with computer scientists from all over the world, an opportunity she was sure not to miss. Through these collaborations Katya has become more and more concerned about a number of troubling issues regarding the fairness of current AI resume screening systems. This has inspired her to create a new AI resume screening system that is less discriminatory towards people with "non-English" names.',
      photo: null,
    },
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
      A look at AI fairness is in the real world by Andrew Putman.
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
    <br>
    <p>
      As AI and other prediction-based technologies have been rapidly incorporated into nearly every industry and aspect of life, we often see SciFi-esque speculation about "AI evolving beyond human control" or discussions of the "existential threat" that AI will pose in the at some unspecified point in our future.
      <br><br>
      However, despite the seeming urgency of these concerns, what is rarely talked about in these discussions of the dangers of AI are the <strong style="color: #e05c8a;">real harms</strong> that these technologies are causing <strong style="color: #e05c8a;">right now</strong>
      <br><br>
    </p>
    <br>
  </div> 

  <div class="eyebrow">The AI <span>Incident Database</span></div>

  <!-- Summary stats above scroll section -->
  <div class="stats-row">
    <StatCard label="Total Incidents" value={totalIncidents.toLocaleString()} />
    <StatCard label="Years Covered"   value={yearRange} />
    <StatCard label="Peak Year"       value={String(peakYear.year ?? '—')} />
    <StatCard label="MIT Classified"  value={classifiedCount.toLocaleString()} />
  </div>

  <!-- First scrollytelling section -->
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

  {/if}
</div>

{#if !loading}
  <!-- Bridge between data section and personal case studies -->
  <section class="transition-bridge">
    <p class="bridge-text">But what does this have to do with me?</p>
  </section>

  <div class="eyebrow-transition">
    The names and some biographical details in the following section have been adjusted to maintain the privacy of the people interviewed.
  </div>

  <!-- Photo-background scrolly: one full-bleed panel per case study -->
  <PhotoScroller steps={CASE_STUDIES} />

  <!--- Outro section -->
  <section class="outro">
    <h2>So what?</h2>
    <br>
    <p>
      Amir, Joel, Katya, and the thousands of people all over the world like them are deeply passionate about making fair AI systems, so <strong style="color: #e05c8a;">why hasn't this happened?</strong> <br><br> 
      To start with we can look at Joel's and Katya's approach to improving fairness of AI resume screening tool use. While Joel is correct that his efforts to minimize subconscious biases and unfairness in the interview process can make a big difference to the fairness of the hiring process as a whole, <i>this does not address the fairness issues introduced by the AI resume screening tool before any candidates are interviewed.</i> <br><br> 
      Relatedly, while Katya could create a new screening algorithm that is less discriminatory towards people with "non-English" names, there are two big sticking points to putting this idea into practice. Firstly, <i>what does less discriminatory mean here?</i> (e.g., If the goal to reduce the rate of rejection for qualified candidates with "non-English" names, how does that affect the rate of incorrect rejections for the system as whole? If the algorithm is less discriminatory based on a person's name, does that change create new discriminatory issues based on other applicant characteristics? Etc.) Secondly, <i>how will Katya know if her new algorithm is actually helping applicants like Amir or HR professionals like Joel?</i> It is all well and good to build an AI system that works in a vacuum, but without understanding the real-world effects of such a system how can Katya know if her new system is less discriminatory <br><br> 
      It can be easy for us to brush off AI fairness failures as being the sole result of corporate greed or a lack of caring by those in power. While these factors do influence how effectively AI fairness can be implemented, there is also a fundamental component of fairness that is missing from most current efforts to make AI systems fair - <strong style="color: #e05c8a;">fairness is not single, measurable thing</strong>. <strong style="color: #4a9eff;"> Fairness is a judgement about whether something aligns with what we choose to value</strong>. There is no universal equation for fairness. <strong style="color: #2dcca0;">Fairness requires us</strong>. <br><br> AI systems have the potential to be greatly beneficial, but no human-made technology exists outside human influence. The fairness of a technology is not an inherent part of the technology itself, rather fairness only has meaning when the context it is used and the experiences of the people who build, work with, and are affected by it are accounted for. <br><br> 
      <strong style="color: #2dcca0;">We can</strong> ensure that the technology we use is <strong style="color: #2dcca0;">fair</strong>. <strong style="color: #e05c8a;">We can't</strong> do that <strong style="color: #e05c8a;">alone</strong>.
    </p>
    <br>
  </section> 
  
  {/if}

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

  .intro {
    max-width: 100ch;
  }

  .eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.75rem;
  }

  .eyebrow-transition {
    font-family: 'DM Mono', monospace;
    font-style: italic;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-align: center;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 1rem;
    margin-top: 1rem;
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

  /* ── Transition bridge ───────────────────────────────────────── */
  :global(.transition-bridge) {
    min-height: 50vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    padding: 4rem 2rem;
  }

  :global(.bridge-text) {
    font-size: clamp(1.3rem, 3.5vw, 2rem);
    font-style: italic;
    font-weight: 400;
    color: var(--muted);
    text-align: center;
    max-width: 600px;
    line-height: 1.4;
    letter-spacing: -0.01em;
  }

  :global(.bridge-subtext) {
    font-size: clamp(1.3rem, 1vw, 2rem);
    font-style: italic;
    font-weight: 100;
    color: var(--muted);
    text-align: center;
    align-content: bottom;
    max-width: 600px;
    line-height: 1.4;
    letter-spacing: -0.01em;
  }

/* ── Outro text section ─────────────────────────────── */
  :global(.outro) {
    position: relative;
    z-index: 1;
    max-width: 950px;;   /* narrower than .page for comfortable reading */
    padding: 3rem 2rem;
    margin: 0 auto;
    background: var(--bg);
  }

  :global(.outro h2) {
    font-size: clamp(1.2rem, 3vw, 1.6rem);
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text);
  }

  :global(.outro p) {
    font-size: 15px;
    line-height: 1.75;
    color: var(--muted);
    max-width: 100ch;
  }
</style>
