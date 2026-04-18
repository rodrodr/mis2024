/**
 * DashboardPage.js
 * National analytical dashboard for ideology, polarization, and party system.
 */

import { IDEOLOGY_BANDS, loadDashboardNational, loadMunicipios, summarizeMunicipalIdeology } from '../data/loader.js';
import { getLocale, t } from '../i18n/index.js';
import { bindTooltip } from './chartTooltip.js';

const DEFAULT_YEAR = 2024;
let dashboardController = null;
let dashboardExtremesRequest = 0;
let dashboardMunicipalSummaryRequest = 0;

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

function bindYearSelectionPoint(point, year, compareYear = null) {
  point.style.cursor = 'pointer';
  point.setAttribute('tabindex', '0');
  point.setAttribute('role', 'button');
  point.setAttribute('aria-label', t('dashboard.pointAriaLabel', { year: String(year) }));
  point.classList.add('dashboard-chart-point');
  point.addEventListener('click', () => {
    applyDashboardSelection(year, compareYear);
  });
  point.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      applyDashboardSelection(year, compareYear);
    }
  });
}

function byYear(rows) {
  return [...rows].sort((a, b) => a.year - b.year);
}

function getActiveYear(rows) {
  const years = rows.map((row) => row.year);
  return years.includes(DEFAULT_YEAR) ? DEFAULT_YEAR : years[years.length - 1];
}

function getYearRow(rows, year) {
  return rows.find((row) => row.year === year) || rows[rows.length - 1] || null;
}

function getCompareRow(rows, year) {
  return rows.find((row) => row.year === year) || null;
}

function computeDelta(current, previous, key) {
  if (!current || !previous) return null;
  const a = current[key];
  const b = previous[key];
  if (a == null || b == null) return null;
  return a - b;
}

function buildYearOptions(rows, selectedYear, excludeYear = null) {
  return rows.map((row) => `
    <option value="${row.year}" ${row.year === selectedYear ? 'selected' : ''} ${row.year === excludeYear ? 'disabled' : ''}>${row.year}</option>
  `).join('');
}

export function createDashboardPage() {
  return `
    <div class="min-h-screen bg-background dashboard-page">
      <main class="px-6 md:px-8 py-8 md:py-12">
        <section class="max-w-[1440px] mx-auto mb-10 md:mb-14">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 items-end border-b border-outline-variant/20 pb-8 md:pb-10">
            <div class="xl:col-span-7">
              <span class="font-label text-[10px] uppercase tracking-[0.22em] text-tertiary font-bold mb-4 block" data-i18n="dashboard.specialReport">${t('dashboard.specialReport')}</span>
              <h1 class="text-5xl md:text-6xl xl:text-7xl font-headline leading-[0.92] tracking-[-0.04em] mb-5 max-w-[12ch]">
                ${t('dashboard.titleLine1')}<br><span class="italic text-primary">${t('dashboard.titleLine2')}</span>
              </h1>
              <p class="text-lg md:text-[1.2rem] text-on-surface-variant max-w-[44rem] leading-[1.65]" data-i18n="dashboard.fracturingDesc">${t('dashboard.fracturingDesc')}</p>
            </div>
            <div class="xl:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-surface-container-lowest border border-outline-variant/10 p-5 shadow-editorial">
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.focusYear')}</p>
                <p class="font-headline text-3xl" id="dashboard-focus-year">2024</p>
              </div>
              <div class="bg-surface-container-lowest border border-outline-variant/10 p-5 shadow-editorial">
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.coverage')}</p>
                <p class="font-headline text-3xl" id="dashboard-coverage">—</p>
              </div>
              <div class="bg-surface-container-lowest border border-outline-variant/10 p-5 shadow-editorial">
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.compareLabel')}</p>
                <p class="font-headline text-3xl" id="dashboard-compare-year">2016</p>
              </div>
            </div>
          </div>
        </section>

        <section class="max-w-[1440px] mx-auto mb-12 md:mb-16">
          <div class="dashboard-control-band bg-surface-container-low border border-outline-variant/10 p-5 md:p-6 flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8">
            <div class="flex-1">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.timelineControl')}</p>
              <div class="flex items-center gap-4">
                <input id="dashboard-year-slider" type="range" min="1994" max="2024" step="2" value="2024" class="w-full">
                <span class="font-label text-[11px] uppercase tracking-[0.16em] font-bold min-w-[3rem] text-right" id="dashboard-year-label">2024</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[320px]">
              <label class="flex flex-col gap-2">
                <span class="font-label text-[9px] uppercase tracking-[0.18em] text-outline">${t('dashboard.zoomYear')}</span>
                <select id="dashboard-year-select" class="border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-label text-sm"></select>
              </label>
              <label class="flex flex-col gap-2">
                <span class="font-label text-[9px] uppercase tracking-[0.18em] text-outline">${t('dashboard.compareSecondary')}</span>
                <select id="dashboard-compare-select" class="border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-label text-sm"></select>
              </label>
            </div>
          </div>
        </section>

        <section class="max-w-[1440px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12 md:mb-16">
          <div class="xl:col-span-8 bg-surface-container-lowest border border-outline-variant/10 shadow-editorial-lg">
            <div class="p-6 md:p-8 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2">${t('dashboard.longitudinalPanel')}</p>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight max-w-[14ch]">${t('dashboard.longitudinalTitle')}</h2>
              </div>
              <p class="text-sm leading-[1.7] text-on-surface-variant max-w-[28rem]">${t('dashboard.longitudinalCopy')}</p>
            </div>
            <div class="p-6 md:p-8">
              <div id="dashboard-main-chart" class="w-full" style="min-height: 420px;"></div>
            </div>
          </div>
          <div class="xl:col-span-4 space-y-5">
            <article class="bg-surface-container-lowest border border-outline-variant/10 p-6 shadow-editorial">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('dashboard.yearReading')}</p>
              <p class="font-headline text-2xl leading-[1.25] mb-3" id="dashboard-year-summary-title">—</p>
              <p class="text-sm leading-[1.75] text-on-surface-variant" id="dashboard-year-summary-body">—</p>
            </article>
            <article class="bg-surface-container-lowest border border-outline-variant/10 p-6 shadow-editorial">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-4">${t('dashboard.comparePanel')}</p>
              <div class="space-y-4" id="dashboard-compare-panel"></div>
            </article>
          </div>
        </section>

        <section class="max-w-[1440px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          <article class="bg-surface-container-lowest border border-outline-variant/10 shadow-editorial-lg">
            <div class="p-6 md:p-7 border-b border-outline-variant/10">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2">${t('dashboard.dimensionIdeology')}</p>
              <h3 class="font-headline text-3xl mb-2">${t('dashboard.dimensionIdeologyTitle')}</h3>
              <p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.dimensionIdeologyCopy')}</p>
            </div>
            <div class="p-6 md:p-7 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.currentMean')}</p>
                  <p class="font-headline text-3xl" id="kpi-ideology-mean">—</p>
                </div>
                <div>
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.currentDispersion')}</p>
                  <p class="font-headline text-3xl" id="kpi-ideology-dispersion">—</p>
                </div>
              </div>
              <div id="dashboard-ideology-shares" class="space-y-3"></div>
            </div>
          </article>

          <article class="bg-surface-container-lowest border border-outline-variant/10 shadow-editorial-lg">
            <div class="p-6 md:p-7 border-b border-outline-variant/10">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-secondary font-bold mb-2">${t('dashboard.dimensionPolarization')}</p>
              <h3 class="font-headline text-3xl mb-2">${t('dashboard.dimensionPolarizationTitle')}</h3>
              <p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.dimensionPolarizationCopy')}</p>
            </div>
            <div class="p-6 md:p-7 space-y-5">
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.saniSartori')}</p>
                <p class="font-headline text-4xl" id="kpi-polarization-sani">—</p>
              </div>
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.daltonPi')}</p>
                <p class="font-headline text-2xl" id="kpi-polarization-dalton">—</p>
              </div>
              <p class="text-sm leading-[1.75] text-on-surface-variant" id="dashboard-polarization-note">—</p>
            </div>
          </article>

          <article class="bg-surface-container-lowest border border-outline-variant/10 shadow-editorial-lg">
            <div class="p-6 md:p-7 border-b border-outline-variant/10">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-tertiary font-bold mb-2">${t('dashboard.dimensionPartySystem')}</p>
              <h3 class="font-headline text-3xl mb-2">${t('dashboard.dimensionPartySystemTitle')}</h3>
              <p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.dimensionPartySystemCopy')}</p>
            </div>
            <div class="p-6 md:p-7 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.enep')}</p>
                  <p class="font-headline text-3xl" id="kpi-party-enep">—</p>
                </div>
                <div>
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.democratization')}</p>
                  <p class="font-headline text-3xl" id="kpi-party-dem">—</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.turnout')}</p>
                  <p class="font-headline text-2xl" id="kpi-party-turnout">—</p>
                </div>
                <div>
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('dashboard.competition')}</p>
                  <p class="font-headline text-2xl" id="kpi-party-compet">—</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="max-w-[1440px] mx-auto mb-12 md:mb-16">
          <div class="bg-surface-container-lowest border border-outline-variant/10 shadow-editorial-lg">
            <div class="p-6 md:p-8 border-b border-outline-variant/10 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary font-bold mb-2">${t('dashboard.municipalExtremes')}</p>
                <h3 class="font-headline text-3xl md:text-4xl leading-tight max-w-[16ch]">${t('dashboard.municipalExtremesTitle')}</h3>
              </div>
              <p class="text-sm leading-[1.7] text-on-surface-variant max-w-[32rem]" id="dashboard-extremes-copy">${t('dashboard.municipalExtremesCopy', { year: String(DEFAULT_YEAR) })}</p>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-0 xl:gap-8 p-6 md:p-8">
              <article class="min-w-0">
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1">${t('dashboard.leftMostMunicipalities')}</p>
                    <p class="font-headline text-2xl">${t('ideo.left')}</p>
                  </div>
                </div>
                <div id="dashboard-left-table"></div>
              </article>
              <article class="min-w-0 pt-8 xl:pt-0 xl:border-l xl:border-outline-variant/10 xl:pl-8">
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1">${t('dashboard.rightMostMunicipalities')}</p>
                    <p class="font-headline text-2xl">${t('ideo.right')}</p>
                  </div>
                </div>
                <div id="dashboard-right-table"></div>
              </article>
            </div>
          </div>
        </section>

        <section class="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div class="bg-surface-container-lowest p-6 md:p-8 border border-outline-variant/10 shadow-editorial-lg">
            <h3 class="font-headline text-2xl mb-2">${t('dashboard.polarizationTrend')}</h3>
            <p class="text-xs text-stone-500 mb-6 font-label uppercase tracking-[0.18em]">${t('dashboard.chartSubtitlePolarization')}</p>
            <div class="grid grid-cols-1 gap-6">
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('dashboard.saniSartori')}</p>
                <div id="dashboard-polarization-sani-chart" class="w-full" style="min-height: 220px;"></div>
              </div>
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('dashboard.daltonPi')}</p>
                <div id="dashboard-polarization-dalton-chart" class="w-full" style="min-height: 220px;"></div>
              </div>
            </div>
          </div>
          <div class="bg-surface-container-lowest p-6 md:p-8 border border-outline-variant/10 shadow-editorial-lg">
            <h3 class="font-headline text-2xl mb-2">${t('dashboard.partySystemTrend')}</h3>
            <p class="text-xs text-stone-500 mb-6 font-label uppercase tracking-[0.18em]">${t('dashboard.chartSubtitlePartySystem')}</p>
            <div class="grid grid-cols-1 gap-6">
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('dashboard.enep')}</p>
                <div id="dashboard-party-enep-chart" class="w-full" style="min-height: 220px;"></div>
              </div>
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('dashboard.democratization')}</p>
                <div id="dashboard-party-dem-chart" class="w-full" style="min-height: 220px;"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;
}

export async function initDashboardPage() {
  try {
    const rows = byYear(await loadDashboardNational().catch(() => []));
    if (!rows.length) return;

    const activeYear = getActiveYear(rows);
    const compareYear = rows.find((row) => row.year !== activeYear)?.year || rows[0].year;

    initControls(rows, activeYear, compareYear);
    renderDashboard(rows, activeYear, compareYear);
  } catch (err) {
    console.warn('Failed to load dashboard data:', err);
  }
}

function initControls(rows, activeYear, compareYear) {
  const slider = document.getElementById('dashboard-year-slider');
  const yearSelect = document.getElementById('dashboard-year-select');
  const compareSelect = document.getElementById('dashboard-compare-select');

  dashboardController = {
    rows,
    slider,
    yearSelect,
    compareSelect,
  };

  if (slider) {
    slider.min = String(rows[0].year);
    slider.max = String(rows[rows.length - 1].year);
    slider.step = '2';
    slider.value = String(activeYear);
  }
  if (yearSelect) yearSelect.innerHTML = buildYearOptions(rows, activeYear);
  if (compareSelect) compareSelect.innerHTML = buildYearOptions(rows, compareYear, activeYear);

  const rerender = () => {
    const newActiveYear = Number(yearSelect?.value || slider?.value || activeYear);
    const requestedCompareYear = Number(compareSelect?.value || compareYear);
    applyDashboardSelection(newActiveYear, requestedCompareYear);
  };

  if (slider && !slider.dataset.bound) {
    slider.addEventListener('input', () => {
      if (yearSelect) yearSelect.value = slider.value;
      rerender();
    });
    slider.dataset.bound = 'true';
  }

  if (yearSelect && !yearSelect.dataset.bound) {
    yearSelect.addEventListener('change', rerender);
    yearSelect.dataset.bound = 'true';
  }

  if (compareSelect && !compareSelect.dataset.bound) {
    compareSelect.addEventListener('change', rerender);
    compareSelect.dataset.bound = 'true';
  }
}

function getFallbackCompareYear(rows, activeYear) {
  const activeIndex = rows.findIndex((row) => row.year === activeYear);
  const previous = rows[activeIndex - 1]?.year;
  if (previous != null) return previous;
  return rows.find((row) => row.year !== activeYear)?.year ?? activeYear;
}

function applyDashboardSelection(activeYear, requestedCompareYear = null) {
  if (!dashboardController?.rows?.length) return;

  const { rows, slider, yearSelect, compareSelect } = dashboardController;
  const nextActiveYear = rows.some((row) => row.year === activeYear) ? activeYear : getActiveYear(rows);
  let nextCompareYear = requestedCompareYear;

  if (!rows.some((row) => row.year === nextCompareYear) || nextCompareYear === nextActiveYear) {
    nextCompareYear = getFallbackCompareYear(rows, nextActiveYear);
  }

  if (slider) slider.value = String(nextActiveYear);
  if (yearSelect) {
    yearSelect.innerHTML = buildYearOptions(rows, nextActiveYear);
    yearSelect.value = String(nextActiveYear);
  }
  if (compareSelect) {
    compareSelect.innerHTML = buildYearOptions(rows, nextCompareYear, nextActiveYear);
    compareSelect.value = String(nextCompareYear);
  }

  renderDashboard(rows, nextActiveYear, nextCompareYear);
}

function renderDashboard(rows, activeYear, compareYear) {
  const active = getYearRow(rows, activeYear);
  let compare = getCompareRow(rows, compareYear);
  if (!compare || compare.year === active.year) compare = rows.find((row) => row.year !== active.year) || active;
  const previous = rows[rows.findIndex((row) => row.year === active.year) - 1] || null;

  updateHeader(active, compare);
  updateSummary(active, previous);
  updateComparePanel(rows, active, compare);
  updateDimensionCards(active, active.year);
  renderMunicipalExtremes(active.year);
  renderMainChart(rows, active.year, compare.year);
  renderPolarizationChart(rows, active.year);
  renderPartySystemChart(rows, active.year);
}

function buildExtremesTable(rows, direction) {
  if (!rows.length) {
    return `<p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.extremesNoData')}</p>`;
  }

  return `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-outline-variant/10 text-left">
            <th class="py-3 pr-4 font-label text-[9px] uppercase tracking-[0.18em] text-outline">#</th>
            <th class="py-3 pr-4 font-label text-[9px] uppercase tracking-[0.18em] text-outline">${t('dashboard.municipality')}</th>
            <th class="py-3 pr-4 font-label text-[9px] uppercase tracking-[0.18em] text-outline">UF</th>
            <th class="py-3 font-label text-[9px] uppercase tracking-[0.18em] text-outline text-right">${t('tooltip.ideology')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr class="border-b border-outline-variant/10 last:border-b-0">
              <td class="py-3 pr-4 font-label text-xs text-outline">${index + 1}</td>
              <td class="py-3 pr-4 min-w-0">
                <div class="font-headline text-lg leading-tight">${row.tse_name || row.ibge_name}</div>
              </td>
              <td class="py-3 pr-4 font-label text-xs uppercase tracking-[0.14em] text-on-surface-variant">${row.uf}</td>
              <td class="py-3 text-right font-headline text-lg ${direction === 'left' ? 'text-ideo-left' : 'text-ideo-right'}">${formatDecimal(row.ideo_imp, 3, true)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function renderMunicipalExtremes(year) {
  const requestId = ++dashboardExtremesRequest;
  const leftContainer = document.getElementById('dashboard-left-table');
  const rightContainer = document.getElementById('dashboard-right-table');
  const copy = document.getElementById('dashboard-extremes-copy');
  if (!leftContainer || !rightContainer) return;

  leftContainer.innerHTML = `<p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.loadingExtremes')}</p>`;
  rightContainer.innerHTML = `<p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.loadingExtremes')}</p>`;
  if (copy) copy.textContent = t('dashboard.municipalExtremesCopy', { year: String(year) });

  const rows = await loadMunicipios(year).catch(() => []);
  if (requestId !== dashboardExtremesRequest) return;

  const valid = rows.filter((row) => row.ideo_imp != null);
  const leftMost = [...valid].sort((a, b) => a.ideo_imp - b.ideo_imp).slice(0, 10);
  const rightMost = [...valid].sort((a, b) => b.ideo_imp - a.ideo_imp).slice(0, 10);

  leftContainer.innerHTML = buildExtremesTable(leftMost, 'left');
  rightContainer.innerHTML = buildExtremesTable(rightMost, 'right');
}

function updateHeader(active, compare) {
  const sliderLabel = document.getElementById('dashboard-year-label');
  const focusYear = document.getElementById('dashboard-focus-year');
  const coverage = document.getElementById('dashboard-coverage');
  const compareYear = document.getElementById('dashboard-compare-year');
  if (sliderLabel) sliderLabel.textContent = String(active.year);
  if (focusYear) focusYear.textContent = String(active.year);
  if (coverage) coverage.textContent = formatCount(active.coverage_n);
  if (compareYear) compareYear.textContent = String(compare.year);
}

function updateSummary(active, previous) {
  const title = document.getElementById('dashboard-year-summary-title');
  const body = document.getElementById('dashboard-year-summary-body');
  const deltaIdeology = computeDelta(active, previous, 'ideology_mean');
  const deltaPolarization = computeDelta(active, previous, 'polarization_sani_sartori');
  if (title) title.textContent = t('dashboard.summaryTitle', { year: String(active.year) });
  if (body) {
    body.textContent = t('dashboard.summaryBody', {
      ideology: formatDecimal(active.ideology_mean, 3, true),
      ideologyDelta: formatDecimal(deltaIdeology, 3, true),
      polarization: formatDecimal(active.polarization_sani_sartori, 3, true),
      polarizationDelta: formatDecimal(deltaPolarization, 3, true),
      enep: formatDecimal(active.party_system_enep, 2),
    });
  }
}

function updateComparePanel(rows, active, compare) {
  const panel = document.getElementById('dashboard-compare-panel');
  if (!panel) return;

  const metrics = [
    { label: t('dashboard.currentMean'), key: 'ideology_mean', digits: 3, signed: true },
    { label: t('dashboard.saniSartori'), key: 'polarization_sani_sartori', digits: 3, signed: true },
    { label: t('dashboard.enep'), key: 'party_system_enep', digits: 2, signed: false },
    { label: t('dashboard.democratization'), key: 'party_system_dem_vhn', digits: 3, signed: false },
  ];

  panel.innerHTML = `
    <p class="text-sm leading-[1.7] text-on-surface-variant mb-4">${t('dashboard.compareIntro', { activeYear: String(active.year), compareYear: String(compare.year) })}</p>
    <div class="space-y-4">
      ${metrics.map((metric) => {
        const series = rows.map((row) => row[metric.key]).filter((value) => value != null);
        const min = Math.min(...series);
        const max = Math.max(...series);
        const span = max - min || 1;
        const activeValue = active[metric.key];
        const compareValue = compare[metric.key];
        const activePct = ((activeValue - min) / span) * 100;
        const comparePct = ((compareValue - min) / span) * 100;
        const left = Math.min(activePct, comparePct);
        const right = Math.max(activePct, comparePct);

        return `
          <div class="dashboard-dumbbell-row border-b border-outline-variant/10 pb-4 last:border-b-0 last:pb-0">
            <div class="dashboard-dumbbell-head">
              <span class="dashboard-dumbbell-label">${metric.label}</span>
              <div class="dashboard-dumbbell-values">
                <span class="dashboard-dumbbell-value dashboard-dumbbell-value-active">${active.year}: ${formatDecimal(activeValue, metric.digits, metric.signed)}</span>
                <span class="dashboard-dumbbell-value dashboard-dumbbell-value-compare">${compare.year}: ${formatDecimal(compareValue, metric.digits, metric.signed)}</span>
              </div>
            </div>
            <div class="dashboard-dumbbell-track-wrap">
              <div class="dashboard-dumbbell-track"></div>
              <div class="dashboard-dumbbell-span" style="left:${left}%; width:${Math.max(right - left, 0.8)}%;"></div>
              <div class="dashboard-dumbbell-dot dashboard-dumbbell-dot-compare" style="left:${comparePct}%;"></div>
              <div class="dashboard-dumbbell-dot dashboard-dumbbell-dot-active" style="left:${activePct}%;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function updateDimensionCards(active, activeYear) {
  const ideologyShares = document.getElementById('dashboard-ideology-shares');
  const polarizationNote = document.getElementById('dashboard-polarization-note');

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('kpi-ideology-mean', formatDecimal(active.ideology_mean, 3, true));
  set('kpi-ideology-dispersion', formatDecimal(active.ideology_sd, 3));
  set('kpi-polarization-sani', formatDecimal(active.polarization_sani_sartori, 3, true));
  set('kpi-polarization-dalton', formatDecimal(active.polarization_dalton_norm, 3));
  set('kpi-party-enep', formatDecimal(active.party_system_enep, 2));
  set('kpi-party-dem', formatDecimal(active.party_system_dem_vhn, 3));
  set('kpi-party-turnout', formatPercent(active.party_system_turnout));
  set('kpi-party-compet', formatDecimal(active.party_system_compet, 3));

  if (ideologyShares) {
    ideologyShares.innerHTML = `<p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.loadingExtremes')}</p>`;
    updateIdeologySharesFromMunicipalData(activeYear);
  }

  if (polarizationNote) {
    polarizationNote.textContent = t('dashboard.polarizationNote', {
      sani: formatDecimal(active.polarization_sani_sartori, 3, true),
      dalton: formatDecimal(active.polarization_dalton_norm, 3),
    });
  }
}

async function updateIdeologySharesFromMunicipalData(year) {
  const requestId = ++dashboardMunicipalSummaryRequest;
  const ideologyShares = document.getElementById('dashboard-ideology-shares');
  if (!ideologyShares) return;

  const rows = await loadMunicipios(year).catch(() => []);
  if (requestId !== dashboardMunicipalSummaryRequest) return;

  const summary = summarizeMunicipalIdeology(rows);
  const bandShares = summary.bandShares || {};
  ideologyShares.innerHTML = summary.count ? `
    <div>
      <div class="flex h-3 overflow-hidden bg-surface-container-low border border-outline-variant/10">
        ${IDEOLOGY_BANDS.map((band) => `<div style="width:${(bandShares[band.key] || 0) * 100}%;background:${band.color}"></div>`).join('')}
      </div>
    </div>
    <p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.ideologyShareCopy', {
      extremeLeft: formatPercent(bandShares.extremeLeft),
      left: formatPercent(bandShares.left),
      centerLeft: formatPercent(bandShares.centerLeft),
      center: formatPercent(bandShares.center),
      centerRight: formatPercent(bandShares.centerRight),
      right: formatPercent(bandShares.right),
      extremeRight: formatPercent(bandShares.extremeRight),
    })}</p>
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
      ${IDEOLOGY_BANDS.map((band) => `
        <div>
          <span class="block font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-1">${t(band.labelKey)}</span>
          <span class="font-headline text-lg">${formatPercent(bandShares[band.key])}</span>
        </div>
      `).join('')}
    </div>
  ` : `<p class="text-sm leading-[1.7] text-on-surface-variant">${t('dashboard.extremesNoData')}</p>`;
}

function renderMainChart(rows, activeYear, compareYear) {
  const container = document.getElementById('dashboard-main-chart');
  if (!container || !rows.length) return;

  const width = container.clientWidth || 840;
  const height = 420;
  const margin = { top: 24, right: 24, bottom: 42, left: 56 };
  const minYear = rows[0].year;
  const maxYear = rows[rows.length - 1].year;
  const minValue = Math.min(...rows.map((row) => Math.min(row.ideology_mean, row.ideology_mean - row.ideology_sd)));
  const maxValue = Math.max(...rows.map((row) => Math.max(row.ideology_mean, row.ideology_mean + row.ideology_sd)));
  const x = (year) => margin.left + ((year - minYear) / (maxYear - minYear || 1)) * (width - margin.left - margin.right);
  const y = (value) => margin.top + (height - margin.top - margin.bottom) - ((value - (minValue - 0.04)) / ((maxValue + 0.04) - (minValue - 0.04) || 1)) * (height - margin.top - margin.bottom);

  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('class', 'chart-svg');
  container.appendChild(svg);

  [-0.1, 0, 0.1, 0.2, 0.3, 0.4].forEach((tick) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(margin.left));
    line.setAttribute('x2', String(width - margin.right));
    line.setAttribute('y1', String(y(tick)));
    line.setAttribute('y2', String(y(tick)));
    line.setAttribute('stroke', tick === 0 ? '#72796e' : '#eae8e3');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(margin.left - 10));
    label.setAttribute('y', String(y(tick) + 4));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('class', 'axis-label');
    label.textContent = formatDecimal(tick, 1, true);
    svg.appendChild(label);
  });

  rows.forEach((row, index) => {
    if (index === rows.length - 1 || row.year % 8 === 2 || row.year === rows[0].year) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x(row.year)));
      label.setAttribute('y', String(height - 14));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'axis-label');
      label.textContent = row.year;
      svg.appendChild(label);
    }
  });

  const bandTop = rows.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(row.year)},${y(row.ideology_mean + row.ideology_sd)}`).join(' ');
  const bandBottom = [...rows].reverse().map((row) => `L${x(row.year)},${y(row.ideology_mean - row.ideology_sd)}`).join(' ');
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', `${bandTop} ${bandBottom} Z`);
  area.setAttribute('fill', '#154212');
  area.setAttribute('fill-opacity', '0.08');
  svg.appendChild(area);

  const activeGuide = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  activeGuide.setAttribute('x1', String(x(activeYear)));
  activeGuide.setAttribute('x2', String(x(activeYear)));
  activeGuide.setAttribute('y1', String(margin.top));
  activeGuide.setAttribute('y2', String(height - margin.bottom));
  activeGuide.setAttribute('stroke', '#cea700');
  activeGuide.setAttribute('stroke-width', '1');
  activeGuide.setAttribute('stroke-dasharray', '4 6');
  activeGuide.setAttribute('opacity', '0.8');
  svg.appendChild(activeGuide);

  const compareGuide = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  compareGuide.setAttribute('x1', String(x(compareYear)));
  compareGuide.setAttribute('x2', String(x(compareYear)));
  compareGuide.setAttribute('y1', String(margin.top));
  compareGuide.setAttribute('y2', String(height - margin.bottom));
  compareGuide.setAttribute('stroke', '#3056c4');
  compareGuide.setAttribute('stroke-width', '1');
  compareGuide.setAttribute('stroke-dasharray', '4 6');
  compareGuide.setAttribute('opacity', '0.6');
  svg.appendChild(compareGuide);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', rows.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(row.year)},${y(row.ideology_mean)}`).join(' '));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#154212');
  path.setAttribute('stroke-width', '4');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  rows.forEach((row) => {
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const isActive = row.year === activeYear;
    const isCompare = row.year === compareYear;
    point.setAttribute('cx', String(x(row.year)));
    point.setAttribute('cy', String(y(row.ideology_mean)));
    point.setAttribute('r', isActive ? '7' : isCompare ? '5.5' : '4.5');
    point.setAttribute('fill', isActive ? '#cea700' : isCompare ? '#3056c4' : '#154212');
    point.setAttribute('stroke', '#fbf9f4');
    point.setAttribute('stroke-width', '2');
    svg.appendChild(point);
    bindTooltip(point, container, () => `
      <strong>${row.year}</strong><br>
      ${t('dashboard.currentMean')}: ${formatDecimal(row.ideology_mean, 3, true)}<br>
      ${t('dashboard.currentDispersion')}: ${formatDecimal(row.ideology_sd, 3)}<br>
      ${t('dashboard.coverage')}: ${formatCount(row.coverage_n)}
    `);
    bindYearSelectionPoint(point, row.year, compareYear === row.year ? activeYear : compareYear);
  });

  const legend = document.createElement('div');
  legend.className = 'dashboard-chart-legend';
  legend.innerHTML = `
    <span><i style="background:#154212"></i>${t('dashboard.currentMean')}</span>
    <span><i class="dashboard-legend-band"></i>${t('dashboard.currentDispersion')}</span>
    <span><i style="background:#cea700"></i>${activeYear}</span>
    <span><i style="background:#3056c4"></i>${compareYear}</span>
  `;
  container.appendChild(legend);
}

function renderPolarizationChart(rows, activeYear) {
  renderSingleLineChart({
    containerId: 'dashboard-polarization-sani-chart',
    rows,
    activeYear,
    key: 'polarization_sani_sartori',
    color: '#3056c4',
    label: t('dashboard.saniSartori'),
    digits: 2,
  });
  renderSingleLineChart({
    containerId: 'dashboard-polarization-dalton-chart',
    rows,
    activeYear,
    key: 'polarization_dalton_norm',
    color: '#154212',
    label: t('dashboard.daltonPi'),
    digits: 3,
  });
}

function renderPartySystemChart(rows, activeYear) {
  renderSingleLineChart({
    containerId: 'dashboard-party-enep-chart',
    rows,
    activeYear,
    key: 'party_system_enep',
    color: '#735c00',
    label: t('dashboard.enep'),
    digits: 2,
  });
  renderSingleLineChart({
    containerId: 'dashboard-party-dem-chart',
    rows,
    activeYear,
    key: 'party_system_dem_vhn',
    color: '#B22222',
    label: t('dashboard.democratization'),
    digits: 3,
  });
}

function renderSingleLineChart({ containerId, rows, activeYear, key, color, label, digits }) {
  const container = document.getElementById(containerId);
  if (!container || !rows.length) return;

  const width = container.clientWidth || 560;
  const height = 220;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const values = rows.map((row) => row[key]).filter((value) => value != null);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const x = (year) => margin.left + ((year - rows[0].year) / (rows[rows.length - 1].year - rows[0].year || 1)) * (width - margin.left - margin.right);
  const y = (value) => margin.top + (height - margin.top - margin.bottom) - ((value - minValue) / (maxValue - minValue || 1)) * (height - margin.top - margin.bottom);

  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('class', 'chart-svg');
  container.appendChild(svg);

  for (let i = 0; i <= 4; i += 1) {
    const tick = minValue + ((maxValue - minValue) * i) / 4;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(margin.left));
    line.setAttribute('x2', String(width - margin.right));
    line.setAttribute('y1', String(y(tick)));
    line.setAttribute('y2', String(y(tick)));
    line.setAttribute('stroke', '#eae8e3');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  rows.forEach((row, index) => {
    if (index === rows.length - 1 || row.year % 8 === 2 || row.year === rows[0].year) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x(row.year)));
      label.setAttribute('y', String(height - 12));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'axis-label');
      label.textContent = row.year;
      svg.appendChild(label);
    }
  });

  const activeGuide = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  activeGuide.setAttribute('x1', String(x(activeYear)));
  activeGuide.setAttribute('x2', String(x(activeYear)));
  activeGuide.setAttribute('y1', String(margin.top));
  activeGuide.setAttribute('y2', String(height - margin.bottom));
  activeGuide.setAttribute('stroke', color);
  activeGuide.setAttribute('stroke-width', '1');
  activeGuide.setAttribute('stroke-dasharray', '4 6');
  activeGuide.setAttribute('opacity', '0.35');
  svg.appendChild(activeGuide);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', rows.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(row.year)},${y(row[key])}`).join(' '));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  rows.forEach((row) => {
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttribute('cx', String(x(row.year)));
    point.setAttribute('cy', String(y(row[key])));
    point.setAttribute('r', row.year === activeYear ? '5.5' : '4');
    point.setAttribute('fill', color);
    point.setAttribute('stroke', '#fbf9f4');
    point.setAttribute('stroke-width', '2');
    svg.appendChild(point);
    bindTooltip(point, container, () => `<strong>${row.year}</strong><br>${label}: ${formatDecimal(row[key], digits)}`);
    bindYearSelectionPoint(point, row.year);
  });

  const legend = document.createElement('div');
  legend.className = 'dashboard-chart-legend';
  legend.innerHTML = `<span><i style="background:${color}"></i>${label}</span>`;
  container.appendChild(legend);
}
