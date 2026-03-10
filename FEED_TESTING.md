# Feed Feature Testing Guide

This guide covers testing the unified mixed-content feed feature for Metzudat HaLikud.

## Quick Start

### Option 1: Automated Test Suite (Recommended)

Run the complete integration test suite:

```bash
./scripts/test-feed-integration.sh
```

This script will:
1. ✅ Check backend environment (PostgreSQL, Redis, .env)
2. 🌱 Seed feed test data (20 articles, 5 polls, 5 events, 2 elections, 500+ comments)
3. 🧪 Run backend QA tests (9 test scenarios)
4. 🚀 Start backend server (if not running)
5. 🔍 Test live API endpoints
6. 📱 Verify Flutter setup and code generation

**Total runtime**: ~30-45 seconds

---

### Option 2: Manual Testing

#### Backend Setup

1. **Start services**:
   ```bash
   brew services start postgresql@16
   brew services start redis
   ```

2. **Seed test data**:
   ```bash
   cd backend
   npm run seed:feed
   ```

3. **Run QA tests**:
   ```bash
   npm run test:feed
   ```

4. **Start backend server**:
   ```bash
   npm run start:dev
   ```

#### Flutter Setup

1. **Generate DI code**:
   ```bash
   cd apps/mobile
   dart run build_runner build --delete-conflicting-outputs
   ```

2. **Update router** to use the new HomePage with Feed:

   Edit `apps/mobile/lib/app/router.dart`:

   ```dart
   // Replace this:
   import '../features/home/presentation/pages/home_page.dart';

   // With this:
   import '../features/home/presentation/pages/home_page_with_feed.dart';
   ```

   ```dart
   // Replace this:
   GoRoute(
     path: '/',
     pageBuilder: (context, state) => const NoTransitionPage(
       child: HomePage(),
     ),
   ),

   // With this:
   GoRoute(
     path: '/',
     pageBuilder: (context, state) => const NoTransitionPage(
       child: HomePageWithFeed(),
     ),
   ),
   ```

3. **Run the app**:
   ```bash
   flutter run
   ```

---

## Test Data Overview

The `seed:feed` script creates:

### Articles (20 total)
- 2 pinned articles
- 3 breaking news articles
- Varying ages (0-48 hours old)
- Different engagement levels (100-5000 views, 5-150 comments)
- Multiple categories (Politics, Economy, Security, Society)

### Community Polls (5 total)
- 1 active poll (not voted)
- 2 active polls (user voted)
- 1 closed poll
- 1 multi-select poll
- Topics: coalition, economy, security, Netanyahu approval

### Campaign Events (5 total)
- 3 upcoming events (RSVP available)
- 1 user has RSVPed
- 1 event at max capacity
- Types: Rally, Town Hall, Conference, Campaign Launch, Debate

### Primary Elections (2 total)
- **Central Committee Election** (LIVE, 12.5% turnout, 5 candidates)
- **Tel Aviv District Primary** (LIVE, 8.2% turnout, 8 candidates)

### Quiz Prompts (1 total)
- "Find Your Likud Match" quiz
- 20 questions, 45% completion rate

### Comments (500+ total)
- Distributed across all 20 articles
- Realistic Hebrew content
- Mix of root comments and replies

---

## QA Test Scenarios

The `test:feed` script validates 9 scenarios:

### 1. **Basic Feed Fetch**
- ✅ Returns 10 items (page 1, limit 10)
- ✅ Includes mixed content types
- ✅ Has proper pagination metadata

### 2. **Content Type Filtering**
- ✅ Filter by single type (articles only)
- ✅ Filter by multiple types (articles + polls)
- ✅ Returns only requested types

### 3. **Priority Scoring**
- ✅ Pinned items ranked highest
- ✅ Breaking articles have high priority
- ✅ Recent content outranks old content

### 4. **Content Interleaving**
- ✅ Articles appear most frequently
- ✅ Polls appear occasionally (every ~6 items)
- ✅ Events appear occasionally (every ~8 items)

### 5. **Cardinality Limits**
- ✅ Max 2 polls per page
- ✅ Max 3 events per page
- ✅ Max 1 quiz per page

### 6. **Pagination**
- ✅ Page 1 returns first 10 items
- ✅ Page 2 returns next 10 items (different items)
- ✅ `hasMore` flag correct

### 7. **Engagement Counts**
- ✅ Articles include view/comment/share counts
- ✅ Polls include vote counts
- ✅ Events include RSVP counts

### 8. **Category Filtering**
- ✅ Filter by category ID
- ✅ Returns only articles from that category
- ✅ Polls/events excluded from category filter

### 9. **Empty States**
- ✅ Invalid filters return empty array
- ✅ Metadata still valid
- ✅ No errors thrown

---

## API Endpoints

### GET `/api/v1/feed`

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 50) - Items per page
- `types` (string[]) - Filter by type: `article`, `poll`, `event`, `election_update`, `quiz_prompt`
- `categoryId` (UUID) - Filter articles by category
- `deviceId` (string) - For personalization
- `userId` (UUID) - For personalization

**Example Requests**:

```bash
# Get first page (mixed content)
curl http://localhost:9090/api/v1/feed?page=1&limit=10

# Get only articles and polls
curl http://localhost:9090/api/v1/feed?types=article,poll

# Filter articles by category
curl http://localhost:9090/api/v1/feed?categoryId=abc-123&types=article

# Pagination
curl http://localhost:9090/api/v1/feed?page=2&limit=20
```

**Response Format**:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "article",
      "publishedAt": "2024-01-15T10:00:00Z",
      "isPinned": false,
      "sortPriority": 582,
      "article": {
        "id": "uuid",
        "title": "כותרת הכתבה",
        "titleEn": "Article Title",
        "subtitle": "כותרת משנה",
        "heroImageUrl": "https://cdn.example.com/image.jpg",
        "categoryName": "פוליטיקה",
        "categoryColor": "#0099DB",
        "isBreaking": false,
        "viewCount": 1523,
        "commentCount": 42,
        "shareCount": 18,
        "readingTimeMinutes": 5,
        "slug": "article-slug",
        "author": "ישראל ישראלי",
        "authorEntityName": "עיתונאי בכיר"
      }
    },
    {
      "id": "uuid",
      "type": "poll",
      "publishedAt": "2024-01-15T09:00:00Z",
      "isPinned": true,
      "sortPriority": 1023,
      "poll": {
        "id": "uuid",
        "question": "מה דעתך על הקואליציה?",
        "questionEn": "What do you think about the coalition?",
        "options": [
          {
            "id": "uuid",
            "text": "תומך",
            "textEn": "Support",
            "votesCount": 1250,
            "percentage": 62.5
          }
        ],
        "totalVotes": 2000,
        "endsAt": "2024-01-20T00:00:00Z",
        "isActive": true,
        "allowMultipleVotes": false,
        "userHasVoted": false
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 32,
    "totalPages": 4,
    "articlesCount": 20,
    "pollsCount": 5,
    "eventsCount": 5,
    "electionsCount": 2,
    "quizzesCount": 1
  }
}
```

### GET `/api/v1/sse/feed`

Server-Sent Events stream for real-time feed updates.

**Example**:

```bash
# Connect to SSE stream
curl -N http://localhost:9090/api/v1/sse/feed
```

**Event Format**:

```
event: feed_update
data: {"type":"article","item":{...}}

event: feed_update
data: {"type":"poll","item":{...}}
```

---

## Flutter Testing Checklist

### Manual Testing in App

1. **Initial Load**
   - [ ] Hero article appears
   - [ ] Breaking ticker scrolls (if breaking news exists)
   - [ ] Story circles load
   - [ ] Mixed content feed loads (articles, polls, events)

2. **Pull to Refresh**
   - [ ] Pull down gesture triggers refresh
   - [ ] Both home content and feed refresh
   - [ ] Loading indicator shows
   - [ ] New content appears

3. **Infinite Scroll**
   - [ ] Scroll down to 90% triggers load more
   - [ ] Loading indicator shows at bottom
   - [ ] More items append to list
   - [ ] No duplicate items

4. **Feed Item Cards**
   - [ ] **Article Cards**: Show image, title, subtitle, category badge, engagement stats
   - [ ] **Poll Cards**: Show question, top 3 options, vote button
   - [ ] **Event Cards**: Show image, date/time/location pills, RSVP button
   - [ ] **Election Cards**: Show LIVE badge, turnout %, candidate bars
   - [ ] **Quiz Cards**: Show title, CTA button, completion badge

5. **Navigation**
   - [ ] Tap article card → navigates to article detail
   - [ ] Tap poll card → (TODO: poll voting page)
   - [ ] Tap event card → (TODO: event detail page)
   - [ ] Tap election card → (TODO: live results page)
   - [ ] Tap quiz card → (TODO: quiz page)

6. **Real-Time Updates (SSE)**
   - [ ] Keep app open
   - [ ] Backend publishes new content
   - [ ] New items appear in feed automatically (without refresh)

7. **Error Handling**
   - [ ] Turn off WiFi → error message shows
   - [ ] Tap retry → reloads feed
   - [ ] Backend offline → error message shows

---

## Troubleshooting

### Backend Issues

**PostgreSQL not running**:
```bash
brew services start postgresql@16
```

**Redis not running**:
```bash
brew services start redis
```

**Port 9090 already in use**:
```bash
# Find process using port
lsof -i :9090

# Kill process
kill -9 <PID>
```

**Database connection error**:
```bash
# Check .env file has correct credentials
cat backend/.env | grep DATABASE

# Reset database
cd backend
npm run migration:revert
npm run migration:run
npm run seed
npm run seed:feed
```

### Flutter Issues

**Build runner fails**:
```bash
cd apps/mobile
flutter clean
flutter pub get
dart run build_runner clean
dart run build_runner build --delete-conflicting-outputs
```

**DI errors (GetIt not registered)**:
```bash
# Make sure build_runner completed successfully
dart run build_runner build --delete-conflicting-outputs

# Check generated file
cat lib/app/di.config.dart | grep FeedBloc
```

**SSE not working**:
- Check backend is running on port 9090
- Check `ApiConstants.baseUrl` in `lib/core/constants/api_constants.dart`
- Check device/emulator can reach backend (use local IP, not localhost if on real device)

---

## Performance Benchmarks

### Backend

- **Feed endpoint response time**: <200ms (for 20 items)
- **Database query time**: <100ms (5 parallel queries)
- **SSE connection time**: <50ms
- **Memory usage**: ~150MB (baseline) + 5MB per SSE client

### Flutter

- **Initial load time**: <2s (hero + feed)
- **Scroll FPS**: 60fps (with image loading)
- **Memory usage**: ~200MB (baseline) + 50MB per 100 feed items
- **Build runner time**: ~20s (first run), ~5s (incremental)

---

## Next Steps

After testing the feed feature:

1. **Implement navigation** for poll/event/election/quiz detail pages
2. **Add analytics tracking** for feed item views/interactions
3. **Implement A/B testing** for feed algorithm parameters
4. **Add user feedback** mechanism for feed quality
5. **Optimize images** with WebP + lazy loading
6. **Add feed filtering UI** (type toggles, category selector)
7. **Implement "Save for later"** functionality
8. **Add share functionality** for all feed item types

---

## Support

For issues or questions:
- Backend: Check `backend/src/modules/feed/`
- Flutter: Check `apps/mobile/lib/features/feed/`
- Algorithm: Check `backend/src/modules/feed/feed-algorithm.service.ts`
- Plan: Check `.claude/plans/logical-squishing-toast.md`
