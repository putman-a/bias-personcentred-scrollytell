<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { DOMAINS } from '$lib/incidentData';
  import { createEventDispatcher } from 'svelte';

  Chart.register(...registerables);

  export let years = [];
  export let yearDomain = {};
  export let mode = 'stacked';
  export let hidden = new Set();

  const dispatch = createEventDispatcher();

  let canvas;
  let chart = null;

  function getDatasets() {
    return DOMAINS.filter(d => !hidden.has(d.key)).map(d => ({
      label: d.label,
      _domainKey: d.key,
      data: years.map(y => yearDomain[y]?.[d.key] || 0),
      backgroundColor: d.color + (mode === 'stacked' ? 'bb' : '33'),
      borderColor: d.color,
      borderWidth: mode === 'line' ? 2 : 0,
      fill: mode === 'stacked',
      tension: 0.35,
      pointRadius: mode === 'line' ? 3 : 0,
      pointHoverRadius: mode === 'line' ? 6 : 0,
      stack: mode === 'stacked' ? 'stack' : undefined,
    }));
  }

  function getTotals() {
    return years.map(y =>
      Object.values(yearDomain[y] || {}).reduce((a, b) => a + b, 0)
    );
  }

  function buildConfig() {
    if (mode === 'bar') {
      return {
        type: 'bar',
        data: {
          labels: years,
          datasets: [{
            label: 'Total Incidents',
            data: getTotals(),
            backgroundColor: 'rgba(201,240,255,0.25)',
            borderColor: '#c9f0ff',
            borderWidth: 1,
            borderRadius: 3,
          }]
        },
        options: makeOptions(false, false),
      };
    }

    if (mode === 'total') {
      return {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Total Incidents',
            data: getTotals(),
            borderColor: '#c9f0ff',
            backgroundColor: 'rgba(201,240,255,0.06)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#c9f0ff',
            borderWidth: 2,
          }]
        },
        options: makeOptions(false, false),
      };
    }

    return {
      type: mode === 'line' ? 'line' : 'bar',
      data: { labels: years, datasets: getDatasets() },
      options: makeOptions(mode === 'stacked', mode === 'stacked'),
    };
  }

  function makeOptions(stackX, stackY) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      onHover: (e, elements) => {
        if (!e.native || !elements.length) {
          dispatch('hover', { visible: false });
          return;
        }
        const idx = elements[0].index;
        dispatch('hover', {
          visible: true,
          year: years[idx],
          x: e.native.clientX,
          y: e.native.clientY,
        });
      },
      scales: {
        x: {
          stacked: stackX,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#7a7d8a',
            font: { family: "'DM Mono', monospace", size: 10 },
            autoSkip: false,
            maxRotation: 45,
          },
          border: { color: 'rgba(255,255,255,0.07)' },
        },
        y: {
          stacked: stackY,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#7a7d8a',
            font: { family: "'DM Mono', monospace", size: 10 },
          },
          border: { color: 'rgba(255,255,255,0.07)' },
        },
      },
    };
  }

  function rebuild() {
    if (!canvas) return;
    if (chart) { chart.destroy(); chart = null; }
    const cfg = buildConfig();
    chart = new Chart(canvas, cfg);
  }

  // Reactive: rebuild whenever inputs change
  $: if (canvas && years.length > 0) {
    mode, hidden; // track reactive deps
    rebuild();
  }

  onMount(() => {
    if (years.length > 0) rebuild();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<div class="chart-container">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    height: 380px;
  }
</style>
