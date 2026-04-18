/**
 * TopAppBar.js
 * Fixed header component with logo, navigation, and user actions.
 */

import { getLocale, getLocaleLabel, applyI18n, onLocaleChange, t } from '../i18n/index.js';

let currentLocale = 'pt';
let localeChangeBound = false;

function closeMobileNav() {
  const panel = document.getElementById('mobile-nav-panel');
  if (panel) panel.classList.add('hidden');
}

function toggleMobileNav() {
  const panel = document.getElementById('mobile-nav-panel');
  if (!panel) return;
  panel.classList.toggle('hidden');
}

function updateLocaleDisplay() {
  const btn = document.getElementById('locale-btn');
  if (btn) {
    btn.innerHTML = `
      <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">language</span>
      <span class="font-label text-[10px] uppercase tracking-widest font-bold">${getLocaleLabel(currentLocale)}</span>
    `;
  }
  
  applyI18n(document);
}

function bindMapReloadLink(link) {
  if (!link || link.dataset.mapReloadBound === 'true') return;
  if (link.dataset.nav !== 'map') return;

  link.addEventListener('click', () => {
    const hash = window.location.hash.slice(1) || '/';
    const path = hash.split('?')[0];
    if (path !== '/map') return;

    window.dispatchEvent(new CustomEvent('map:reload-request'));
  });

  link.dataset.mapReloadBound = 'true';
}

export function createTopAppBar() {
  return `
    <header class="bg-background border-b border-surface-container-high sticky top-0 z-50">
      <div class="flex justify-between items-center w-full px-8 py-4">
        <!-- Logo & Title -->
        <div class="flex items-center gap-8">
          <a href="#/" class="text-2xl font-headline italic font-bold text-primary no-underline">
            ${t('landing.heroTitle')}
          </a>
          <nav class="hidden md:flex items-center gap-6">
            <a href="#/" class="nav-link font-label text-[10px] uppercase tracking-widest text-stone-600 hover:text-primary transition-colors duration-200" data-nav="landing" data-i18n="nav.landing">Home</a>
            <a href="#/dashboard" class="nav-link font-label text-[10px] uppercase tracking-widest text-stone-600 hover:text-primary transition-colors duration-200" data-nav="dashboard" data-i18n="nav.dashboard">Analysis</a>
            <a href="#/map" class="nav-link font-label text-[10px] uppercase tracking-widest text-stone-600 hover:text-primary transition-colors duration-200" data-nav="map" data-i18n="nav.map">Map</a>
            <a href="#/municipio" class="nav-link font-label text-[10px] uppercase tracking-widest text-stone-600 hover:text-primary transition-colors duration-200" data-nav="municipio" data-i18n="nav.municipio">Municipality</a>
            <a href="#/methodology" class="nav-link font-label text-[10px] uppercase tracking-widest text-stone-600 hover:text-primary transition-colors duration-200" data-nav="methodology" data-i18n="nav.methodology">Methodology</a>
          </nav>
        </div>

        <!-- User Actions -->
        <div class="flex items-center gap-4">
          <button id="mobile-nav-toggle" class="md:hidden flex items-center justify-center w-10 h-10 border border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-200" aria-label="Toggle navigation">
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">menu</span>
          </button>
          <button id="locale-btn" class="flex items-center gap-2 px-3 py-1.5 border border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-200" onclick="window.dispatchEvent(new CustomEvent('cycle-locale'))">
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">language</span>
            <span class="font-label text-[10px] uppercase tracking-widest font-bold">PT-BR</span>
          </button>
        </div>
      </div>
      <div id="mobile-nav-panel" class="hidden md:hidden border-t border-surface-container-high bg-background px-8 py-4">
        <nav class="flex flex-col gap-3">
          <a href="#/" class="nav-link font-label text-[11px] uppercase tracking-widest text-stone-700" data-nav="landing" data-i18n="nav.landing">Home</a>
          <a href="#/dashboard" class="nav-link font-label text-[11px] uppercase tracking-widest text-stone-700" data-nav="dashboard" data-i18n="nav.dashboard">Analysis</a>
          <a href="#/map" class="nav-link font-label text-[11px] uppercase tracking-widest text-stone-700" data-nav="map" data-i18n="nav.map">Map</a>
          <a href="#/municipio" class="nav-link font-label text-[11px] uppercase tracking-widest text-stone-700" data-nav="municipio" data-i18n="nav.municipio">Municipality</a>
          <a href="#/methodology" class="nav-link font-label text-[11px] uppercase tracking-widest text-stone-700" data-nav="methodology" data-i18n="nav.methodology">Methodology</a>
        </nav>
      </div>
    </header>
  `;
}

export function initTopAppBar() {
  currentLocale = getLocale();

  // Set active nav state based on current route
  const hash = window.location.hash.slice(1) || '/';
  const path = hash.split('?')[0];

  const navMap = {
    '/': 'landing',
    '/dashboard': 'dashboard',
    '/map': 'map',
    '/municipio': 'municipio',
    '/methodology': 'methodology',
  };

  const active = navMap[path] || 'landing';

  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === active) {
      link.classList.add('text-primary', 'font-bold', 'border-b', 'border-primary');
      link.classList.remove('text-stone-600');
      link.classList.remove('text-stone-700');
    } else {
      link.classList.remove('text-primary', 'font-bold', 'border-b', 'border-primary');
      link.classList.add('text-stone-600');
    }

    bindMapReloadLink(link);
  });

  const toggle = document.getElementById('mobile-nav-toggle');
  if (toggle && !toggle.dataset.bound) {
    toggle.addEventListener('click', toggleMobileNav);
    toggle.dataset.bound = 'true';
  }

  document.querySelectorAll('#mobile-nav-panel a').forEach((link) => {
    if (!link.dataset.bound) {
      link.addEventListener('click', closeMobileNav);
      link.dataset.bound = 'true';
    }
  });

  updateLocaleDisplay();

  if (!localeChangeBound) {
    onLocaleChange((locale) => {
      currentLocale = locale;
      updateLocaleDisplay();
    });
    localeChangeBound = true;
  }

}
