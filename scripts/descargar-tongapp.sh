#!/usr/bin/env bash
# Descarga las colecciones canarias de TongaApp (UCTICEE, Gobierno de Canarias) a art/tongapp/.
# Licencia CC BY-NC-SA: NO compatible con distribuir el juego como software libre (GPLv3),
# por eso art/tongapp/ está en .gitignore y no va al build. Ver docs/creditos.md.
set -euo pipefail
BASE=https://www3.gobiernodecanarias.org/medusa/apps/tongapp/repositorios
DEST="$(dirname "$0")/../art/tongapp"
COLECCIONES="${*:-personajescanarios antiguoscanarios faunaterrestre floracanaria etnografia arquitectura espaciosnaturales alimentoscanarios}"
for c in $COLECCIONES; do
  mkdir -p "$DEST/$c"
  # lista.txt: fichero|título|fondo (con BOM y CRLF en algunas colecciones)
  curl -fsSL "$BASE/$c/lista.txt" | sed 's/^\xEF\xBB\xBF//; s/\r$//' | cut -d'|' -f1 | grep . |
    while read -r f; do
      [ -s "$DEST/$c/$f" ] || curl -fsSL "$BASE/$c/$f" -o "$DEST/$c/$f" || echo "falló $c/$f" >&2
    done
  echo "$c: $(ls "$DEST/$c" | wc -l | tr -d ' ') imágenes"
done
