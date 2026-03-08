# Database Rules

## PostgreSQL 16:
- Port: 5432
- Dev credentials: `likud:likud_dev@localhost/likud_news`
- Start with: `docker-compose -f infra/docker-compose.yml up -d`

## TypeORM:
- Entities in `backend/src/modules/{module}/entities/`
- Migrations in `backend/src/database/migrations/`
- Seeds in `backend/src/database/seeds/`
- Column naming: camelCase (no naming strategy)
- Use `DeleteDateColumn` for soft deletes

## Indexes:
- GIN indexes for full-text search
- B-tree indexes on frequently queried columns
- Check existing migrations for index patterns

## Redis 7:
- Port: 6379
- Used for caching API responses
- Cache invalidation on writes
