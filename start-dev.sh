#!/bin/bash

# Start Development Environment — Klassa Backend

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping development environment...${NC}"
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    cd "$SCRIPT_DIR/klassa-backend"
    docker compose -f docker-compose.dev.yml down 2>/dev/null || true
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "========================================="
echo "  Klassa — Development Environment"
echo "========================================="
echo ""

cd "$SCRIPT_DIR/klassa-backend"

# ─── Step 1: Infrastructure ───────────────────────────────────────────────────
echo -e "${BLUE}[1/3] Starting PostgreSQL + Redis...${NC}"
docker compose -f docker-compose.dev.yml up -d

echo -e "${YELLOW}Waiting for services to be ready...${NC}"

until docker exec klassa_postgres_dev pg_isready -U klassa -d klassa_dev > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}  ✓ PostgreSQL ready${NC}"

until docker exec klassa_redis_dev redis-cli ping > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for Redis...${NC}"
    sleep 2
done
echo -e "${GREEN}  ✓ Redis ready${NC}"
echo ""

# ─── Step 2: Environment variables ───────────────────────────────────────────
echo -e "${BLUE}Loading environment variables...${NC}"
if [ -f .env.dev ]; then
    set -a && source .env.dev && set +a
    echo -e "${GREEN}  ✓ Loaded from .env.dev${NC}"
else
    echo -e "${YELLOW}  Warning: no .env.dev file found, using application.yml defaults${NC}"
fi
echo ""

# ─── Step 3: Frontend ────────────────────────────────────────────────────────
echo -e "${BLUE}[2/3] Starting Frontend (Next.js, port: 3000)...${NC}"
cd "$SCRIPT_DIR/klassa-frontend"
bun run dev &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

cd "$SCRIPT_DIR/klassa-backend"

# ─── Step 4: Spring Boot ─────────────────────────────────────────────────────
echo -e "${BLUE}[3/3] Starting Spring Boot (profile: dev, port: 8080)...${NC}"
echo ""

./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
