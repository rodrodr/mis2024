/**
 * SpatialExplorerPage.js
 * Minimal map page with temporal control and yearly analytical summary.
 */

import { ELECTION_YEARS, IDEOLOGY_BANDS, loadGeoJSON, loadMunicipios, summarizeMunicipalIdeology } from '../data/loader.js';
import { applyI18n, getLocale, t } from '../i18n/index.js';
import { initMapComponent, updateMapYear } from './Map.js';

const DEFAULT_YEAR = ELECTION_YEARS[ELECTION_YEARS.length - 1];

let currentYear = DEFAULT_YEAR;
let currentVariable = 'ideo_imp';
let loadSequence = 0;

function getNumberLocale() {
  const locale = getLocale();
  if (locale === 'pt') return 'pt-BR';
  if (locale === 'es') return 'es-ES';
  return 'en-US';
}

function formatCount(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat(getNumberLocale()).format(value);
}

function formatDecimal(value, digits = 3, withSign = false) {
  if (value == null || Number.isNaN(value)) return '—';
  const number = Number(value);
  return `${withSign && number > 0 ? '+' : ''}${number.toFixed(digits)}`;
}

function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${(Math.min(Number(value), 1) * 100).toFixed(digits)}%`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setHTML(id, value) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = value;
}

function updateSummaryCard(rows) {
  const summary = summarizeMunicipalIdeology(rows);
  const bandShares = summary.bandShares || {};
  setText('electoral-map-summary-year', String(currentYear));
  setText('electoral-map-summary-count', formatCount(summary.count));
  setText('electoral-map-summary-mean', formatDecimal(summary.mean, 3, true));

  const bandsContainer = document.getElementById('electoral-map-summary-bands');
  if (bandsContainer) {
    bandsContainer.innerHTML = IDEOLOGY_BANDS.map((band) => `
      <div class="border border-outline-variant/15 bg-surface-container-low/35 px-3 py-3">
        <p class="font-label text-[9px] uppercase tracking-[0.18em] mb-2" style="color:${band.color}">${t(band.labelKey)}</p>
        <p class="font-headline text-xl">${formatPercent(bandShares[band.key])}</p>
      </div>
    `).join('');
  }

  setHTML('electoral-map-summary-body', summary.count
    ? t('map.summaryBody', {
        year: String(currentYear),
        mean: formatDecimal(summary.mean, 3, true),
        extremeLeft: formatPercent(bandShares.extremeLeft),
        left: formatPercent(bandShares.left),
        centerLeft: formatPercent(bandShares.centerLeft),
        center: formatPercent(bandShares.center),
        centerRight: formatPercent(bandShares.centerRight),
        right: formatPercent(bandShares.right),
        extremeRight: formatPercent(bandShares.extremeRight),
        leftRegion: summary.leftRegion?.region || '—',
        rightRegion: summary.rightRegion?.region || '—',
      })
    : t('map.summaryEmpty'));
}

function syncControls() {
  const slider = document.getElementById('electoral-map-timeline');
  if (slider) slider.value = String(currentYear);
  setText('electoral-map-current-year', String(currentYear));
}

async function loadYear(year) {
  const sequence = ++loadSequence;
  const rows = await loadMunicipios(year).catch(() => []);
  if (sequence !== loadSequence) return;
  currentYear = year;
  syncControls();
  updateMapYear(currentYear, currentVariable, rows);
  updateSummaryCard(rows);
}

function bindControls() {
  const slider = document.getElementById('electoral-map-timeline');
  if (!slider || slider.dataset.bound === 'true') return;

  slider.addEventListener('input', async () => {
    await loadYear(Number(slider.value));
  });

  slider.dataset.bound = 'true';
}

export function createSpatialExplorerPage() {
  const lastIndex = ELECTION_YEARS.length - 1;
  const tickMarkup = ELECTION_YEARS.map((year, index) => {
    const showOnDesktop = index === 0 || index === lastIndex || index % 2 === 0;
    const showOnMobile = index === 0 || index === lastIndex || index % 4 === 0;
    let classes = 'hidden';

    if (showOnMobile) classes = 'inline';
    else if (showOnDesktop) classes = 'hidden md:inline';

    return `<span class="${classes}">${year}</span>`;
  }).join('');

  return `
    <div class="map-atlas-page min-h-[calc(100vh-73px)] bg-background text-on-background">
      <main class="px-0 md:px-0 py-0">
        <section class="max-w-[1600px] mx-auto bg-surface-container-lowest border border-outline-variant/10 shadow-editorial-lg overflow-hidden">
          <div class="relative h-[calc(100vh-73px)] min-h-[560px] bg-surface-container-low atlas-map-stage">
            <div id="spatial-map-container" class="absolute inset-0"></div>
            <aside class="absolute top-3 right-3 md:top-6 md:right-6 z-[60] w-[min(25rem,calc(100%-1.5rem))] md:w-[22rem] pointer-events-none">
              <div class="electoral-map-summary-card pointer-events-auto">
                <div class="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2" data-i18n="map.summaryEyebrow">Year reading</p>
                    <h2 class="font-headline text-3xl leading-[0.95]" id="electoral-map-summary-year">${currentYear}</h2>
                  </div>
                  <div class="text-right">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1" data-i18n="map.summaryCoverage">Coverage</p>
                    <p class="font-headline text-2xl" id="electoral-map-summary-count">—</p>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3 mb-5">
                  <div>
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2" data-i18n="map.summaryMean">Mean</p>
                    <p class="font-headline text-2xl" id="electoral-map-summary-mean">—</p>
                  </div>
                  <div class="col-span-2">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2" data-i18n="map.summaryBands">Seven-band distribution</p>
                    <div class="flex h-3 overflow-hidden border border-outline-variant/15 bg-surface-container-low/35">
                      ${IDEOLOGY_BANDS.map((band) => `<div style="width:${100 / IDEOLOGY_BANDS.length}%;background:${band.color}"></div>`).join('')}
                    </div>
                  </div>
                </div>

                <div class="mb-5 pb-5 border-b border-white/35">
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3" data-i18n="map.summaryBands">Seven-band distribution</p>
                  <div id="electoral-map-summary-bands" class="grid grid-cols-2 md:grid-cols-4 gap-3"></div>
                </div>

                <p class="text-sm leading-[1.75] text-on-surface-variant" id="electoral-map-summary-body">—</p>
              </div>
            </aside>
            <div class="absolute left-0 bottom-0 z-[60] pointer-events-none">
              <div class="ml-3 md:ml-6 mb-3 md:mb-6 w-[min(28rem,calc(100vw-1.5rem))] md:w-[min(24rem,28vw)] border border-outline-variant/10 bg-background/62 backdrop-blur-sm shadow-editorial pointer-events-auto">
                <div class="px-4 md:px-5 py-3 md:py-4">
                  <div class="flex items-center justify-between gap-4 mb-2">
                    <p class="font-label text-[10px] uppercase tracking-[0.18em] text-outline" data-i18n="common.year">Year</p>
                    <p class="font-headline text-2xl md:text-3xl text-primary" id="electoral-map-current-year">${currentYear}</p>
                  </div>
                  <input id="electoral-map-timeline" type="range" min="1994" max="2024" step="2" value="${currentYear}" class="w-full atlas-timeline-range atlas-timeline-range-ideo">
                  <div class="mt-2 flex justify-between gap-2 font-label text-[9px] uppercase tracking-[0.16em] text-outline atlas-timeline-ticks">${tickMarkup}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>`;
}

export async function initSpatialExplorerPage() {
  currentYear = DEFAULT_YEAR;
  currentVariable = 'ideo_imp';
  applyI18n(document);
  bindControls();
  syncControls();

  try {
    const [geoJSON, rows] = await Promise.all([
      loadGeoJSON().catch(() => null),
      loadMunicipios(currentYear).catch(() => []),
    ]);

    if (geoJSON?.features?.length > 0) {
      await initMapComponent('spatial-map-container', geoJSON, currentYear, currentVariable, rows);
    }
    updateSummaryCard(rows);
  } catch (err) {
    console.error('Failed to init spatial explorer:', err);
  }
}

export { currentYear, currentVariable };
