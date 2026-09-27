// Results galleries. Baselines: benchmark tabs -> instance pills -> camera-motion dropdown -> one clip per method.
// Ablations: benchmark tabs -> instance pills -> camera-motion dropdown -> one clip per method.
// Data comes from static/js/results.js (window.RESULTS).
// Clips autoplay while hovered and reset when the pointer leaves.

const RESULTS = window.RESULTS || { collections: [] };
const BASELINES = RESULTS.collections.filter(c => c.group === 'baselines');
const ABLATIONS = RESULTS.collections.filter(c => c.group === 'ablations');
let curCol = 0;

// Notes shown under each clip: static/notes.json, keyed by
// "<collection>/<instance>/<trajectory>" then method -> {text, ok}.
let NOTES = {};

function noteEl(notes, m) {
  const n = notes[m.key];
  if (!n || !n.text) return el('div', { className: 'note' });
  return el('div', { className: 'note' }, n.text + ' ',
    el('span', { className: 'mark ' + (n.ok ? 'ok' : 'bad') }, n.ok ? '✓' : '✗'));
}

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const k of kids) n.append(k);
  return n;
}

const POINTER_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
  '<path d="M5 2l14 11.5-6.2.9 3.6 7.1-2.9 1.4-3.6-7.2L5 20z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';

function hoverVideo(src, poster) {
  const v = el('video', { src, poster, muted: '', playsinline: '', preload: 'metadata', loop: '' });
  v.muted = true;
  // "Hover to play" badge over the clip; hidden while the clip plays.
  const hint = el('div', { className: 'hover-hint' });
  hint.innerHTML = `<span class="hover-hint-icon">${POINTER_SVG}</span><span>Hover to play</span>`;
  const wrap = el('div', { className: 'clip' }, v, hint);
  wrap.addEventListener('mouseenter', () => {
    wrap.classList.add('playing');
    v.play().catch(() => {});
  });
  wrap.addEventListener('mouseleave', () => { wrap.classList.remove('playing'); v.pause(); v.currentTime = 0; });
  return wrap;
}

function renderTabs() {
  const ul = document.querySelector('#tabs ul');
  ul.innerHTML = '';
  BASELINES.forEach((c, i) => {
    const li = el('li', { className: i === curCol ? 'is-active' : '', onclick: () => setCollection(i) }, el('a', {}, c.label));
    ul.append(li);
  });
}

function renderInstances(c) {
  const wrap = document.getElementById('instance-pills');
  wrap.innerHTML = '';
  c.instances.forEach((inst, i) => {
    const b = el('button', { className: 'button is-rounded is-small', onclick: () => renderInstance(c, i) }, inst.label || inst.key);
    wrap.append(b);
  });
}

function renderInstance(c, idx) {
  const inst = c.instances[idx];
  document.querySelectorAll('#instance-pills .button').forEach((b, i) =>
    b.classList.toggle('is-dark', i === idx));
  document.getElementById('hero-init').src = 'static/' + inst.init;
  document.getElementById('hero-prompt').textContent = inst.prompt || '';

  // Camera motion dropdown: one option per trajectory of this instance.
  const sel = document.getElementById('traj-select');
  sel.innerHTML = '';
  inst.trajectories.forEach((t, i) => sel.append(el('option', { value: i }, t.label)));
  sel.onchange = () => renderTrajectory(c, inst, inst.trajectories[sel.value]);
  renderTrajectory(c, inst, inst.trajectories[0]);
}

function renderTrajectory(c, inst, t) {
  // Grid: 2x3, one labeled clip per method for the selected camera motion, ours last.
  const grid = document.getElementById('result-grid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(3, minmax(240px, 1fr))`;
  const methods = [...c.methods.filter(m => !m.ours), ...c.methods.filter(m => m.ours)];
  const notes = NOTES[`${c.key}/${inst.key}/${t.key}`] || {};
  for (const m of methods) {
    const src = t.videos[m.key];
    const cell = el('div', {},
      el('div', { className: 'rowhdr' + (m.ours ? ' ours' : '') }, m.label),
      src ? hoverVideo('static/' + src, 'static/' + inst.init) : el('div', { className: 'missing' }, 'n/a'));
    cell.append(noteEl(notes, m));
    grid.append(cell);
  }
}

function setCollection(i) {
  curCol = i;
  renderTabs();
  const c = BASELINES[i];
  renderInstances(c);
  renderInstance(c, 0);
}

// ── Ablation gallery: initial frame | chosen finetuning method | DynaTokens ──
let ablCol = 0;

function ablSetCollection(i) {
  ablCol = i;
  const ul = document.querySelector('#abl-tabs ul');
  ul.innerHTML = '';
  ABLATIONS.forEach((c, j) => ul.append(
    el('li', { className: j === i ? 'is-active' : '', onclick: () => ablSetCollection(j) }, el('a', {}, c.label))));
  const c = ABLATIONS[i];
  const pills = document.getElementById('abl-instance-pills');
  pills.innerHTML = '';
  c.instances.forEach((inst, j) => pills.append(
    el('button', { className: 'button is-rounded is-small', onclick: () => ablRenderInstance(c, j) }, inst.label || inst.key)));
  ablRenderInstance(c, 0);
}

function ablRenderInstance(c, idx) {
  const inst = c.instances[idx];
  document.querySelectorAll('#abl-instance-pills .button').forEach((b, i) => b.classList.toggle('is-dark', i === idx));
  document.getElementById('abl-hero-init').src = 'static/' + inst.init;
  document.getElementById('abl-hero-prompt').textContent = inst.prompt || '';
  const tsel = document.getElementById('abl-traj-select');
  tsel.innerHTML = '';
  inst.trajectories.forEach((t, i) => tsel.append(el('option', { value: i }, t.label)));
  tsel.onchange = () => ablRenderTrajectory(c, inst, inst.trajectories[tsel.value]);
  ablRenderTrajectory(c, inst, inst.trajectories[0]);
}

function ablRenderTrajectory(c, inst, t) {
  // Grid: 2x2, one labeled clip per finetuning method for the selected camera motion, ours last.
  const grid = document.getElementById('abl-grid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = 'repeat(2, minmax(240px, 1fr))';
  const methods = [...c.methods.filter(m => !m.ours), ...c.methods.filter(m => m.ours)];
  const notes = NOTES[`${c.key}/${inst.key}/${t.key}`] || {};
  for (const m of methods) {
    const src = t.videos[m.key];
    const cell = el('div', {},
      el('div', { className: 'rowhdr' + (m.ours ? ' ours' : '') }, m.label),
      src ? hoverVideo('static/' + src, 'static/' + inst.init) : el('div', { className: 'missing' }, 'n/a'));
    cell.append(noteEl(notes, m));
    grid.append(cell);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try { NOTES = await (await fetch('static/notes.json', { cache: 'no-store' })).json(); } catch (e) { NOTES = {}; }
  if (BASELINES.length) setCollection(0);
  if (ABLATIONS.length) ablSetCollection(0);
});
