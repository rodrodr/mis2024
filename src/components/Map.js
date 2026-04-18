/**
 * components/Map.js
 * Leaflet choropleth map with synced hover and pinned selection state.
 */

import * as L from 'leaflet';
import 'leaflet.vectorgrid';
import { EventBus } from '../EventBus.js';
import { t } from '../i18n/index.js';

let map = null;
let vectorLayer = null;
let stateLayer = null;
let geoJSON = null;
let currentYear = 2024;
let currentVar = 'ideo_imp';
let muniIndex = {};
let colorScale = { min: -0.7, max: 0.9 };
let pinnedPopup = null;
let cdMunToGeocodig = {};
let geocodigToCdMun = {};
let geoIndex = {};
let highlightedParty = null;
let highlightedMuni = null;
let partyWinnerIndex = {};
let mapClickHandlerBound = false;
let eventBusBound = false;
let currentContainerId = 'map-container';

const DEFAULT_VIEW = {
  center: [-14.5, -54],
  zoom: 4.5,
};

const VAR_SCALES = {
  ideo_imp: { min: -0.7, max: 0.9, labelKey: 'map.variableIdeology' },
  ideo_na: { min: -0.7, max: 0.9, labelKey: 'map.variableIdeologyNa' },
  ideopref: { min: -1, max: 1, label: 'Ideology Preference' },
  ideogov: { min: -1, max: 1, label: 'Ideology Governor' },
  ideo_pres: { min: -1, max: 1, label: 'Ideology President' },
  closeness: { min: 0, max: 1, labelKey: 'map.variableCloseness' },
};

function getVariableLabel() {
  const config = VAR_SCALES[currentVar];
  if (config?.labelKey) return t(config.labelKey);
  return config?.label || currentVar;
}

function getNeutralColor() {
  return '#d8d4cc';
}

function getColor(value) {
  const { min, max } = colorScale;
  const v = Math.max(min, Math.min(max, value ?? 0));
  if (v < -0.75) return '#7f0000';
  if (v < -0.5) return '#b22222';
  if (v < -0.25) return '#d97a6c';
  if (v <= 0.25) return '#f3efe8';
  if (v <= 0.5) return '#8aa9e6';
  if (v <= 0.75) return '#3d6dcc';
  return '#0d3d91';
}

function computeColorScale(municipalities) {
  const varConfig = VAR_SCALES[currentVar] || { min: -0.7, max: 0.9 };
  if (!municipalities?.length) {
    if (currentVar === 'closeness') {
      colorScale = { min: 0, max: 1 };
    } else {
      const bound = Math.max(Math.abs(varConfig.min), Math.abs(varConfig.max));
      colorScale = { min: -bound, max: bound };
    }
    return;
  }

  const values = municipalities.map((row) => row[currentVar]).filter((value) => value != null);
  if (!values.length) {
    if (currentVar === 'closeness') {
      colorScale = { min: 0, max: 1 };
    } else {
      const bound = Math.max(Math.abs(varConfig.min), Math.abs(varConfig.max));
      colorScale = { min: -bound, max: bound };
    }
    return;
  }

  if (currentVar === 'closeness') {
    colorScale = { min: 0, max: 1 };
    return;
  }

  const bound = Math.max(Math.abs(varConfig.min), Math.abs(varConfig.max));
  colorScale = { min: -bound, max: bound };
}

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function buildGeoIndex(gjData) {
  geoIndex = {};
  cdMunToGeocodig = {};
  geocodigToCdMun = {};
  const nameToGeocodig = {};

  Object.entries(muniIndex).forEach(([geocodig, row]) => {
    const key = `${row.uf}-${normalize(row.tse_name || row.ibge_name)}`;
    nameToGeocodig[key] = geocodig;
  });

  gjData.features.forEach((feature) => {
    const cdMun = String(feature.properties.CD_MUN);
    const uf = feature.properties.SIGLA_UF;
    const name = feature.properties.NM_MUN;
    geoIndex[cdMun] = feature;
    const geocodig = nameToGeocodig[`${uf}-${normalize(name)}`];
    if (geocodig) {
      cdMunToGeocodig[cdMun] = geocodig;
      geocodigToCdMun[geocodig] = cdMun;
    }
  });
}

function getFeatureCentroid(feature) {
  const coords = feature.geometry.coordinates;
  const lngs = [];
  const lats = [];
  function walk(value) {
    value.forEach((entry) => {
      if (typeof entry[0] === 'number') {
        lngs.push(entry[0]);
        lats.push(entry[1]);
      } else {
        walk(entry);
      }
    });
  }
  walk(coords);
  if (!lngs.length) return null;
  return [
    lats.reduce((sum, value) => sum + value, 0) / lats.length,
    lngs.reduce((sum, value) => sum + value, 0) / lngs.length,
  ];
}

function getStyleForFeature(feature) {
  const geocodig = cdMunToGeocodig[String(feature.properties.CD_MUN)];
  const municipality = geocodig ? muniIndex[geocodig] : null;
  const value = municipality ? municipality[currentVar] : null;

  return {
    fillColor: value != null ? getColor(value) : getNeutralColor(),
    fillOpacity: 1,
    color: '#ffffff',
    weight: 0.25,
    opacity: 0.72,
  };
}

function getSelectionStyle(feature, geocodig) {
  const base = getStyleForFeature(feature);
  if (highlightedMuni && highlightedMuni === geocodig) {
    return {
      ...base,
      weight: 1.8,
      color: '#c9a000',
      fillOpacity: 1,
      opacity: 1,
    };
  }

  if (highlightedParty) {
    const winner = partyWinnerIndex[`${currentYear}-${feature.properties.SIGLA_UF}`];
    if (winner === highlightedParty) {
      return { ...base, weight: 1, color: '#c9a000', fillOpacity: 0.95, opacity: 0.9 };
    }
    return { ...base, weight: 0.2, fillOpacity: 0.35, opacity: 0.4 };
  }

  return base;
}

function buildTooltipHTML(muni, variable) {
  const value = muni[variable];
  const isLeft = value < -0.05;
  const isRight = value > 0.05;
  const valueClass = isLeft ? 'left' : isRight ? 'right' : 'center';
  const name = muni.tse_name || muni.ibge_name;
  const href = `#/municipio?id=${encodeURIComponent(name)}&geocodig=${encodeURIComponent(muni.GEOCODIG_M)}&year=${encodeURIComponent(muni.year || currentYear)}`;

  return `
    <div class="map-tooltip">
      <div class="map-tooltip-header">${name}, ${muni.uf}</div>
      <div class="map-tooltip-row">
        <span class="map-tooltip-label">${t('tooltip.ideology')}</span>
        <span class="map-tooltip-value ${valueClass}">${value != null ? `${value >= 0 ? '+' : ''}${value.toFixed(3)}` : '—'}</span>
      </div>
      <div class="map-tooltip-row">
        <span class="map-tooltip-label">${t('tooltip.year')}</span>
        <span class="map-tooltip-value">${muni.year || currentYear}</span>
      </div>
      <a class="map-tooltip-button" href="${href}">
        <span>${t('map.profileButton')}</span>
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  `;
}

function applySelectionStyles() {
  if (!vectorLayer) return;
  vectorLayer.eachLayer((layer) => {
    const cdMun = String(layer.feature?.properties?.CD_MUN || '');
    const geocodig = cdMunToGeocodig[cdMun];
    if (!layer.feature || !geocodig) return;
    layer.setStyle(getSelectionStyle(layer.feature, geocodig));
  });
}

function emitHover(geocodig) {
  EventBus.emit('map:municipio:hover', { geocodig });
}

function emitSelection(geocodig) {
  EventBus.emit('map:municipio:select', { geocodig });
  EventBus.emit('municipio:select', {
    geocodig,
    name: muniIndex[geocodig]?.tse_name || muniIndex[geocodig]?.ibge_name,
    uf: muniIndex[geocodig]?.uf,
  });
}

function clearPinnedPopup() {
  if (pinnedPopup) {
    pinnedPopup.closePopup();
    pinnedPopup = null;
  }
}

function openPinnedPopup(layer, geocodig, muni) {
  clearPinnedPopup();
  pinnedPopup = layer.bindPopup(buildTooltipHTML(muni, currentVar), {
    maxWidth: 220,
    className: 'leaflet-popup-rich',
  }).openPopup();
  pinnedPopup._muniGeo = geocodig;
}

function updatePinnedPopupContent() {
  if (!pinnedPopup || !highlightedMuni) return;
  const municipality = muniIndex[highlightedMuni];
  if (!municipality) {
    clearPinnedSelection();
    return;
  }
  pinnedPopup.setContent(buildTooltipHTML(municipality, currentVar));
}

function attachLayerHandlers(feature, layer) {
  const cdMun = String(feature.properties.CD_MUN);
  const geocodig = cdMunToGeocodig[cdMun];

  layer.on('mouseover', () => {
    const muni = geocodig ? muniIndex[geocodig] : null;
    if (!muni) return;
    layer.setStyle({ weight: highlightedMuni === geocodig ? 1.8 : 0.8, opacity: 1, fillOpacity: 1 });
    if (!(pinnedPopup && pinnedPopup._muniGeo === geocodig)) {
      layer.bindTooltip(buildTooltipHTML(muni, currentVar), {
        direction: 'top',
        offset: [0, -5],
        className: 'leaflet-tooltip-rich',
        opacity: 1,
      }).openTooltip();
    }
    emitHover(geocodig);
  });

  layer.on('mouseout', () => {
    layer.closeTooltip();
    applySelectionStyles();
    emitHover(highlightedMuni || null);
  });

  layer.on('click', (event) => {
    L.DomEvent.stopPropagation(event);
    const muni = geocodig ? muniIndex[geocodig] : null;
    if (!muni) return;
    highlightedParty = null;
    highlightedMuni = geocodig;
    applySelectionStyles();
    openPinnedPopup(layer, geocodig, muni);
    emitSelection(geocodig);
  });
}

function initMap(containerId = 'map-container') {
  const targetContainer = document.getElementById(containerId);
  if (!targetContainer) return null;

  if (map) {
    const existingContainer = map.getContainer();
    if (!existingContainer || existingContainer !== targetContainer || existingContainer.id !== containerId) {
      map.remove();
      map = null;
      vectorLayer = null;
      stateLayer = null;
      clearPinnedPopup();
      mapClickHandlerBound = false;
    } else {
      map.invalidateSize();
      return map;
    }
  }

  map = L.map(containerId, {
    center: DEFAULT_VIEW.center,
    zoom: DEFAULT_VIEW.zoom,
    minZoom: 3,
    maxZoom: 10,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    zoomControl: true,
    scrollWheelZoom: true,
    preferCanvas: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  map.zoomControl.setPosition('bottomright');
  return map;
}

async function loadStateBoundaries() {
  if (!map) return;
  try {
    const res = await fetch('./geo/br_states.json');
    if (!res.ok) throw new Error('Failed to load br_states.json');
    const statesGeoJSON = await res.json();

    if (stateLayer) {
      map.removeLayer(stateLayer);
      stateLayer = null;
    }

    stateLayer = L.geoJSON(statesGeoJSON, {
      style: {
        fillColor: 'none',
        fillOpacity: 0,
        color: '#1a1614',
        weight: 1.1,
        opacity: 0.5,
        interactive: false,
      },
      interactive: false,
      attribution: '',
    });

    stateLayer.addTo(map);
  } catch (err) {
    console.warn('State boundaries could not be loaded:', err.message);
  }
}

export function setPartyWinnerIndex(data) {
  partyWinnerIndex = {};
  data.forEach((row) => {
    const key = `${row.year}-${row.uf}`;
    const existing = partyWinnerIndex[key];
    if (!existing || row.votes > existing.votes) {
      partyWinnerIndex[key] = { party: row.party, votes: row.votes };
    }
  });

  Object.keys(partyWinnerIndex).forEach((key) => {
    partyWinnerIndex[key] = partyWinnerIndex[key].party;
  });
}

export async function highlightMunicipioByGeo(geocodig) {
  if (!map || !geocodig) return;
  const municipality = muniIndex[geocodig];
  const cdMun = geocodigToCdMun[geocodig];
  const feature = cdMun ? geoIndex[cdMun] : null;
  if (!municipality || !feature) return;

  highlightedParty = null;
  highlightedMuni = geocodig;
  applySelectionStyles();

  const center = getFeatureCentroid(feature);
  if (center) {
    map.setView(center, 9, { animate: true, duration: 0.5 });
  }

  vectorLayer?.eachLayer((layer) => {
    const layerCdMun = String(layer.feature?.properties?.CD_MUN || '');
    if (layerCdMun === cdMun) {
      openPinnedPopup(layer, geocodig, municipality);
    }
  });

  emitSelection(geocodig);
}

export function highlightParty(partyCode, year) {
  if (!map || !vectorLayer) return;
  highlightedParty = partyCode;
  highlightedMuni = null;
  clearPinnedPopup();
  currentYear = year;
  applySelectionStyles();
}

export function clearPinnedSelection() {
  highlightedMuni = null;
  clearPinnedPopup();
  applySelectionStyles();
  EventBus.emit('map:municipio:clear');
}

export function clearHighlight() {
  highlightedParty = null;
  highlightedMuni = null;
  clearPinnedPopup();
  applySelectionStyles();
}

export async function initMapComponent(containerId, gjData, year, variable, municipalities) {
  const container = document.getElementById(containerId);
  if (!container) return;

  currentContainerId = containerId;
  currentYear = year;
  currentVar = variable;
  muniIndex = Object.fromEntries(municipalities.map((row) => [row.GEOCODIG_M, row]));
  buildGeoIndex(gjData);
  computeColorScale(municipalities);

  initMap(containerId);

  if (vectorLayer) {
    map.removeLayer(vectorLayer);
    vectorLayer = null;
  }

  geoJSON = gjData;
  vectorLayer = L.geoJSON(gjData, {
    style: getStyleForFeature,
    onEachFeature: attachLayerHandlers,
  });

  vectorLayer.addTo(map);
  await loadStateBoundaries();
  applySelectionStyles();

  if (!mapClickHandlerBound) {
    map.on('click', () => {
      highlightedMuni = null;
      clearPinnedPopup();
      applySelectionStyles();
      EventBus.emit('map:municipio:clear');
    });
    mapClickHandlerBound = true;
  }

  if (!eventBusBound) {
    EventBus.on('municipio:highlight', ({ geocodig }) => {
      highlightMunicipioByGeo(geocodig);
    });
    EventBus.on('party:select', ({ party, year: selectedYear }) => {
      if (party) highlightParty(party, selectedYear);
      else clearHighlight();
    });
    eventBusBound = true;
  }
}

export function updateMapYear(year, variable, municipalities) {
  currentYear = year;
  currentVar = variable;
  if (!geoJSON || !vectorLayer) return;

  muniIndex = Object.fromEntries(municipalities.map((row) => [row.GEOCODIG_M, row]));
  buildGeoIndex(geoJSON);
  computeColorScale(municipalities);
  applySelectionStyles();
  updatePinnedPopupContent();

  if (highlightedMuni && !muniIndex[highlightedMuni]) {
    clearPinnedSelection();
  }
}

export function setMapCenter(lat, lng, zoom) {
  if (map) map.setView([lat, lng], zoom || 7);
}

export function resetMapView() {
  if (map) map.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
}

export function zoomToUF(uf) {
  const UF_BOUNDS = {
    AC: [[-8.8, -67.1], [-10.9, -73.0]],
    AL: [[-8.8, -36.3], [-10.5, -38.7]],
    AP: [[-0.5, -52.0], [-2.2, -55.9]],
    AM: [[-0.5, -60.5], [-8.5, -73.0]],
    BA: [[-8.0, -37.0], [-18.5, -46.5]],
    CE: [[-2.5, -37.5], [-8.5, -41.0]],
    DF: [[-15.4, -48.3], [-16.0, -47.3]],
    ES: [[-17.8, -40.3], [-21.3, -44.9]],
    GO: [[-12.5, -45.0], [-19.5, -53.0]],
    MA: [[-1.0, -43.0], [-9.5, -48.0]],
    MT: [[-8.0, -58.5], [-18.0, -61.5]],
    MS: [[-18.5, -50.0], [-24.5, -58.0]],
    MG: [[-14.3, -39.0], [-23.5, -51.0]],
    PA: [[-0.5, -48.0], [-8.5, -56.0]],
    PB: [[-6.0, -34.5], [-8.5, -38.5]],
    PR: [[-22.5, -48.0], [-27.0, -53.8]],
    PE: [[-7.2, -34.5], [-9.5, -41.5]],
    PI: [[-1.5, -40.5], [-10.5, -45.8]],
    RJ: [[-20.1, -40.5], [-23.5, -44.9]],
    RN: [[-4.5, -35.0], [-6.5, -38.5]],
    RS: [[-27.0, -49.5], [-33.5, -57.5]],
    RO: [[-7.5, -60.5], [-14.5, -66.8]],
    RR: [[0.5, -60.0], [-3.5, -64.0]],
    SC: [[-25.5, -48.0], [-29.5, -53.5]],
    SP: [[-19.5, -44.5], [-25.5, -53.5]],
    SE: [[-9.5, -36.3], [-11.5, -38.0]],
    TO: [[-5.0, -45.5], [-13.5, -50.5]],
  };

  if (UF_BOUNDS[uf] && map) {
    const [[south, west], [north, east]] = UF_BOUNDS[uf];
    map.fitBounds([[south, west], [north, east]]);
  }
}

export function getCurrentMapScale() {
  return { ...colorScale };
}

export function getMap() {
  return map;
}
