/**
 * components/LineChart.js
 * Publication-quality line chart with rich tooltips,
 * event annotations, and draw animation.
 */

export function renderLineChart(containerId, data, width = 700, height = 300, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container || !data || data.length === 0) return;

  container.innerHTML = '';

  const margin = { top: 20, right: 28, bottom: 44, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.style.fontFamily = "'IBM Plex Sans', sans-serif";
  svg.style.overflow = 'visible';
  container.appendChild(svg);

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const years = sorted.map(d => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const allVals = sorted.flatMap(d => [
    d.min ?? d.mean - (d.sd ?? 0),
    d.max ?? d.mean + (d.sd ?? 0),
    d.mean
  ]);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const valPad = (rawMax - rawMin) * 0.15 || 0.1;
  const yMin = rawMin - valPad;
  const yMax = rawMax + valPad;

  const xScale = (y) => margin.left + ((y - minYear) / (maxYear - minYear || 1)) * innerW;
  const yScale = (v) => margin.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  // ---- Event annotations ----
  const events = [
    { year: 2002, label: 'Lula', color: '#c0392b' },
    { year: 2013, label: 'Protestos', color: '#e67e22' },
    { year: 2016, label: 'Impeachment', color: '#8e44ad' },
    { year: 2018, label: 'Bolsonaro', color: '#2166AC' },
  ];

  for (const evt of events) {
    if (evt.year >= minYear && evt.year <= maxYear) {
      const x = xScale(evt.year);

      // Vertical line
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', x);
      vLine.setAttribute('y1', margin.top);
      vLine.setAttribute('x2', x);
      vLine.setAttribute('y2', height - margin.bottom);
      vLine.setAttribute('stroke', evt.color);
      vLine.setAttribute('stroke-width', 1.5);
      vLine.setAttribute('stroke-dasharray', '4,3');
      vLine.setAttribute('opacity', '0.5');
      svg.appendChild(vLine);

      // Label at top
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', x + 4);
      lbl.setAttribute('y', margin.top + 10);
      lbl.setAttribute('font-size', 9);
      lbl.setAttribute('fill', evt.color);
      lbl.setAttribute('font-weight', '600');
      lbl.setAttribute('opacity', '0.85');
      lbl.textContent = evt.label;
      svg.appendChild(lbl);
    }
  }

  // ---- Horizontal grid ----
  const yTicks = 5;
  for (let t = 0; t <= yTicks; t++) {
    const v = yMin + (yMax - yMin) * (t / yTicks);
    const y = yScale(v);
    const isZero = Math.abs(v) < 0.01;

    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', margin.left);
    gridLine.setAttribute('y1', y);
    gridLine.setAttribute('x2', width - margin.right);
    gridLine.setAttribute('y2', y);
    gridLine.setAttribute('stroke', isZero ? '#9c938a' : '#d8d4cc');
    gridLine.setAttribute('stroke-width', isZero ? 1.5 : 1);
    gridLine.setAttribute('stroke-dasharray', isZero ? 'none' : '3,3');
    svg.appendChild(gridLine);

    const tickLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tickLbl.setAttribute('x', margin.left - 8);
    tickLbl.setAttribute('y', y + 4);
    tickLbl.setAttribute('text-anchor', 'end');
    tickLbl.setAttribute('font-size', 10);
    tickLbl.setAttribute('fill', isZero ? '#5c534a' : '#9c938a');
    tickLbl.setAttribute('font-weight', isZero ? '600' : '400');
    tickLbl.textContent = v.toFixed(2);
    svg.appendChild(tickLbl);
  }

  // ---- Vertical grid + X axis ----
  const axisBottom = height - margin.bottom;
  for (const yr of years) {
    const x = xScale(yr);

    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', x);
    gridLine.setAttribute('y1', margin.top);
    gridLine.setAttribute('x2', x);
    gridLine.setAttribute('y2', axisBottom);
    gridLine.setAttribute('stroke', '#eeecea');
    gridLine.setAttribute('stroke-width', 1);
    svg.appendChild(gridLine);

    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', axisBottom);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', axisBottom + 5);
    tick.setAttribute('stroke', '#bbb');
    tick.setAttribute('stroke-width', 1);
    svg.appendChild(tick);

    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', axisBottom + 16);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-size', 10);
    lbl.setAttribute('fill', '#5c534a');
    lbl.setAttribute('font-weight', '500');
    lbl.textContent = yr;
    svg.appendChild(lbl);
  }

  // ---- X axis label ----
  const xAxisLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xAxisLbl.setAttribute('x', width / 2);
  xAxisLbl.setAttribute('y', height - 4);
  xAxisLbl.setAttribute('text-anchor', 'middle');
  xAxisLbl.setAttribute('font-size', 10);
  xAxisLbl.setAttribute('fill', '#9c938a');
  xAxisLbl.textContent = 'Año electoral';
  svg.appendChild(xAxisLbl);

  // ---- Area band (min–max range) ----
  if (sorted[0].min != null && sorted[0].max != null) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', `areaGrad-${containerId}`);
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    grad.setAttribute('x1', 0);
    grad.setAttribute('y1', margin.top);
    grad.setAttribute('x2', 0);
    grad.setAttribute('y2', margin.top + innerH);

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#2166AC');
    stop1.setAttribute('stop-opacity', '0.15');
    grad.appendChild(stop1);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#2166AC');
    stop2.setAttribute('stop-opacity', '0.03');
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dTop = sorted.map(d => `${xScale(d.year)},${yScale(d.min)}`).join(' L');
    const dBot = [...sorted].reverse().map(d => `${xScale(d.year)},${yScale(d.max)}`).join(' L');
    areaPath.setAttribute('d', `M${dTop} L${dBot} Z`);
    areaPath.setAttribute('fill', `url(#areaGrad-${containerId})`);
    svg.appendChild(areaPath);
  }

  // ---- Mean line ----
  const lineD = sorted.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.year)},${yScale(d.mean)}`).join(' ');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', lineD);
  line.setAttribute('stroke', '#2166AC');
  line.setAttribute('stroke-width', 2.5);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('class', 'chart-line');
  svg.appendChild(line);

  // Animate line draw on entrance
  const lineLen = line.getTotalLength ? line.getTotalLength() : 1000;
  line.style.strokeDasharray = lineLen;
  line.style.strokeDashoffset = lineLen;
  line.style.transition = 'stroke-dashoffset 0.8s ease-out';

  // ---- Data points ----
  const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'points-group');
  svg.appendChild(pointsGroup);

  for (const d of sorted) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', xScale(d.year));
    circle.setAttribute('cy', yScale(d.mean));
    circle.setAttribute('r', 4.5);
    circle.setAttribute('fill', '#2166AC');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', 2);
    circle.style.cursor = 'pointer';
    circle.style.transition = 'r 0.15s ease, transform 0.15s ease';
    circle.setAttribute('data-year', d.year);
    pointsGroup.appendChild(circle);

    // Native tooltip as fallback
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    tooltip.textContent = `${d.year}: ${d.mean.toFixed(3)}`;
    circle.appendChild(tooltip);

    // Click handler
    if (opts.onYearClick) {
      circle.addEventListener('click', () => {
        opts.onYearClick(d.year);
      });
    }

    // Hover effect
    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('r', 7);
      circle.setAttribute('stroke-width', 2.5);
    });
    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', 4.5);
      circle.setAttribute('stroke-width', 2);
    });
  }

  // ---- Zero line label ----
  if (yMin < 0 && yMax > 0) {
    const zeroY = yScale(0);
    const zeroLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    zeroLbl.setAttribute('x', width - margin.right + 5);
    zeroLbl.setAttribute('y', zeroY + 4);
    zeroLbl.setAttribute('font-size', 9);
    zeroLbl.setAttribute('fill', '#9c938a');
    zeroLbl.setAttribute('font-style', 'italic');
    zeroLbl.textContent = '0';
    svg.appendChild(zeroLbl);
  }

  // ---- Rich tooltip (HTML overlay) ----
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
  container.style.position = 'relative';
  container.appendChild(tooltip);

  // Invisible overlay for precise mouse tracking
  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  overlay.setAttribute('x', margin.left);
  overlay.setAttribute('y', margin.top);
  overlay.setAttribute('width', innerW);
  overlay.setAttribute('height', innerH);
  overlay.setAttribute('fill', 'transparent');
  svg.appendChild(overlay);

  overlay.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const scaleX = svgRect.width / width;

    const mouseX = (e.clientX - svgRect.left) / scaleX;
    if (mouseX < margin.left || mouseX > width - margin.right) {
      tooltip.style.opacity = '0';
      return;
    }

    // Find nearest year
    const yearAtMouse = Math.round(minYear + (mouseX - margin.left) / innerW * (maxYear - minYear));
    const nearest = sorted.reduce((prev, curr) =>
      Math.abs(curr.year - yearAtMouse) < Math.abs(prev.year - yearAtMouse) ? curr : prev
    );

    const prev = sorted.find(d => d.year === nearest.year - 2);
    const diff = prev ? nearest.mean - prev.mean : null;

    const side = (xScale(nearest.year) > width * 0.7) ? 'left' : 'right';
    const xPos = xScale(nearest.year) * scaleX;
    tooltip.style.left = side === 'right'
      ? `${xPos + 12}px`
      : `${xPos - 160}px`;
    tooltip.style.top = `${yScale(nearest.mean) * (svgRect.height / height) - 20}px`;

    const diffStr = diff !== null
      ? diff > 0 ? ` <span style="color:#4ade80">+${diff.toFixed(3)}</span>` : ` <span style="color:#f87171">${diff.toFixed(3)}</span>`
      : '';

    tooltip.innerHTML = `
      <div style="font-weight:700;font-size:13px;margin-bottom:3px">${nearest.year}</div>
      <div style="color:#c9a000">Média: <strong>${nearest.mean >= 0 ? '+' : ''}${nearest.mean.toFixed(3)}</strong></div>
      ${nearest.sd ? `<div style="color:#9c938a;font-size:11px">DE: ${nearest.sd.toFixed(3)}</div>` : ''}
      ${diffStr ? `<div style="color:#9c938a;font-size:11px;margin-top:2px">vs ${nearest.year - 2}: ${diffStr}</div>` : ''}
    `;
    tooltip.style.opacity = '1';
  });

  overlay.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
  });

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      line.style.strokeDashoffset = '0';
    });
  });
}
