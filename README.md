# Municipal Ideology Explorer — Brasil, 1994–2024

Web interactiva para explorar la geografía ideológica de 5.570 municipios brasileños. Basada en los datos de **Power & Rodrigues-Silveira (2019)**, *Brazilian Political Science Review*, 13(1). https://doi.org/10.1590/1981-3821201900010001

## Empezar

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run preview

# Build de producción para GitHub Pages
npm run build
```

## Publicación

El sitio se publica con la convención clásica de GitHub Pages:

- rama: `main`
- carpeta publicada: `docs/`

Flujo recomendado:

```bash
# Generar build estática
npm run build

# Subir cambios a main
git add docs src public package.json package-lock.json vite.config.js index.html README.md
git commit -m "Update published site"
git push
```

En GitHub, la configuración de Pages debe ser:

- `Deploy from a branch`
- branch `main`
- folder `/docs`

## Estructura

- `docs/` — build estática publicada por GitHub Pages
- `Documents/` — materiales metodológicos y PDFs de referencia (local, fuera del repo público)
- `public/data/` — JSON preprocesados para la app
- `public/geo/` — GeoJSON de Brasil (subido al repo)
- `src/components/` — componentes Leaflet/D3
- `src/data/` — data loading y crossfilter2

## Citation

Power, T. y Rodrigues-Silveira, R. (2019). "Mapping Ideological Preferences in Brazilian Elections, 1994-2018: A Municipal-Level Study." *Brazilian Political Science Review*, 13(1). https://doi.org/10.1590/1981-3821201900010001
