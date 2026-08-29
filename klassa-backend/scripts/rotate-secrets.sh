#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Rotate Klassa local secrets (JWT + platform admin password).
# ─────────────────────────────────────────────────────────────────────────────
# Genera valores nuevos para JWT_SECRET y PLATFORM_ADMIN_PASSWORD usando
# fuentes aleatorias del sistema. NO escribe en .env.dev (lo hace el usuario
# tras revisar).
#
# Uso:
#   ./scripts/rotate-secrets.sh           # genera e imprime
#   ./scripts/rotate-secrets.sh --write   # además actualiza klassa-backend/.env.dev (in-place)
#
# Requisitos: openssl
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v openssl >/dev/null 2>&1; then
  echo -e "${RED}✗ openssl no encontrado.${NC}" >&2
  exit 1
fi

ENV_FILE="${ENV_FILE:-klassa-backend/.env.dev}"
WRITE=false
if [[ "${1:-}" == "--write" ]]; then
  WRITE=true
fi

# JWT secret: 48 bytes base64 → 64 chars (>= 256 bits requerido por HS256)
NEW_JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')

# Admin password: 24 chars alfanum + símbolos seguros (sin comillas para evitar shell-escape en .env)
NEW_ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 24)

echo -e "${GREEN}✓ Nuevos secretos generados${NC}"
echo
echo "JWT_SECRET=${NEW_JWT_SECRET}"
echo "PLATFORM_ADMIN_PASSWORD=${NEW_ADMIN_PASSWORD}"
echo

if [[ "$WRITE" == true ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}✗ No existe $ENV_FILE${NC}" >&2
    exit 1
  fi

  if grep -q '^JWT_SECRET=' "$ENV_FILE"; then
    sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${NEW_JWT_SECRET}|" "$ENV_FILE"
  else
    echo "JWT_SECRET=${NEW_JWT_SECRET}" >> "$ENV_FILE"
  fi

  if grep -q '^PLATFORM_ADMIN_PASSWORD=' "$ENV_FILE"; then
    sed -i.bak "s|^PLATFORM_ADMIN_PASSWORD=.*|PLATFORM_ADMIN_PASSWORD=${NEW_ADMIN_PASSWORD}|" "$ENV_FILE"
  else
    echo "PLATFORM_ADMIN_PASSWORD=${NEW_ADMIN_PASSWORD}" >> "$ENV_FILE"
  fi

  rm -f "$ENV_FILE.bak"
  echo -e "${GREEN}✓ $ENV_FILE actualizado${NC}"
  echo -e "${YELLOW}⚠  Recordá: tras este cambio, los tokens JWT emitidos antes dejarán de ser válidos${NC}"
  echo -e "${YELLOW}   y la cuenta PLATFORM_ADMIN con la contraseña anterior no podrá loguearse.${NC}"
else
  echo -e "${YELLOW}ℹ  Modo dry-run. Para escribir en $ENV_FILE, ejecutá:${NC}"
  echo -e "${YELLOW}   $0 --write${NC}"
fi
