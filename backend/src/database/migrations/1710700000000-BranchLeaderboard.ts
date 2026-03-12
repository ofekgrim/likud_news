import { MigrationInterface, QueryRunner } from 'typeorm';

export class BranchLeaderboard1710700000000 implements MigrationInterface {
  name = 'BranchLeaderboard1710700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create branches table ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "district" varchar(100) NOT NULL,
        "city" varchar(100),
        "memberCount" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branches" PRIMARY KEY ("id")
      )
    `);

    // Unique index on name
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_branches_name" ON "branches" ("name")
    `);

    // Index on district for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_branches_district" ON "branches" ("district")
    `);

    // ── Create branch_weekly_scores table ─────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "branch_weekly_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "branchId" uuid NOT NULL,
        "weekStart" date NOT NULL,
        "totalScore" integer NOT NULL DEFAULT 0,
        "perCapitaScore" float NOT NULL DEFAULT 0,
        "activeMemberCount" integer NOT NULL DEFAULT 0,
        "rank" integer,
        "prevRank" integer,
        "scoreBreakdown" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branch_weekly_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_branch_weekly_scores_branch_week" UNIQUE ("branchId", "weekStart"),
        CONSTRAINT "FK_branch_weekly_scores_branchId" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);

    // Index on branchId for lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_branch_weekly_scores_branchId" ON "branch_weekly_scores" ("branchId")
    `);

    // Index on weekStart for time-range queries
    await queryRunner.query(`
      CREATE INDEX "IDX_branch_weekly_scores_weekStart" ON "branch_weekly_scores" ("weekStart")
    `);

    // Composite index for leaderboard queries (weekStart + perCapitaScore DESC)
    await queryRunner.query(`
      CREATE INDEX "IDX_branch_weekly_scores_leaderboard"
        ON "branch_weekly_scores" ("weekStart", "perCapitaScore" DESC)
    `);

    // ── Add branchId column to app_users ──────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "app_users"
        ADD COLUMN "branchId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "app_users"
        ADD CONSTRAINT "FK_app_users_branchId"
          FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_app_users_branchId" ON "app_users" ("branchId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop branchId from app_users
    await queryRunner.query(`DROP INDEX "IDX_app_users_branchId"`);
    await queryRunner.query(`ALTER TABLE "app_users" DROP CONSTRAINT "FK_app_users_branchId"`);
    await queryRunner.query(`ALTER TABLE "app_users" DROP COLUMN "branchId"`);

    // Drop branch_weekly_scores
    await queryRunner.query(`DROP INDEX "IDX_branch_weekly_scores_leaderboard"`);
    await queryRunner.query(`DROP INDEX "IDX_branch_weekly_scores_weekStart"`);
    await queryRunner.query(`DROP INDEX "IDX_branch_weekly_scores_branchId"`);
    await queryRunner.query(`DROP TABLE "branch_weekly_scores"`);

    // Drop branches
    await queryRunner.query(`DROP INDEX "IDX_branches_district"`);
    await queryRunner.query(`DROP INDEX "IDX_branches_name"`);
    await queryRunner.query(`DROP TABLE "branches"`);
  }
}
