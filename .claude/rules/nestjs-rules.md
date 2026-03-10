# NestJS Rules (backend)

## Module Structure:
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

## API Conventions:
- All endpoints prefixed with `/api/v1/`
- Public endpoints: no auth required
- Admin endpoints: JWT auth guard + roles guard
- Pagination: cursor-based for feeds, offset-based for admin tables
- Responses wrapped in standard format: `{ data, meta, error }`
- Soft-delete on articles (DeleteDateColumn)

## Database:
- PostgreSQL 16 on port 5432
- TypeORM with camelCase columns (no naming strategy configured)
- Migrations: `backend/src/database/migrations/`
- Seeds: `backend/src/database/seeds/`
- Dev credentials: `likud:likud_dev@localhost/likud_news`

## Common Pitfalls:
- Static routes MUST come before dynamic `:param` routes in controllers
- TypeORM columns are camelCase by default
- Redis 7 for caching on port 6379

## Real-time:
- SSE for ticker/breaking news (unidirectional, auto-reconnect)
- FCM for push notifications

## Media:
- Presigned uploads: media goes directly to S3 via presigned URLs, NOT through the backend
- AWS S3 + CloudFront CDN
