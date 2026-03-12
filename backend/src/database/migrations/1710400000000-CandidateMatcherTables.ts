import { MigrationInterface, QueryRunner } from 'typeorm';

export class CandidateMatcherTables1710400000000
  implements MigrationInterface
{
  name = 'CandidateMatcherTables1710400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "policy_category_enum" AS ENUM (
        'security', 'economy', 'judiciary', 'housing', 'social', 'foreign'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "position_value_enum" AS ENUM (
        'agree', 'neutral', 'disagree'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "quiz_answer_enum" AS ENUM (
        'agree', 'disagree', 'skip'
      )
    `);

    // ─── policy_statements ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "policy_statements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "textHe" text NOT NULL,
        "textEn" text,
        "category" "policy_category_enum" NOT NULL,
        "defaultWeight" float NOT NULL DEFAULT 1.0,
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "electionId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_policy_statements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_policy_statements_electionId" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_policy_statements_electionId" ON "policy_statements" ("electionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_policy_statements_category" ON "policy_statements" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_policy_statements_active_sort" ON "policy_statements" ("electionId", "isActive", "sortOrder")
    `);

    // ─── candidate_positions ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "candidate_positions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "candidateId" uuid NOT NULL,
        "statementId" uuid NOT NULL,
        "position" "position_value_enum" NOT NULL,
        "justificationHe" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_positions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_candidate_positions_candidate_statement" UNIQUE ("candidateId", "statementId"),
        CONSTRAINT "FK_candidate_positions_candidateId" FOREIGN KEY ("candidateId")
          REFERENCES "candidates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_candidate_positions_statementId" FOREIGN KEY ("statementId")
          REFERENCES "policy_statements"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_candidate_positions_candidateId" ON "candidate_positions" ("candidateId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_candidate_positions_statementId" ON "candidate_positions" ("statementId")
    `);

    // ─── member_quiz_responses ────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "member_quiz_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appUserId" uuid,
        "deviceId" varchar(200),
        "statementId" uuid NOT NULL,
        "electionId" uuid NOT NULL,
        "answer" "quiz_answer_enum" NOT NULL,
        "importanceWeight" float NOT NULL DEFAULT 1.0,
        "answeredAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_member_quiz_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_member_quiz_responses_statementId" FOREIGN KEY ("statementId")
          REFERENCES "policy_statements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_member_quiz_responses_electionId" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections"("id") ON DELETE CASCADE
      )
    `);

    // Functional unique constraint: COALESCE(appUserId, deviceId) + statementId + electionId
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_member_quiz_responses_user_statement_election"
      ON "member_quiz_responses" (COALESCE("appUserId"::text, "deviceId"), "statementId", "electionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_member_quiz_responses_appUserId" ON "member_quiz_responses" ("appUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_member_quiz_responses_deviceId" ON "member_quiz_responses" ("deviceId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_member_quiz_responses_electionId" ON "member_quiz_responses" ("electionId")
    `);

    // ─── quiz_match_results ───────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "quiz_match_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appUserId" uuid,
        "deviceId" varchar(200),
        "candidateId" uuid NOT NULL,
        "electionId" uuid NOT NULL,
        "matchPct" float NOT NULL,
        "categoryBreakdown" jsonb NOT NULL DEFAULT '{}',
        "computedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_match_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_match_results_candidateId" FOREIGN KEY ("candidateId")
          REFERENCES "candidates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_match_results_electionId" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quiz_match_results_appUserId" ON "quiz_match_results" ("appUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quiz_match_results_deviceId" ON "quiz_match_results" ("deviceId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quiz_match_results_electionId" ON "quiz_match_results" ("electionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quiz_match_results_candidateId" ON "quiz_match_results" ("candidateId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quiz_match_results_matchPct" ON "quiz_match_results" ("electionId", "matchPct" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting FK dependencies)
    await queryRunner.query(`DROP TABLE "quiz_match_results"`);
    await queryRunner.query(`DROP TABLE "member_quiz_responses"`);
    await queryRunner.query(`DROP TABLE "candidate_positions"`);
    await queryRunner.query(`DROP TABLE "policy_statements"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "quiz_answer_enum"`);
    await queryRunner.query(`DROP TYPE "position_value_enum"`);
    await queryRunner.query(`DROP TYPE "policy_category_enum"`);
  }
}
