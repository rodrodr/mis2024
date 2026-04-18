# scripts/build_geo.sh
# Descarga el GeoJSON de IBGE, simplifica y guarda en public/geo/
# Requiere: curl, mapshaper (npm install -g mapshaper)

set -e

GEO_DIR="public/geo"
TMP_DIR="/tmp/ibge_geo"
OUT_FILE="$GEO_DIR/brazil_municipalities.json"

mkdir -p "$GEO_DIR"
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

# IBGE tiene 27 archivos UF, uno por estado
# URL base: ftp://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2019/UF/BR/
BASE_URL="https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2019/UF/BR"

STATES=("AC" "AL" "AP" "AM" "BA" "CE" "DF" "ES" "GO" "MA" "MT" "MS" "MG" "PA" "PB" "PR" "PE" "PI" "RJ" "RN" "RS" "RO" "RR" "SC" "SP" "SE" "TO")

echo "Descargando archivos UF del IBGE..."
for UF in "${STATES[@]}"; do
  URL="$BASE_URL/BR_${UF}_municipios_2019.zip"
  ZIP="BR_${UF}_municipios_2019.zip"
  if [ ! -f "$ZIP" ]; then
    echo "  $UF..."
    curl -fsSL -o "$ZIP" "$URL" || echo "  Falló: $UF"
  fi
done

echo "Descargando done."

# Si mapshaper está disponible, convertir a JSON y simplificar
if command -v mapshaper &> /dev/null; then
  echo "Simplificando con mapshaper..."
  mapshaper "$TMP_DIR/BR_${STATES[0]}_municipios_2019.zip" -quiet \
    -merge-layers \
    -simplify 0.001 \
    -o "$OUT_FILE" format=geojson
  echo "Guardado en $OUT_FILE"
else
  echo "AVISO: mapshaper no está instalado. Instalar con: npm install -g mapshaper"
  echo "Los archivos zip están en $TMP_DIR"
  echo "Para procesar manualmente:"
  echo "  npx mapshaper $TMP_DIR/*.zip -merge-layers -simplify 0.001 -o $OUT_FILE format=geojson"
fi

echo "Listo."
