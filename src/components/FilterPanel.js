/**
 * components/FilterPanel.js
 * Filter panel with dropdowns, region selector, range sliders.
 * Emits filter:change events to bus.
 */

import { STATES, IDEO_VARS, ELECTION_YEARS, REGIONS, PARTY_NAMES } from '../data/loader.js';
import { EventBus } from '../EventBus.js';

const bus = EventBus;

let stateChangeHandler = null;
let currentState = { year: 2022, uf: 'BR', variable: 'ideo_imp', ideoRange: [-0.7, 0.9], party: null };

function createSelect(id, label, options, defaultValue) {
  const wrap = document.createElement('div');
  wrap.className = 'filter-group';

  if (label) {
    const lbl = document.createElement('label');
    lbl.innerHTML = `${label} <span class="badge"></span>`;
    wrap.appendChild(lbl);
  }

  const sel = document.createElement('select');
  sel.id = id;
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === defaultValue) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => {
    const lbl = wrap.querySelector('label');
    if (lbl) updateBadge(lbl, sel);
    emitChange();
  });
  wrap.appendChild(sel);
  return wrap;
}

function updateBadge(lbl, sel) {
  const badge = lbl.querySelector('.badge');
  if (badge) {
    badge.classList.toggle('active', sel.value !== '' && sel.value !== 'BR');
  }
}

function emitChange() {
  const state = getFilterState();
  currentState = state;
  if (stateChangeHandler) stateChangeHandler(state);
  bus.emit('filter:change', state);
}

export function getFilterState() {
  return {
    year: parseInt(document.getElementById('filter-year')?.value || 2022),
    uf: document.getElementById('filter-uf')?.value || 'BR',
    variable: document.getElementById('filter-var')?.value || 'ideo_imp',
    ideoRange: [
      parseFloat(document.getElementById('filter-ideo-min')?.value || -0.7),
      parseFloat(document.getElementById('filter-ideo-max')?.value || 0.9),
    ],
    party: document.getElementById('filter-party')?.value || null,
  };
}

export function initFilterPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  container.className = 'filter-panel';

  // ---- Panel header ----
  const panelHeader = document.createElement('div');
  panelHeader.className = 'filter-panel-header';
  panelHeader.innerHTML = `
    <span class="filter-panel-title">Filters</span>
    <button class="btn-reset-sm" id="filter-reset-sm">Clear</button>
  `;
  container.appendChild(panelHeader);

  document.getElementById('filter-reset-sm')?.addEventListener('click', resetFilters);

  // ---- Section 1: Year ----
  const yearSection = createSection(container, 'Year', 'navy');
  const yearOptions = [
    { value: '', label: 'All years' },
    ...ELECTION_YEARS.map(y => ({ value: y, label: y })),
  ];
  yearSection.appendChild(createSelect('filter-year', null, yearOptions, 2022));

  // ---- Section 2: Location ----
  const ubiSection = createSection(container, 'Location', 'green');

  const regionOptions = [
    { value: '', label: 'All regions' },
    { value: 'Norte', label: 'North' },
    { value: 'Nordeste', label: 'Northeast' },
    { value: 'Centro-Oeste', label: 'Central-West' },
    { value: 'Sudeste', label: 'Southeast' },
    { value: 'Sul', label: 'South' },
  ];
  ubiSection.appendChild(createSelect('filter-region', 'Region', regionOptions, ''));

  const ufOptions = [
    { value: 'BR', label: 'Brazil (national)' },
    ...STATES.map(s => ({ value: s.uf, label: s.name })),
  ];
  ubiSection.appendChild(createSelect('filter-uf', 'State', ufOptions, 'BR'));

  document.getElementById('filter-region')?.addEventListener('change', (e) => {
    const region = e.target.value;
    const ufSel = document.getElementById('filter-uf');
    if (!ufSel) return;
    const current = ufSel.value;
    ufSel.innerHTML = '';
    const allStates = region
      ? [{ value: '', label: 'All states' }, ...STATES.filter(s => REGIONS[region]?.includes(s.uf))]
      : [{ value: 'BR', label: 'Brazil (national)' }, ...STATES.map(s => ({ value: s.uf, label: s.name }))];
    for (const opt of allStates) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      if (opt.value === current) o.selected = true;
      ufSel.appendChild(o);
    }
    if (!ufSel.value) ufSel.value = 'BR';
    emitChange();
  });

  // ---- Section 3: Variable ----
  const varSection = createSection(container, 'Variable', 'gold');
  const varOptions = IDEO_VARS.map(v => ({ value: v.key, label: v.label }));
  varSection.appendChild(createSelect('filter-var', null, varOptions, 'ideo_imp'));

  // ---- Section 4: Ideology Range ----
  const rangeSection = createSection(container, 'Range', 'ink');
  rangeSection.appendChild(createIdeoRange());

  // ---- Section 5: Party ----
  const partySection = createSection(container, 'Party', 'navy');
  const partyWrap = document.createElement('div');
  partyWrap.className = 'filter-group';
  const partySel = document.createElement('select');
  partySel.id = 'filter-party';
  partySel.innerHTML = '<option value="">All</option>';
  partySel.addEventListener('change', () => emitChange());
  partyWrap.appendChild(partySel);
  partySection.appendChild(partyWrap);

  // ---- Actions ----
  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'filter-actions';
  const shareBtn = document.createElement('button');
  shareBtn.className = 'btn-share';
  shareBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 0, \'wght\' 400, \'GRAD\' 0, \'opsz\' 24;">link</span> Copy link';
  shareBtn.addEventListener('click', () => {
    const state = getFilterState();
    const params = new URLSearchParams();
    if (state.year) params.set('year', state.year);
    if (state.uf !== 'BR') params.set('uf', state.uf);
    if (state.variable !== 'ideo_imp') params.set('var', state.variable);
    const url = `${location.origin}${location.pathname}#/${state.uf === 'BR' ? 'map' : 'map?uf=' + state.uf}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      shareBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1, \'wght\' 400, \'GRAD\' 0, \'opsz\' 24;">check</span> Copied!';
      shareBtn.classList.add('copied');
      setTimeout(() => {
        shareBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 0, \'wght\' 400, \'GRAD\' 0, \'opsz\' 24;">link</span> Copy link';
        shareBtn.classList.remove('copied');
      }, 2000);
    });
  });
  actionsWrap.appendChild(shareBtn);
  container.appendChild(actionsWrap);
}

function createSection(container, label, accent = 'navy') {
  const section = document.createElement('div');
  section.className = `filter-section filter-section--${accent}`;
  const hdr = document.createElement('div');
  hdr.className = 'filter-section-label';
  hdr.textContent = label;
  section.appendChild(hdr);
  container.appendChild(section);
  return section;
}

function resetFilters() {
  document.getElementById('filter-year').value = 2022;
  document.getElementById('filter-region').value = '';
  document.getElementById('filter-var').value = 'ideo_imp';
  document.getElementById('filter-ideo-min').value = -0.7;
  document.getElementById('filter-ideo-max').value = 0.9;
  document.getElementById('filter-party').value = '';

  // Reset UF dropdown to show all states, and set to BR
  const ufSel = document.getElementById('filter-uf');
  if (ufSel) {
    ufSel.innerHTML = '';
    const opts = [{ value: 'BR', label: 'Brazil (national)' }, ...STATES.map(s => ({ value: s.uf, label: s.name }))];
    for (const o of opts) {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      ufSel.appendChild(opt);
    }
    ufSel.value = 'BR';
  }

  // Update badges
  document.querySelectorAll('.badge').forEach(b => b.classList.remove('active'));
  updateRangeDisplay();

  emitChange();
}

function createIdeoRange() {
  const wrap = document.createElement('div');
  wrap.className = 'filter-group filter-range';

  const valWrap = document.createElement('div');
  valWrap.className = 'filter-range-values';
  valWrap.id = 'filter-ideo-val';
  valWrap.innerHTML = '<span id="ideo-val-min">-0.70</span> — <span id="ideo-val-max">+0.90</span>';
  wrap.appendChild(valWrap);

  const minInput = document.createElement('input');
  minInput.type = 'range';
  minInput.min = -1.0;
  minInput.max = 1.0;
  minInput.step = 0.05;
  minInput.value = -0.7;
  minInput.id = 'filter-ideo-min';

  const maxInput = document.createElement('input');
  maxInput.type = 'range';
  maxInput.min = -1.0;
  maxInput.max = 1.0;
  maxInput.step = 0.05;
  maxInput.value = 0.9;
  maxInput.id = 'filter-ideo-max';

  function update() {
    let min = parseFloat(minInput.value);
    let max = parseFloat(maxInput.value);
    if (min > max) { [min, max] = [max, min]; }
    document.getElementById('ideo-val-min').textContent = min >= 0 ? `+${min.toFixed(2)}` : min.toFixed(2);
    document.getElementById('ideo-val-max').textContent = max >= 0 ? `+${max.toFixed(2)}` : max.toFixed(2);

    // Sync thumbs so they don't cross
    if (parseFloat(minInput.value) > parseFloat(maxInput.value)) {
      const tmp = minInput.value;
      minInput.value = maxInput.value;
      maxInput.value = tmp;
    }

    emitChange();
  }

  minInput.addEventListener('input', update);
  maxInput.addEventListener('input', update);

  wrap.appendChild(minInput);
  wrap.appendChild(maxInput);
  return wrap;
}

function updateRangeDisplay() {
  const min = parseFloat(document.getElementById('filter-ideo-min')?.value || -0.7);
  const max = parseFloat(document.getElementById('filter-ideo-max')?.value || 0.9);
  const minEl = document.getElementById('ideo-val-min');
  const maxEl = document.getElementById('ideo-val-max');
  if (minEl) minEl.textContent = min >= 0 ? `+${min.toFixed(2)}` : min.toFixed(2);
  if (maxEl) maxEl.textContent = max >= 0 ? `+${max.toFixed(2)}` : max.toFixed(2);
}

export function updatePartyOptions(partyData) {
  const sel = document.getElementById('filter-party');
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">Todos</option>';
  const parties = [...new Set(partyData.map(d => d.party))].sort((a, b) => a - b);
  for (const p of parties) {
    const o = document.createElement('option');
    o.value = p;
    o.textContent = `${PARTY_NAMES[p] || `P${p}`} (${p})`;
    sel.appendChild(o);
  }
  if (currentVal) sel.value = currentVal;
}

export function onFilterChange(handler) {
  stateChangeHandler = handler;
}
