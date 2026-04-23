const sectorData = {
  NIFTYPHARMA: {
    color: '#67b252',
    trail: [
      [100.1, 100.7], [100.8, 101.4], [101.5, 101.9], [102.3, 102.5],
      [103.1, 102.9], [103.9, 103.2], [104.8, 103.2]
    ],
    price: '₹ 22,497.25',
    change: '-2.06%'
  },
  NIFTYFMCG: {
    color: '#0f61d5',
    trail: [
      [95.0, 99.5], [95.4, 100.1], [95.9, 100.5], [96.3, 100.8],
      [96.6, 101.0], [96.8, 101.1], [97.2, 101.3]
    ],
    price: '₹ 49,657.75',
    change: '-0.63%'
  },
  NIFTYBANK: {
    color: '#0076ff',
    trail: [
      [101.7, 99.1], [102.0, 99.5], [102.3, 99.8], [102.7, 100.1],
      [103.0, 100.6], [103.3, 100.9], [103.2, 101.2]
    ],
    price: '₹ 56,565.70',
    change: '-2.11%'
  },
  NIFTYIT: {
    color: '#ff4fb2',
    trail: [
      [92.2, 95.8], [92.5, 95.0], [93.5, 95.1], [94.8, 95.3],
      [96.0, 95.7], [97.2, 96.2], [98.4, 97.0]
    ],
    price: '₹ 31,809.85',
    change: '5.55%'
  }
};

const subtitle = document.getElementById('subtitle');
const tailSlider = document.getElementById('tailLength');
const tailValue = document.getElementById('tailValue');
const rowTarget = document.getElementById('sectorRows');

function last(values) { return values[values.length - 1]; }

function renderRows() {
  rowTarget.innerHTML = Object.entries(sectorData).map(([name, v]) => {
    const [ratio, momentum] = last(v.trail);
    return `<tr>
      <td>${name.replace('NIFTY', 'Nifty ')}</td>
      <td>${ratio.toFixed(2)}</td>
      <td>${momentum.toFixed(2)}</td>
      <td>${v.price}</td>
      <td>${v.change}</td>
    </tr>`;
  }).join('');
}

function traces(tail) {
  return Object.entries(sectorData).map(([name, entry]) => {
    const points = entry.trail.slice(-tail);
    return {
      x: points.map((p) => p[0]),
      y: points.map((p) => p[1]),
      mode: 'lines+markers+text',
      type: 'scatter',
      line: { color: entry.color, width: 2 },
      marker: { color: entry.color, size: 8 },
      text: [...new Array(points.length - 1).fill(''), name],
      textposition: 'top center',
      name
    };
  });
}

function renderPlot(tail = Number(tailSlider.value)) {
  tailValue.textContent = String(tail);
  subtitle.textContent = `Showing data for ${tail + 1} weeks ending 17 Apr 2026`;

  Plotly.newPlot('rrg', traces(tail), {
    dragmode: 'pan',
    xaxis: { title: 'JdK RS-Ratio', range: [91, 106], zeroline: false, dtick: 0.5 },
    yaxis: { title: 'JdK RS-Momentum', range: [93.5, 104], zeroline: false, dtick: 0.5 },
    legend: { orientation: 'h', y: -0.15 },
    margin: { t: 30, l: 60, r: 25, b: 65 },
    paper_bgcolor: '#fff',
    plot_bgcolor: '#fff',
    shapes: [
      { type: 'rect', x0: 100, y0: 100, x1: 106, y1: 104, fillcolor: 'rgba(103,178,82,0.16)', line: { width: 0 } },
      { type: 'rect', x0: 91, y0: 100, x1: 100, y1: 104, fillcolor: 'rgba(88,112,255,0.18)', line: { width: 0 } },
      { type: 'rect', x0: 91, y0: 93.5, x1: 100, y1: 100, fillcolor: 'rgba(255,93,93,0.18)', line: { width: 0 } },
      { type: 'rect', x0: 100, y0: 93.5, x1: 106, y1: 100, fillcolor: 'rgba(246,211,74,0.2)', line: { width: 0 } },
      { type: 'line', x0: 100, x1: 100, y0: 93.5, y1: 104, line: { color: '#8b8ea0', width: 1 } },
      { type: 'line', x0: 91, x1: 106, y0: 100, y1: 100, line: { color: '#8b8ea0', width: 1 } }
    ],
    annotations: [
      { x: 105.6, y: 103.7, text: 'Leading', showarrow: false, font: { color: '#2b8a2b', size: 22 } },
      { x: 91.6, y: 103.7, text: 'Improving', showarrow: false, font: { color: '#2f4dfd', size: 22 } },
      { x: 91.6, y: 93.8, text: 'Lagging', showarrow: false, font: { color: '#f03e3e', size: 22 } },
      { x: 105.5, y: 93.8, text: 'Weakening', showarrow: false, font: { color: '#e8ae00', size: 22 } }
    ]
  }, { responsive: true, displaylogo: false });
}

tailSlider.addEventListener('input', () => renderPlot());

document.getElementById('animate').addEventListener('click', () => {
  let step = 3;
  const interval = setInterval(() => {
    renderPlot(step);
    step += 1;
    if (step > Number(tailSlider.max)) {
      clearInterval(interval);
    }
  }, 350);
});

renderRows();
renderPlot(6);
