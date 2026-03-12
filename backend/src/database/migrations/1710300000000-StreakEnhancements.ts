import { MigrationInterface, QueryRunner } from 'typeorm';

export class StreakEnhancements1710300000000 implements MigrationInterface {
  name = 'StreakEnhancements1710300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to user_streaks table
    await queryRunner.query(`
      ALTER TABLE "user_streaks"
      ADD COLUMN "freezeTokens" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "user_streaks"
      ADD COLUMN "freezeTokensUsed" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "user_streaks"
      ADD COLUMN "lastFreezeUsedDate" date
    `);

    await queryRunner.query(`
      ALTER TABLE "user_streaks"
      ADD COLUMN "tier" integer NOT NULL DEFAULT 1
    `);

    // Create milestone_type enum
    await queryRunner.query(`
      CREATE TYPE "milestone_type_enum" AS ENUM ('7d', '14d', '30d', '100d', '365d')
    `);

    // Create streak_milestones table
    await queryRunner.query(`
      CREATE TABLE "streak_milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "milestone" "milestone_type_enum" NOT NULL,
        "bonusPoints" integer NOT NULL,
        "earnedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_streak_milestones" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_streak_milestones_user_milestone" UNIQUE ("userId", "milestone"),
        CONSTRAINT "FK_streak_milestones_userId" FOREIGN KEY ("userId")
          REFERENCES "app_users"("id") ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_streak_milestones_userId" ON "streak_milestones" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_streaks_tier" ON "user_streaks" ("tier")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_streaks_tier"`);
    await queryRunner.query(`DROP INDEX "IDX_streak_milestones_userId"`);
    await queryRunner.query(`DROP TABLE "streak_milestones"`);
    await queryRunner.query(`DROP TYPE "milestone_type_enum"`);
    await queryRunner.query(`ALTER TABLE "user_streaks" DROP COLUMN "tier"`);
    await queryRunner.query(`ALTER TABLE "user_streaks" DROP COLUMN "lastFreezeUsedDate"`);
    await queryRunner.query(`ALTER TABLE "user_streaks" DROP COLUMN "freezeTokensUsed"`);
    await queryRunner.query(`ALTER TABLE "user_streaks" DROP COLUMN "freezeTokens"`);
  }
}
