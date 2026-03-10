# Testing & QA Scripts

This directory contains testing and QA scripts for Metzudat HaLikud.

## Feed Feature Testing

### Full Integration Test (Recommended)

Tests the complete Feed feature stack (Backend + Flutter):

```bash
./scripts/test-feed-integration.sh
```

**What it does**:
- ✅ Checks backend environment (PostgreSQL, Redis, .env)
- 🌱 Seeds feed test data (20 articles, 5 polls, 5 events, etc.)
- 🧪 Runs backend QA tests (9 scenarios)
- 🚀 Starts backend server (if not running)
- 🔍 Tests live API endpoints
- 📱 Verifies Flutter setup

**Time**: ~30-45 seconds

---

### Quick Backend Test

Seeds data and runs QA tests only (no environment checks):

```bash
cd backend
./scripts/quick-feed-test.sh
```

**What it does**:
- 🌱 Seeds feed test data
- 🧪 Runs backend QA tests

**Time**: ~10 seconds

---

## NPM Scripts (Backend)

From `backend/` directory:

```bash
# Seed all base data (users, categories, articles, etc.)
npm run seed

# Seed election data
npm run seed:elections

# Seed feed test data (20 articles, 5 polls, 5 events, etc.)
npm run seed:feed

# Run feed QA tests
npm run test:feed

# Seed + test in one command
npm run qa:all
```

---

## Manual Testing

### Backend

```bash
cd backend

# 1. Start services
brew services start postgresql@16
brew services start redis

# 2. Seed data
npm run seed:feed

# 3. Start server
npm run start:dev

# 4. Test endpoint
curl http://localhost:9090/api/v1/feed?page=1&limit=10 | jq
```

### Flutter

```bash
cd apps/mobile

# 1. Generate DI code
dart run build_runner build --delete-conflicting-outputs

# 2. Run app
flutter run

# 3. Test in app
# - Pull to refresh
# - Scroll to load more
# - Tap different feed item types
```

---

## Test Data Overview

### Feed Seed (`npm run seed:feed`)

Creates realistic test data:

| Content Type | Count | Details |
|-------------|-------|---------|
| Articles | 20 | 2 pinned, 3 breaking, varying ages & engagement |
| Polls | 5 | Active/closed, voted/not voted, various topics |
| Events | 5 | Upcoming/past, RSVP available, different types |
| Elections | 2 | LIVE with turnout & candidate results |
| Quiz | 1 | Multi-question, completion rate |
| Comments | 500+ | Distributed across articles |

---

## QA Test Scenarios

The `test:feed` script validates:

1. ✅ Basic feed fetch (pagination, metadata)
2. ✅ Content type filtering (single & multiple types)
3. ✅ Priority scoring (pinned, breaking, recency)
4. ✅ Content interleaving (proper distribution)
5. ✅ Cardinality limits (max polls/events per page)
6. ✅ Pagination (correct items per page)
7. ✅ Engagement counts (views, comments, votes)
8. ✅ Category filtering (articles only)
9. ✅ Empty states (invalid filters)

---

## Useful Commands

### Backend

```bash
# View server logs
tail -f /tmp/likud-backend.log

# Stop backend server
pkill -f 'nest start'

# Reset database
npm run migration:revert
npm run migration:run
npm run seed
npm run seed:feed

# Check if services are running
pg_isready && redis-cli ping
```

### Flutter

```bash
# Clean build
flutter clean
flutter pub get

# Regenerate DI code
dart run build_runner clean
dart run build_runner build --delete-conflicting-outputs

# Run with logs
flutter run -v

# Check for errors
flutter analyze
```

---

## Documentation

- **Full Testing Guide**: `/FEED_TESTING.md`
- **Implementation Plan**: `/.claude/plans/logical-squishing-toast.md`
- **Backend Feed Module**: `/backend/src/modules/feed/`
- **Flutter Feed Feature**: `/apps/mobile/lib/features/feed/`

---

## Troubleshooting

### "PostgreSQL not running"
```bash
brew services start postgresql@16
```

### "Redis not running"
```bash
brew services start redis
```

### "Port 9090 already in use"
```bash
lsof -i :9090  # Find process
kill -9 <PID>  # Kill it
```

### "GetIt: Object/factory with type FeedBloc not registered"
```bash
cd apps/mobile
dart run build_runner build --delete-conflicting-outputs
```

---

## CI/CD Integration

These scripts can be integrated into GitHub Actions:

```yaml
# .github/workflows/test-feed.yml
name: Feed Feature Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Services
        run: |
          docker-compose up -d postgres redis

      - name: Run Feed Tests
        run: |
          cd backend
          npm install
          npm run seed:feed
          npm run test:feed
```

---

For detailed documentation, see [FEED_TESTING.md](/FEED_TESTING.md)
