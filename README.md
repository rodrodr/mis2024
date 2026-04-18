# Municipal Ideology Explorer — Brasil, 1994–2024

Web interactiva para explorar la geografía ideológica de 5.570 municipios brasileños. Basada en los datos de **Power & Rodrigues-Silveira (2019)**, *Brazilian Political Science Review*, 13(1). https://doi.org/10.1590/1981-3821201900010001

## Empezar

```bash
# Instalar dependencias
npm install

# Generar datos estáticos (requiere pandas)
npm run preprocess

# (Opcional) Descargar y simplificar GeoJSON del IBGE
npm run build:geo

# Desarrollo local
npm run preview

# Deploy a GitHub Pages (automático en push a main)
npm run deploy
```

## Estructura

- `scripts/preprocess.py` — genera JSON estáticos desde los CSVs originales
- `scripts/build_geo.sh` — descarga GeoJSON del IBGE (requiere `mapshaper`)
- `public/data/` — JSON preprocesados para la app
- `public/geo/` — GeoJSON de Brasil (subido al repo)
- `src/components/` — componentes Leaflet/D3
- `src/data/` — data loading y crossfilter2

## Citation

Power, T. y Rodrigues-Silveira, R. (2019). "Mapping Ideological Preferences in Brazilian Elections, 1994-2018: A Municipal-Level Study." *Brazilian Political Science Review*, 13(1). https://doi.org/10.1590/1981-3821201900010001
