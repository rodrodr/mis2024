/**
 * App.js
 * Main application layout with hash-based routing.
 * Routes:
 *   /           → Landing Page
 *   /dashboard  → National Trends Dashboard
 *   /map        → Spatial Explorer
 *   /municipio  → Municipal Profile
 *   /methodology → Methodology Documentation
 */

import { createTopAppBar, initTopAppBar } from './components/TopAppBar.js';
import { createLandingPage, initLandingPage } from './components/LandingPage.js';
import { createDashboardPage, initDashboardPage } from './components/DashboardPage.js';
import { createSpatialExplorerPage, initSpatialExplorerPage } from './components/SpatialExplorerPage.js';
import { createMunicipalProfilePage, initMunicipalProfilePage } from './components/MunicipalProfilePage.js';
import { createMethodologyPage, initMethodologyPage } from './components/MethodologyPage.js';
import { initI18n, getLocale, setLocale, locales, applyI18n, onLocaleChange, t } from './i18n/index.js';

class App {
  constructor() {
    this.currentRoute = null;
    this.baseTitle = typeof document !== 'undefined' ? document.title : 'Ideología Municipal de Brasil · 1994–2024';
  }

  async init() {
    // Initialize i18n
    initI18n();
    this.bindGlobalLocaleCycle();
    this.bindLocaleRerender();
    
    this.buildLayout();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('map:reload-request', () => {
      if (this.currentRoute === 'map') this.handleRoute();
    });
  }

  bindGlobalLocaleCycle() {
    if (window.__misLocaleCycleBound) return;

    window.addEventListener('cycle-locale', () => {
      const current = getLocale();
      const idx = locales.indexOf(current);
      const next = locales[(idx + 1) % locales.length];
      setLocale(next);
      applyI18n(document);
    });

    window.__misLocaleCycleBound = true;
  }

  bindLocaleRerender() {
    if (window.__misLocaleRerenderBound) return;

    onLocaleChange(() => {
      this.handleRoute();
    });

    window.__misLocaleRerenderBound = true;
  }

  buildLayout() {
    const root = document.getElementById('app');
    root.innerHTML = `<div id="view-container"></div>`;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const path = hash.split('?')[0];
    const params = new URLSearchParams(hash.split('?')[1] || '');

    let route = path;
    let view = '';

    switch (route) {
      case '/':
        view = this.renderLanding();
        this.currentRoute = 'landing';
        break;
      case '/dashboard':
        view = this.renderDashboard();
        this.currentRoute = 'dashboard';
        break;
      case '/map':
        view = this.renderMap();
        this.currentRoute = 'map';
        break;
      case '/municipio':
        const id = params.get('id') || params.get('municipio') || '';
        view = this.renderMunicipal(id);
        this.currentRoute = 'municipal';
        break;
      case '/methodology':
        view = this.renderMethodology();
        this.currentRoute = 'methodology';
        break;
      default:
        view = this.renderLanding();
        this.currentRoute = 'landing';
    }

    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = view;
      if (this.currentRoute !== 'municipal') document.title = this.baseTitle;
      this.initCurrentView();
    }
  }

  renderLanding() {
    return `
      ${createTopAppBar()}
      <main>
        ${createLandingPage()}
      </main>
      <footer class="app-footer">
        <p>${t('footer.datasetCitation')}
           <a href="https://doi.org/10.1590/1981-3821201900010001" target="_blank">DOI</a>.
           ${t('footer.ownExtension')}</p>
      </footer>
    `;
  }

  renderDashboard() {
    return `
      ${createTopAppBar()}
      <main>
          ${createDashboardPage()}
        </main>
    `;
  }

  renderMap() {
    return `
      ${createTopAppBar()}
      <main>
        ${createSpatialExplorerPage()}
      </main>
    `;
  }

  renderMunicipal(id) {
    return `
      ${createTopAppBar()}
      <main>
          ${createMunicipalProfilePage(id)}
        </main>
    `;
  }

  renderMethodology() {
    return `
      ${createTopAppBar()}
      <main>
        ${createMethodologyPage()}
      </main>
    `;
  }

  initCurrentView() {
    switch (this.currentRoute) {
      case 'landing':
        initLandingPage();
        initTopAppBar();
        break;
      case 'dashboard':
        initDashboardPage();
        initTopAppBar();
        break;
      case 'map':
        initSpatialExplorerPage();
        initTopAppBar();
        break;
      case 'municipal':
        initMunicipalProfilePage();
        initTopAppBar();
        break;
      case 'methodology':
        initMethodologyPage();
        initTopAppBar();
        break;
    }
  }
}

export default App;
