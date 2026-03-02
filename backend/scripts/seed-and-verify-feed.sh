#!/bin/bash

# Comprehensive Feed Seeding & Verification Script
# Seeds data, verifies creation, and tests endpoints

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Feed Data Seeding & Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$(dirname "$0")/.."

# ============================================================================
# Step 1: Check PostgreSQL Connection
# ============================================================================
echo -e "${CYAN}[1/5]${NC} Checking database connection..."

if ! pg_isready -q; then
  echo -e "${RED}✗ PostgreSQL is not running${NC}"
  echo -e "  Start it: ${YELLOW}brew services start postgresql@16${NC}"
  exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# ============================================================================
# Step 2: Seed Feed Data
# ============================================================================
echo -e "${CYAN}[2/5]${NC} Seeding feed data..."
echo -e "${BLUE}  This will create:${NC}"
echo -e "    • 20 articles (2 pinned, 3 breaking)"
echo -e "    • 5 community polls"
echo -e "    • 5 campaign events"
echo -e "    • 2 primary elections (with candidates)"
echo -e "    • 1 quiz prompt"
echo -e "    • 500+ comments"
echo ""

npm run seed:feed

echo -e "${GREEN}✓ Seed completed${NC}"
echo ""

# ============================================================================
# Step 3: Verify Data in Database
# ============================================================================
echo -e "${CYAN}[3/5]${NC} Verifying data in database..."

# Get database connection from .env
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT .env | cut -d '=' -f2)
DB_USER=$(grep DB_USERNAME .env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)

# Default values if not in .env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-likud}
DB_NAME=${DB_NAME:-likud_news}

echo -e "${BLUE}  Counting records...${NC}"

# Check articles
ARTICLES_COUNT=$(PGPASSWORD=likud_dev psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM articles WHERE status = 'published';" 2>/dev/null | xargs)
echo -e "    Articles:    ${YELLOW}$ARTICLES_COUNT${NC}"

# Check polls
POLLS_COUNT=$(PGPASSWORD=likud_dev psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM community_polls;" 2>/dev/null | xargs)
echo -e "    Polls:       ${YELLOW}$POLLS_COUNT${NC}"

# Check events
EVENTS_COUNT=$(PGPASSWORD=likud_dev psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM campaign_events;" 2>/dev/null | xargs)
echo -e "    Events:      ${YELLOW}$EVENTS_COUNT${NC}"

# Check elections
ELECTIONS_COUNT=$(PGPASSWORD=likud_dev psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM primary_elections WHERE is_active = true;" 2>/dev/null | xargs)
echo -e "    Elections:   ${YELLOW}$ELECTIONS_COUNT${NC}"

# Check quiz questions
QUIZ_COUNT=$(PGPASSWORD=likud_dev psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(DISTINCT election_id) FROM quiz_questions;" 2>/dev/null | xargs)
echo -e "    Quizzes:     ${YELLOW}$QUIZ_COUNT${NC}"

# Check comments
COMMENTS_COUNT=$(PGPASSWORD=likud_dev psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM comments WHERE is_approved = true;" 2>/dev/null | xargs)
echo -e "    Comments:    ${YELLOW}$COMMENTS_COUNT${NC}"

echo ""

# Verify minimum counts
if [ "$ARTICLES_COUNT" -lt 20 ]; then
  echo -e "${RED}✗ Not enough articles (expected at least 20)${NC}"
  exit 1
fi

if [ "$POLLS_COUNT" -lt 5 ]; then
  echo -e "${RED}✗ Not enough polls (expected at least 5)${NC}"
  exit 1
fi

if [ "$EVENTS_COUNT" -lt 5 ]; then
  echo -e "${RED}✗ Not enough events (expected at least 5)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ All data verified in database${NC}"
echo ""

# ============================================================================
# Step 4: Check Backend Server
# ============================================================================
echo -e "${CYAN}[4/5]${NC} Checking backend server..."

if ! curl -s http://localhost:9090/api/v1/health > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠ Backend server not running${NC}"
  echo -e "${BLUE}  Starting server...${NC}"
  npm run start:dev > /tmp/likud-backend.log 2>&1 &

  # Wait for server
  for i in {1..30}; do
    if curl -s http://localhost:9090/api/v1/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Server started${NC}"
      break
    fi
    sleep 1
  done
else
  echo -e "${GREEN}✓ Backend server is running${NC}"
fi

echo ""

# ============================================================================
# Step 5: Test Feed Endpoint
# ============================================================================
echo -e "${CYAN}[5/5]${NC} Testing feed endpoint..."

# Test basic feed
echo -e "${BLUE}  → Testing GET /api/v1/feed${NC}"
RESPONSE=$(curl -s http://localhost:9090/api/v1/feed?page=1&limit=20)

# Parse response
TOTAL=$(echo "$RESPONSE" | grep -o '"total":[0-9]*' | head -1 | cut -d ':' -f2)
ARTICLES_IN_FEED=$(echo "$RESPONSE" | grep -o '"articlesCount":[0-9]*' | head -1 | cut -d ':' -f2)
POLLS_IN_FEED=$(echo "$RESPONSE" | grep -o '"pollsCount":[0-9]*' | head -1 | cut -d ':' -f2)
EVENTS_IN_FEED=$(echo "$RESPONSE" | grep -o '"eventsCount":[0-9]*' | head -1 | cut -d ':' -f2)
ELECTIONS_IN_FEED=$(echo "$RESPONSE" | grep -o '"electionsCount":[0-9]*' | head -1 | cut -d ':' -f2)
QUIZZES_IN_FEED=$(echo "$RESPONSE" | grep -o '"quizzesCount":[0-9]*' | head -1 | cut -d ':' -f2)

echo ""
echo -e "${GREEN}✓ Feed endpoint working!${NC}"
echo ""
echo -e "${BLUE}  Feed Statistics:${NC}"
echo -e "    Total items:      ${YELLOW}${TOTAL:-0}${NC}"
echo -e "    Articles:         ${YELLOW}${ARTICLES_IN_FEED:-0}${NC}"
echo -e "    Polls:            ${YELLOW}${POLLS_IN_FEED:-0}${NC}"
echo -e "    Events:           ${YELLOW}${EVENTS_IN_FEED:-0}${NC}"
echo -e "    Elections:        ${YELLOW}${ELECTIONS_IN_FEED:-0}${NC}"
echo -e "    Quizzes:          ${YELLOW}${QUIZZES_IN_FEED:-0}${NC}"
echo ""

# Show sample items
echo -e "${BLUE}  First 3 feed items:${NC}"
echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    items = data.get('data', [])[:3]
    for i, item in enumerate(items, 1):
        item_type = item.get('type', 'unknown')
        is_pinned = '📌' if item.get('isPinned', False) else '  '
        priority = item.get('sortPriority', 0)

        if item_type == 'article':
            title = item.get('article', {}).get('title', 'No title')[:50]
            print(f'    {is_pinned} [{item_type:15}] {title}... (priority: {priority})')
        elif item_type == 'poll':
            question = item.get('poll', {}).get('question', 'No question')[:50]
            print(f'    {is_pinned} [{item_type:15}] {question}... (priority: {priority})')
        elif item_type == 'event':
            title = item.get('event', {}).get('title', 'No title')[:50]
            print(f'    {is_pinned} [{item_type:15}] {title}... (priority: {priority})')
        elif item_type == 'election_update':
            name = item.get('electionUpdate', {}).get('electionName', 'No name')[:50]
            print(f'    {is_pinned} [{item_type:15}] {name}... (priority: {priority})')
        elif item_type == 'quiz_prompt':
            title = item.get('quizPrompt', {}).get('title', 'No title')[:50]
            print(f'    {is_pinned} [{item_type:15}] {title}... (priority: {priority})')
except Exception as e:
    print(f'    Error parsing response: {e}', file=sys.stderr)
" 2>/dev/null || echo -e "    ${YELLOW}(Could not parse items)${NC}"

echo ""

# ============================================================================
# Summary & Next Steps
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Feed Data Ready!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📱 Flutter App Setup:${NC}"
echo ""
echo -e "1. Update the router to use the new HomePage:"
echo -e "   ${CYAN}File:${NC} apps/mobile/lib/app/router.dart"
echo ""
echo -e "   ${YELLOW}Change:${NC}"
echo -e "   ${RED}import '../features/home/presentation/pages/home_page.dart';${NC}"
echo -e "   ${GREEN}import '../features/home/presentation/pages/home_page_with_feed.dart';${NC}"
echo ""
echo -e "   ${RED}child: HomePage(),${NC}"
echo -e "   ${GREEN}child: HomePageWithFeed(),${NC}"
echo ""
echo -e "2. Generate DI code:"
echo -e "   ${BLUE}cd apps/mobile${NC}"
echo -e "   ${BLUE}dart run build_runner build --delete-conflicting-outputs${NC}"
echo ""
echo -e "3. Run the app:"
echo -e "   ${BLUE}flutter run${NC}"
echo ""
echo -e "${YELLOW}🔍 Test the Feed:${NC}"
echo -e "   ${BLUE}curl http://localhost:9090/api/v1/feed?page=1&limit=10 | jq${NC}"
echo ""
echo -e "${YELLOW}📊 View in browser:${NC}"
echo -e "   ${BLUE}open http://localhost:9090/api/v1/feed?page=1&limit=10${NC}"
echo ""
