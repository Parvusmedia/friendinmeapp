#!/usr/bin/env bash
# Añade una entrada al registro de cambios aplicados.
# Uso:
#   ./registrar_cambio.sh "Título" "Descripción (puede ser varias frases)."
#   ./registrar_cambio.sh "Título"   # y descripción por stdin (Ctrl+D)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGISTRO="${SCRIPT_DIR}/REGISTRO_CAMBIOS.md"
MARKER="<!-- Las entradas nuevas se insertan debajo de esta línea (más reciente primero) -->"

if [[ ! -f "$REGISTRO" ]]; then
  echo "No existe $REGISTRO" >&2
  exit 1
fi

TITLE="${1:-}"
if [[ -z "$TITLE" ]]; then
  echo "Uso: $0 \"Título\" [\"Descripción\"]" >&2
  exit 1
fi

if [[ -n "${2:-}" ]]; then
  BODY="$2"
else
  if [[ -t 0 ]]; then
    echo "Descripción (línea vacía + Ctrl+D para terminar):"
  fi
  BODY="$(cat)"
fi

STAMP="$(date +"%Y-%m-%d")"
ENTRY="### ${STAMP} — ${TITLE}

- **Qué:** ${BODY//$'\n'/$'\n- '}
- **Despliegue:** (completar si aplica)

"

TMP="$(mktemp)"
if ! grep -qF "$MARKER" "$REGISTRO"; then
  echo "Marcador no encontrado en $REGISTRO" >&2
  exit 1
fi

awk -v marker="$MARKER" -v entry="$ENTRY" '
  $0 == marker { print; print entry; next }
  { print }
' "$REGISTRO" > "$TMP"
mv "$TMP" "$REGISTRO"

echo "Entrada añadida a $REGISTRO"
