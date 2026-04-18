/**
 * components/ScatterPlot.js
 * Scatter plot: year A vs year B IDEO per municipality.
 * Canvas 2D renderer for performance (5,570 points).
 * Supports linked brushing, nearest-neighbor tooltip, density contours.
 */

const SOUTH = new Set(['RS', 'SC', 'PR', 'SP', 'MS', 'MT', 'GO', 'DF']);
const NE = new Set(['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA', 'PA', 'AP']);

export function renderScatterPlot(containerId, dataA, dataB, width = 600, height = 500, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container || !dataA || !dataB || dataA.length === 0 || dataB.length === 0) return;

  container.innerHTML = '';

  const margin = { top: 20, right: 24, bottom: 52, left: 56 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative; width:100%;';
  container.appendChild(wrapper);

  // Canvas for points
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = 'display:block; width:100%; cursor:crosshair;';
  wrapper.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Overlay SVG for axes, labels, brush
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;font-family:"IBM Plex Sans",sans-serif;';
  wrapper.appendChild(svg);

  // Build paired data
  const idxB = {};
  for (const m of dataB) idxB[m.GEOCODIG_M] = m;

  const points = [];
  for (const mA of dataA) {
    const mB = idxB[mA.GEOCODIG_M];
    if (mB && mA.ideo_imp != null && mB.ideo_imp != null) {
      points.push({
        geocodig: mA.GEOCODIG_M,
        name: mA.tse_name,
        ibge_name: mA.ibge_name,
        uf: mA.uf,
        vA: mA.ideo_imp,
        vB: mB.ideo_imp,
      });
    }
  }

  if (points.length === 0) {
    container.textContent = 'No hay datos comparables para los años seleccionados.';
    return;
  }

  const yearA = dataA[0]?.year || 'Año A';
  const yearB = dataB[0]?.year || 'Año B';

  const minV = Math.min(...points.flatMap(p => [p.vA, p.vB]));
  const maxV = Math.max(...points.flatMap(p => [p.vA, p.vB]));
  const pad = (maxV - minV) * 0.06;
  const yMin = minV - pad;
  const yMax = maxV + pad;

  const xScale = (v) => margin.left + ((v - yMin) / (yMax - yMin)) * innerW;
  const yScale = (v) => margin.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const invertX = (px) => yMin + ((px - margin.left) / innerW) * (yMax - yMin);
  const invertY = (py) => yMax + ((margin.top + innerH - py) / innerH) * (yMax - yMin);

  // ---- Draw grid + axes on SVG ----
  function drawAxes() {
    const ticks = 5;

    for (let t = 0; t <= ticks; t++) {
      const v = yMin + (yMax - yMin) * (t / ticks);
      const isZero = Math.abs(v) < 0.01;
      const px = xScale(v);
      const py = yScale(v);

      // Horizontal grid
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', margin.left); hLine.setAttribute('y1', py);
      hLine.setAttribute('x2', width - margin.right); hLine.setAttribute('y2', py);
      hLine.setAttribute('stroke', isZero ? '#9c938a' : '#eeecea');
      hLine.setAttribute('stroke-width', isZero ? 1.5 : 1);
      hLine.setAttribute('stroke-dasharray', isZero ? 'none' : '3,3');
      svg.appendChild(hLine);

      // Vertical grid
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', px); vLine.setAttribute('y1', margin.top);
      vLine.setAttribute('x2', px); vLine.setAttribute('y2', height - margin.bottom);
      vLine.setAttribute('stroke', isZero ? '#9c938a' : '#eeecea');
      vLine.setAttribute('stroke-width', isZero ? 1.5 : 1);
      vLine.setAttribute('stroke-dasharray', isZero ? 'none' : '3,3');
      svg.appendChild(vLine);

      // Y labels (left)
      const yLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yLbl.setAttribute('x', margin.left - 8); yLbl.setAttribute('y', py + 4);
      yLbl.setAttribute('text-anchor', 'end');
      yLbl.setAttribute('font-size', 10);
      yLbl.setAttribute('fill', isZero ? '#5c534a' : '#9c938a');
      yLbl.setAttribute('font-weight', isZero ? '600' : '400');
      yLbl.textContent = v.toFixed(1);
      svg.appendChild(yLbl);

      // X labels (bottom)
      const xLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      xLbl.setAttribute('x', px); xLbl.setAttribute('y', height - margin.bottom + 16);
      xLbl.setAttribute('text-anchor', 'middle');
      xLbl.setAttribute('font-size', 10);
      xLbl.setAttribute('fill', isZero ? '#5c534a' : '#9c938a');
      xLbl.setAttribute('font-weight', isZero ? '600' : '400');
      xLbl.textContent = v.toFixed(1);
      svg.appendChild(xLbl);
    }

    // Diagonal (y=x) equality line
    const diag = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    diag.setAttribute('x1', xScale(yMin)); diag.setAttribute('y1', yScale(yMin));
    diag.setAttribute('x2', xScale(yMax)); diag.setAttribute('y2', yScale(yMax));
    diag.setAttribute('stroke', '#9c938a'); diag.setAttribute('stroke-width', 1.5);
    diag.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(diag);

    const diagLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const dMid = (yMin + yMax) / 2;
    diagLbl.setAttribute('x', xScale(dMid) + 6); diagLbl.setAttribute('y', yScale(dMid) - 6);
    diagLbl.setAttribute('font-size', 9); diagLbl.setAttribute('fill', '#9c938a');
    diagLbl.setAttribute('font-style', 'italic');
    diagLbl.textContent = 'y = x';
    svg.appendChild(diagLbl);

    // Axis labels
    const xLblEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLblEl.setAttribute('x', width / 2); xLblEl.setAttribute('y', height - 6);
    xLblEl.setAttribute('text-anchor', 'middle'); xLblEl.setAttribute('font-size', 11);
    xLblEl.setAttribute('fill', '#5c534a'); xLblEl.setAttribute('font-weight', '500');
    xLblEl.textContent = `Ideología ${yearA}`;
    svg.appendChild(xLblEl);

    const yLblEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLblEl.setAttribute('x', 14); yLblEl.setAttribute('y', height / 2);
    yLblEl.setAttribute('text-anchor', 'middle'); yLblEl.setAttribute('font-size', 11);
    yLblEl.setAttribute('fill', '#5c534a'); yLblEl.setAttribute('font-weight', '500');
    yLblEl.setAttribute('transform', `rotate(-90, 14, ${height / 2})`);
    yLblEl.textContent = `Ideología ${yearB}`;
    svg.appendChild(yLblEl);

    // Legend
    const legendItems = [
      { color: '#2166AC', label: 'Sur/Sudeste' },
      { color: '#B2182B', label: 'Norte/Nordeste' },
      { color: '#aaa', label: 'Otro' },
    ];
    const legendX = width - margin.right - 120;
    const legendY = margin.top + 8;
    legendItems.forEach((item, i) => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', legendX + 6); dot.setAttribute('cy', legendY + i * 18 + 6);
      dot.setAttribute('r', 5); dot.setAttribute('fill', item.color); dot.setAttribute('opacity', '0.8');
      svg.appendChild(dot);
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', legendX + 16); lbl.setAttribute('y', legendY + i * 18 + 10);
      lbl.setAttribute('font-size', 11); lbl.setAttribute('fill', '#5c534a');
      lbl.textContent = item.label;
      svg.appendChild(lbl);
    });

    // Point count
    const countLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    countLbl.setAttribute('x', width - margin.right); countLbl.setAttribute('y', margin.top + 8);
    countLbl.setAttribute('text-anchor', 'end'); countLbl.setAttribute('font-size', 9);
    countLbl.setAttribute('fill', '#9c938a'); countLbl.setAttribute('font-style', 'italic');
    countLbl.textContent = `${points.length.toLocaleString()} municipios`;
    svg.appendChild(countLbl);

    // Quadrant annotations
    const zeroX = xScale(0);
    const zeroY = yScale(0);
    if (zeroX > margin.left && zeroX < width - margin.right &&
        zeroY > margin.top && zeroY < height - margin.bottom) {

      const quads = [
        { x: zeroX + 8, y: zeroY + 24, label: 'Izq→Der', color: '#2166AC' },
        { x: zeroX - 8, y: zeroY + 24, label: 'Izq→Izq', color: '#aaa' },
        { x: zeroX + 8, y: zeroY - 16, label: 'Der→Der', color: '#2166AC' },
        { x: zeroX - 8, y: zeroY - 16, label: 'Der→Izq', color: '#B2182B' },
      ];

      const counts = { 'Izq→Der': 0, 'Izq→Izq': 0, 'Der→Der': 0, 'Der→Izq': 0 };
      for (const p of points) {
        const k = p.vA < 0 ? (p.vB < 0 ? 'Izq→Izq' : 'Izq→Der') : (p.vB < 0 ? 'Der→Izq' : 'Der→Der');
        counts[k]++;
      }

      quads.forEach(q => {
        const pct = ((counts[q.label] / points.length) * 100).toFixed(1);
        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', q.x); lbl.setAttribute('y', q.y);
        lbl.setAttribute('font-size', 9); lbl.setAttribute('fill', q.color);
        lbl.setAttribute('font-weight', '600');
        lbl.setAttribute('opacity', '0.6');
        lbl.textContent = `${q.label} ${pct}%`;
        svg.appendChild(lbl);
      });
    }
  }

  // ---- Draw points on canvas ----
  let brush = null;
  let hoveredPoint = null;
  let animationFrame = 0;

  function getPointColor(p) {
    if (p.uf && SOUTH.has(p.uf)) return '#2166AC';
    if (p.uf && NE.has(p.uf)) return '#B2182B';
    return '#aaa';
  }

  function draw(animated = false) {
    ctx.clearRect(0, 0, width, height);

    // Clip to chart area
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, innerW, innerH);
    ctx.clip();

    // Draw points with stagger animation
    const batch = animated ? 500 : points.length;
    const start = animated ? 0 : 0;
    const end = animated ? Math.min(batch * animationFrame, points.length) : points.length;

    for (let i = start; i < end; i++) {
      const p = points[i];
      const px = xScale(p.vA);
      const py = yScale(p.vB);

      const alpha = hoveredPoint === i ? 0.9 : 0.55;
      const r = hoveredPoint === i ? 5 : 3.5;

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = getPointColor(p);
      ctx.globalAlpha = alpha;
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // Brush overlay
    if (brush) {
      ctx.strokeStyle = '#c9a000';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(brush.x, brush.y, brush.w, brush.h);
      ctx.setLineDash([]);
    }

    // Continue animation
    if (animated && end < points.length) {
      animationFrame++;
      requestAnimationFrame(() => draw(true));
    }
  }

  // ---- Tooltip ----
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
    transition: opacity 0.1s ease;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    line-height: 1.5;
    max-width: 220px;
  `;
  wrapper.appendChild(tooltip);

  // Nearest neighbor lookup
  function findNearest(mouseX, mouseY) {
    let nearest = null;
    let minDist = Infinity;
    const threshold = 15;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const px = xScale(p.vA);
      const py = yScale(p.vB);
      const d = Math.hypot(px - mouseX, py - mouseY);
      if (d < minDist && d < threshold) {
        minDist = d;
        nearest = i;
      }
    }
    return nearest;
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const idx = findNearest(mouseX, mouseY);

    if (idx !== null) {
      if (hoveredPoint !== idx) {
        hoveredPoint = idx;
        draw(false);
      }
      const p = points[idx];
      const change = p.vB - p.vA;
      const changeStr = change >= 0 ? `+${change.toFixed(3)}` : change.toFixed(3);
      const changeColor = change > 0.05 ? '#4ade80' : change < -0.05 ? '#f87171' : '#9c938a';

      tooltip.innerHTML = `
        <div style="font-weight:700;font-size:12px;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:4px">
          ${p.name}, ${p.uf}
        </div>
        <div style="display:flex;gap:12px;margin-bottom:4px">
          <div><span style="color:#9c938a">${yearA}:</span> <strong>${p.vA >= 0 ? '+' : ''}${p.vA.toFixed(3)}</strong></div>
          <div><span style="color:#9c938a">${yearB}:</span> <strong>${p.vB >= 0 ? '+' : ''}${p.vB.toFixed(3)}</strong></div>
        </div>
        <div style="color:${changeColor};font-size:11px">Cambio: ${changeStr}</div>
      `;
      tooltip.style.opacity = '1';

      const svgRect = wrapper.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - svgRect.left + 14}px`;
      tooltip.style.top = `${e.clientY - svgRect.top - 50}px`;
    } else {
      hoveredPoint = null;
      draw(false);
      tooltip.style.opacity = '0';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredPoint = null;
    draw(false);
    tooltip.style.opacity = '0';
  });

  // ---- Brush selection ----
  let brushStart = null;

  canvas.addEventListener('mousedown', (e) => {
    if (e.shiftKey) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      brushStart = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (brushStart) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const curX = (e.clientX - rect.left) * scaleX;
      const curY = (e.clientY - rect.top) * scaleY;

      brush = {
        x: Math.min(brushStart.x, curX),
        y: Math.min(brushStart.y, curY),
        w: Math.abs(curX - brushStart.x),
        h: Math.abs(curY - brushStart.y),
      };
      draw(false);
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    if (brushStart && brush && brush.w > 5 && brush.h > 5) {
      // Emit brush event for linked highlighting
      const x0 = invertX(brush.x);
      const x1 = invertX(brush.x + brush.w);
      const y0 = invertY(brush.y + brush.h);
      const y1 = invertY(brush.y);

      const selected = points.filter(p =>
        p.vA >= x0 && p.vA <= x1 && p.vB >= y0 && p.vB <= y1
      );

      if (opts.onBrush) {
        opts.onBrush({ x0, x1, y0, y1, points: selected });
      }
    }
    brushStart = null;
  });

  canvas.addEventListener('dblclick', () => {
    brush = null;
    draw(false);
    if (opts.onBrush) {
      opts.onBrush(null);
    }
  });

  // Draw axes
  drawAxes();

  // Draw points with animation
  animationFrame = 1;
  draw(true);
}
