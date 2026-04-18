/**
 * components/Scrollytelling.js
 * Professional scrollytelling: text left, chart sticky right.
 * Editorial design — light background, serif titles.
 */

import { loadNationalTrend, loadPolarization, loadMunicipios } from '../data/loader.js';
import { renderLineChart } from './LineChart.js';
import { renderScatterPlot } from './ScatterPlot.js';

export const CHAPTERS = [
  {
    id: 1,
    theme: 'intro',
    eyebrow: "Introducción",
    title: "Brasil siempre fue de derecha",
    text: "Even during the PT years, the vast majority of municipalities tended to the right. El score ideológico municipal medio de Brasil nunca cruzó el cero hacia la izquierda entre 1994 y 2018. La média más baja fue 0.083 en 2010 — aún a la derecha del centro.",
    source: "Power & Rodrigues-Silveira (2019), Fig. 1",
    chartType: 'line',
    chartLoader: async () => {
      const trend = await loadNationalTrend();
      return {
        component: 'line',
        data: trend,
        title: 'Score ideológico medio nacional, 1994–2024',
        subtitle: 'Media municipal por año electoral',
        width: 620,
        height: 340,
      };
    },
  },
  {
    id: 2,
    theme: 'geo',
    eyebrow: "Geografía",
    title: "La geografía de una división",
    text: "Desde el inicio de la serie, Ceará, Bahía y el nordeste se inclinaron hacia la izquierda. El Sur y el Centro-Oeste se mantuvieron consistentemente a la derecha. Esta división regional — 'regional cleavage' — no se ha cerrado en 30 años.",
    source: "Power & Rodrigues-Silveira (2019)",
    chartType: 'line',
    chartLoader: async () => {
      const pol = await loadPolarization();
      return {
        component: 'line',
        data: pol.map(d => ({
          year: d.year,
          mean: d.mean_ideo,
          sd: d.dispersion,
          min: d.mean_ideo - d.dispersion,
          max: d.mean_ideo + d.dispersion,
        })),
        title: 'Media y dispersión por año',
        subtitle: 'Rango inter-cuartil de score ideológico municipal',
        width: 620,
        height: 340,
      };
    },
  },
  {
    id: 3,
    theme: 'party',
    eyebrow: "Partidos",
    title: "El PT se movió al centro",
    text: "El PT se moderó ideológicamente con el tiempo, acercándose al promedio nacional. En 1994 era un partido de extrema izquierda. En 2018, su posición lo colocaba cerca del centro. El PFL/DEM, en cambio, se mantuvo rígido a la derecha — y perdió votos de forma sostenida.",
    source: "Power & Rodrigues-Silveira (2019)",
    chartType: 'line',
    chartLoader: async () => {
      const trend = await loadNationalTrend();
      return {
        component: 'line',
        data: trend,
        title: 'Evolución ideológica nacional',
        subtitle: 'Media municipal por año electoral',
        width: 620,
        height: 340,
      };
    },
  },
  {
    id: 4,
    theme: 'conv',
    eyebrow: "Convergencia",
    title: "La convergencia (2002–2012)",
    text: "Entre 2002 y 2012, los municipios brasileños se parecían cada vez más entre sí. La desviación estándar cayó. El rango ideológico se redujo. Brasil se estaba nationalizando ideológicamente. Esta convergence hacia el centro-right se revierte a partir de 2013.",
    source: "Power & Rodrigues-Silveira (2019)",
    chartType: 'line',
    chartLoader: async () => {
      const pol = await loadPolarization();
      return {
        component: 'line',
        data: pol.map(d => ({
          year: d.year,
          mean: d.dispersion,
          sd: 0,
          min: 0,
          max: d.dispersion * 2,
        })),
        title: 'Dispersión ideológica: el termostato político',
        subtitle: 'Desviación estándar del score ideológico municipal',
        width: 620,
        height: 340,
      };
    },
  },
  {
    id: 5,
    theme: 'rupture',
    eyebrow: "Ruptura",
    title: "2013: cuando el termostato se rompió",
    text: "Las protestas de junio de 2013 no aparecen directamente en los datos electorales, pero el efecto es visible. A partir de 2014, la dispersión ideológica dejó de caer y comenzó a subir. El centro se vació mientras nordeste y sur se alejaban.",
    source: "Basado en Power & Rodrigues-Silveira (2019), extensión propia",
    chartType: 'scatter',
    chartLoader: async () => {
      const [m2012, m2018] = await Promise.all([
        loadMunicipios(2012),
        loadMunicipios(2018),
      ]);
      return {
        component: 'scatter',
        dataA: m2012,
        dataB: m2018,
        labelA: '2012',
        labelB: '2018',
        title: 'Cambio ideológico: 2012 → 2018',
        subtitle: 'Cada punto es un municipio. Eje Y: 2018. Eje X: 2012.',
        width: 620,
        height: 420,
      };
    },
  },
  {
    id: 6,
    theme: 'turn',
    eyebrow: "Punto de inflexión",
    title: "2018: la elección que reorganizó el mapa",
    text: "Las elecciones de 2018 fueron el punto de inflexión más dramático en 30 años. La dispersión alcanzó su máximo histórico. Los municipios no solo se dividieron más: la división adquirió un componente regional más marcado que antes.",
    source: "Extensión propia (datos 2018–2024)",
    chartType: 'scatter',
    chartLoader: async () => {
      const [m2016, m2018] = await Promise.all([
        loadMunicipios(2016),
        loadMunicipios(2018),
      ]);
      return {
        component: 'scatter',
        dataA: m2016,
        dataB: m2018,
        labelA: '2016',
        labelB: '2018',
        title: 'Cambio ideológico: 2016 → 2018',
        subtitle: 'La mayor polarización en 30 años',
        width: 620,
        height: 420,
      };
    },
  },
  {
    id: 7,
    theme: 'now',
    eyebrow: "Actualidad",
    title: "Lo que vino después: 2020–2024",
    text: "El período post-2018 muestra una aceleración de la polarización. La média nacional se mantiene a la derecha del centro, pero la dispersión sigue en níveis históricos. Este padrão tiene implicaciones que apenas começamos a entender.",
    source: "Extensión propia",
    chartType: 'scatter',
    chartLoader: async () => {
      const [m2018, m2024] = await Promise.all([
        loadMunicipios(2018),
        loadMunicipios(2024),
      ]);
      return {
        component: 'scatter',
        dataA: m2018,
        dataB: m2024,
        labelA: '2018',
        labelB: '2024',
        title: 'Cambio ideológico: 2018 → 2024',
        subtitle: '¿Se consolida la polarización?',
        width: 620,
        height: 420,
      };
    },
  },
];

let viewedChapters = new Set();

export async function initScrollytelling(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  container.className = 'scrollytelling';

  const total = CHAPTERS.length;

  // ---- Header with progress ----
  const header = document.createElement('div');
  header.className = 'scrolly-header';
  header.innerHTML = `
    <div class="scrolly-progress-bar"></div>
    <div class="scrolly-header-inner">
      <div class="scrolly-header-title">
        <span class="scrolly-label">Narrativa</span>
        <span class="scrolly-chapter-count"></span>
      </div>
      <div class="scrolly-progress-track">
        ${CHAPTERS.map(ch => `<div class="scrolly-pip" data-chapter="${ch.id}"></div>`).join('')}
      </div>
    </div>
  `;
  container.appendChild(header);

  // ---- Two-column layout ----
  const body = document.createElement('div');
  body.className = 'scrolly-body';

  // Left: text chapters
  const textCol = document.createElement('div');
  textCol.className = 'scrolly-text-col';
  body.appendChild(textCol);

  // Right: sticky chart
  const chartCol = document.createElement('div');
  chartCol.className = 'scrolly-chart-col';
  const sticky = document.createElement('div');
  sticky.className = 'scrolly-sticky';
  const chartWrap = document.createElement('div');
  chartWrap.id = 'scrolly-chart';
  chartWrap.className = 'scrolly-chart';
  chartWrap.innerHTML = '<p class="scrolly-loading">Cargando...</p>';
  sticky.appendChild(chartWrap);
  chartCol.appendChild(sticky);
  body.appendChild(chartCol);

  container.appendChild(body);

  // Build chapter sections
  for (const ch of CHAPTERS) {
    const section = document.createElement('section');
    section.className = 'scrolly-chapter';
    section.dataset.chapter = ch.id;
    section.dataset.theme = ch.theme;
    section.innerHTML = `
      <div class="scrolly-chapter-inner">
        ${ch.eyebrow ? `<p class="chapter-eyebrow">${ch.eyebrow}</p>` : ''}
        <h2 class="chapter-title">${ch.title}</h2>
        <p class="chapter-text">${ch.text}</p>
        <cite class="chapter-source">${ch.source}</cite>
      </div>
    `;
    textCol.appendChild(section);
  }

  // ---- Intersection Observer ----
  const allSections = document.querySelectorAll('.scrolly-chapter');
  const chartArea = document.getElementById('scrolly-chart');

  const observer = new IntersectionObserver(
    async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const chapterId = parseInt(entry.target.dataset.chapter);
          updateProgress(chapterId);
          await activateChapter(chapterId, chartArea);
        }
      }
    },
    { rootMargin: '-30% 0px -30% 0px', threshold: 0 }
  );

  for (const section of allSections) {
    observer.observe(section);
  }

  // Activate first chapter immediately
  updateProgress(1);
  await activateChapter(1, chartArea);
}

function updateProgress(chapterId) {
  viewedChapters.add(chapterId);
  document.querySelectorAll('.scrolly-pip').forEach(pip => {
    const id = parseInt(pip.dataset.chapter);
    pip.classList.toggle('active', id === chapterId);
    pip.classList.toggle('viewed', viewedChapters.has(id) && id !== chapterId);
  });
  const count = document.querySelector('.scrolly-chapter-count');
  if (count) count.textContent = `${chapterId} / ${CHAPTERS.length}`;
  const bar = document.querySelector('.scrolly-progress-bar');
  if (bar) {
    const pct = ((chapterId - 1) / (CHAPTERS.length - 1)) * 100;
    bar.style.width = `${pct}%`;
  }
}

let activeChart = null;

async function activateChapter(chapterId, chartArea) {
  const ch = CHAPTERS.find(c => c.id === chapterId);
  if (!ch) return;
  if (activeChart === chapterId) return;
  activeChart = chapterId;

  chartArea.innerHTML = '<p class="scrolly-loading">Cargando visualización...</p>';

  try {
    const result = await ch.chartLoader();
    chartArea.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'scrolly-chart-inner';

    if (result.title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'scrolly-chart-title';
      titleEl.textContent = result.title;
      inner.appendChild(titleEl);
    }
    if (result.subtitle) {
      const subEl = document.createElement('p');
      subEl.className = 'scrolly-chart-subtitle';
      subEl.textContent = result.subtitle;
      inner.appendChild(subEl);
    }

    const chartDiv = document.createElement('div');
    chartDiv.id = `scrolly-chart-inner-${chapterId}`;
    chartDiv.className = 'scrolly-chart-svg';
    inner.appendChild(chartDiv);
    chartArea.appendChild(inner);

    if (result.component === 'line') {
      const { renderLineChart: render } = await import('./LineChart.js');
      render(chartDiv.id, result.data, result.width, result.height);
    } else if (result.component === 'scatter') {
      const { renderScatterPlot: render } = await import('./ScatterPlot.js');
      render(chartDiv.id, result.dataA, result.dataB, result.width, result.height, {});
    }
  } catch (err) {
    chartArea.innerHTML = `<p class="scrolly-error">Error: ${err.message}</p>`;
  }
}
