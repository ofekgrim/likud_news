# Metzudat HaLikud - Project Guide

## Project Overview

**Metzudat HaLikud** (Hebrew: מצודת הליכוד) is a production-grade Hebrew RTL news application for the Likud party. It mirrors the Israel Hayom (ForReal) app UX with Likud branding (light blue #0099DB + white, Heebo font, floating logo).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Flutter 3.x + BLoC + Clean Architecture |
| State Management | flutter_bloc + freezed + get_it + injectable |
| Navigation | go_router (StatefulShellRoute for bottom tabs) |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 16 (TypeORM) |
| Cache | Redis 7 |
| Real-time | SSE (ticker/breaking) + FCM (push notifications) |
| Admin Panel | Next.js 15 + shadcn/ui + TipTap editor |
| Media Storage | AWS S3 + CloudFront CDN |
| CI/CD | GitHub Actions + Docker |

## Monorepo Structure

```
likud_news/
├── apps/mobile/          # Flutter app (main client)
├── packages/
│   ├── likud_api_client/ # Generated API client
│   ├── likud_ui_kit/     # Design system components
│   └── likud_shared/     # Shared constants, enums
├── backend/              # NestJS API server
├── admin/                # Next.js admin panel
├── infra/                # Docker, nginx, terraform
├── .github/workflows/    # CI/CD
└── melos.yaml            # Dart workspace manager
```

## Architecture Conventions

### Flutter (apps/mobile)

**Clean Architecture — every feature follows this structure:**
```
features/{feature_name}/
├── data/
│   ├── datasources/     # Remote (API) + Local (Hive cache)
│   ├── models/          # @JsonSerializable DTOs with toEntity()
│   └── repositories/    # Repository implementations
├── domain/
│   ├── entities/        # @freezed immutable business objects
│   ├── repositories/    # Abstract contracts (interfaces)
│   └── usecases/        # Single-purpose use cases returning Either<Failure, T>
└── presentation/
    ├── bloc/            # BLoC + Events + States (@freezed)
    ├── pages/           # Screen-level widgets
    └── widgets/         # Feature-specific widgets
```

**BLoC Pattern:**
- Events: `@freezed` union types (e.g., `LoadHome`, `RefreshFeed`, `LoadMore`)
- States: `@freezed` union types (e.g., `initial`, `loading`, `loaded`, `error`)
- Use `Either<Failure, T>` from dartz for error handling
- One BLoC per feature, provided at the page level
- No BLoC-to-BLoC direct communication — use streams or shared use cases

**Dependency Injection:**
- `get_it` as service locator, `injectable` for auto-registration
- Annotate: `@injectable` for transient, `@lazySingleton` for singletons
- All DI configured in `app/di.dart` → auto-generated `di.config.dart`

**Naming Conventions:**
- Files: `snake_case.dart`
- Classes: `PascalCase`
- BLoC files: `{feature}_bloc.dart`, `{feature}_event.dart`, `{feature}_state.dart`
- Models: `{entity}_model.dart` (data layer)
- Entities: `{entity}.dart` (domain layer)
- Use cases: `get_{noun}.dart`, `toggle_{noun}.dart`, `record_{noun}.dart`

### NestJS (backend)

**Module Structure:**
```
modules/{module_name}/
├── {module}.module.ts
├── {module}.controller.ts
├── {module}.service.ts
├── entities/
│   └── {entity}.entity.ts    # TypeORM entity with decorators
└── dto/
    ├── create-{entity}.dto.ts
    └── update-{entity}.dto.ts
```

**Conventions:**
- All endpoints prefixed with `/api/v1/`
- Public endpoints: no auth required
- Admin endpoints: JWT auth guard + roles guard
- Pagination: cursor-based for feeds, offset-based for admin tables
- Responses wrapped in standard format: `{ data, meta, error }`
- Soft-delete on articles (DeleteDateColumn)

### Next.js Admin (admin)

**App Router structure:**
- `(authenticated)/` route group with JWT auth guard
- shadcn/ui components in `components/ui/`
- TipTap rich text editor for article content (Hebrew RTL)
- TanStack Query for data fetching, React Hook Form + Zod for forms

## Branding

| Property | Value |
|----------|-------|
| Primary Color | `#0099DB` (Likud bright blue) |
| Dark Variant | `#1E3A8A` |
| Breaking News | `#DC2626` (red) |
| Background | `#FFFFFF` (white) |
| Surface | `#F8FAFC` |
| Text Primary | `#1E293B` |
| Text Secondary | `#64748B` |
| Font Family | Heebo (Google Fonts, Hebrew-optimized) |
| App Name | מצודת הליכוד |

## Key Commands

```bash
# Development
make setup              # Install all dependencies
make run-mobile         # Run Flutter app
make run-backend        # Run NestJS server
make run-admin          # Run Next.js admin
docker-compose -f infra/docker-compose.yml up -d  # Start Postgres + Redis

# Testing
make test-all           # Run all tests across stack
make test-flutter       # Flutter tests only
make test-backend       # Backend tests only

# Code Generation
cd apps/mobile && dart run build_runner build --delete-conflicting-outputs

# Building
make build-android      # Build Android APK/AAB
make build-ios          # Build iOS IPA
```

## API Base URL

- Development: `http://localhost:6000/api/v1`
- Staging: TBD
- Production: TBD

## Database

- PostgreSQL 16 on port 5432
- Dev credentials: `likud:likud_dev@localhost/likud_news`
- Migrations: `backend/src/database/migrations/`
- Seeds: `backend/src/database/seeds/`

## Important Rules

1. **RTL-first**: Always use `EdgeInsetsDirectional` (start/end, not left/right), `TextDirection.rtl` as default
2. **Hebrew primary**: All user-facing strings go in `l10n/he.json` first, then `en.json`
3. **No direct API calls from UI**: Always go through UseCase → Repository → DataSource
4. **Immutable states**: Use `@freezed` for all entities and BLoC states
5. **Error handling**: Use `Either<Failure, T>`, never throw from repositories
6. **Anonymous users**: Device-ID based favorites/history, no user login required
7. **Cache everything**: Redis on backend, Hive on mobile for offline support
8. **SSE for real-time**: Breaking ticker and news updates via Server-Sent Events
9. **Presigned uploads**: Media goes directly to S3 via presigned URLs, not through the backend

## Screens (14 total)

1. Home (ראשי) — hero, ticker, stories, feed
2. Article Detail — full content, hashtags → members, share, bookmark
3. Categories — grid with filtered feeds
4. Search — debounced full-text search
5. Member Profiles — Likud member directory
6. Breaking News (מבזקים) — real-time desk + audio player
7. Video — TikTok-style vertical + grid
8. Magazine — long-form content
9. Contact — form submission
10. About — static
11. Accessibility Statement — static
12. Privacy Policy — static
13. Settings & Language — Hebrew/English toggle, theme, font size
14. Favorites & Recently Read — offline-first, device-ID based

## Current Build Status

### Phase 1: Scaffolding - COMPLETE
- Git repo, Flutter app, NestJS backend, Next.js admin, Docker Compose, CI/CD, Melos

### Phase 2: Core Architecture - COMPLETE
- Flutter: DI, theme, RTL, router, network layer, SSE client, error handling
- Flutter features: Home (19 files), Article Detail (15 files), Breaking News (9 files)
- NestJS: All 13 modules wired in AppModule (Articles, Categories, Members, Ticker, Auth, Users, Media, Contact, Favorites, History, Push, SSE, Search)

### Phase 3: Feature Development - IN PROGRESS
- Flutter: Categories, Search, Members, Video, Magazine, Favorites/History, Settings, Contact, About/Legal, More menu
- Backend: Database migrations, seeds, indexes

### Phase 4-7: Remaining
- Admin panel (Next.js), media pipeline, push notifications, testing, deployment

## GitHub Repository

- Remote: https://github.com/ofekgrim/likud_news
- Branch: main

## Plan Reference

Full implementation plan: `.claude/plans/misty-humming-parasol.md`
