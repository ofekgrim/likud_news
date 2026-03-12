import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationPreferences1710800000000 implements MigrationInterface {
  name = 'NotificationPreferences1710800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add granular notification preference columns with defaults
    await queryRunner.query(`
      ALTER TABLE "app_users"
        ADD COLUMN "notifBreakingNews" boolean NOT NULL DEFAULT true,
        ADD COLUMN "notifPrimariesUpdates" boolean NOT NULL DEFAULT true,
        ADD COLUMN "notifDailyQuizReminder" boolean NOT NULL DEFAULT true,
        ADD COLUMN "notifStreakAchievements" boolean NOT NULL DEFAULT true,
        ADD COLUMN "notifEvents" boolean NOT NULL DEFAULT true,
        ADD COLUMN "notifGotv" boolean NOT NULL DEFAULT true,
        ADD COLUMN "notifAmaSessions" boolean NOT NULL DEFAULT false,
        ADD COLUMN "quietHoursStart" varchar(5),
        ADD COLUMN "quietHoursEnd" varchar(5)
    `);

    // Migrate existing JSONB preferences to typed columns where applicable
    await queryRunner.query(`
      UPDATE "app_users"
      SET
        "notifBreakingNews" = COALESCE(("notificationPrefs" ->> 'breaking_news')::boolean, true),
        "notifEvents" = COALESCE(("notificationPrefs" ->> 'campaign_events')::boolean, true)
      WHERE "notificationPrefs" != '{}'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "app_users"
        DROP COLUMN IF EXISTS "notifBreakingNews",
        DROP COLUMN IF EXISTS "notifPrimariesUpdates",
        DROP COLUMN IF EXISTS "notifDailyQuizReminder",
        DROP COLUMN IF EXISTS "notifStreakAchievements",
        DROP COLUMN IF EXISTS "notifEvents",
        DROP COLUMN IF EXISTS "notifGotv",
        DROP COLUMN IF EXISTS "notifAmaSessions",
        DROP COLUMN IF EXISTS "quietHoursStart",
        DROP COLUMN IF EXISTS "quietHoursEnd"
    `);
  }
}
