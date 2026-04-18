/**
 * components/BarChart.js
 * Horizontal bar chart: party × IDEO weighted.
 * With official party colors, sorting, and click-to-select.
 */

import { PARTY_NAMES } from '../data/loader.js';

/** Official party colors — Brazil */
const PARTY_COLORS = {
  13: '#c0392b',  // PT — vermelho
  11: '#1e4d8c',  // PP — azul escuro
  15: '#2e7d32',  // PSD — verde
  40: '#e65100',  //PSB — laranja
  45: '#1e88e5',  // PSDB — azul
  14: '#087d42',  // PDT — vermelho-alaranjado
  43: '#7030a0',  // PV — verde
  12: '#c41e3a',  // PDT / other red
  22: '#0066b3',  // PL / PSL — azul
  1:  '#f9c200',  // PTB — amarelo
  16: '#e01e36',  // PSDL / other
  44: '#0077cc',  // NOVO — azul
  55: '#8B0000',  // REPUBLICANOS — rojo escuro
  18: '#c9a000',  // SOLIDARIEDADE — amarelo
  35: '#006400',  // PSB — verde
  20: '#e30613',  // PST — vermelho
  25: '#800080',  // DEM / no
  27: '#006400',  // other green
  28: '#cc0000',  // other red
  30: '#e67e22',  // PSTU — laranja
  65: '#2980b9',  // PCdoB — azul escuro
  36: '#27ae60',  // other green
  39: '#8e44ad',  // other purple
  50: '#f39c12',  // other yellow
  51: '#16a085',  // other teal
  54: '#7f8c8d',  // other gray
  56: '#f1c40f',  // DEM — amarelo
  70: '#c0392b',  // other red
  77: '#c0392b',  // other red
  80: '#2ecc71',  // PV — verde
  90: '#f39c12',  // PSDC — amarelo
  96: '#3498db',  // other blue
};

/** Get color for a party based on ideology + party number */
function getPartyColor(ideo, party) {
  if (ideo < 0) {
    // Left — use intensity gradient from moderate to extreme
    const intensity = Math.abs(ideo) / 1.0; // 0 to 1
    if (intensity > 0.7) return '#8b0000';       // extreme left
    if (intensity > 0.4) return '#c0392b';      // strong left
    return '#e06c75';                            // moderate left
  } else {
    // Right — try official color first
    const official = PARTY_COLORS[party];
    if (official) return official;
    // Fall back to intensity gradient
    const intensity = Math.abs(ideo) / 1.0;
    if (intensity > 0.7) return '#002776';      // extreme right
    if (intensity > 0.4) return '#2166AC';      // strong right
    return '#5dade2';                            // moderate right
  }
}

export function renderBarChart(containerId, data, width = 700, height = 400, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container || !data || data.length === 0) return;

  container.innerHTML = '';

  // Controls
  const controls = document.createElement('div');
  controls.style.cssText = `
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    align-items: center;
  `;

  const sortLabel = document.createElement('span');
  sortLabel.textContent = 'Ordenar:';
  sortLabel.style.cssText = 'font-size:11px;font-weight:600;color:#5c534a;text-transform:uppercase;letter-spacing:0.06em;';
  controls.appendChild(sortLabel);

  const sortOptions = [
    { value: 'ideo-asc', label: '← Izquierda' },
    { value: 'ideo-desc', label: 'Derecha →' },
    { value: 'votes', label: 'Votos' },
  ];

  let currentSort = 'ideo-asc';

  function applySort(sortKey) {
    currentSort = sortKey;
    container.querySelectorAll('[data-sort]').forEach(b => {
      b.style.background = '#f8f5ee';
      b.style.color = '#5c534a';
      b.style.borderColor = '#d8d4cc';
    });
    const activeBtn = container.querySelector(`[data-sort="${sortKey}"]`);
    if (activeBtn) {
      activeBtn.style.background = '#002776';
      activeBtn.style.color = '#fff';
      activeBtn.style.borderColor = '#002776';
    }
    const sorted = sortData(data, sortKey);
    renderBars(container, sorted, width, height, opts);
  }

  sortOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;
    btn.dataset.sort = opt.value;
    btn.style.cssText = `
      padding: 3px 10px;
      border: 1px solid #d8d4cc;
      border-radius: 3px;
      background: #f8f5ee;
      font-size: 11px;
      cursor: pointer;
      color: #5c534a;
      font-family: 'IBM Plex Sans', sans-serif;
      transition: all 0.15s ease;
    `;
    if (opt.value === 'ideo-asc') {
      btn.style.background = '#002776';
      btn.style.color = '#fff';
      btn.style.borderColor = '#002776';
    }
    btn.addEventListener('click', () => applySort(opt.value));
    controls.appendChild(btn);
  });
  container.appendChild(controls);

  renderBars(container, data, width, height, opts);
}

function sortData(data, by) {
  const out = [...data];
  if (by === 'votes') {
    out.sort((a, b) => (b.votes || 0) - (a.votes || 0));
  } else if (by === 'ideo-desc') {
    out.sort((a, b) => b.ideo_weighted - a.ideo_weighted);
  } else {
    out.sort((a, b) => a.ideo_weighted - b.ideo_weighted);
  }
  return out;
}

function renderBars(container, data, width, height, opts) {
  // Remove old chart (keep controls)
  const existing = container.querySelector('.chart-svg-wrap');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'chart-svg-wrap';
  wrapper.style.cssText = 'position:relative;';
  container.appendChild(wrapper);

  const margin = { top: 8, right: 70, bottom: 32, left: 72 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.style.maxHeight = `${height}px`;
  svg.style.fontFamily = "'IBM Plex Sans', sans-serif";
  svg.style.overflow = 'visible';
  wrapper.appendChild(svg);

  const barH = Math.min(22, Math.max(10, innerH / data.length - 2));

  const minVal = Math.min(...data.map(d => d.ideo_weighted));
  const maxVal = Math.max(...data.map(d => d.ideo_weighted));
  const pad = Math.max(Math.abs(minVal), Math.abs(maxVal)) * 0.05 || 0.05;
  const xMin = minVal - pad;
  const xMax = maxVal + pad;
  const xScale = (v) => margin.left + ((v - xMin) / (xMax - xMin || 1)) * innerW;

  // Center line (0)
  const zeroX = xScale(0);
  const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  centerLine.setAttribute('x1', zeroX); centerLine.setAttribute('y1', margin.top);
  centerLine.setAttribute('x2', zeroX); centerLine.setAttribute('y2', height - margin.bottom);
  centerLine.setAttribute('stroke', '#9c938a'); centerLine.setAttribute('stroke-width', 1.5);
  svg.appendChild(centerLine);

  // Grid lines
  const xTicks = 5;
  for (let t = 0; t <= xTicks; t++) {
    const v = xMin + (xMax - xMin) * (t / xTicks);
    const x = xScale(v);
    if (Math.abs(v) < 0.005) continue;

    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', x); gridLine.setAttribute('y1', margin.top);
    gridLine.setAttribute('x2', x); gridLine.setAttribute('y2', height - margin.bottom);
    gridLine.setAttribute('stroke', '#eeecea'); gridLine.setAttribute('stroke-width', 1);
    svg.appendChild(gridLine);
  }

  // Bars + labels
  data.forEach((d, i) => {
    const y = margin.top + i * barH;
    const barX = d.ideo_weighted < 0 ? xScale(d.ideo_weighted) : zeroX;
    const barW = Math.abs(xScale(d.ideo_weighted) - zeroX);
    const color = getPartyColor(d.ideo_weighted, d.party);

    // Bar background track
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    track.setAttribute('x', zeroX);
    track.setAttribute('y', y + 2);
    track.setAttribute('width', innerW);
    track.setAttribute('height', barH - 4);
    track.setAttribute('fill', '#f8f5ee');
    track.setAttribute('rx', 2);
    svg.appendChild(track);

    // Actual bar
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', barX);
    rect.setAttribute('y', y + 2);
    rect.setAttribute('width', barW);
    rect.setAttribute('height', barH - 4);
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', '0.9');
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.style.transition = 'opacity 0.15s ease';
    svg.appendChild(rect);

    // Hover effect
    rect.addEventListener('mouseenter', () => { rect.setAttribute('opacity', '1'); });
    rect.addEventListener('mouseleave', () => { rect.setAttribute('opacity', '0.9'); });

    // Click
    if (opts.onPartyClick) {
      rect.addEventListener('click', () => opts.onPartyClick(d.party));
    }

    // Party name label
    const label = PARTY_NAMES[d.party] || `P${d.party}`;
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', margin.left - 6);
    lbl.setAttribute('y', y + barH / 2 + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('font-size', 11);
    lbl.setAttribute('font-weight', '600');
    lbl.setAttribute('fill', d.ideo_weighted < 0 ? '#8b0000' : '#1e4d8c');
    lbl.textContent = label;
    svg.appendChild(lbl);

    // Value label
    const valLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const valX = d.ideo_weighted < 0 ? xScale(d.ideo_weighted) - 5 : xScale(d.ideo_weighted) + 5;
    valLbl.setAttribute('x', valX);
    valLbl.setAttribute('y', y + barH / 2 + 4);
    valLbl.setAttribute('text-anchor', d.ideo_weighted < 0 ? 'end' : 'start');
    valLbl.setAttribute('font-size', 10);
    valLbl.setAttribute('fill', '#5c534a');
    valLbl.setAttribute('font-weight', '500');
    valLbl.textContent = `${d.ideo_weighted >= 0 ? '+' : ''}${d.ideo_weighted.toFixed(2)}`;
    svg.appendChild(valLbl);
  });

  // X axis
  const axisY = height - margin.bottom;
  const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axisLine.setAttribute('x1', margin.left); axisLine.setAttribute('y1', axisY);
  axisLine.setAttribute('x2', width - margin.right); axisLine.setAttribute('y2', axisY);
  axisLine.setAttribute('stroke', '#9c938a'); axisLine.setAttribute('stroke-width', 1);
  svg.appendChild(axisLine);

  // Tick labels
  const xTickCount = 5;
  for (let t = 0; t <= xTickCount; t++) {
    const v = xMin + (xMax - xMin) * (t / xTickCount);
    const x = xScale(v);
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x); tick.setAttribute('y1', axisY);
    tick.setAttribute('x2', x); tick.setAttribute('y2', axisY + 4);
    tick.setAttribute('stroke', '#9c938a'); tick.setAttribute('stroke-width', 1);
    svg.appendChild(tick);

    const tickLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tickLbl.setAttribute('x', x); tickLbl.setAttribute('y', axisY + 14);
    tickLbl.setAttribute('text-anchor', 'middle');
    tickLbl.setAttribute('font-size', 9);
    tickLbl.setAttribute('fill', '#9c938a');
    tickLbl.textContent = v.toFixed(1);
    svg.appendChild(tickLbl);
  }

  // Side labels
  const leftLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  leftLabel.setAttribute('x', margin.left + 5);
  leftLabel.setAttribute('y', margin.top - 4);
  leftLabel.setAttribute('font-size', 9);
  leftLabel.setAttribute('fill', '#B2182B');
  leftLabel.setAttribute('font-weight', '600');
  leftLabel.textContent = '← Izquierda';
  svg.appendChild(leftLabel);

  const rightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  rightLabel.setAttribute('x', width - margin.right - 5);
  rightLabel.setAttribute('y', margin.top - 4);
  rightLabel.setAttribute('text-anchor', 'end');
  rightLabel.setAttribute('font-size', 9);
  rightLabel.setAttribute('fill', '#2166AC');
  rightLabel.setAttribute('font-weight', '600');
  rightLabel.textContent = 'Derecha →';
  svg.appendChild(rightLabel);

  // Hover tooltip
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    pointer-events: none;
    background: #1a1614;
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: 'IBM Plex Sans', sans-serif;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    line-height: 1.5;
  `;
  wrapper.style.position = 'relative';
  wrapper.appendChild(tooltip);

  // Add hover listeners to bars
  data.forEach((d, i) => {
    const y = margin.top + i * barH;
    const barX = d.ideo_weighted < 0 ? xScale(d.ideo_weighted) : zeroX;
    const barW = Math.abs(xScale(d.ideo_weighted) - zeroX);

    const hoverRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hoverRect.setAttribute('x', barX);
    hoverRect.setAttribute('y', y + 2);
    hoverRect.setAttribute('width', barW || 2);
    hoverRect.setAttribute('height', barH - 4);
    hoverRect.setAttribute('fill', 'transparent');
    hoverRect.style.cursor = 'pointer';
    svg.appendChild(hoverRect);

    hoverRect.addEventListener('mouseenter', (e) => {
      const label = PARTY_NAMES[d.party] || `P${d.party}`;
      tooltip.innerHTML = `
        <div style="font-weight:700;font-size:13px;margin-bottom:3px">${label}</div>
        <div style="color:#c9a000">Partido ${d.party}</div>
        <div>Ideología: <strong>${d.ideo_weighted >= 0 ? '+' : ''}${d.ideo_weighted.toFixed(3)}</strong></div>
        ${d.votes ? `<div style="color:#9c938a;font-size:11px">${d.votes.toLocaleString('pt-BR')} votos</div>` : ''}
      `;
      tooltip.style.opacity = '1';
    });

    hoverRect.addEventListener('mousemove', (e) => {
      const rect2 = wrapper.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - rect2.left + 12}px`;
      tooltip.style.top = `${e.clientY - rect2.top - 40}px`;
    });

    hoverRect.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}
