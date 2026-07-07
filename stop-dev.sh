#!/bin/bash

# Stop Development Environment — Klassa

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "  Klassa — Stopping Dev Environment"
echo "========================================="
echo ""

cd "$SCRIPT_DIR/klassa-backend"

echo -e "${BLUE}Stopping PostgreSQL + Redis...${NC}"
docker compose -f docker-compose.dev.yml down

echo -e "${GREEN}✓ Services stopped${NC}"
echo ""
echo "Note: volumes preserved. To delete data:"
echo "  docker compose -f klassa-backend/docker-compose.dev.yml down -v"
