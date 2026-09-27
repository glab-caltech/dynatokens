// Quantitative results: rows = methods (ours last), columns = metrics, one bar per cell.
// Each metric column has its own 0-based scale.

const QUANT = {
  'quant-baselines': {
    groups: [{ label: 'VBench2', span: 3 }, { label: 'WorldScore', span: 2 }],
    metrics: [
      { label: 'DSR', max: 1 }, { label: 'MOU', max: 1 }, { label: 'Cam', max: 1 },
      { label: 'MA', max: 6 }, { label: 'Cam', max: 1 },
    ],
    rows: [
      { label: 'Lyra-2', values: [0.54, 0.17, 0.87, 1.11, 0.70] },
      { label: 'LingBot', values: [0.68, 0.25, 0.82, 4.37, 0.64] },
      { label: 'HYWP', values: [0.56, 0.07, 0.88, 1.95, 0.69] },
      { label: 'HyDRA', values: [0.51, 0.18, 0.61, 2.51, 0.56] },
      { label: 'LiveWorld', values: [0.44, 0.35, 0.82, 4.49, 0.70] },
      { label: 'DynaTokens', values: [0.96, 0.69, 0.87, 5.33, 0.69], ours: true },
    ],
  },
  'quant-peft': {
    groups: [{ label: 'VBench2', span: 3 }, { label: 'WorldScore', span: 2 }],
    metrics: [
      { label: 'DSR', max: 1 }, { label: 'MOU', max: 1 }, { label: 'Cam', max: 1 },
      { label: 'MA', max: 5 }, { label: 'Cam', max: 1 },
    ],
    rows: [
      { label: 'LoRA', values: [0.61, 0.22, 0.83, 2.79, 0.56] },
      { label: 'LoRA-no PRoPE', values: [0.41, 0.06, 0.84, 3.62, 0.67] },
      { label: 'Fine-tuning', values: [0.59, 0.67, 0.83, 2.66, 0.54] },
      { label: 'TTT Layer', values: [0.41, 0.11, 0.88, 3.79, 0.66] },
      { label: 'DynaTokens', values: [1.00, 0.72, 0.88, 4.46, 0.67], ours: true },
    ],
  },
};

function renderQuant(id, spec) {
  const root = document.getElementById(id);
  if (!root) return;
  const grid = document.createElement('div');
  grid.className = 'quant-grid';
  grid.style.gridTemplateColumns = `150px repeat(${spec.metrics.length}, minmax(90px, 1fr))`;
  const cell = (cls, text) => {
    const d = document.createElement('div');
    d.className = cls;
    if (text !== undefined) d.textContent = text;
    grid.append(d);
    return d;
  };

  // Header: benchmark groups, then metric names with their scale.
  cell('q-corner');
  for (const g of spec.groups) cell('q-group', g.label).style.gridColumn = `span ${g.span}`;
  cell('q-corner');
  for (const m of spec.metrics) cell('q-metric', m.label);

  const tip = document.getElementById('quant-tip');
  for (const r of spec.rows) {
    cell('q-method' + (r.ours ? ' ours' : ''), r.label);
    r.values.forEach((v, j) => {
      const m = spec.metrics[j];
      const c = cell('q-cell');
      const bar = document.createElement('div');
      bar.className = 'q-bar' + (r.ours ? ' ours' : '');
      bar.style.width = `calc((100% - 40px) * ${v / m.max})`;
      const val = document.createElement('span');
      val.className = 'q-val';
      val.textContent = v.toFixed(2);
      c.append(bar, val);
      const group = spec.groups[spec.groups.findIndex((g, gi) =>
        j < spec.groups.slice(0, gi + 1).reduce((s, x) => s + x.span, 0))].label;
      c.addEventListener('mousemove', e => {
        tip.textContent = `${r.label} · ${group} ${m.label}: ${v.toFixed(2)}`;
        tip.style.left = `${e.clientX + 12}px`;
        tip.style.top = `${e.clientY + 12}px`;
        tip.style.opacity = '1';
      });
      c.addEventListener('mouseleave', () => { tip.style.opacity = '0'; });
    });
  }
  root.append(grid);
}

document.addEventListener('DOMContentLoaded', () => {
  for (const [id, spec] of Object.entries(QUANT)) renderQuant(id, spec);
});
