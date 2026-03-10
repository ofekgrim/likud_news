#!/bin/bash
# Database backup script — run via cron on the production server
# Example crontab: 0 3 * * * /opt/likud-news/infra/scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="/opt/likud-news/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/likud_news_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

docker compose -f /opt/likud-news/docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${DATABASE_USER:-likud}" "${DATABASE_NAME:-likud_news}" \
  | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Clean up old backups
find "$BACKUP_DIR" -name "likud_news_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"

# Optional: upload to S3
# aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BUCKET}/backups/$(basename "$BACKUP_FILE")"
# echo "[$(date)] Uploaded to S3"
