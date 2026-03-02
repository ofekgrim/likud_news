import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Feed Performance Indexes
 *
 * Creates optimized indexes for the unified feed endpoint to improve query performance.
 *
 * Indexes:
 * 1. Articles: Composite index on (publishedAt DESC, id) for published articles
 * 2. Community Polls: Composite index on (createdAt DESC, id) for active polls
 * 3. Campaign Events: Composite index on (startTime ASC, id) for active events
 * 4. Primary Elections: Index on (createdAt DESC, id)
 * 5. Quiz Questions: Index on (createdAt DESC, id)
 *
 * These indexes support:
 * - Fast sorting by recency (publishedAt/createdAt/startTime)
 * - Efficient filtering by status/active flags
 * - Cursor-based pagination using composite (time, id)
 */
export class FeedPerformanceIndexes1709600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Articles feed index (published only, sorted by publishedAt DESC)
    await queryRunner.query(`
      CREATE INDEX "idx_articles_feed_sorting" ON "articles"
      ("publishedAt" DESC, "id")
      WHERE "status" = 'published'
    `);

    // 2. Community polls feed index (active only, sorted by createdAt DESC)
    await queryRunner.query(`
      CREATE INDEX "idx_community_polls_feed_sorting" ON "community_polls"
      ("createdAt" DESC, "id")
      WHERE "isActive" = true
    `);

    // 3. Campaign events feed index (active only, sorted by startTime ASC for upcoming events)
    await queryRunner.query(`
      CREATE INDEX "idx_campaign_events_feed_sorting" ON "campaign_events"
      ("startTime" ASC, "id")
      WHERE "isActive" = true
    `);

    // 4. Primary elections feed index (sorted by createdAt DESC)
    await queryRunner.query(`
      CREATE INDEX "idx_primary_elections_feed_sorting" ON "primary_elections"
      ("createdAt" DESC, "id")
    `);

    // 5. Quiz questions feed index (active only, sorted by createdAt DESC)
    await queryRunner.query(`
      CREATE INDEX "idx_quiz_questions_feed_sorting" ON "quiz_questions"
      ("createdAt" DESC, "id")
      WHERE "isActive" = true
    `);

    // 6. Comments count optimization (for enrichWithCommentCounts batch query)
    // This index already exists from previous migrations, but ensure it covers the feed use case
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_comments_article_approved_count" ON "comments"
      ("articleId")
      WHERE "isApproved" = true
    `);

    // 7. Article view count index (for engagement sorting)
    await queryRunner.query(`
      CREATE INDEX "idx_articles_engagement" ON "articles"
      ("viewCount" DESC, "shareCount" DESC)
      WHERE "status" = 'published'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_articles_feed_sorting"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_community_polls_feed_sorting"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_campaign_events_feed_sorting"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_primary_elections_feed_sorting"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_quiz_questions_feed_sorting"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_comments_article_approved_count"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_articles_engagement"`,
    );
  }
}
