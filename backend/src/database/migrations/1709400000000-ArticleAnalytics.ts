import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArticleAnalytics1709400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum Types ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "article_analytics_event_type_enum" AS ENUM ('view', 'click', 'read_complete', 'share', 'favorite', 'comment')
    `);

    // ── article_analytics ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "article_analytics" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "articleId"              uuid NOT NULL,
        "deviceId"               varchar(255),
        "userId"                 uuid,
        "eventType"              "article_analytics_event_type_enum" NOT NULL,
        "platform"               varchar(50),
        "referrer"               varchar(100),
        "readTimeSeconds"        int,
        "scrollDepthPercent"     int,
        "metadata"               jsonb NOT NULL DEFAULT '{}',
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_article_analytics" PRIMARY KEY ("id"),
        CONSTRAINT "FK_article_analytics_article" FOREIGN KEY ("articleId")
          REFERENCES "articles" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_article_analytics_article_event" ON "article_analytics" ("articleId", "eventType")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_article_analytics_article_created" ON "article_analytics" ("articleId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_article_analytics_event_created" ON "article_analytics" ("eventType", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Drop table ──────────────────────────────────────────────────────
    await queryRunner.query(`DROP TABLE IF EXISTS "article_analytics"`);

    // ── Drop enum ───────────────────────────────────────────────────────
    await queryRunner.query(`DROP TYPE IF EXISTS "article_analytics_event_type_enum"`);
  }
}
