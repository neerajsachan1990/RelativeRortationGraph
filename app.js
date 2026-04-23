const chartEl = document.getElementById('rrgChart');
const summaryEl = document.getElementById('summary');
const tailLengthEl = document.getElementById('tailLength');
const tailValueEl = document.getElementById('tailValue');
const animateBtn = document.getElementById('animateBtn');
const zoneBtn = document.getElementById('zoneBtn');
const timeframeSelect = document.getElementById('timeframeSelect');
const partialCandlesEl = document.getElementById('partialCandles');
const benchmarkSelect = document.getElementById('benchmarkSelect');
const dataFileEl = document.getElementById('dataFile');
const showLabelsEl = document.getElementById('showLabels');
const tbody = document.querySelector('#sectorTable tbody');

const midpoint = 100;

let appState = {
  rawData: null,
  series: [],
  showZones: true,
  showLabels: false,
  animating: false,
  enabledSectors: new Set(),
  frameIdx: 0,
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function toDateString(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function assertValidData(payload) {
  if (!payload || !Array.isArray(payload.series) || payload.series.length === 0) {
    throw new Error('Invalid JSON: expected { series: [...] } with at least one sector.');
  }

  payload.series.forEach((sector) => {
    if (!sector.name || !Array.isArray(sector.points) || sector.points.length < 2) {
      throw new Error(`Invalid sector ${sector.name || '(unknown)'}: points must contain at least 2 rows.`);
    }
  });
}

function buildDailyPoints(points, includePartial) {
  const expanded = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];

    for (let step = 0; step < 5; step += 1) {
      const t = step / 5;
      const d = new Date(current.date);
      d.setUTCDate(d.getUTCDate() + step);
      expanded.push({
        date: toDateString(d),
        ratio: Number(lerp(current.ratio, next.ratio, t).toFixed(2)),
        momentum: Number(lerp(current.momentum, next.momentum, t).toFixed(2)),
      });
    }
  }

  const last = points[points.length - 1];
  expanded.push(last);

  if (includePartial) {
    for (let i = 1; i <= 3; i += 1) {
      const d = new Date(last.date);
      d.setUTCDate(d.getUTCDate() + i);
      expanded.push({
        date: toDateString(d),
        ratio: Number((last.ratio + i * 0.08).toFixed(2)),
        momentum: Number((last.momentum + i * 0.06).toFixed(2)),
      });
    }
  }

  return expanded;
}

function currentSeries() {
  return appState.series.filter((item) => appState.enabledSectors.has(item.name));
}

function getAxisRange(series, key, fallback) {
  const values = series.flatMap((item) => item.points.map((point) => point[key]));
  if (!values.length) return fallback;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 1;
  return [Math.min(min - pad, fallback[0]), Math.max(max + pad, fallback[1])];
}

function zoneShapes(xRange, yRange, showZones) {
  if (!showZones) return [];
  const [xmin, xmax] = xRange;
  const [ymin, ymax] = yRange;

  return [
    { x0: midpoint, x1: xmax, y0: midpoint, y1: ymax, fillcolor: '#dcefd9' },
    { x0: xmin, x1: midpoint, y0: midpoint, y1: ymax, fillcolor: '#dde0f8' },
    { x0: xmin, x1: midpoint, y0: ymin, y1: midpoint, fillcolor: '#f8dedd' },
    { x0: midpoint, x1: xmax, y0: ymin, y1: midpoint, fillcolor: '#f5f2dd' },
  ].map((shape) => ({ type: 'rect', xref: 'x', yref: 'y', line: { width: 0 }, opacity: 0.55, layer: 'below', ...shape }));
}

function buildTraces(frameIdx, tailLength) {
  const labelAllowed = appState.showLabels && currentSeries().length <= 8;

  return currentSeries().flatMap((item) => {
    const safeFrame = Math.min(frameIdx, item.points.length - 1);
    const start = Math.max(0, safeFrame - tailLength + 1);
    const tail = item.points.slice(start, safeFrame + 1);
    if (!tail.length) return [];

    const trail = {
      x: tail.map((p) => p.ratio),
      y: tail.map((p) => p.momentum),
      type: 'scatter',
      mode: 'lines+markers',
      marker: { size: 5, color: item.color },
      line: { color: item.color, width: 2 },
      name: item.name,
      hovertemplate: `${item.name}<br>RS-Ratio: %{x:.2f}<br>RS-Momentum: %{y:.2f}<extra></extra>`,
    };

    const current = tail[tail.length - 1];
    const currentMarker = {
      x: [current.ratio],
      y: [current.momentum],
      type: 'scatter',
      mode: labelAllowed ? 'markers+text' : 'markers',
      marker: { size: 9, color: item.color, line: { color: '#ffffff', width: 1 } },
      text: labelAllowed ? [item.name] : undefined,
      textposition: 'top center',
      textfont: { color: item.color, size: 11 },
      showlegend: false,
      hovertemplate: `${item.name}<br>RS-Ratio: %{x:.2f}<br>RS-Momentum: %{y:.2f}<extra></extra>`,
    };

    return [trail, currentMarker];
  });
}

function updateTable(frameIdx) {
  tbody.innerHTML = '';

  appState.series
    .map((item) => {
      const p = item.points[Math.min(frameIdx, item.points.length - 1)];
      return { name: item.name, ratio: p.ratio, momentum: p.momentum, price: item.price, pctChange: item.pctChange };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .forEach((row) => {
      const tr = document.createElement('tr');
      const checked = appState.enabledSectors.has(row.name) ? 'checked' : '';
      tr.innerHTML = `
        <td>
          <label class="sector-toggle"><input type="checkbox" data-sector="${row.name}" ${checked} /><span>${row.name}</span></label>
        </td>
        <td>${row.ratio.toFixed(2)}</td>
        <td>${row.momentum.toFixed(2)}</td>
        <td>₹ ${row.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${row.pctChange.toFixed(2)}%</td>
      `;
      tbody.appendChild(tr);
    });

  tbody.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.addEventListener('change', (event) => {
      const { sector } = event.target.dataset;
      if (event.target.checked) appState.enabledSectors.add(sector);
      else appState.enabledSectors.delete(sector);
      render(appState.frameIdx);
    });
  });
}

function updateDerivedSeries() {
  const timeframe = timeframeSelect.value;
  const includePartial = partialCandlesEl.checked;

  appState.series = appState.rawData.series.map((item) => ({
    ...item,
    points: timeframe === 'daily' ? buildDailyPoints(item.points, includePartial) : item.points,
  }));
}

function render(frameIdx = appState.series[0].points.length - 1) {
  appState.frameIdx = frameIdx;

  const tailLength = Number(tailLengthEl.value);
  tailValueEl.textContent = `${tailLength} ${timeframeSelect.value === 'daily' ? 'days' : 'weeks'}`;

  const traces = buildTraces(frameIdx, tailLength);
  const xRange = getAxisRange(appState.series, 'ratio', [90, 106]);
  const yRange = getAxisRange(appState.series, 'momentum', [93, 104]);

  const layout = {
    xaxis: { title: 'JdK RS-Ratio', range: xRange, zeroline: false, gridcolor: '#d8dce2' },
    yaxis: { title: 'JdK RS-Momentum', range: yRange, zeroline: false, gridcolor: '#d8dce2' },
    shapes: [
      ...zoneShapes(xRange, yRange, appState.showZones),
      { type: 'line', x0: midpoint, x1: midpoint, y0: yRange[0], y1: yRange[1], line: { color: '#94a3b8', width: 1 } },
      { type: 'line', x0: xRange[0], x1: xRange[1], y0: midpoint, y1: midpoint, line: { color: '#94a3b8', width: 1 } },
    ],
    annotations: [
      { x: xRange[1] - 0.4, y: yRange[1] - 0.4, text: 'Leading', showarrow: false, font: { color: 'green', size: 22 } },
      { x: xRange[0] + 0.5, y: yRange[1] - 0.4, text: 'Improving', showarrow: false, font: { color: 'blue', size: 22 } },
      { x: xRange[0] + 0.5, y: yRange[0] + 0.3, text: 'Lagging', showarrow: false, font: { color: 'red', size: 22 } },
      { x: xRange[1] - 0.5, y: yRange[0] + 0.3, text: 'Weakening', showarrow: false, font: { color: '#e7b400', size: 22 } },
    ],
    margin: { l: 60, r: 20, t: 20, b: 60 },
    legend: { orientation: 'h', y: -0.16 },
  };

  Plotly.react(chartEl, traces, layout, { responsive: true, displaylogo: false });


  const safeIndex = Math.min(frameIdx, appState.series[0].points.length - 1);
  const date = appState.series[0].points[safeIndex].date;
  const timeframeLabel = timeframeSelect.value === 'daily' ? 'days' : 'weeks';
  const baseSummary = `Showing data for ${tailLength + 1} ${timeframeLabel} ending ${formatDate(date)}`;
  if (currentSeries().length > 8 && appState.showLabels) {
    summaryEl.textContent = `${baseSummary} · labels auto-muted for readability`;
  } else {
    summaryEl.textContent = baseSummary;
  }

  updateTable(safeIndex);
}

async function animate() {
  if (appState.animating) return;
  appState.animating = true;
  animateBtn.textContent = 'Animating...';

  const total = Math.max(...appState.series.map((s) => s.points.length));
  for (let i = 0; i < total; i += 1) {
    render(i);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 260));
  }

  appState.animating = false;
  animateBtn.textContent = 'Animate ✨';
}

function refreshFromRawData() {
  const benchmarks = appState.rawData.benchmarks || [appState.rawData.benchmark || 'NIFTY 50'];
  benchmarkSelect.innerHTML = benchmarks.map((name) => `<option value="${name}">${name}</option>`).join('');

  appState.enabledSectors = new Set(appState.rawData.series.map((s) => s.name));
  updateDerivedSeries();
  render();
}

function bindEvents() {
  tailLengthEl.addEventListener('input', () => render(appState.frameIdx));

  zoneBtn.addEventListener('click', () => {
    appState.showZones = !appState.showZones;
    zoneBtn.textContent = appState.showZones ? 'Hide zones' : 'Show zones';
    render(appState.frameIdx);
  });

  animateBtn.addEventListener('click', animate);
  timeframeSelect.addEventListener('change', () => { updateDerivedSeries(); render(); });
  partialCandlesEl.addEventListener('change', () => { updateDerivedSeries(); render(); });
  benchmarkSelect.addEventListener('change', () => render(appState.frameIdx));
  showLabelsEl.addEventListener('change', () => {
    appState.showLabels = showLabelsEl.checked;
    render(appState.frameIdx);
  });

  dataFileEl.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());
      assertValidData(payload);
      appState.rawData = payload;
      refreshFromRawData();
    } catch (error) {
      alert(`Could not load data file. ${error.message}`);
    }
  });
}

async function init() {
  const res = await fetch('./data.json');
  appState.rawData = await res.json();
  assertValidData(appState.rawData);

  bindEvents();
  refreshFromRawData();
}

init();
