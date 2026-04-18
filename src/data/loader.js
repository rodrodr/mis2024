/**
 * data/loader.js
 * Fetch + cache all static JSON data files.
 * All functions return Promises.
 */

const DATA_BASE = './data';
const GEO_BASE = './geo';

// In-memory cache
const cache = {};

async function fetchJSON(filename) {
  if (cache[filename]) return cache[filename];
  const res = await fetch(`${DATA_BASE}/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  const data = await res.json();
  cache[filename] = data;
  return data;
}

// Load a single year's municipality data
export function loadMunicipios(year) {
  return fetchJSON(`municipios_${year}.json`);
}

// Load all municipality years (for timeline/scatter)
// Uses Promise.all for parallel loading
export function loadAllMunicipios(years) {
  return Promise.all(years.map(y => loadMunicipios(y)));
}

// Load national trend (mean, sd per year)
export function loadNationalTrend() {
  return fetchJSON('national_trend.json');
}

// Load polarization index (dispersion per year)
export function loadPolarization() {
  return fetchJSON('polarization_index.json');
}

// Load state summary (mean IDEO per UF per year)
export function loadStateSummary() {
  return fetchJSON('state_summary.json');
}

// Load party lookup (party number → name)
export function loadPartyLookup() {
  return fetchJSON('party_lookup.json');
}

// Load national party aggregates (party × year, top 25)
export function loadPartyNational() {
  return fetchJSON('party_national.json');
}

// Load state-level party aggregates (party × UF × year, top 25)
export function loadPartyState() {
  return fetchJSON('party_state.json');
}

// Load municipality-level party data (party × municipality) for a given year
export function loadPartyMunicipal(year) {
  return fetchJSON(`party_municipal_${year}.json`);
}

// Load national dashboard aggregates (ideology, polarization, party system)
export function loadDashboardNational() {
  return fetchJSON('dashboard_national.json');
}

// Load GeoJSON for Brazil municipalities
export function loadGeoJSON() {
  return fetch(`${GEO_BASE}/brazil_municipalities.json`).then(async (res) => {
    if (!res.ok) throw new Error(`Failed to load brazil_municipalities.json: ${res.status}`);
    return res.json();
  });
}

// Returns a map GEOCODIG_M → muni data for given year
// (built from loaded municipio array, indexed by GEOCODIG_M)
export function indexMunicipiosByGeocodig(municipios) {
  const idx = {};
  for (const m of municipios) {
    idx[m.GEOCODIG_M] = m;
  }
  return idx;
}

// Available election years in the dataset
export const ELECTION_YEARS = [1994, 1996, 1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024];

// Brazilian states
export const STATES = [
  { uf: "AC", name: "Acre" }, { uf: "AL", name: "Alagoas" }, { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" }, { uf: "BA", name: "Bahia" }, { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" }, { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" }, { uf: "MA", name: "Maranhão" }, { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" }, { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" }, { uf: "PB", name: "Paraíba" }, { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" }, { uf: "PI", name: "Piauí" }, { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" }, { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" }, { uf: "RR", name: "Roraima" }, { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" }, { uf: "SE", name: "Sergipe" }, { uf: "TO", name: "Tocantins" },
];

// Ideology variables available in the dataset
export const IDEO_VARS = [
  { key: "ideo_imp", label: "Ideología imputed" },
  { key: "ideo_na", label: "Ideología no-imputed" },
  { key: "ideopref", label: "Ideología preferencia" },
  { key: "ideogov", label: "Ideología gobernador" },
  { key: "ideo_pres", label: "Ideología presidente" },
];

// Region mapping for Brazilian states
export const REGIONS = {
  "Norte": ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
  "Nordeste": ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "Centro-Oeste": ["DF", "GO", "MT", "MS"],
  "Sudeste": ["ES", "MG", "RJ", "SP"],
  "Sul": ["PR", "RS", "SC"],
};

export const IDEOLOGY_BANDS = [
  { key: 'extremeLeft', labelKey: 'ideo.extremeLeft', short: 'EI', min: -1, max: -0.75, color: '#7f0000' },
  { key: 'left', labelKey: 'ideo.left', short: 'I', min: -0.75, max: -0.5, color: '#b22222' },
  { key: 'centerLeft', labelKey: 'ideo.centerLeft', short: 'CI', min: -0.5, max: -0.25, color: '#d97a6c' },
  { key: 'center', labelKey: 'ideo.center', short: 'C', min: -0.25, max: 0.25, color: '#d9d5cd' },
  { key: 'centerRight', labelKey: 'ideo.centerRight', short: 'CD', min: 0.25, max: 0.5, color: '#8aa9e6' },
  { key: 'right', labelKey: 'ideo.right', short: 'D', min: 0.5, max: 0.75, color: '#3d6dcc' },
  { key: 'extremeRight', labelKey: 'ideo.extremeRight', short: 'ED', min: 0.75, max: 1, color: '#0d3d91' },
];

export const PARTY_NAMES = {
  10: 'Republicanos',
  11: 'PP',
  12: 'PDT',
  13: 'PT',
  14: 'PTB',
  15: 'MDB',
  16: 'PSTU',
  17: 'PSL',
  18: 'REDE',
  19: 'PODE',
  20: 'PSC',
  21: 'PCB',
  22: 'PL',
  23: 'Cidadania',
  25: 'PRD',
  27: 'DC',
  28: 'PRTB',
  29: 'PCO',
  30: 'NOVO',
  31: 'PHS',
  33: 'PMN',
  35: 'PMB',
  36: 'AGIR',
  40: 'PSB',
  41: 'PTdoB',
  43: 'PV',
  44: 'UNIÃO',
  45: 'PSDB',
  50: 'PSOL',
  51: 'Patriota',
  54: 'PPL',
  55: 'PSD',
  56: 'PRONA',
  65: 'PCdoB',
  70: 'Avante',
  77: 'Solidariedade',
  80: 'UP',
  90: 'PROS',
};

export function getRegion(uf) {
  for (const [region, ufs] of Object.entries(REGIONS)) {
    if (ufs.includes(uf)) return region;
  }
  return "Unknown Region";
}

export function classifyIdeologyBucket(value) {
  if (value == null || Number.isNaN(value)) return null;
  if (value < -0.75) return 'extremeLeft';
  if (value < -0.5) return 'left';
  if (value < -0.25) return 'centerLeft';
  if (value <= 0.25) return 'center';
  if (value <= 0.5) return 'centerRight';
  if (value <= 0.75) return 'right';
  return 'extremeRight';
}

export function summarizeMunicipalIdeology(rows = []) {
  const valid = rows.filter((row) => row?.ideo_imp != null);

  if (!valid.length) {
    return {
      count: 0,
      mean: null,
      bandShares: Object.fromEntries(IDEOLOGY_BANDS.map((band) => [band.key, null])),
      leftShare: null,
      centerShare: null,
      rightShare: null,
      leftRegion: null,
      rightRegion: null,
    };
  }

  const count = valid.length;
  const mean = valid.reduce((sum, row) => sum + row.ideo_imp, 0) / count;
  const bandCounts = Object.fromEntries(IDEOLOGY_BANDS.map((band) => [band.key, 0]));
  const byRegion = {};

  valid.forEach((row) => {
    const bucket = classifyIdeologyBucket(row.ideo_imp);
    if (bucket) bandCounts[bucket] += 1;

    const region = getRegion(row.uf);
    if (!byRegion[region]) byRegion[region] = { sum: 0, count: 0 };
    byRegion[region].sum += row.ideo_imp;
    byRegion[region].count += 1;
  });

  const regionMeans = Object.entries(byRegion)
    .map(([region, stats]) => ({ region, mean: stats.sum / stats.count }))
    .sort((a, b) => a.mean - b.mean);

  const bandShares = Object.fromEntries(
    Object.entries(bandCounts).map(([key, bandCount]) => [key, bandCount / count]),
  );

  return {
    count,
    mean,
    bandShares,
    leftShare: (bandCounts.extremeLeft + bandCounts.left + bandCounts.centerLeft) / count,
    centerShare: bandCounts.center / count,
    rightShare: (bandCounts.centerRight + bandCounts.right + bandCounts.extremeRight) / count,
    leftRegion: regionMeans[0] || null,
    rightRegion: regionMeans[regionMeans.length - 1] || null,
  };
}
