/**
 * MunicipalProfilePage.js
 * Detailed municipal political system explorer.
 */

import {
  loadMunicipios,
  loadStateSummary,
  loadNationalTrend,
  loadPartyMunicipal,
  loadPartyLookup,
  loadGeoJSON,
  ELECTION_YEARS,
  getRegion,
  classifyIdeologyBucket,
  IDEOLOGY_BANDS,
} from '../data/loader.js';
import { t, applyI18n, getLocale } from '../i18n/index.js';
import { bindTooltip } from './chartTooltip.js';
import * as L from 'leaflet';

let selectedProfileYear = null;
let allMunicipios = {};
let municipalitySeriesIndex = {};
let municipalityPartyIndex = {};
let municipalityPartyYearLoaded = null;
let partyLookup = {};
let stateSummary = [];
let nationalTrend = [];
let municipalityGeoIndex = {};
let municipalityStaticMap = null;
let municipalityStaticLayer = null;
let documentClickBound = false;

function getNumberLocale() {
  const locale = getLocale();
  if (locale === 'pt') return 'pt-BR';
  if (locale === 'es') return 'es-ES';
  return 'en-US';
}

function formatNumber(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(getNumberLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatSigned(value, digits = 3) {
  if (value == null || Number.isNaN(value)) return '—';
  const formatted = formatNumber(value, digits);
  return value > 0 ? `+${formatted}` : formatted;
}

function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  const normalized = Math.min(Number(value), 1);
  return `${formatNumber(normalized * 100, digits)}%`;
}

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function getIdeologyColor(value) {
  const bucket = classifyIdeologyBucket(value);
  return IDEOLOGY_BANDS.find((band) => band.key === bucket)?.color || '#d9d5cd';
}

function renderStaticMapContext(geocodig) {
  const mapContainer = document.getElementById('muni-static-map-canvas');
  if (!mapContainer) return;

  const target = municipalityGeoIndex[String(geocodig)];
  if (!target) {
    mapContainer.innerHTML = '';
    return;
  }

  if (municipalityStaticMap) {
    municipalityStaticMap.remove();
    municipalityStaticMap = null;
    municipalityStaticLayer = null;
  }

  municipalityStaticMap = L.map(mapContainer, {
    zoomControl: true,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(municipalityStaticMap);

  municipalityStaticLayer = L.geoJSON(target, {
    style: {
      color: '#154212',
      weight: 2,
      fillColor: '#154212',
      fillOpacity: 0.15,
    },
  }).addTo(municipalityStaticMap);

  municipalityStaticMap.zoomControl.setPosition('bottomright');
  municipalityStaticMap.fitBounds(municipalityStaticLayer.getBounds().pad(1.8));
}

function getLevelKey(value) {
  if (value > 0.12) return 'common.high';
  if (value > 0.07) return 'common.medium';
  return 'common.low';
}

function renderTopPartiesList(summary) {
  const container = document.getElementById('muni-top-parties-list');
  const totalEl = document.getElementById('muni-party-total');
  if (!container || !totalEl) return;

  totalEl.textContent = formatNumber(summary.rows.length);

  if (!summary.rows.length) {
    container.innerHTML = `<p class="text-sm leading-[1.7] text-on-surface-variant">${t('municipality.partyLandscapeEmpty')}</p>`;
    return;
  }

  const topRows = [...summary.rows]
    .sort((a, b) => (b.vote_share || 0) - (a.vote_share || 0))
    .slice(0, 5);

  container.innerHTML = topRows.map((row, index) => {
    const ideology = row.party_ideology ?? row.ideo_imputed;
    return `
      <div class="municipality-top-party-row">
        <div class="municipality-top-party-rank">${index + 1}</div>
        <div class="municipality-top-party-namewrap">
          <span class="municipality-top-party-swatch" style="background:${getIdeologyColor(ideology)}"></span>
          <p class="font-headline text-lg leading-tight truncate">${getPartyName(row.party)}</p>
        </div>
        <p class="municipality-top-party-ideo">${formatSigned(ideology, 2)}</p>
        <p class="municipality-top-party-share">${formatPercent(row.vote_share)}</p>
      </div>
    `;
  }).join('');
}

function computeVolatility(series) {
  if (series.length < 2) return null;
  let totalChange = 0;
  let comparisons = 0;
  for (let i = 1; i < series.length; i += 1) {
    const prev = series[i - 1].ideo_imp;
    const current = series[i].ideo_imp;
    if (prev == null || current == null) continue;
    totalChange += Math.abs(current - prev);
    comparisons += 1;
  }
  return comparisons ? totalChange / comparisons : null;
}

function summarizeMunicipalitySeries(series, selectedYear) {
  const activeSeries = series.filter((row) => row.year <= selectedYear && row.ideo_imp != null);
  const selectedRow = series.find((row) => row.year === selectedYear) || series[series.length - 1] || null;
  const earliest = series[0] || null;
  const latest = selectedRow;
  const values = activeSeries.map((row) => row.ideo_imp).filter((value) => value != null);
  const range = values.length ? Math.max(...values) - Math.min(...values) : null;
  const ideologyDiff = latest?.ideo_imp != null && getNationalAverage(latest.year) != null
    ? latest.ideo_imp - getNationalAverage(latest.year)
    : null;
  const stateDiff = latest?.ideo_imp != null && getStateAverage(latest.uf, latest.year) != null
    ? latest.ideo_imp - getStateAverage(latest.uf, latest.year)
    : null;

  return {
    activeSeries,
    selectedRow,
    earliest,
    latest,
    range,
    volatility: computeVolatility(activeSeries),
    ideologyDiff,
    stateDiff,
  };
}

function summarizePartyRows(rows = []) {
  const valid = rows.filter((row) => (row.party_ideology ?? row.ideo_imputed) != null && row.votes != null && row.votes > 0);
  const totalVotes = valid.reduce((sum, row) => sum + row.votes, 0);
  const coverageObserved = rows.reduce((sum, row) => sum + (row.party_imputed === 0 ? (row.vote_share || 0) : 0), 0);
  const coverageImputed = rows.reduce((sum, row) => sum + ((row.party_ideology ?? row.ideo_imputed) != null ? (row.vote_share || 0) : 0), 0);

  const gravity = totalVotes
    ? valid.reduce((sum, row) => sum + ((row.party_ideology ?? row.ideo_imputed) * row.votes), 0) / totalVotes
    : null;

  const bandVotes = Object.fromEntries(IDEOLOGY_BANDS.map((band) => [band.key, 0]));
  valid.forEach((row) => {
    const bucket = classifyIdeologyBucket(row.party_ideology ?? row.ideo_imputed);
    if (bucket) bandVotes[bucket] += row.votes;
  });

  return {
    rows: valid.sort((a, b) => ((a.party_ideology ?? a.ideo_imputed) - (b.party_ideology ?? b.ideo_imputed)) || (b.votes - a.votes)),
    totalVotes,
    gravity,
    coverageObserved,
    coverageImputed,
    bandShares: Object.fromEntries(IDEOLOGY_BANDS.map((band) => [band.key, totalVotes ? bandVotes[band.key] / totalVotes : null])),
  };
}

function getNationalAverage(year) {
  return nationalTrend.find((row) => row.year === year)?.mean ?? null;
}

function getStateAverage(uf, year) {
  return stateSummary.find((row) => row.uf === uf && row.year === year)?.mean_ideo ?? null;
}

function getPartyName(code) {
  const yearKey = `${selectedProfileYear}-${code}`;
  return partyLookup[yearKey] || t('municipality.partyCode', { code: String(code) });
}

function handleDocumentClick(e) {
  const input = document.getElementById('muni-search-input');
  const dropdown = document.getElementById('muni-search-dropdown');
  if (!input || !dropdown) return;
  if (!input.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('visible');
  }
}

export function createMunicipalProfilePage(municipioName = '') {
  return `
    <div class="min-h-screen bg-background">
      <main class="max-w-[1520px] mx-auto px-4 md:px-8 py-8 md:py-10">
        <section class="mb-10 md:mb-12">
          <div class="max-w-3xl mx-auto">
            <div class="relative group">
              <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-outline">search</span>
              </div>
              <input id="muni-search-input"
                     class="w-full bg-surface-container-lowest border border-outline-variant px-4 pl-12 py-4 text-lg font-headline focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-editorial"
                     data-i18n-placeholder="municipality.searchPlaceholder"
                     placeholder="Search for a municipality (e.g. São Paulo, Belo Horizonte...)"
                     type="text"
                     value="${municipioName}"
                     autocomplete="off"/>
              <div id="muni-search-dropdown" class="header-search-dropdown"></div>
            </div>
            <p class="text-center mt-3 font-label text-[10px] uppercase tracking-widest text-stone-400" data-i18n="municipality.selectMuni">Select a municipality to view profile</p>
          </div>
        </section>

        <div id="profile-content" class="${municipioName ? '' : 'hidden'} space-y-10 md:space-y-12">
          <section class="border-b border-outline-variant/20 pb-10 md:pb-12">
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div class="xl:col-span-8">
                <div class="flex flex-wrap items-center gap-3 mb-4">
                  <span class="font-label text-[10px] uppercase tracking-[0.18em] text-secondary font-bold" id="muni-region-badge">Region</span>
                  <span class="font-label text-[10px] uppercase tracking-[0.18em] text-outline" id="muni-uf">UF</span>
                  <span class="font-label text-[10px] uppercase tracking-[0.18em] text-outline" id="muni-period">2024</span>
                </div>
                <h1 class="text-4xl md:text-6xl font-headline font-semibold text-on-surface leading-[0.96] mb-4 italic" id="muni-name">${municipioName || 'Municipality Name'}</h1>
                <p id="muni-description" class="text-lg text-on-surface-variant font-headline leading-relaxed max-w-3xl"></p>
              </div>

              <div class="xl:col-span-4">
                <div class="municipality-coverage-panel">
                  <div class="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2" data-i18n="municipality.coverageIndicator">Coverage</p>
                      <p class="font-headline text-3xl" id="muni-coverage-year">2024</p>
                    </div>
                    <div class="text-right">
                      <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1" data-i18n="municipality.electionYear">Election year</p>
                      <select id="muni-year-select" class="bg-transparent border border-outline-variant/20 px-3 py-2 font-label text-sm shadow-none"></select>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2" data-i18n="municipality.coverageMunicipal">Municipal coverage</p>
                      <p class="font-headline text-2xl" id="muni-coverage-municipal">—</p>
                    </div>
                    <div>
                      <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2" data-i18n="municipality.coverageParty">Party coverage</p>
                      <p class="font-headline text-2xl" id="muni-coverage-party">—</p>
                    </div>
                  </div>
                  <p class="text-sm leading-[1.75] text-on-surface-variant" id="muni-coverage-copy">—</p>
                </div>
              </div>
            </div>
          </section>

          <section class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div class="xl:col-span-8 space-y-8">
              <section class="bg-surface-container-lowest p-6 md:p-8 shadow-editorial-lg border border-outline-variant/10">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6">
                  <div>
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2" data-i18n="municipality.longitudinalView">Longitudinal view</p>
                    <h2 class="font-headline text-3xl md:text-4xl leading-tight" data-i18n="municipality.evolutionTitle">Municipal ideology through time</h2>
                  </div>
                  <div class="text-right">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1" data-i18n="municipality.range">Range</p>
                    <p class="font-headline text-2xl" id="muni-range">—</p>
                  </div>
                </div>
                <div id="chart-evolution" class="w-full" style="height: 300px;"></div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div class="bg-surface-container-low p-4 border border-outline-variant/10">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2" data-i18n="municipality.currentScore">Current ideology score</p>
                    <p class="font-headline text-3xl" id="muni-ideo-score">—</p>
                  </div>
                  <div class="bg-surface-container-low p-4 border border-outline-variant/10">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2" data-i18n="municipality.fragmentationIndex">Fragmentation Index</p>
                    <p class="font-headline text-3xl" id="frag-value">—</p>
                    <p class="text-xs text-on-surface-variant mt-3" id="frag-copy"></p>
                  </div>
                  <div class="bg-surface-container-low p-4 border border-outline-variant/10">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2" data-i18n="municipality.secondaryPolarization">Polarization</p>
                    <p class="font-headline text-3xl" id="polar-value">—</p>
                    <p class="text-xs text-on-surface-variant mt-3" id="polar-copy"></p>
                  </div>
                </div>
              </section>

              <section class="bg-surface-container-lowest p-6 md:p-8 shadow-editorial-lg border border-outline-variant/10">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6">
                  <div>
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2" data-i18n="municipality.partyLandscape">Party landscape</p>
                    <h2 class="font-headline text-3xl md:text-4xl leading-tight" data-i18n="municipality.partyLandscapeTitle">Ideological distribution of parties and votes</h2>
                  </div>
                  <div class="text-right">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1" data-i18n="municipality.centerOfGravity">Center of gravity</p>
                    <p class="font-headline text-2xl" id="muni-party-gravity">—</p>
                  </div>
                </div>
                <p class="text-sm leading-[1.75] text-on-surface-variant mb-6" id="muni-party-summary">—</p>
                <div id="muni-party-landscape-chart" class="w-full" style="height: 420px;"></div>
                <div class="mt-6">
                  <div class="flex h-3 overflow-hidden border border-outline-variant/10 bg-surface-container-low">
                    ${IDEOLOGY_BANDS.map((band) => `<div style="width:${100 / IDEOLOGY_BANDS.length}%;background:${band.color}"></div>`).join('')}
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 mt-4" id="muni-party-block-shares"></div>
                </div>
              </section>
            </div>

            <aside class="xl:col-span-4 space-y-8">
              <section class="bg-surface-container-lowest p-6 md:p-8 shadow-editorial-lg border border-outline-variant/10">
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-3" data-i18n="municipality.localGeography">Local Geography</p>
                <h3 class="font-headline text-2xl leading-tight mb-4" data-i18n="municipality.staticMapTitle">Geographic context</h3>
                <div class="municipality-static-map mb-4">
                  <div class="municipality-static-map-grid"></div>
                  <div id="muni-static-map-canvas" class="municipality-static-map-canvas relative z-[2]"></div>
                  <p class="font-headline italic text-lg relative z-[3] mt-3" id="muni-static-map-label">—</p>
                </div>
                <p class="text-sm leading-[1.75] text-on-surface-variant" id="muni-static-map-copy">—</p>
              </section>

              <section class="bg-surface-container-lowest p-6 md:p-8 shadow-editorial-lg border border-outline-variant/10">
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-3" data-i18n="municipality.comparativePanel">Comparative panel</p>
                <div class="space-y-4">
                  <div class="municipality-comparison-row">
                    <span class="font-label text-[9px] uppercase tracking-[0.18em] text-outline" data-i18n="municipality.vsStateAvg">vs. State average</span>
                    <span class="font-headline text-xl" id="comp-uf-ideo">—</span>
                  </div>
                  <div class="municipality-comparison-row">
                    <span class="font-label text-[9px] uppercase tracking-[0.18em] text-outline" data-i18n="municipality.vsNationalAvg">vs. National average</span>
                    <span class="font-headline text-xl" id="comp-br-ideo">—</span>
                  </div>
                  <div class="municipality-comparison-row">
                    <span class="font-label text-[9px] uppercase tracking-[0.18em] text-outline" data-i18n="municipality.volatilityRank">Volatility rank</span>
                    <span class="font-headline text-xl" id="comp-rank">—</span>
                  </div>
                </div>
              </section>

              <section class="bg-surface-container-lowest p-6 md:p-8 shadow-editorial-lg border border-outline-variant/10">
                <div class="flex items-end justify-between gap-4 mb-5">
                  <div>
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2" data-i18n="municipality.partySnapshot">Party snapshot</p>
                    <h3 class="font-headline text-2xl leading-tight" data-i18n="municipality.topPartiesTitle">Local party structure in the active year</h3>
                  </div>
                  <div class="text-right">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1" data-i18n="municipality.totalPartiesWithVotes">Total parties with votes</p>
                    <p class="font-headline text-2xl" id="muni-party-total">—</p>
                  </div>
                </div>
                <div class="municipality-top-party-headings">
                  <span>#</span>
                  <span data-i18n="common.party">Party</span>
                  <span data-i18n="tooltip.ideology">Ideology</span>
                  <span data-i18n="municipality.voteShare">Vote share</span>
                </div>
                <div id="muni-top-parties-list"></div>
              </section>
            </aside>
          </section>
        </div>

        <div id="profile-empty" class="${municipioName ? 'hidden' : ''} text-center py-20">
          <span class="material-symbols-outlined text-6xl text-stone-300 mb-6 block">map</span>
          <h2 class="text-2xl font-headline font-bold text-stone-400 mb-4" data-i18n="municipality.selectMuni">Select a municipality to view profile</h2>
          <p class="text-on-surface-variant max-w-md mx-auto" data-i18n="municipality.searchHelp">Search by municipality name to inspect its ideology trajectory and territorial comparisons.</p>
        </div>
      </main>
    </div>
  `;
}

export async function initMunicipalProfilePage() {
  const input = document.getElementById('muni-search-input');
  const dropdown = document.getElementById('muni-search-dropdown');
  const yearSelect = document.getElementById('muni-year-select');
  if (!input || !dropdown) return;

  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const urlGeocodig = params.get('geocodig') || '';
  const urlName = params.get('id') || '';
  const urlYear = Number(params.get('year')) || null;

  selectedProfileYear = urlYear;
  await ensureMunicipalityData();
  applyI18n(document);

  if (urlName || urlGeocodig) {
    input.value = urlName;
    await showMunicipalityProfile(urlName, urlGeocodig);
  }

  if (yearSelect && !yearSelect.dataset.bound) {
    yearSelect.addEventListener('change', () => {
      selectedProfileYear = yearSelect.value ? Number(yearSelect.value) : null;
      const activeParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const activeGeocodig = activeParams.get('geocodig') || '';
      const activeName = input.value.trim();
      if (!activeName && !activeGeocodig) return;
      updateMunicipalityHash(activeName, activeGeocodig, selectedProfileYear);
    });
    yearSelect.dataset.bound = 'true';
  }

  let debounceTimer = null;
  if (!input.dataset.bound) {
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = normalize(input.value);

      if (q.length < 2) {
        dropdown.classList.remove('visible');
        dropdown.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(() => {
        const matches = Object.values(allMunicipios)
          .filter((m) => normalize(m.tse_name || m.ibge_name || '').includes(q))
          .slice(0, 8);

        if (!matches.length) {
          dropdown.classList.remove('visible');
          dropdown.innerHTML = '';
          return;
        }

        dropdown.innerHTML = matches.map((m) => `
          <div class="search-result" data-geocodig="${m.GEOCODIG_M}" data-name="${m.tse_name || m.ibge_name}">
            <span class="search-result-name">${m.tse_name || m.ibge_name}</span>
            <span class="search-result-uf">${m.uf}</span>
          </div>
        `).join('');

        dropdown.classList.add('visible');
        dropdown.querySelectorAll('.search-result').forEach((el) => {
          el.addEventListener('click', () => {
            window.location.hash = `/municipio?id=${encodeURIComponent(el.dataset.name)}&geocodig=${el.dataset.geocodig}`;
          });
        });
      }, 120);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (!q) return;
        const exact = Object.values(allMunicipios).find((row) => normalize(row.tse_name || row.ibge_name || '') === normalize(q));
        if (exact) {
          updateMunicipalityHash(exact.tse_name || exact.ibge_name || q, String(exact.GEOCODIG_M), selectedProfileYear);
        } else {
          updateMunicipalityHash(q, '', selectedProfileYear);
        }
      }
      if (e.key === 'Escape') {
        dropdown.classList.remove('visible');
        input.blur();
      }
    });

    input.dataset.bound = 'true';
  }

  if (!documentClickBound) {
    document.addEventListener('click', handleDocumentClick);
    documentClickBound = true;
  }
}

async function ensureMunicipalityData() {
  if (
    Object.keys(allMunicipios).length &&
    Object.keys(municipalitySeriesIndex).length &&
    Object.keys(partyLookup).length &&
    stateSummary.length &&
    nationalTrend.length
  ) {
    return;
  }

  const [yearly, stateRows, nationalRows, lookup] = await Promise.all([
    Promise.all(ELECTION_YEARS.map((year) => loadMunicipios(year).catch(() => []))),
    loadStateSummary().catch(() => []),
    loadNationalTrend().catch(() => []),
    loadPartyLookup().catch(() => ({})),
  ]);

  municipalitySeriesIndex = {};
  allMunicipios = {};
  yearly.forEach((rows) => {
    rows.forEach((row) => {
      if (!municipalitySeriesIndex[row.GEOCODIG_M]) municipalitySeriesIndex[row.GEOCODIG_M] = [];
      municipalitySeriesIndex[row.GEOCODIG_M].push(row);
      allMunicipios[row.GEOCODIG_M] = row;
    });
  });

  Object.values(municipalitySeriesIndex).forEach((series) => series.sort((a, b) => a.year - b.year));

  partyLookup = Object.fromEntries((lookup || []).map((row) => [`${row.year}-${row.party_code}`, row.party_label]));
  stateSummary = stateRows;
  nationalTrend = nationalRows;

  const geoJSON = await loadGeoJSON().catch(() => null);
  if (geoJSON?.features?.length) {
    municipalityGeoIndex = Object.fromEntries(geoJSON.features.map((feature) => [String(feature.properties.CD_MUN), feature]));
  }
}

async function ensureMunicipalityPartyYear(year) {
  if (municipalityPartyYearLoaded === year && Object.keys(municipalityPartyIndex).length) return;

  const rows = await loadPartyMunicipal(year).catch(() => []);
  municipalityPartyIndex = {};
  rows.forEach((row) => {
    const key = `${row.GEOCODIG_M}-${row.year}`;
    if (!municipalityPartyIndex[key]) municipalityPartyIndex[key] = [];
    municipalityPartyIndex[key].push(row);
  });
  municipalityPartyYearLoaded = year;
}

function updateMunicipalityHash(name, geocodig, year) {
  const params = new URLSearchParams();
  if (name) params.set('id', name);
  if (geocodig) params.set('geocodig', geocodig);
  if (year) params.set('year', String(year));
  window.location.hash = `/municipio?${params.toString()}`;
}

async function showMunicipalityProfile(name, geocodig) {
  const profileContent = document.getElementById('profile-content');
  const emptyState = document.getElementById('profile-empty');
  if (!profileContent || !emptyState) return;

  let muni = geocodig ? allMunicipios[geocodig] : null;
  if (!muni && name) {
    const normalizedName = normalize(name);
    muni = Object.values(allMunicipios).find((row) => normalize(row.tse_name || row.ibge_name || '') === normalizedName);
  }

  if (!muni) {
    profileContent.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  const series = municipalitySeriesIndex[muni.GEOCODIG_M] || [];
  const availableYears = series.map((row) => row.year).sort((a, b) => a - b);
  if (selectedProfileYear == null || !availableYears.includes(selectedProfileYear)) {
    selectedProfileYear = availableYears[availableYears.length - 1] || null;
  }

  const summary = summarizeMunicipalitySeries(series, selectedProfileYear);
  const latest = summary.latest || muni;
  await ensureMunicipalityPartyYear(latest.year);
  const partyRows = municipalityPartyIndex[`${latest.GEOCODIG_M}-${latest.year}`] || [];
  const partySummary = summarizePartyRows(partyRows);
  const region = getRegion(latest.uf) || t('common.region');
  const currentLabel = t(`ideo.${classifyIdeologyBucket(latest.ideo_imp) || 'center'}`);

  profileContent.classList.remove('hidden');
  emptyState.classList.add('hidden');

  const yearSelect = document.getElementById('muni-year-select');
  if (yearSelect) {
    yearSelect.innerHTML = availableYears.map((year) => `<option value="${year}" ${year === selectedProfileYear ? 'selected' : ''}>${year}</option>`).join('');
  }

  setText('muni-name', latest.tse_name || latest.ibge_name);
  setText('muni-uf', latest.uf);
  setText('muni-region-badge', region);
  setText('muni-period', String(latest.year));
  setText('muni-description', t('municipality.description', {
    name: latest.tse_name || latest.ibge_name,
    band: currentLabel.toLowerCase(),
    elections: formatNumber(summary.activeSeries.length),
    movement: t(summary.volatility == null ? 'common.medium' : getLevelKey(summary.volatility)).toLowerCase(),
  }));

  setText('muni-coverage-year', String(latest.year));
  setText('muni-coverage-municipal', latest.ideo_imp != null ? t('municipality.coverageAvailable') : t('municipality.coverageUnavailable'));
  setText('muni-coverage-party', formatPercent(partySummary.coverageObserved ?? partySummary.coverageImputed, 1));
  setText('muni-coverage-copy', t('municipality.coverageCopy', {
    year: String(latest.year),
    observed: formatPercent(partySummary.coverageObserved, 1),
  }));

  setText('muni-range', summary.range == null ? '—' : formatNumber(summary.range, 2));
  setText('frag-value', latest.enep != null ? formatNumber(latest.enep, 2) : '—');
  setText('frag-copy', latest.enep == null ? t('municipality.fragNoData') : t('municipality.fragPartyCopy'));
  setText('polar-value', latest.pol_sanisarto != null ? formatNumber(latest.pol_sanisarto, 3) : '—');
  setText('polar-copy', latest.pol_sanisarto == null ? t('municipality.polarNoData') : t('municipality.polarCopy'));

  const scoreEl = document.getElementById('muni-ideo-score');
  if (scoreEl) {
    scoreEl.textContent = formatSigned(latest.ideo_imp);
    scoreEl.className = 'font-headline text-3xl';
    scoreEl.style.color = getIdeologyColor(latest.ideo_imp);
  }

  setText('comp-uf-ideo', summary.stateDiff == null ? '—' : formatSigned(summary.stateDiff, 2));
  setText('comp-br-ideo', summary.ideologyDiff == null ? '—' : formatSigned(summary.ideologyDiff, 2));
  setText('comp-rank', summary.volatility == null ? '—' : t(getLevelKey(summary.volatility)));

  setText('muni-party-gravity', formatSigned(partySummary.gravity, 3));
  setText('muni-party-summary', t('municipality.partyLandscapeCopy', {
    year: String(latest.year),
    gravity: formatSigned(partySummary.gravity, 3),
    parties: formatNumber(partySummary.rows.length),
  }));

  const partyBands = document.getElementById('muni-party-block-shares');
  if (partyBands) {
    partyBands.innerHTML = IDEOLOGY_BANDS.map((band) => `
      <div class="border border-outline-variant/10 p-4" style="background:${band.color}0d">
        <p class="font-label text-[9px] uppercase tracking-[0.18em] mb-2" style="color:${band.color}">${t(band.labelKey)}</p>
        <p class="font-headline text-2xl">${formatPercent(partySummary.bandShares?.[band.key])}</p>
      </div>
    `).join('');
  }

  setText('muni-static-map-label', `${latest.tse_name || latest.ibge_name} · ${latest.uf}`);
  setText('muni-static-map-copy', t('municipality.staticMapCopy', { region, uf: latest.uf }));
  renderStaticMapContext(latest.GEOCODIG_M, latest.uf);

  renderEvolutionChart(
    document.getElementById('chart-evolution'),
    series,
    selectedProfileYear,
    (year) => updateMunicipalityHash(latest.tse_name || latest.ibge_name || '', String(latest.GEOCODIG_M), year),
  );
  renderPartyLandscapeChart(document.getElementById('muni-party-landscape-chart'), partySummary, latest.year);
  renderTopPartiesList(partySummary);

  document.title = `${latest.tse_name || latest.ibge_name} — ${t('landing.heroTitle')}`;
}

function renderEvolutionChart(container, series, highlightedYear = null, onYearSelect = null) {
  if (!container || !series.length) return;

  const width = container.clientWidth || 760;
  const height = 300;
  const margin = { top: 20, right: 18, bottom: 42, left: 44 };
  const values = series.map((row) => row.ideo_imp).filter((value) => value != null);
  const minYear = series[0].year;
  const maxYear = series[series.length - 1].year;
  const minVal = Math.min(-0.5, ...values);
  const maxVal = Math.max(0.5, ...values);
  const xScale = (year) => margin.left + ((year - minYear) / (maxYear - minYear || 1)) * (width - margin.left - margin.right);
  const yScale = (value) => margin.top + (height - margin.top - margin.bottom) - ((value - minVal) / (maxVal - minVal || 1)) * (height - margin.top - margin.bottom);

  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  container.appendChild(svg);

  [minVal, 0, maxVal].forEach((value) => {
    const y = yScale(value);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(margin.left));
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(width - margin.right));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', value === 0 ? '#72796e' : '#eae8e3');
    line.setAttribute('stroke-dasharray', value === 0 ? '4 4' : '');
    svg.appendChild(line);
  });

  const path = series
    .filter((row) => row.ideo_imp != null)
    .map((row, index) => `${index === 0 ? 'M' : 'L'}${xScale(row.year)},${yScale(row.ideo_imp)}`)
    .join(' ');

  const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  linePath.setAttribute('d', path);
  linePath.setAttribute('fill', 'none');
  linePath.setAttribute('stroke', '#154212');
  linePath.setAttribute('stroke-width', '3');
  svg.appendChild(linePath);

  series.forEach((row) => {
    if (row.ideo_imp == null) return;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(xScale(row.year)));
    circle.setAttribute('cy', String(yScale(row.ideo_imp)));
    circle.setAttribute('r', row.year === highlightedYear ? '6' : '3.5');
    circle.setAttribute('fill', getIdeologyColor(row.ideo_imp));
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '1.5');
    if (onYearSelect) {
      circle.style.cursor = 'pointer';
      circle.addEventListener('click', () => onYearSelect(row.year));
    }
    bindTooltip(circle, container, () => `<strong>${row.year}</strong><br>${formatSigned(row.ideo_imp)}`);
    svg.appendChild(circle);
  });
}

function renderPartyLandscapeChart(container, summary, year) {
  if (!container) return;
  if (!summary.rows.length) {
    container.innerHTML = `<p class="text-sm leading-[1.7] text-on-surface-variant">${t('municipality.partyLandscapeEmpty')}</p>`;
    return;
  }

  const width = container.clientWidth || 720;
  const height = 420;
  const margin = { top: 24, right: 24, bottom: 52, left: 36 };
  const minX = -1;
  const maxX = 1;
  const maxShare = Math.max(...summary.rows.map((row) => row.vote_share || 0), 0.05);
  const xScale = (value) => margin.left + ((value - minX) / (maxX - minX || 1)) * (width - margin.left - margin.right);
  const barWidth = 18;
  const yScale = (value) => margin.top + (height - margin.top - margin.bottom) - ((value - 0) / (maxShare || 1)) * (height - margin.top - margin.bottom);

  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  container.appendChild(svg);

  const baseline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  baseline.setAttribute('x1', String(margin.left));
  baseline.setAttribute('y1', String(height - margin.bottom));
  baseline.setAttribute('x2', String(width - margin.right));
  baseline.setAttribute('y2', String(height - margin.bottom));
  baseline.setAttribute('stroke', '#c9c4bc');
  baseline.setAttribute('stroke-width', '1');
  svg.appendChild(baseline);

  [-1, 0, 1].forEach((tick) => {
    const x = xScale(tick);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x));
    line.setAttribute('x2', String(x));
    line.setAttribute('y1', String(margin.top));
    line.setAttribute('y2', String(height - margin.bottom));
    line.setAttribute('stroke', tick === 0 ? '#72796e' : '#eae8e3');
    line.setAttribute('stroke-dasharray', tick === 0 ? '5 4' : '');
    svg.appendChild(line);
  });

  summary.rows.forEach((row) => {
    const ideology = row.party_ideology ?? row.ideo_imputed;
    const voteShare = row.vote_share || (summary.totalVotes ? row.votes / summary.totalVotes : 0);
    const x = xScale(ideology) - (barWidth / 2);
    const y = yScale(voteShare);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(barWidth));
    rect.setAttribute('height', String(height - margin.bottom - y));
    rect.setAttribute('fill', getIdeologyColor(ideology));
    rect.setAttribute('opacity', '0.82');
    bindTooltip(rect, container, () => `
      <strong>${getPartyName(row.party)}</strong><br>
      ${t('tooltip.ideology')}: ${formatSigned(ideology)}<br>
      ${t('municipality.voteShare')}: ${formatPercent(voteShare)}<br>
      ${t('common.year')}: ${year}
    `);
    svg.appendChild(rect);

    if (voteShare >= 0.05) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x + (barWidth / 2)));
      label.setAttribute('y', String(y - 6));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#1b1c19');
      label.textContent = getPartyName(row.party);
      svg.appendChild(label);
    }
  });

  if (summary.gravity != null) {
    const x = xScale(summary.gravity);
    const gravityLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gravityLine.setAttribute('x1', String(x));
    gravityLine.setAttribute('x2', String(x));
    gravityLine.setAttribute('y1', String(margin.top));
    gravityLine.setAttribute('y2', String(height - margin.bottom));
    gravityLine.setAttribute('stroke', '#1f9de4');
    gravityLine.setAttribute('stroke-width', '3');
    gravityLine.setAttribute('stroke-dasharray', '6 4');
    svg.appendChild(gravityLine);

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    marker.setAttribute('x', String(x - 64));
    marker.setAttribute('y', String(margin.top));
    marker.setAttribute('width', '128');
    marker.setAttribute('height', '38');
    marker.setAttribute('rx', '12');
    marker.setAttribute('fill', '#1b1c19');
    svg.appendChild(marker);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(x));
    label.setAttribute('y', String(margin.top + 24));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', '700');
    label.setAttribute('fill', '#ffffff');
    label.textContent = `${t('municipality.gravityShort')} ${formatNumber(summary.gravity, 2)}`;
    svg.appendChild(label);
  }
}
