export function ensureChartTooltip(container) {
  if (!container) return null;
  if (!container.style.position) container.style.position = 'relative';
  let tooltip = container.querySelector('.chart-hover-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-hover-tooltip hidden';
    container.appendChild(tooltip);
  }
  return tooltip;
}

export function bindTooltip(target, container, htmlBuilder) {
  const tooltip = ensureChartTooltip(container);
  if (!tooltip || !target) return;

  const show = (event) => {
    tooltip.innerHTML = htmlBuilder();
    tooltip.classList.remove('hidden');
    const rect = container.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 12}px`;
    tooltip.style.top = `${event.clientY - rect.top - 12}px`;
  };

  const hide = () => tooltip.classList.add('hidden');

  target.addEventListener('mouseenter', show);
  target.addEventListener('mousemove', show);
  target.addEventListener('mouseleave', hide);
}
