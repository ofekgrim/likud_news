# Metzudat HaLikud (מצודת הליכוד) — Project Overview

Production-grade Hebrew RTL news app for the Likud party. Full-stack monorepo: Flutter mobile + NestJS backend + Next.js admin panel.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Mobile App (Flutter)](#2-mobile-app-flutter)
3. [Backend API (NestJS)](#3-backend-api-nestjs)
4. [Admin Panel (Next.js)](#4-admin-panel-nextjs)
5. [Infrastructure & Deployment](#5-infrastructure--deployment)
6. [Key Technical Decisions](#6-key-technical-decisions)
7. [Build & Deployment Status](#7-build--deployment-status)
8. [Summary Statistics](#8-summary-statistics)

---

## 1. Architecture Overview

| Layer | Technology | Path |
|-------|-----------|------|
| Mobile App | Flutter (BLoC + Clean Architecture) | `apps/mobile/` |
| Backend API | NestJS (TypeORM + PostgreSQL) | `backend/` |
| Admin Panel | Next.js 15 (shadcn/ui + TipTap) | `admin/` |
| Infrastructure | Docker, Nginx, Terraform | `infra/` |

**Branding**: Likud Blue (#0099DB), Heebo font family, RTL-first Hebrew UI.

---

## 2. Mobile App (Flutter)

**Path:** `apps/mobile/`

### Core Layers

- `lib/app/` — Application shell (DI, routing, theming)
- `lib/core/` — Cross-cutting concerns (network, services, constants, utils, widgets, ads)
- `lib/features/` — Feature modules (Clean Architecture: data → domain → presentation)

### All 32 Features

| Feature | BLoCs | Entities | Purpose |
|---------|-------|----------|---------|
| article_detail | 2 | 5 | Article viewing, comments |
| auth | 1 | 2 | Phone OTP, login/register |
| author_articles | 1 | 0 | Articles filtered by author |
| authors | 1 | 0 | Author listings |
| breaking_news | 1 | 0 | Real-time ticker/breaking updates |
| campaign_events | 1 | 2 | Likud campaign events |
| candidate_quiz | 2 | 5 | Interactive primaries quiz |
| candidates | 1 | 3 | Candidate profiles (primaries) |
| categories | 1 | 0 | Article categories |
| community_polls | 1 | 2 | User voting polls |
| contact | 1 | 0 | Contact form submission |
| daily_quiz | 1 | 1 | Gamified daily quiz |
| election_day | 1 | 4 | Election results dashboard |
| enhanced_favorites | 1 | 1 | Bookmark folders system |
| favorites | 1 | 0 | Simple favorites list |
| feed | 1 | 2 | Unified mixed-content feed |
| gamification | 1 | 4 | Points, badges, streaks |
| home | 1 | 4 | Main feed home page |
| magazine | 1 | 0 | Magazine/curated content |
| members | 1 | 2 | Knesset member profiles |
| membership | 1 | 2 | Party membership info |
| notification_inbox | 1 | 1 | Push notification history |
| search | 1 | 1 | Full-text article search |
| settings | 1 | 0 | User preferences |
| stories | 1 | 0 | Instagram-style stories |
| tag_articles | 1 | 0 | Articles by tag |
| user_profile | 1 | 0 | User account management |
| video | 1 | 1 | Video articles & player |
| about | 0 | 0 | Static about page |
| accessibility | 0 | 0 | Accessibility settings |
| privacy | 0 | 0 | Privacy policy |
| more | 0 | 0 | Settings/menu drawer |

**Totals:** 30 BLoCs, 48 Entities

### Bottom Tab Navigation (5 Tabs)

| Tab | Label | Route | BLoC |
|-----|-------|-------|------|
| 1 | ראשי (Home) | `/` | HomeBloc |
| 2 | מבזקים (Breaking) | `/breaking` | BreakingNewsBloc |
| 3 | וידאו (Video) | `/video` | VideoBloc |
| 4 | סטוריז (Stories) | `/stories` | StoriesBloc |
| 5 | ☰ (More) | `/more` | Menu drawer |

### All Routes

```
/                                  — Home feed
/breaking                          — Breaking news
/video                             — Video feed
/stories                           — Stories
/more                              — Menu/settings drawer

/article/:slug                     — Article detail (smart: video or standard)
/member/:id                        — Knesset member profile
/members                           — Members list
/authors                           — Authors list
/search                            — Search interface
/categories                        — Categories list
/category/:slug?name=X             — Articles by category
/settings                          — User settings
/favorites                         — Simple favorites
/contact                           — Contact form
/about                             — About page
/accessibility                     — Accessibility page
/privacy                           — Privacy policy
/tag/:slug?name=X                  — Articles by tag
/author/:id                        — Articles by author

/login                             — Phone login
/otp-verify                        — OTP verification
/register                          — User registration
/profile                           — User profile (auth required)
/profile/edit                      — Edit profile (auth required)
/profile/notifications             — Notification preferences (auth required)
/folders                           — Bookmark folders (auth required)
/folders/:id                       — Folder detail (auth required)

/primaries                         — Candidates list
/candidate/:slug                   — Candidate detail
/primaries/quiz                    — Quiz list
/primaries/quiz/:electionId        — Quiz intro
/primaries/quiz/:electionId/questions  — Quiz questions
/primaries/quiz/:electionId/results    — Quiz results
/election-day/:electionId          — Election results

/polls                             — Community polls
/events                            — Campaign events
/events/:id                        — Event detail
/membership                        — Membership page
/gamification                      — Gamification dashboard
/daily-quiz                        — Daily quiz (auth required)
/notifications                     — Notification inbox
```

### Theme System

| File | Purpose |
|------|---------|
| `lib/app/theme/app_theme.dart` | Light & dark ThemeData (Material 3) |
| `lib/app/theme/app_colors.dart` | Brand palette (static constants) |
| `lib/app/theme/app_colors_extension.dart` | Theme-aware semantic colors (ThemeExtension) |
| `lib/app/theme/app_typography.dart` | Heebo font family, text styles |
| `lib/app/theme/theme_context.dart` | `context.colors` accessor extension |

**Brand Colors (static — same in both modes):**
- Primary: Likud Blue `#0077B0`
- Secondary: Dark Blue `#1E3A8A`
- Accent: Light Blue `#E0F2FE`
- Breaking: Red `#DC2626`

**Semantic Colors (theme-aware — vary by mode):**

| Token | Light | Dark |
|-------|-------|------|
| surface | `#FFFFFF` | `#1E1E1E` |
| surfaceVariant | `#F8FAFC` | `#252525` |
| surfaceMedium | `#F1F5F9` | `#2C2C2C` |
| background | `#FFFFFF` | `#121212` |
| textPrimary | `#1E293B` | `#E8E8E8` |
| textSecondary | `#5B6B80` | `#B0B0B0` |
| textTertiary | `#6B7A8D` | `#808080` |
| border | `#E2E8F0` | `#3A3A3A` |
| cardSurface | `#FFFFFF` | `#1E1E1E` |
| glassBg | white | `#1E1E1E` |
| glassBorder | white/0.3 | white/0.08 |

**"System" theme** follows day/night time (dark 19:00–06:00, light 06:00–19:00), not OS preference.

### Core Services

| Service | Purpose |
|---------|---------|
| ApiClient (Dio) | HTTP with auth interceptor |
| PushNotificationService | FCM registration & handling |
| NotificationCountService | Unread badge counts |
| DeviceIdService | Anonymous device identification |
| SecureStorageService | JWT token storage |
| AppLoggerService | Talker-based logging |

### Dependency Injection

- **get_it** as service locator + **injectable** for auto-registration
- Configured in `lib/app/di.dart` → auto-generated `di.config.dart`
- `@injectable` for transient, `@lazySingleton` for singletons

### Key Dependencies

| Category | Packages |
|----------|----------|
| State | flutter_bloc, equatable |
| DI | get_it, injectable |
| Navigation | go_router |
| Network | dio, connectivity_plus |
| Storage | hive_flutter, flutter_secure_storage |
| UI | cached_network_image, shimmer, photo_view |
| Media | video_player, chewie, image_picker |
| Firebase | firebase_core, firebase_messaging, firebase_analytics |
| i18n | easy_localization |
| Functional | dartz (Either for error handling) |
| Charts | fl_chart |
| Maps | google_maps_flutter, geolocator |

### Localization

- **Hebrew first:** `he.json` (672 strings)
- **English fallback:** `en.json` (663 strings)
- Uses **easy_localization** with `.tr()` extension
- RTL enforced via `TextDirection.rtl` and `EdgeInsetsDirectional`

---

## 3. Backend API (NestJS)

**Path:** `backend/src/`

### All 35 Modules

| Module | Controller | Purpose |
|--------|-----------|---------|
| app-auth | AppAuthController | Phone OTP, JWT tokens |
| app-users | AppUsersController | User profiles, voting eligibility |
| articles | ArticlesController | CRUD articles, soft-delete, hero images |
| article-analytics | ArticleAnalyticsController | View counts, engagement metrics |
| authors | AuthorsController | Author profiles |
| categories | CategoriesController | News categories |
| members | MembersController | Knesset member profiles |
| users | UsersController | Admin/legacy user system |
| comments | CommentsController | Article & story comments |
| contact | ContactController | Contact form submissions |
| favorites | FavoritesController | User favorites (simple) |
| bookmark-folders | BookmarkFoldersController | Organized bookmark folders |
| history | HistoryController | Reading history tracking |
| media | MediaController | S3 presigned URLs, file uploads |
| push | PushController | FCM push tokens, device registration |
| sse | SseController | Server-sent events for ticker |
| search | SearchController | Full-text article search |
| tags | TagsController | Article tags |
| stories | StoriesController | Stories CRUD |
| ticker | TickerController | Breaking news ticker items |
| user-follows | UserFollowsController | User follow relationships |
| elections | ElectionsController | Primary election definitions |
| candidates | CandidatesController | Candidate profiles |
| campaign-events | CampaignEventsController | Campaign events + RSVP |
| community-polls | CommunityPollsController | User voting polls |
| quiz | QuizController | Candidate personality quiz |
| endorsements | EndorsementsController | Candidate endorsements |
| election-results | ElectionResultsController | Live results, turnout |
| polling-stations | PollingStationsController | Station locations, reports |
| gamification | GamificationController | Points, badges, streaks, daily quiz |
| feed | FeedController | Unified mixed-content feed |
| notifications | NotificationsController | Templates, schedules, receipts, logs |
| health | HealthController | Liveness/readiness probes |

**Totals:** 35 modules, 40 services, 45 entities

### All 45 Entities

```
app-auth:        email-verification, otp-code, refresh-token
app-users:       app-user, voting-eligibility
articles:        article
article-analytics: article-analytics
authors:         author
bookmark-folders: bookmark-folder
campaign-events: campaign-event, event-rsvp
candidates:      candidate
categories:      category
comments:        comment
community-polls: community-poll, poll-vote
contact:         contact-message
election-results: election-result, turnout-snapshot
elections:       primary-election
endorsements:    candidate-endorsement
favorites:       user-favorite
gamification:    daily-quiz, daily-quiz-attempt, user-badge, user-points, user-streak
history:         reading-history
media:           media
members:         member
notifications:   notification-log, notification-receipt, notification-schedule, notification-template
polling-stations: polling-station, station-report
push:            push-token
quiz:            quiz-question, quiz-response
stories:         story
tags:            tag
ticker:          ticker-item
user-follows:    user-follow
users:           user
```

### Guards & Security

| Guard | Purpose |
|-------|---------|
| AppAuthGuard | JWT auth for mobile app users |
| AppRolesGuard | Role-based access (mobile) |
| OptionalAppAuthGuard | Allow anonymous with device ID |
| JwtAuthGuard | JWT auth for admin panel |
| RolesGuard | Admin panel role authorization |

### API Conventions

- All endpoints prefixed with `/api/v1/`
- Public endpoints: no auth required (feed, articles, search)
- Mobile endpoints: `@UseGuards(AppAuthGuard)`
- Admin endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Pagination: cursor-based for feeds, offset-based for admin
- Response format: `{ data, meta, error }`
- Soft-delete: articles use `@DeleteDateColumn`

### Database

| Component | Details |
|-----------|---------|
| Engine | PostgreSQL 16 |
| Port | 5432 |
| Database | likud_news |
| Credentials | likud:likud_dev |
| ORM | TypeORM (camelCase columns) |
| Migrations | 18 files |
| Cache | Redis 7 (port 6379) |

### Real-time Features

| Feature | Technology |
|---------|-----------|
| Breaking news ticker | SSE (Server-Sent Events) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Feed updates | SSE with auto-reconnect |

### Key Dependencies

| Category | Packages |
|----------|----------|
| Framework | @nestjs/core, @nestjs/platform-express |
| Auth | @nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt |
| Database | @nestjs/typeorm, typeorm, pg |
| Cache | @nestjs/cache-manager, redis |
| Cloud | @aws-sdk/client-s3, firebase-admin |
| Validation | class-validator, class-transformer |
| Docs | @nestjs/swagger |

---

## 4. Admin Panel (Next.js)

**Path:** `admin/src/`

### Stack

- Next.js 15 with App Router
- shadcn/ui component library
- TipTap rich text editor (Hebrew RTL)
- TanStack Query for data fetching
- React Hook Form + Zod for validation
- Zustand for local state

### All Pages (48 Pages)

#### Dashboard
- `/dashboard` — Main dashboard

#### Content Management
| Page | Purpose |
|------|---------|
| `/articles` | Article list |
| `/articles/new` | Create article |
| `/articles/[id]/edit` | Edit article |
| `/articles/analytics` | Analytics overview |
| `/articles/[id]/analytics` | Single article analytics |
| `/authors` | Author management |
| `/categories` | Category management |
| `/tags` | Tag management |
| `/stories` | Stories management |
| `/videos` | Video list |
| `/videos/new` | Create video |
| `/videos/[id]/edit` | Edit video |
| `/media` | Media library |

#### User Management
| Page | Purpose |
|------|---------|
| `/users` | Admin users |
| `/app-users` | Mobile app users |
| `/app-users/[id]` | User detail |
| `/members` | Knesset members |
| `/members/new` | Add member |
| `/members/[id]/edit` | Edit member |

#### Engagement
| Page | Purpose |
|------|---------|
| `/comments` | Comment moderation |
| `/notifications` | Notification management |
| `/notifications/send` | Send notification |
| `/notifications/history` | History |
| `/notifications/templates` | Templates |
| `/notifications/schedules` | Scheduled sends |
| `/contact` | Contact submissions |
| `/push` | Push testing |
| `/daily-quiz` | Quiz management |
| `/ticker` | Ticker items |

#### Primaries (Elections)
| Page | Purpose |
|------|---------|
| `/primaries` | Hub page |
| `/primaries/elections` | Election management |
| `/primaries/candidates` | Candidate management |
| `/primaries/events` | Campaign events |
| `/primaries/polls` | Community polls |
| `/primaries/quiz` | Candidate quiz |
| `/primaries/endorsements` | Endorsements |
| `/primaries/stations` | Polling stations |
| `/primaries/results` | Election results |
| `/primaries/turnout` | Turnout dashboard |
| `/primaries/analytics` | Primaries analytics |
| `/primaries/gamification` | Gamification |

### API Client (`lib/api.ts`)

- Base URL: `http://localhost:9090/api/v1` (configurable via env)
- JWT from localStorage, auto-redirect on 401
- Typed CRUD helpers for all resources

### Key Dependencies

| Category | Packages |
|----------|----------|
| Framework | next, react, react-dom |
| Data | @tanstack/react-query |
| Forms | react-hook-form, zod |
| UI | shadcn/ui, lucide-react |
| Editor | @tiptap/* |
| Drag & Drop | @dnd-kit/* |
| Charts | recharts |
| State | zustand |
| Testing | vitest, @testing-library/react, msw |

---

## 5. Infrastructure & Deployment

### Docker Compose (Development)

**Path:** `infra/docker-compose.yml`

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 | 5432 | Primary database |
| Redis 7 | 6379 | Caching layer |
| Adminer | 8080 | Database management UI |

### CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `flutter_ci.yml` | Push/PR | Flutter analyze + tests |
| `backend_ci.yml` | Push/PR | NestJS lint + unit + e2e tests |
| `admin_ci.yml` | Push/PR | Next.js lint + tests |
| `deploy.yml` | Push to main | Production deployment |

### Nginx

- Reverse proxy for multi-app routing
- SSL/TLS termination
- Rate limiting

---

## 6. Key Technical Decisions

### Error Handling

| Layer | Approach |
|-------|----------|
| Mobile | `Either<Failure, T>` from dartz (functional) |
| Backend | Exception filters, standard error format |
| Admin | try/catch + toast notifications |

### Authentication Flow

1. User enters phone number → backend sends OTP
2. User verifies OTP → backend issues JWT + refresh token
3. Anonymous users get device-ID-based access (read-only)
4. Interactive actions (vote, RSVP, quiz) require auth → sign-in dialog

### Data Storage

| Layer | Technology |
|-------|-----------|
| Local cache | Hive (Flutter) |
| Secure storage | flutter_secure_storage (JWT tokens) |
| Server DB | PostgreSQL 16 + TypeORM |
| API cache | Redis 7 |
| Media | AWS S3 + CloudFront CDN (presigned uploads) |

---

## 7. Build & Deployment Status

### Completed (Phases 1–3)

- Scaffolding: monorepo structure, Melos for Dart
- Core architecture: BLoC + Clean Architecture, NestJS modular
- 32 mobile features, 35 backend modules, 48 admin pages
- Database schema: 45 entities, 18 migrations
- Localization: 672 Hebrew + 663 English strings
- Dark mode: full theme-aware migration
- Auth guards on all user actions

### In Progress (Phases 4–7)

- Admin panel enhancements
- Media pipeline optimizations
- Push notification refinements
- Comprehensive test suite
- Production deployment automation

### Key Commands

```bash
# Development
make run-mobile                                    # Flutter app
make run-backend                                   # NestJS server (port 6000)
make run-admin                                     # Next.js admin (port 6001)
docker-compose -f infra/docker-compose.yml up -d   # Start DB + Redis

# Testing
cd apps/mobile && flutter test                     # Flutter tests
cd backend && npm test                             # Backend unit tests
cd backend && npm run test:e2e                     # Backend e2e tests
cd admin && npm test                               # Admin tests

# Building
cd apps/mobile && flutter build ios                # iOS build
cd apps/mobile && flutter build apk                # Android build
cd backend && npm run build                        # NestJS build
cd admin && npm run build                          # Next.js build
```

---

## 8. Summary Statistics

| Metric | Count |
|--------|-------|
| Mobile Features | 32 |
| Mobile BLoCs | 30 |
| Mobile Entities | 48 |
| Mobile Routes | 45+ |
| Backend Modules | 35 |
| Backend Services | 40 |
| Backend Entities | 45 |
| Admin Pages | 48 |
| Admin Components | 35+ |
| Database Migrations | 18 |
| Hebrew Strings | 672 |
| English Strings | 663 |
| CI/CD Workflows | 4 |
| Current Version | 1.0.0+9 |
