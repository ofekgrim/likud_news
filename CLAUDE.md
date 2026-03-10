# Metzudat HaLikud (מצודת הליכוד)

Production-grade Hebrew RTL news app for the Likud party. Mirrors Israel Hayom (ForReal) UX with Likud branding (#0099DB blue, Heebo font).

## Monorepo Layout
- `apps/mobile/` — Flutter app (BLoC + Clean Architecture)
- `backend/` — NestJS API server (TypeORM + PostgreSQL)
- `admin/` — Next.js 15 admin panel (shadcn/ui + TipTap)
- `infra/` — Docker, nginx, terraform

## Context Routing — Read the right rules for your task:
- Working on Flutter code → read `.claude/rules/flutter-rules.md`
- Working on NestJS backend → read `.claude/rules/nestjs-rules.md`
- Working on admin panel → read `.claude/rules/admin-rules.md`
- Writing or running tests → read `.claude/rules/testing-rules.md`
- Database/migrations work → read `.claude/rules/database-rules.md`

## After compaction (ALWAYS do this):
1. Re-read your current task plan
2. Re-read the files relevant to your current task
3. Read the appropriate rules file above for the area you're working on

## Critical rules (always apply):
- RTL-first: `EdgeInsetsDirectional` (start/end, NOT left/right)
- Hebrew primary: all strings in `assets/l10n/he.json` first, then `en.json`
- No direct API calls from UI: UseCase → Repository → DataSource
- Error handling: `Either<Failure, T>` from dartz, never throw from repositories
- Anonymous users: device-ID based, no login for readers
- BLoC pattern: sealed classes + Equatable (NOT @freezed)

## Key Commands
```bash
make run-mobile         # Run Flutter app
make run-backend        # Run NestJS server (port 6000)
make run-admin          # Run Next.js admin
docker-compose -f infra/docker-compose.yml up -d  # Start Postgres + Redis
cd apps/mobile && flutter test                      # Flutter tests
cd backend && npm test                              # Backend tests
```

## Build Status
- Phase 1-3: COMPLETE (scaffolding, core architecture, features, DB, i18n)
- Phase 4-7: TODO (admin panel, media pipeline, push notifications, testing, deploy)
