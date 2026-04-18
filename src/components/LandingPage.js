/**
 * LandingPage.js
 * Narrative landing page built around the historical time series.
 */

import { loadNationalTrend, loadPolarization } from '../data/loader.js';
import { t, applyI18n, getLocale } from '../i18n/index.js';
import { bindTooltip } from './chartTooltip.js';

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

function signed(value, digits = 3) {
  if (value == null) return '—';
  const formatted = Number(value).toFixed(digits);
  return Number(value) > 0 ? `+${formatted}` : formatted;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setHTML(id, value) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = value;
}

function getShiftDirection(delta) {
  if (delta > 0.015) return t('landing.shiftRight');
  if (delta < -0.015) return t('landing.shiftLeft');
  return t('landing.shiftStable');
}

function getDispersionDirection(delta) {
  if (delta > 0.015) return t('landing.dispersionUp');
  if (delta < -0.015) return t('landing.dispersionDown');
  return t('landing.dispersionStable');
}

function renderHeroTimeline(containerId, trend, polarization) {
  const container = document.getElementById(containerId);
  if (!container || !trend?.length || !polarization?.length) return;

  const width = container.clientWidth || 960;
  const height = 420;
  const margin = { top: 36, right: 84, bottom: 54, left: 56 };
  const rows = trend.map((row) => ({
    ...row,
    dispersion: polarization.find((entry) => entry.year === row.year)?.dispersion ?? row.sd ?? 0,
  }));

  const minYear = rows[0].year;
  const maxYear = rows[rows.length - 1].year;
  const minValue = Math.min(...rows.map((row) => Math.min(row.mean, row.mean - row.dispersion)));
  const maxValue = Math.max(...rows.map((row) => Math.max(row.mean, row.mean + row.dispersion)));
  const yMin = Math.min(-0.1, minValue - 0.03);
  const yMax = Math.max(0.35, maxValue + 0.03);
  const x = (year) => margin.left + ((year - minYear) / (maxYear - minYear || 1)) * (width - margin.left - margin.right);
  const y = (value) => margin.top + (height - margin.top - margin.bottom) - ((value - yMin) / (yMax - yMin || 1)) * (height - margin.top - margin.bottom);

  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('class', 'chart-svg landing-timeline-svg');
  container.appendChild(svg);

  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('class', 'grid');
  svg.appendChild(gridGroup);

  [-0.1, 0, 0.1, 0.2, 0.3, 0.4].forEach((tick) => {
    if (tick < yMin || tick > yMax) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(margin.left));
    line.setAttribute('x2', String(width - margin.right));
    line.setAttribute('y1', String(y(tick)));
    line.setAttribute('y2', String(y(tick)));
    if (Math.abs(tick) < 0.0001) line.setAttribute('class', 'zero-line');
    gridGroup.appendChild(line);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(margin.left - 10));
    label.setAttribute('y', String(y(tick) + 4));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('class', 'axis-label');
    label.textContent = signed(tick, 1);
    svg.appendChild(label);
  });

  rows.forEach((row, index) => {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(x(row.year)));
    label.setAttribute('y', String(height - 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'axis-label');
    if (index === 0 || index === rows.length - 1 || row.year % 8 === 2) label.textContent = row.year;
    svg.appendChild(label);
  });

  const bandTop = rows.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(row.year)},${y(row.mean + row.dispersion)}`).join(' ');
  const bandBottom = [...rows].reverse().map((row) => `L${x(row.year)},${y(row.mean - row.dispersion)}`).join(' ');
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', `${bandTop} ${bandBottom} Z`);
  area.setAttribute('fill', '#154212');
  area.setAttribute('fill-opacity', '0.08');
  svg.appendChild(area);

  const linePath = rows.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(row.year)},${y(row.mean)}`).join(' ');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', linePath);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', '#154212');
  line.setAttribute('stroke-width', '4');
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  const dispersionLinePath = rows.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(row.year)},${y(row.mean + row.dispersion)}`).join(' ');
  const dispersionLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  dispersionLine.setAttribute('d', dispersionLinePath);
  dispersionLine.setAttribute('fill', 'none');
  dispersionLine.setAttribute('stroke', '#3056c4');
  dispersionLine.setAttribute('stroke-width', '1.5');
  dispersionLine.setAttribute('stroke-dasharray', '6 6');
  dispersionLine.setAttribute('opacity', '0.7');
  svg.appendChild(dispersionLine);

  rows.forEach((row, index) => {
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const isLatest = index === rows.length - 1;
    point.setAttribute('cx', String(x(row.year)));
    point.setAttribute('cy', String(y(row.mean)));
    point.setAttribute('r', isLatest ? '6' : '4.5');
    point.setAttribute('fill', isLatest ? '#cea700' : '#154212');
    point.setAttribute('stroke', '#fbf9f4');
    point.setAttribute('stroke-width', '2');
    svg.appendChild(point);
    bindTooltip(point, container, () => `
      <strong>${row.year}</strong><br>
      ${t('landing.tooltipMean')}: ${signed(row.mean, 3)}<br>
      ${t('landing.tooltipDispersion')}: ${row.dispersion.toFixed(3)}<br>
      ${t('landing.tooltipCoverage')}: ${formatCount(row.n)}
    `);
  });

  const meanLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  meanLabel.setAttribute('x', String(width - margin.right + 12));
  meanLabel.setAttribute('y', String(y(rows[rows.length - 1].mean) + 4));
  meanLabel.setAttribute('class', 'annotation');
  meanLabel.textContent = t('landing.timelineMeanLabel');
  svg.appendChild(meanLabel);

  const dispLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  dispLabel.setAttribute('x', String(width - margin.right + 12));
  dispLabel.setAttribute('y', String(y(rows[rows.length - 1].mean + rows[rows.length - 1].dispersion) + 4));
  dispLabel.setAttribute('class', 'annotation');
  dispLabel.textContent = t('landing.timelineDispersionLabel');
  svg.appendChild(dispLabel);
}

function updateLandingNarrative(trend, polarization) {
  const first = trend[0];
  const latest = trend[trend.length - 1];
  const mid = trend.find((row) => row.year === 2014) || trend[Math.floor(trend.length / 2)];
  const firstPol = polarization[0];
  const latestPol = polarization[polarization.length - 1];
  const midpointPol = polarization.find((row) => row.year === 2014) || polarization[Math.floor(polarization.length / 2)];
  const deltaMean = latest.mean - first.mean;
  const deltaDispersion = latestPol.dispersion - firstPol.dispersion;
  const latestCoverage = latest.n;
  const historicalRange = latest.year - first.year;

  setText('landing-range-years', `${first.year}-${latest.year}`);
  setText('landing-range-count', `${historicalRange} ${t('common.years')}`);
  setText('landing-coverage-value', formatCount(latestCoverage));
  setText('landing-mean-value', signed(latest.mean, 3));
  setText('landing-dispersion-value', latestPol.dispersion.toFixed(3));
  setText('landing-delta-mean', signed(deltaMean, 3));
  setText('landing-delta-dispersion', signed(deltaDispersion, 3));
  setText('landing-midpoint-year', String(mid.year));
  setText('landing-midpoint-value', signed(mid.mean, 3));
  setText('landing-midpoint-dispersion', midpointPol.dispersion.toFixed(3));
  setText('landing-midpoint-copy', t('landing.midpointCopy', {
    value: signed(mid.mean, 3),
    dispersion: midpointPol.dispersion.toFixed(3),
  }));

  setHTML('landing-hero-copy', t('landing.heroNarrative', {
    startYear: String(first.year),
    endYear: String(latest.year),
    municipalities: formatCount(latestCoverage),
  }));

  setText('landing-findings-lead', t('landing.findingsLead', {
    range: `${first.year}-${latest.year}`,
    municipalities: formatCount(latestCoverage),
  }));

  setText('landing-findings-body', t('landing.findingsBody', {
    meanShift: signed(deltaMean, 3),
    shiftDirection: getShiftDirection(deltaMean),
    dispersionDirection: getDispersionDirection(deltaDispersion),
    latestDispersion: latestPol.dispersion.toFixed(3),
  }));

  setText('landing-method-copy', t('landing.methodNarrative', {
    latestYear: String(latest.year),
    municipalities: formatCount(latestCoverage),
  }));
}

export function createLandingPage() {
  return `
    <div class="landing-page bg-background text-on-background">
      <section class="max-w-[1440px] mx-auto px-6 md:px-8 pt-8 md:pt-12 pb-14 md:pb-20">
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-14 items-end mb-12 md:mb-16">
          <div class="xl:col-span-5">
            <span class="font-label text-[10px] uppercase tracking-[0.24em] text-primary font-bold mb-5 block" data-i18n="landing.specialReport">${t('landing.specialReport')}</span>
            <h1 class="font-headline text-[3.2rem] md:text-[5.4rem] leading-[0.9] tracking-[-0.04em] mb-6 max-w-[10ch]">
              ${t('landing.heroTitleLine1')}<br><span class="italic text-primary">${t('landing.heroTitleLine2')}</span>
            </h1>
            <p class="text-lg md:text-[1.35rem] leading-[1.55] text-on-surface-variant max-w-[34rem] mb-8" id="landing-hero-copy">${t('landing.heroSubtitle')}</p>
            <div class="flex flex-wrap gap-3 mb-8">
              <a href="#/map" class="px-7 py-4 bg-primary text-on-primary font-label text-[11px] font-bold uppercase tracking-[0.16em] hover:bg-primary-container transition-colors">${t('landing.ctaPrimary')}</a>
              <a href="#/methodology" class="px-7 py-4 border border-outline-variant/60 text-on-surface font-label text-[11px] font-bold uppercase tracking-[0.16em] hover:border-primary hover:text-primary transition-colors">${t('landing.ctaSecondary')}</a>
            </div>
            <div class="landing-kicker-row grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-outline-variant/20 pt-6">
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('landing.kickerRange')}</p>
                <p class="font-headline text-2xl" id="landing-range-years">1994-2024</p>
                <p class="text-sm text-on-surface-variant" id="landing-range-count">30 ${t('common.years')}</p>
              </div>
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('landing.kickerCoverage')}</p>
                <p class="font-headline text-2xl" id="landing-coverage-value">5,569</p>
                <p class="text-sm text-on-surface-variant">${t('landing.kickerCoverageCopy')}</p>
              </div>
              <div>
                <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('landing.kickerRepository')}</p>
                <p class="font-headline text-2xl">Harvard</p>
                <p class="text-sm text-on-surface-variant">Dataverse</p>
              </div>
            </div>
          </div>

          <div class="xl:col-span-7">
            <div class="landing-hero-panel bg-surface-container-lowest border border-outline-variant/20 shadow-editorial-lg">
              <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 p-6 md:p-8 border-b border-outline-variant/10">
                <div>
                  <p class="font-label text-[10px] uppercase tracking-[0.18em] text-tertiary font-bold mb-2" data-i18n="landing.timelineEyebrow">${t('landing.timelineEyebrow')}</p>
                  <h2 class="font-headline text-3xl md:text-4xl leading-tight max-w-[12ch]">${t('landing.timelineTitle')}</h2>
                </div>
                <p class="text-sm leading-relaxed text-on-surface-variant max-w-[26rem]">${t('landing.timelineSubtitle')}</p>
              </div>
              <div class="p-5 md:p-8">
                <div id="landing-timeline" class="w-full" style="min-height:420px;"></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-outline-variant/10">
                <div class="p-5 md:p-6 border-b md:border-b-0 md:border-r border-outline-variant/10">
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('landing.meanLabel')}</p>
                  <p class="font-headline text-3xl" id="landing-mean-value">—</p>
                  <p class="text-sm text-on-surface-variant">${t('landing.meanCopy')}</p>
                </div>
                <div class="p-5 md:p-6 border-b md:border-b-0 md:border-r border-outline-variant/10">
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('landing.dispersionLabel')}</p>
                  <p class="font-headline text-3xl" id="landing-dispersion-value">—</p>
                  <p class="text-sm text-on-surface-variant">${t('landing.dispersionCopy')}</p>
                </div>
                <div class="p-5 md:p-6">
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-2">${t('landing.midpointLabel')}</p>
                  <p class="font-headline text-3xl"><span id="landing-midpoint-year">2014</span></p>
                  <p class="text-sm text-on-surface-variant" id="landing-midpoint-copy">${t('landing.midpointCopy', { value: '+0.000', dispersion: '0.000' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start">
          <div class="lg:col-span-7 bg-surface-container-low p-6 md:p-8 border border-outline-variant/10">
            <p class="font-label text-[10px] uppercase tracking-[0.18em] text-primary font-bold mb-4" data-i18n="landing.findingsEyebrow">${t('landing.findingsEyebrow')}</p>
            <p class="font-headline text-2xl md:text-3xl leading-[1.22] mb-4" id="landing-findings-lead">${t('landing.findingsLead', { range: '1994-2024', municipalities: '5,569' })}</p>
            <p class="text-base md:text-lg leading-[1.75] text-on-surface-variant max-w-[48rem]" id="landing-findings-body">${t('landing.findingsBody', { meanShift: '+0.000', shiftDirection: t('landing.shiftStable'), dispersionDirection: t('landing.dispersionStable'), latestDispersion: '0.000' })}</p>
          </div>
          <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <article class="bg-surface-container-lowest p-6 border border-outline-variant/10 shadow-editorial">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('landing.deltaIdeology')}</p>
              <p class="font-headline text-4xl text-primary mb-2" id="landing-delta-mean">—</p>
              <p class="text-sm text-on-surface-variant">${t('landing.deltaIdeologyCopy')}</p>
            </article>
            <article class="bg-surface-container-lowest p-6 border border-outline-variant/10 shadow-editorial">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('landing.deltaDispersion')}</p>
              <p class="font-headline text-4xl text-secondary mb-2" id="landing-delta-dispersion">—</p>
              <p class="text-sm text-on-surface-variant">${t('landing.deltaDispersionCopy')}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="bg-surface-container-low py-16 md:py-20 border-y border-outline-variant/10">
        <div class="max-w-[1440px] mx-auto px-6 md:px-8 grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          <div class="xl:col-span-4">
            <p class="font-label text-[10px] uppercase tracking-[0.18em] text-tertiary font-bold mb-4">${t('landing.methodEyebrow')}</p>
            <h3 class="font-headline text-3xl md:text-4xl leading-tight mb-5 max-w-[12ch]">${t('landing.methodTitle')}</h3>
            <p class="text-base md:text-lg leading-[1.75] text-on-surface-variant max-w-[30rem]" id="landing-method-copy">${t('landing.methodNarrative', { latestYear: '2024', municipalities: '5,569' })}</p>
          </div>
          <div class="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <article class="landing-method-card bg-surface-container-lowest p-6 md:p-7 border border-outline-variant/10">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('landing.methodCard1Eyebrow')}</p>
              <h4 class="font-headline text-2xl mb-3">${t('landing.methodCard1Title')}</h4>
              <p class="text-sm leading-[1.7] text-on-surface-variant">${t('landing.methodCard1Copy')}</p>
            </article>
            <article class="landing-method-card bg-surface-container-lowest p-6 md:p-7 border border-outline-variant/10">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('landing.methodCard2Eyebrow')}</p>
              <h4 class="font-headline text-2xl mb-3">${t('landing.methodCard2Title')}</h4>
              <p class="text-sm leading-[1.7] text-on-surface-variant">${t('landing.methodCard2Copy')}</p>
            </article>
            <article class="landing-method-card bg-primary text-on-primary p-6 md:p-7 border border-primary/20 shadow-editorial">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary-fixed mb-3">${t('landing.methodCard3Eyebrow')}</p>
              <h4 class="font-headline text-2xl mb-3">${t('landing.methodCard3Title')}</h4>
              <p class="text-sm leading-[1.7] text-on-primary/85 mb-6">${t('landing.methodCard3Copy')}</p>
              <a href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/8USPML" target="_blank" rel="noreferrer" class="inline-flex items-center gap-3 font-label text-[10px] uppercase tracking-[0.18em] font-bold text-primary-fixed hover:text-white transition-colors">${t('landing.methodCard3Cta')}</a>
            </article>
          </div>
        </div>
      </section>

      <section class="max-w-[1440px] mx-auto px-6 md:px-8 py-16 md:py-20">
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          <div class="xl:col-span-4">
            <p class="font-label text-[10px] uppercase tracking-[0.18em] text-primary font-bold mb-4">${t('landing.nextEyebrow')}</p>
            <h3 class="font-headline text-3xl md:text-4xl leading-tight mb-5 max-w-[13ch]">${t('landing.nextTitle')}</h3>
            <p class="text-base md:text-lg leading-[1.75] text-on-surface-variant max-w-[32rem]">${t('landing.nextCopy')}</p>
          </div>
          <div class="xl:col-span-8 grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-5">
            <div class="bg-surface-container-lowest p-7 md:p-8 border border-outline-variant/10 shadow-editorial-lg">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('landing.mapCtaEyebrow')}</p>
              <h4 class="font-headline text-3xl md:text-4xl leading-tight mb-4">${t('landing.mapCtaTitle')}</h4>
              <p class="text-base leading-[1.75] text-on-surface-variant mb-8 max-w-[34rem]">${t('landing.mapCtaCopy')}</p>
              <div class="flex flex-wrap gap-3">
                <a href="#/map" class="px-7 py-4 bg-primary text-on-primary font-label text-[11px] font-bold uppercase tracking-[0.16em] hover:bg-primary-container transition-colors">${t('landing.ctaPrimary')}</a>
              </div>
            </div>
            <div class="bg-surface-container-low p-7 md:p-8 border border-outline-variant/10">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-outline mb-3">${t('landing.dataverseEyebrow')}</p>
              <h4 class="font-headline text-2xl leading-tight mb-4">${t('landing.dataverseTitle')}</h4>
              <p class="text-sm leading-[1.7] text-on-surface-variant mb-6">${t('landing.dataverseCopy')}</p>
              <div class="space-y-3 text-sm">
                <div class="border-t border-outline-variant/20 pt-3">
                  <span class="font-label text-[9px] uppercase tracking-[0.18em] text-outline block mb-1">${t('landing.persistentId')}</span>
                  <span class="font-label text-xs font-bold">DOI: 10.7910/DVN/8USPML</span>
                </div>
                <div>
                  <span class="font-label text-[9px] uppercase tracking-[0.18em] text-outline block mb-1">${t('landing.datasetYearsLabel')}</span>
                  <span class="font-headline text-lg">1994-2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export async function initLandingPage() {
  applyI18n(document);
  try {
    const [trend, polarization] = await Promise.all([
      loadNationalTrend().catch(() => []),
      loadPolarization().catch(() => []),
    ]);
    if (!trend.length || !polarization.length) return;
    renderHeroTimeline('landing-timeline', trend, polarization);
    updateLandingNarrative(trend, polarization);
  } catch (error) {
    console.warn('Failed to initialize landing page:', error);
  }
}
