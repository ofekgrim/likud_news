import { MigrationInterface, QueryRunner } from 'typeorm';

export class GamificationStreaksAndDailyQuiz1710100000000
  implements MigrationInterface
{
  name = 'GamificationStreaksAndDailyQuiz1710100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum values to point_action
    await queryRunner.query(`
      ALTER TYPE "point_action_enum"
      ADD VALUE IF NOT EXISTS 'daily_quiz_complete'
    `);
    await queryRunner.query(`
      ALTER TYPE "point_action_enum"
      ADD VALUE IF NOT EXISTS 'article_read'
    `);
    await queryRunner.query(`
      ALTER TYPE "point_action_enum"
      ADD VALUE IF NOT EXISTS 'daily_login'
    `);
    await queryRunner.query(`
      ALTER TYPE "point_action_enum"
      ADD VALUE IF NOT EXISTS 'streak_bonus'
    `);

    // Add new enum values to badge_type
    await queryRunner.query(`
      ALTER TYPE "badge_type_enum"
      ADD VALUE IF NOT EXISTS 'streak_7'
    `);
    await queryRunner.query(`
      ALTER TYPE "badge_type_enum"
      ADD VALUE IF NOT EXISTS 'streak_30'
    `);
    await queryRunner.query(`
      ALTER TYPE "badge_type_enum"
      ADD VALUE IF NOT EXISTS 'streak_100'
    `);
    await queryRunner.query(`
      ALTER TYPE "badge_type_enum"
      ADD VALUE IF NOT EXISTS 'quiz_master'
    `);
    await queryRunner.query(`
      ALTER TYPE "badge_type_enum"
      ADD VALUE IF NOT EXISTS 'news_junkie'
    `);
    await queryRunner.query(`
      ALTER TYPE "badge_type_enum"
      ADD VALUE IF NOT EXISTS 'community_voice'
    `);

    // Create user_streaks table
    await queryRunner.query(`
      CREATE TABLE "user_streaks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "currentStreak" integer NOT NULL DEFAULT 0,
        "longestStreak" integer NOT NULL DEFAULT 0,
        "lastActivityDate" date,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_streaks" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_streaks_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_user_streaks_userId" FOREIGN KEY ("userId")
          REFERENCES "app_users"("id") ON DELETE CASCADE
      )
    `);

    // Create daily_quizzes table
    await queryRunner.query(`
      CREATE TABLE "daily_quizzes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" date NOT NULL,
        "questions" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "pointsReward" integer NOT NULL DEFAULT 20,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_quizzes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_quizzes_date" UNIQUE ("date")
      )
    `);

    // Create daily_quiz_attempts table
    await queryRunner.query(`
      CREATE TABLE "daily_quiz_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "quizId" uuid NOT NULL,
        "answers" jsonb NOT NULL,
        "score" integer NOT NULL,
        "totalQuestions" integer NOT NULL,
        "pointsAwarded" integer NOT NULL DEFAULT 0,
        "completedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_quiz_attempts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_quiz_attempts_user_quiz" UNIQUE ("userId", "quizId"),
        CONSTRAINT "FK_daily_quiz_attempts_userId" FOREIGN KEY ("userId")
          REFERENCES "app_users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_daily_quiz_attempts_quizId" FOREIGN KEY ("quizId")
          REFERENCES "daily_quizzes"("id") ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_user_streaks_lastActivity" ON "user_streaks" ("lastActivityDate")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_daily_quizzes_date" ON "daily_quizzes" ("date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_daily_quiz_attempts_userId" ON "daily_quiz_attempts" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_points_userId_earnedAt" ON "user_points" ("userId", "earnedAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_points_action" ON "user_points" ("action")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_points_action"`);
    await queryRunner.query(`DROP INDEX "IDX_user_points_userId_earnedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_daily_quiz_attempts_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_daily_quizzes_date"`);
    await queryRunner.query(`DROP INDEX "IDX_user_streaks_lastActivity"`);
    await queryRunner.query(`DROP TABLE "daily_quiz_attempts"`);
    await queryRunner.query(`DROP TABLE "daily_quizzes"`);
    await queryRunner.query(`DROP TABLE "user_streaks"`);
    // Note: PostgreSQL doesn't support removing enum values
  }
}
