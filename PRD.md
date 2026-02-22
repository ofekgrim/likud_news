# Metzudat HaLikud — Product Requirements Document (PRD)

**Project:** Metzudat HaLikud (מצודת הליכוד)
**Version:** 0.18.0
**Last Updated:** February 22, 2026
**Status:** Pre-Alpha — Feature Development

---

## 1. Product Overview

### 1.1 Vision

Metzudat HaLikud is a Hebrew-first, RTL news application for the Likud political party. It delivers news, video content, member profiles, and real-time breaking updates — all ad-free and focused on user experience. The app mirrors the quality of Israel Hayom / ForReal while carrying Likud branding.

### 1.2 Target Audience

- Likud party members and supporters in Israel
- Hebrew-speaking news consumers interested in political coverage
- Party leadership requiring a branded communication channel

### 1.3 Key Differentiators

- **Ad-free experience** (Israeli news apps average 2-3 stars due to ad fatigue)
- **Real-time breaking news** via Server-Sent Events (SSE)
- **No login required** — anonymous device-ID based favorites and history
- **Rich member profiles** — premium personal pages with structured content blocks
- **Bilingual** — Hebrew primary, English secondary

### 1.4 Branding

| Property       | Value                                   |
|----------------|-----------------------------------------|
| Primary Color  | `#0099DB` (Likud bright blue)           |
| Dark Variant   | `#1E3A8A`                               |
| Breaking News  | `#DC2626` (red)                         |
| Background     | `#FFFFFF`                               |
| Font Family    | Heebo (Google Fonts, Hebrew-optimized)  |
| Logo           | Fortress + Menorah (SVG, gradient pill) |

---

## 2. Tech Stack

| Layer          | Technology                               | Status    |
|----------------|------------------------------------------|-----------|
| Mobile App     | Flutter 3.x + BLoC + Clean Architecture  | Built     |
| Backend API    | NestJS 11 + TypeScript + TypeORM         | Built     |
| Database       | PostgreSQL 16 + Redis 7                  | Built     |
| Admin Panel    | Next.js 15 + shadcn/ui + TipTap         | Built     |
| Real-time      | SSE (ticker + breaking news)             | Built     |
| Media Storage  | AWS S3 + CloudFront CDN                  | Configured|
| Push Notifs    | Firebase Cloud Messaging (FCM)           | Configured|
| CI/CD          | GitHub Actions + Docker + Nginx          | Built     |
| Monorepo       | Melos (Dart) + sibling dirs (NestJS/Next)| Built     |

---

## 3. Architecture

### 3.1 Repository Structure

```
likud_news/
├── apps/mobile/          # Flutter app — 189 Dart files, 16 features
├── backend/              # NestJS API — 18 modules, 70+ endpoints
├── admin/                # Next.js admin — 20 pages, 40+ components
├── infra/                # Docker, Nginx, production configs
├── .github/workflows/    # 4 CI/CD pipelines
└── melos.yaml            # Dart workspace manager
```

### 3.2 Flutter Architecture (Clean Architecture)

Every feature follows this structure:
```
features/{name}/
├── data/           # datasources (API), models (JSON), repositories (impl)
├── domain/         # entities, abstract repos, use cases (Either<Failure, T>)
└── presentation/   # BLoC (sealed events/states), pages, widgets
```

**Key patterns:**
- BLoC with sealed classes + Equatable (NOT @freezed)
- Error handling: `Either<Failure, T>` from dartz
- DI: get_it + injectable (`@lazySingleton` for repos, `@injectable` for BLoCs)
- Navigation: go_router with StatefulShellRoute (5 bottom tabs)
- RTL-first: `EdgeInsetsDirectional`, `TextDirection.rtl` throughout

### 3.3 Backend Architecture

- **API prefix:** `/api/v1/`
- **Auth:** JWT with bcrypt password hashing, role-based guards (SUPER_ADMIN, ADMIN, EDITOR)
- **Database:** TypeORM with manual migrations (synchronize=false in production)
- **Real-time:** SSE for ticker + breaking news streams
- **Media:** S3 presigned URLs for direct client uploads
- **Search:** ILIKE full-text search + GIN indexes

---

## 4. What's Built (Completed Features)

### 4.1 Flutter Mobile App — 16 Features

#### Tier 1: Full Clean Architecture (9 features)

| # | Feature | Files | Layers | Key Capabilities |
|---|---------|-------|--------|------------------|
| 1 | **Home** | 24 | 9/9 | Hero article, ticker (SSE), story circles, infinite feed, pull-to-refresh |
| 2 | **Article Detail** | 42 | 9/9 | 11 content block types, comments, bookmarks, share tracking, related articles, YouTube/Twitter embeds, ad insertion slots |
| 3 | **Breaking News** | 11 | 7/9 | SSE real-time stream, live indicator, search (server-side + local fallback), tab bar (breaking / all articles), pagination |
| 4 | **Categories** | 9 | 7/9 | Category grid with colored badges, filtered article feeds per category |
| 5 | **Members** | 12 | 9/9 | Business card directory, premium detail page (cover image, bio blocks, contact row, social links, personal HTML page, related articles) |
| 6 | **Search** | 9 | 9/9 | Debounced full-text search, popular topics, recent searches |
| 7 | **Video** | 12 | 9/9 | 2-column grid, full-screen player, duration badges, category tags |
| 8 | **Magazine** | 8 | 7/9 | Featured article spotlight, long-form content collection |
| 9 | **Favorites** | 8 | 7/9 | Device-ID based bookmarks + reading history, tab switching, swipe-to-remove |

#### Tier 2: Functional (4 features)

| # | Feature | Files | Key Capabilities |
|---|---------|-------|------------------|
| 10 | **Contact** | 6 | Email form with validation, submission to backend |
| 11 | **Settings** | 2 | Language toggle (HE/EN), theme, font size, cache clear |
| 12 | **Author Articles** | 6 | Filtered article feed by author |
| 13 | **Tag Articles** | 6 | Filtered article feed by hashtag/tag |

#### Tier 3: Navigation / Static (3 features)

| # | Feature | Description |
|---|---------|-------------|
| 14 | **About** | App version, logo, description |
| 15 | **Privacy / Accessibility** | Static legal text |
| 16 | **More** | Navigation hub to settings, about, privacy, contact |

#### Core Infrastructure

| Component | Description |
|-----------|-------------|
| **API Client** | Dio with interceptors, 10s/15s timeouts |
| **SSE Client** | Server-Sent Events with auto-reconnect |
| **Device ID Service** | UUID-based anonymous user identity |
| **Push Notification Service** | Firebase Cloud Messaging integration |
| **Block Renderer** | 11 block types: paragraph, heading, image, YouTube, tweet, quote, divider, bullet list, article link, video, drop cap |
| **Ad System** | Google Mobile Ads SDK (banner + native) |
| **Cached Image** | CloudFront CDN image caching |
| **RTL Scaffold** | Directionality wrapper for Hebrew layout |
| **Liquid Glass Nav** | Frosted-glass floating bottom navigation bar |
| **App Drawer** | Side navigation with social links |
| **Floating Logo** | Fortress+menorah SVG badge in header |
| **Shimmer Loading** | Skeleton loading animations |
| **Tutorial Overlay** | Onboarding system |

#### Localization

- **203 translation keys** in `he.json` + `en.json`
- All hardcoded Hebrew strings replaced with `.tr()` calls
- easy_localization with flat key structure

#### Tests

- **384 passing tests** (42 test files)
- Coverage: Models, entities, use cases, BLoCs
- Uses `bloc_test` + `mocktail`

---

### 4.2 Backend API — 18 Modules, 70+ Endpoints

#### Database Schema (14 tables)

| Table | Key Columns | Relations |
|-------|-------------|-----------|
| **articles** | title, subtitle, content, bodyBlocks (JSONB), heroImageUrl, slug, status (draft/published/archived), isHero, isBreaking, viewCount, shareCount, publishedAt, deletedAt | belongsTo Category, Author; hasMany Members, Tags, Media, Comments |
| **categories** | name, nameEn, slug, color, sortOrder | hasMany Articles |
| **members** | name, nameEn, title, bio, bioBlocks (JSONB), photoUrl, slug, office, phone, email, website, coverImageUrl, personalPageHtml, socialTwitter/Facebook/Instagram | manyToMany Articles |
| **authors** | nameHe, nameEn, roleHe, avatarUrl, socialLinks (JSONB) | hasMany Articles |
| **tags** | nameHe, nameEn, slug, tagType (topic/person/location) | manyToMany Articles |
| **comments** | body, authorName, articleId, storyId, parentId, isApproved, isPinned, likesCount | belongsTo Article, Story; self-referencing replies |
| **stories** | title, imageUrl, videoUrl, mediaType, expiresAt | belongsTo Article (optional) |
| **ticker_items** | text, linkUrl, position, expiresAt | belongsTo Article (optional) |
| **users** | email, name, passwordHash, role (super_admin/admin/editor) | — |
| **media** | type, url, mimeType, size, dimensions | belongsTo Article |
| **contact_messages** | name, email, subject, message, isRead | — |
| **user_favorites** | deviceId, articleId | unique(deviceId, articleId) |
| **reading_history** | deviceId, articleId, readAt | — |
| **push_tokens** | deviceId, token, platform | — |

#### API Endpoints (Key Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles` | Paginated article feed with filters |
| GET | `/articles/:slug` | Article detail (increments view count) |
| GET | `/articles/hero` | Current hero article |
| GET | `/articles/breaking` | Breaking news articles |
| GET | `/articles/search?q=` | Full-text search (ILIKE + tags) |
| GET | `/articles/related/:id` | Related articles |
| GET | `/articles/recommendations` | Recommended articles |
| GET | `/categories` | All active categories |
| GET | `/categories/:slug/articles` | Articles by category |
| GET | `/members` | All active members |
| GET | `/members/:id/articles` | Articles linked to member |
| GET | `/tags/:slug/articles` | Articles by tag |
| GET | `/authors/:id/articles` | Articles by author |
| GET | `/search?q=` | Cross-entity search |
| GET | `/stories` | Active stories |
| GET | `/ticker` | Active ticker items |
| SSE | `/sse/ticker` | Real-time ticker stream |
| SSE | `/sse/breaking` | Real-time breaking news stream |
| POST | `/favorites` | Add favorite (device-ID) |
| POST | `/history` | Record reading history |
| POST | `/contact` | Submit contact form |
| POST | `/auth/login` | JWT authentication |

#### Migrations

7 progressive migrations from initial schema through member enhancement:
1. `InitialSchema` — 11 base tables + indexes
2. `EnhancedArticles` — Authors, tags, comments, bodyBlocks
3. `CreateStories` — TikTok-style stories
4. `EnhanceStories` — Video support for stories
5. `CommentStorySupport` — Comments on stories
6. `EnhanceMembers` — Slug, office, phone, email, website, coverImageUrl, personalPageHtml
7. `AddMemberBioBlocks` — Rich biography content blocks

#### Seed Data

- 1 super_admin user
- 6 categories (politics, security, economy, society, education, health)
- 5 Knesset members with full data (bio blocks, photos, social links)
- Multiple articles with content blocks
- Auto-generated person tags for each member
- Sample comments with replies
- Ticker items and stories

---

### 4.3 Admin Panel — 20 Pages

| Resource | Pages | CRUD | Editor Type |
|----------|-------|------|-------------|
| **Dashboard** | 1 | — | Stats + quick actions |
| **Articles** | 3 (list/new/edit) | Full CRUD | Block Editor + TipTap HTML fallback |
| **Videos** | 3 (list/new/edit) | Full CRUD | Block Editor + source selector (YouTube/social/upload) |
| **Members** | 3 (list/new/edit) | Create/Read/Update | Block Editor for bio + TipTap for personal page |
| **Categories** | 1 | Full CRUD (modal) | Inline form |
| **Tags** | 1 | Full CRUD (modal) | Inline form |
| **Authors** | 1 | Full CRUD (inline) | Avatar picker + social links |
| **Ticker** | 1 | Full CRUD (modal) | Inline form |
| **Stories** | 1 | Full CRUD (modal) | Image/video picker |
| **Comments** | 1 | Read/Approve/Pin/Delete | Moderation workflow |
| **Media** | 1 | Upload/Read/Delete | Grid gallery |
| **Contact** | 1 | Read/Mark read | Message viewer |
| **Users** | 1 | Create/Read/Update | Dialog form |
| **Push** | 1 | Send only | Notification form |

#### Key Components

| Component | Description |
|-----------|-------------|
| **Block Editor** | Custom drag-and-drop editor with 10 block types (paragraph, heading, image, quote, YouTube, tweet, divider, bullet list, article link, video) |
| **TipTap Editor** | Rich HTML editor for fallback content and personal pages |
| **Image Picker** | S3 presigned upload or media library selection |
| **Tag Selector** | Multi-select with search |
| **Author Selector** | Dropdown with avatar preview |
| **Color Picker** | Category color selection |

---

### 4.4 Infrastructure

| Component | Status | Files |
|-----------|--------|-------|
| Docker Compose (dev) | Built | `infra/docker-compose.yml` (Postgres + Redis) |
| Docker Compose (prod) | Built | `infra/docker-compose.prod.yml` |
| Nginx reverse proxy | Built | `infra/nginx/` |
| GitHub Actions — Flutter CI | Built | `.github/workflows/flutter_ci.yml` |
| GitHub Actions — Backend CI | Built | `.github/workflows/backend_ci.yml` |
| GitHub Actions — Admin CI | Built | `.github/workflows/admin_ci.yml` |
| GitHub Actions — Deploy | Built | `.github/workflows/deploy.yml` |
| Prod env template | Built | `infra/.env.production.example` |

---

## 5. What's Left To Do

### 5.1 Priority 1: Production Readiness (Critical Path)

#### P1.1 — Backend Hardening

| Task | Description | Effort |
|------|-------------|--------|
| **Redis caching** | Wire Redis to cache article feeds, categories, members (TTL: 60s feeds, 300s categories) | Medium |
| **Rate limiting** | Add throttle decorators to public endpoints (esp. search, SSE, push/register) | Small |
| **Input sanitization** | Sanitize HTML in comments, contact messages (XSS prevention) | Small |
| **API response wrapping** | Standardize all responses to `{ data, meta, error }` format | Medium |
| **Soft-delete everywhere** | Add DeleteDateColumn to members, categories (currently articles only) | Small |
| **Comment moderation defaults** | Change isApproved default from `true` to `false` | Small |
| **Transaction management** | Wrap multi-step operations (article + tags + members) in transactions | Medium |
| **Error logging** | Structured logging (Winston/Pino) with log levels | Medium |
| **Health check endpoint** | `GET /health` for load balancer monitoring | Small |

#### P1.2 — Flutter Hardening

| Task | Description | Effort |
|------|-------------|--------|
| **Offline caching with Hive** | Cache article feeds, categories, members for offline reading (Hive is imported but unused) | Large |
| **Retry + exponential backoff** | Add retry logic to API client for transient failures | Medium |
| **Image preloading** | Preload hero images and story thumbnails for instant display | Small |
| **Deep link handling** | Handle `likud.news/article/:slug` deep links via go_router | Medium |
| **Error boundary widgets** | Wrap features in error boundaries to prevent full-screen crashes | Small |
| **Pull-to-refresh on all lists** | Ensure all list views support pull-to-refresh consistently | Small |
| **Pagination on members** | Add pagination to members list (currently loads all) | Small |

#### P1.3 — Admin Hardening

| Task | Description | Effort |
|------|-------------|--------|
| **JWT refresh token** | Implement auto-refresh before token expiry (currently no refresh) | Medium |
| **Member delete** | Add delete confirmation dialog for members | Small |
| **User delete** | Add delete functionality for admin users | Small |
| **Contact reply/delete** | Add reply and delete options for contact messages | Small |
| **Bulk operations** | Select multiple articles for bulk publish/archive/delete | Medium |
| **Draft preview** | Preview article/video before publishing | Medium |
| **Scheduled publishing** | Set future publishedAt date to auto-publish | Medium |

---

### 5.2 Priority 2: User Experience Enhancements

#### P2.1 — Flutter UX

| Task | Description | Effort |
|------|-------------|--------|
| **Dark mode** | Full dark theme implementation (AppTheme.dark is configured but not wired) | Large |
| **Font size scaling** | Wire settings font size slider to actual content (settings page exists but doesn't persist) | Medium |
| **Settings persistence** | Persist language, theme, font size to Hive/SharedPreferences | Medium |
| **Onboarding tutorial** | Wire tutorial_service.dart + tutorial_overlay.dart to first-launch flow | Medium |
| **Share deep links** | Generate and share deep links to specific articles | Small |
| **Haptic feedback** | Add haptic feedback to key interactions (bookmark, like, refresh) | Small |
| **Animated transitions** | Page transitions between article list and detail (Hero widget) | Medium |
| **Accessibility** | Screen reader labels, semantic widgets, minimum tap targets | Medium |
| **Push notification handling** | Navigate to article when push notification tapped | Medium |

#### P2.2 — Content Features

| Task | Description | Effort |
|------|-------------|--------|
| **Audio player** | Breaking news audio stream (just_audio is imported) | Medium |
| **Podcast section** | Podcast episodes with playback controls | Large |
| **Live event coverage** | Special live blog format with chronological updates | Large |
| **Polls / surveys** | In-app polls for party member engagement | Large |
| **Newsletter signup** | Email subscription form in more/settings | Small |

---

### 5.3 Priority 3: Analytics & Monitoring

| Task | Description | Effort |
|------|-------------|--------|
| **Firebase Analytics** | Event tracking (article_view, search, share, bookmark, category_tap) | Medium |
| **Crashlytics** | Crash reporting via Firebase Crashlytics | Small |
| **Performance monitoring** | Firebase Performance for API latency + render times | Small |
| **Admin analytics dashboard** | Charts for views, shares, popular articles, active users | Large |
| **A/B testing** | Firebase Remote Config for feature flags | Medium |

---

### 5.4 Priority 4: Testing & Quality

| Task | Description | Effort |
|------|-------------|--------|
| **Widget tests** | Flutter widget tests for all major pages (currently 0 widget tests) | Large |
| **Integration tests** | End-to-end tests for key flows (home → article → bookmark) | Large |
| **Backend unit tests** | NestJS service unit tests with jest | Large |
| **Backend E2E tests** | Supertest API endpoint testing | Large |
| **Admin tests** | Cypress or Playwright E2E tests for admin CRUD flows | Large |
| **Performance profiling** | Flutter DevTools profiling for large feed rendering | Medium |
| **Load testing** | k6 or Artillery for API load testing | Medium |

---

### 5.5 Priority 5: Deployment & DevOps

| Task | Description | Effort |
|------|-------------|--------|
| **Staging environment** | Deploy to staging server for QA testing | Medium |
| **Production deployment** | Deploy to production (cloud provider TBD) | Large |
| **SSL/TLS** | Configure HTTPS with Let's Encrypt | Small |
| **CDN configuration** | Configure CloudFront for media delivery | Medium |
| **Database backups** | Automated daily PostgreSQL backups | Small |
| **Monitoring** | Uptime monitoring (Uptime Robot / Better Stack) | Small |
| **App Store submission** | iOS App Store + Google Play Store submission | Medium |
| **App signing** | iOS certificates + Android keystore setup | Medium |

---

## 6. Build Progress Summary

### Phases Completed

| Phase | Description | Commit | LOC |
|-------|-------------|--------|-----|
| Phase 1 | Project scaffolding (Flutter, NestJS, Next.js, Docker, CI/CD) | `c2dbbbe` | — |
| Phase 2 | Core architecture (DI, theme, router, network, SSE, 3 features) | `51d510b` | 7,680 |
| Phase 3 | Feature development (11 features, DB migrations, i18n) | `afd3b8b` | 9,000 |
| Phases 4-6 | Admin panel, push notifications, backend refinements | `9a16cfd` | — |
| Phase 7 | Test suite (392 tests) | `39718e4` | — |
| Phase 8 | Deployment infrastructure (Docker, CI/CD, Nginx) | `ca4da2c` | — |
| Phase 9 | Server-client integration (navigation, JSON keys) | `012b3fa` | — |
| Phase 10 | Premium article detail + Google AdMob ads | `7de208a` | — |
| Phases 16-17 | LiquidGlass nav, stories, comments, smart video routing | `1dd2e9b` | — |
| Phase 18 | Video editor, server search, members enhancement, logo system | *(in progress)* | — |

### Current Stats

| Metric | Value |
|--------|-------|
| Flutter files (lib/) | 189 |
| Flutter features | 16 |
| Flutter tests | 384 passing |
| Translation keys | 203 (HE + EN) |
| Backend modules | 18 |
| REST endpoints | 70+ |
| Database tables | 14 |
| Database migrations | 7 |
| Admin pages | 20 |
| Admin components | 40+ |
| CI/CD pipelines | 4 |
| Git commits | 13 |

---

## 7. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| No offline caching | Users lose content when offline | High | Wire Hive cache (already imported) |
| No JWT refresh | Admin sessions expire unexpectedly | Medium | Implement refresh token flow |
| No input sanitization | XSS in comments/contact | Medium | Add HTML sanitization middleware |
| No rate limiting | API abuse / DDoS | Medium | Add throttle decorators |
| No monitoring | Undetected downtime | High | Add health checks + uptime monitoring |
| No widget tests | UI regressions undetected | Medium | Add widget tests for key pages |
| App Store rejection | iOS review failure | Low | Follow Apple guidelines, add privacy labels |

---

## 8. Technical Debt

| Item | Location | Description |
|------|----------|-------------|
| `freezed_annotation` imported but unused | pubspec.yaml | Sealed classes used instead — remove freezed dependency |
| `flutter_lints` warning | analysis_options.yaml | Referenced but not installed — switch to `very_good_analysis` |
| Settings not persisted | settings_bloc.dart | Font size, theme, language reset on app restart |
| Hive imported but unused | pubspec.yaml | Configure Hive boxes for offline caching |
| Redis configured but unused | backend config | Wire Redis to cache frequently-accessed endpoints |
| Comment isApproved defaults to true | comment entity | Should default to false for moderation workflow |
| `zustand` imported in admin but unused | admin/package.json | Remove or wire for global state |

---

## 9. Appendix

### 9.1 GitHub Repository

- **URL:** https://github.com/ofekgrim/likud_news
- **Branch:** main
- **User:** ofekgrim

### 9.2 Development Setup

```bash
# Prerequisites: Flutter 3.x, Node 20+, Docker

# Start database
docker-compose -f infra/docker-compose.yml up -d

# Backend
cd backend && npm install && npm run migration:run && npm run seed && npm run start:dev

# Admin
cd admin && npm install && npm run dev

# Mobile
cd apps/mobile && flutter pub get && flutter run
```

### 9.3 Default Credentials

| Service | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@likud.org.il | Admin123! | super_admin |

### 9.4 API Documentation

Swagger UI available at: `http://localhost:9090/api/v1/docs`

### 9.5 Key File Paths

| File | Purpose |
|------|---------|
| `apps/mobile/lib/app/router.dart` | Flutter navigation (5 tabs + routes) |
| `apps/mobile/lib/core/constants/api_constants.dart` | API endpoint constants |
| `apps/mobile/lib/app/theme/app_colors.dart` | Likud color palette |
| `apps/mobile/assets/l10n/{he,en}.json` | Translation files |
| `backend/src/database/migrations/` | Database schema history |
| `backend/src/database/seeds/seed.ts` | Seed data |
| `admin/src/lib/types.ts` | TypeScript type definitions |
| `admin/src/components/block-editor/` | Block editor system |
| `CLAUDE.md` | Project conventions guide |
