import { MigrationInterface, QueryRunner } from 'typeorm';

export class DailyMissions1710600000000 implements MigrationInterface {
  name = 'DailyMissions1710600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create mission_type enum
    await queryRunner.query(`
      CREATE TYPE "mission_type_enum" AS ENUM (
        'read_article',
        'complete_quiz',
        'vote_poll',
        'share_content',
        'check_membership',
        'rsvp_event',
        'view_candidate',
        'use_matcher'
      )
    `);

    // Create mission_frequency enum
    await queryRunner.query(`
      CREATE TYPE "mission_frequency_enum" AS ENUM (
        'daily',
        'weekly',
        'once_per_cycle'
      )
    `);

    // Add new point action enum values
    await queryRunner.query(`
      ALTER TYPE "point_action_enum"
      ADD VALUE IF NOT EXISTS 'daily_mission_complete'
    `);
    await queryRunner.query(`
      ALTER TYPE "point_action_enum"
      ADD VALUE IF NOT EXISTS 'daily_mission_bonus'
    `);

    // Create daily_missions table
    await queryRunner.query(`
      CREATE TABLE "daily_missions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "mission_type_enum" NOT NULL,
        "descriptionHe" varchar(500) NOT NULL,
        "descriptionEn" varchar(500) NOT NULL,
        "points" integer NOT NULL,
        "iconName" varchar(100),
        "isActive" boolean NOT NULL DEFAULT true,
        "frequency" "mission_frequency_enum" NOT NULL DEFAULT 'daily',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_missions" PRIMARY KEY ("id")
      )
    `);

    // Create user_daily_missions table
    await queryRunner.query(`
      CREATE TABLE "user_daily_missions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appUserId" uuid NOT NULL,
        "missionId" uuid NOT NULL,
        "date" date NOT NULL,
        "isCompleted" boolean NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_daily_missions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_daily_missions_user_mission_date" UNIQUE ("appUserId", "missionId", "date"),
        CONSTRAINT "FK_user_daily_missions_appUserId" FOREIGN KEY ("appUserId")
          REFERENCES "app_users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_daily_missions_missionId" FOREIGN KEY ("missionId")
          REFERENCES "daily_missions"("id") ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_daily_missions_type" ON "daily_missions" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_daily_missions_isActive" ON "daily_missions" ("isActive")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_daily_missions_appUserId_date" ON "user_daily_missions" ("appUserId", "date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_daily_missions_missionId" ON "user_daily_missions" ("missionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_daily_missions_date" ON "user_daily_missions" ("date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_daily_missions_date"`);
    await queryRunner.query(`DROP INDEX "IDX_user_daily_missions_missionId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_daily_missions_appUserId_date"`);
    await queryRunner.query(`DROP INDEX "IDX_daily_missions_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_daily_missions_type"`);
    await queryRunner.query(`DROP TABLE "user_daily_missions"`);
    await queryRunner.query(`DROP TABLE "daily_missions"`);
    await queryRunner.query(`DROP TYPE "mission_frequency_enum"`);
    await queryRunner.query(`DROP TYPE "mission_type_enum"`);
    // Note: PostgreSQL doesn't support removing enum values from point_action_enum
  }
}
