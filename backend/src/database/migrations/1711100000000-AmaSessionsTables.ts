import { MigrationInterface, QueryRunner } from 'typeorm';

export class AmaSessionsTables1711100000000 implements MigrationInterface {
  name = 'AmaSessionsTables1711100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create enums ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "ama_session_status_enum" AS ENUM ('draft', 'scheduled', 'live', 'ended', 'archived')
    `);

    await queryRunner.query(`
      CREATE TYPE "ama_question_status_enum" AS ENUM ('pending', 'approved', 'answered', 'rejected')
    `);

    // ── Create ama_sessions table ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ama_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "candidateId" uuid NOT NULL,
        "title" varchar(300) NOT NULL,
        "description" text,
        "scheduledAt" TIMESTAMP NOT NULL,
        "startedAt" TIMESTAMP,
        "endedAt" TIMESTAMP,
        "status" "ama_session_status_enum" NOT NULL DEFAULT 'draft',
        "moderatorId" uuid,
        "maxQuestions" integer NOT NULL DEFAULT 100,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ama_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ama_sessions_candidateId" FOREIGN KEY ("candidateId")
          REFERENCES "candidates"("id") ON DELETE CASCADE
      )
    `);

    // ── Create ama_questions table ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ama_questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "appUserId" uuid NOT NULL,
        "questionText" text NOT NULL,
        "answerText" text,
        "answeredAt" TIMESTAMP,
        "upvoteCount" integer NOT NULL DEFAULT 0,
        "status" "ama_question_status_enum" NOT NULL DEFAULT 'pending',
        "isModerated" boolean NOT NULL DEFAULT false,
        "moderatedById" uuid,
        "isPinned" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ama_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ama_questions_sessionId" FOREIGN KEY ("sessionId")
          REFERENCES "ama_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ama_questions_appUserId" FOREIGN KEY ("appUserId")
          REFERENCES "app_users"("id") ON DELETE CASCADE
      )
    `);

    // ── Indexes ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX "IDX_ama_questions_sessionId" ON "ama_questions" ("sessionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ama_questions_appUserId" ON "ama_questions" ("appUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ama_questions_session_status" ON "ama_questions" ("sessionId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ama_questions_session_upvotes" ON "ama_questions" ("sessionId", "upvoteCount" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_ama_questions_session_upvotes"`);
    await queryRunner.query(`DROP INDEX "IDX_ama_questions_session_status"`);
    await queryRunner.query(`DROP INDEX "IDX_ama_questions_appUserId"`);
    await queryRunner.query(`DROP INDEX "IDX_ama_questions_sessionId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "ama_questions"`);
    await queryRunner.query(`DROP TABLE "ama_sessions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "ama_question_status_enum"`);
    await queryRunner.query(`DROP TYPE "ama_session_status_enum"`);
  }
}
