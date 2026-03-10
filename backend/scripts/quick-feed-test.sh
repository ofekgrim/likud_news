#!/bin/bash

# Quick Feed Testing Script - Backend Only
# Seeds data and runs QA tests quickly

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Quick Feed Test (Backend)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$(dirname "$0")/.."

# Seed test data
echo -e "${YELLOW}→${NC} Seeding feed test data..."
npm run seed:feed
echo ""

# Run QA tests
echo -e "${YELLOW}→${NC} Running feed QA tests..."
npm run test:feed
echo ""

echo -e "${GREEN}✓ Done!${NC}"
echo ""
echo -e "Test feed endpoint:"
echo -e "  ${BLUE}curl http://localhost:9090/api/v1/feed?page=1&limit=10${NC}"
echo ""
