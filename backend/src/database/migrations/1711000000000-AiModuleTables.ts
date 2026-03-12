import { MigrationInterface, QueryRunner } from 'typeorm';

export class AiModuleTables1711000000000 implements MigrationInterface {
  name = 'AiModuleTables1711000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enable pgvector extension (optional — requires pgvector installed) ──
    // Use SAVEPOINT so a failure doesn't abort the surrounding transaction.
    let vectorAvailable = false;
    await queryRunner.query(`SAVEPOINT pgvector_sp`);
    try {
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
      await queryRunner.query(`RELEASE SAVEPOINT pgvector_sp`);
      vectorAvailable = true;
    } catch {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT pgvector_sp`);
      console.warn(
        '[Migration] pgvector not available — article_embeddings skipped. ' +
          'Install pgvector to enable AI semantic search.',
      );
    }

    // ── Create feedback enum type ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "chatbot_sessions_feedback_enum" AS ENUM ('positive', 'negative')
    `);

    // ── Create article_ai_summaries table ──────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "article_ai_summaries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "articleId" uuid NOT NULL,
        "summaryHe" text NOT NULL,
        "keyPointsHe" jsonb NOT NULL,
        "politicalAngleHe" text,
        "modelUsed" varchar(100) NOT NULL,
        "tokensUsed" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_article_ai_summaries" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_article_ai_summaries_articleId" UNIQUE ("articleId"),
        CONSTRAINT "FK_article_ai_summaries_articleId" FOREIGN KEY ("articleId")
          REFERENCES "articles"("id") ON DELETE CASCADE
      )
    `);

    // ── Create chatbot_sessions table ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "chatbot_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appUserId" uuid,
        "deviceId" varchar(200),
        "messages" jsonb NOT NULL DEFAULT '[]',
        "feedback" "chatbot_sessions_feedback_enum",
        "messageCount" integer NOT NULL DEFAULT 0,
        "flaggedForReview" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chatbot_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chatbot_sessions_appUserId" FOREIGN KEY ("appUserId")
          REFERENCES "app_users"("id") ON DELETE SET NULL
      )
    `);

    // Indexes on chatbot_sessions
    await queryRunner.query(`
      CREATE INDEX "IDX_chatbot_sessions_appUserId" ON "chatbot_sessions" ("appUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chatbot_sessions_deviceId" ON "chatbot_sessions" ("deviceId")
    `);

    // ── Create article_embeddings table (requires pgvector) ────────────
    if (vectorAvailable) {
      await queryRunner.query(`
        CREATE TABLE "article_embeddings" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "articleId" uuid NOT NULL,
          "chunkIndex" integer NOT NULL,
          "chunkText" text NOT NULL,
          "embedding" vector(768) NOT NULL,
          "model" varchar(100) NOT NULL DEFAULT 'alephbert-768',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_article_embeddings" PRIMARY KEY ("id"),
          CONSTRAINT "FK_article_embeddings_articleId" FOREIGN KEY ("articleId")
            REFERENCES "articles"("id") ON DELETE CASCADE
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_article_embeddings_article_chunk"
          ON "article_embeddings" ("articleId", "chunkIndex")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_article_embeddings_hnsw"
          ON "article_embeddings" USING hnsw (embedding vector_cosine_ops)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop article_embeddings
    await queryRunner.query(`DROP INDEX "IDX_article_embeddings_hnsw"`);
    await queryRunner.query(`DROP INDEX "IDX_article_embeddings_article_chunk"`);
    await queryRunner.query(`DROP TABLE "article_embeddings"`);

    // Drop chatbot_sessions
    await queryRunner.query(`DROP INDEX "IDX_chatbot_sessions_deviceId"`);
    await queryRunner.query(`DROP INDEX "IDX_chatbot_sessions_appUserId"`);
    await queryRunner.query(`DROP TABLE "chatbot_sessions"`);

    // Drop article_ai_summaries
    await queryRunner.query(`DROP TABLE "article_ai_summaries"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "chatbot_sessions_feedback_enum"`);

    // Note: we don't drop the vector extension as other tables may use it
  }
}
