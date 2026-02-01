#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ProxSecure Deployment          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# Check Docker
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Error: Docker is not installed.${NC}"
  echo "Please install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
  echo -e "${RED}Error: Docker Compose is not installed.${NC}"
  echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
  exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose detected.${NC}"
echo ""

# Ask for mode
echo "Select Proxmox mode:"
echo "  1) Mock  (default — no real Proxmox connection, uses demo data)"
echo "  2) Real  (connects to a live Proxmox host)"
echo ""
read -rp "Enter choice [1/2]: " MODE_CHOICE

PROXMOX_MODE="mock"
PROXMOX_HOST=""
PROXMOX_USER=""
PROXMOX_PASSWORD=""
PROXMOX_TOKEN_NAME=""
PROXMOX_TOKEN_VALUE=""
PROXMOX_VERIFY_SSL="true"

if [[ "${MODE_CHOICE}" == "2" ]]; then
  PROXMOX_MODE="real"
  echo ""
  read -rp "Proxmox Host (e.g. 192.168.1.100:8006): " PROXMOX_HOST
  read -rp "Proxmox User (e.g. root@pam): " PROXMOX_USER
  echo "Authentication — choose one:"
  echo "  1) Password"
  echo "  2) API Token"
  read -rp "Enter choice [1/2]: " AUTH_CHOICE
  if [[ "${AUTH_CHOICE}" == "2" ]]; then
    read -rp "Token Name: " PROXMOX_TOKEN_NAME
    read -rsp "Token Value: " PROXMOX_TOKEN_VALUE
    echo ""
  else
    read -rsp "Password: " PROXMOX_PASSWORD
    echo ""
  fi
  read -rp "Verify SSL? [y/N]: " SSL_CHOICE
  if [[ "${SSL_CHOICE}" =~ ^[Yy]$ ]]; then
    PROXMOX_VERIFY_SSL="true"
  else
    PROXMOX_VERIFY_SSL="false"
  fi
fi

# Generate .env
echo ""
echo -e "${YELLOW}Generating backend/.env ...${NC}"

cat > backend/.env <<EOF
PROXMOX_MODE=${PROXMOX_MODE}
PROXMOX_HOST=${PROXMOX_HOST}
PROXMOX_USER=${PROXMOX_USER}
PROXMOX_PASSWORD=${PROXMOX_PASSWORD}
PROXMOX_TOKEN_NAME=${PROXMOX_TOKEN_NAME}
PROXMOX_TOKEN_VALUE=${PROXMOX_TOKEN_VALUE}
PROXMOX_VERIFY_SSL=${PROXMOX_VERIFY_SSL}
AUTOMATION_ENABLED=false
EOF

echo -e "${GREEN}✓ .env generated (mode: ${PROXMOX_MODE})${NC}"
echo ""

# Build and start
echo -e "${YELLOW}Starting Docker Compose build ...${NC}"
echo ""

if docker compose version &>/dev/null 2>&1; then
  docker compose up -d --build
else
  docker-compose up -d --build
fi

echo ""
echo -e "${GREEN}✓ Containers started.${NC}"
echo ""

# Health check
echo -e "${YELLOW}Running health check ...${NC}"
MAX_RETRIES=15
RETRY_INTERVAL=2

for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy!${NC}"
    echo ""
    echo -e "${GREEN}ProxSecure is running:${NC}"
    echo "  Frontend:  http://localhost"
    echo "  API:       http://localhost/api/v1"
    echo "  Swagger:   http://localhost:8000/docs"
    exit 0
  fi
  echo "  Waiting for backend ... (${i}/${MAX_RETRIES})"
  sleep $RETRY_INTERVAL
done

echo -e "${RED}✗ Health check failed after ${MAX_RETRIES} attempts.${NC}"
echo "  Check logs with: docker compose logs backend"
exit 1
