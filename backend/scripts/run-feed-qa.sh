#!/bin/bash

# Feed QA Test Runner
# Runs seed data creation and comprehensive QA tests for the unified feed endpoint

set -e

echo "════════════════════════════════════════════════════"
echo "  Feed Endpoint QA Test Runner"
echo "════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend server is running
echo -e "${BLUE}→${NC} Checking if backend server is running..."
if curl -s http://localhost:9090/api/v1/feed | grep -q "data"; then
    echo -e "${GREEN}✓${NC} Backend server is running"
else
    echo -e "${RED}✗${NC} Backend server is not running on port 9090"
    echo -e "${YELLOW}  Please start the backend server first:${NC}"
    echo -e "    cd backend && npm run start:dev"
    exit 1
fi

echo ""
echo -e "${BLUE}→${NC} Step 1: Seeding test data..."
echo "────────────────────────────────────────────────────"

cd "$(dirname "$0")/.."

# Run seed
if npx ts-node src/database/seeds/seed-feed-test.ts; then
    echo -e "${GREEN}✓${NC} Test data seeded successfully"
else
    echo -e "${RED}✗${NC} Failed to seed test data"
    exit 1
fi

echo ""
echo -e "${BLUE}→${NC} Step 2: Running QA tests..."
echo "────────────────────────────────────────────────────"

# Wait a moment for data to be fully indexed
sleep 1

# Run QA tests
if npx ts-node scripts/test-feed-qa.ts; then
    echo -e "${GREEN}✓${NC} All QA tests passed!"
    exit 0
else
    echo -e "${RED}✗${NC} Some QA tests failed"
    exit 1
fi
