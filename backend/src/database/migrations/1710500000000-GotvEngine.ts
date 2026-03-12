import { MigrationInterface, QueryRunner } from 'typeorm';

export class GotvEngine1710500000000 implements MigrationInterface {
  name = 'GotvEngine1710500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create gotv_engagement table
    await queryRunner.query(`
      CREATE TABLE "gotv_engagement" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appUserId" uuid NOT NULL,
        "electionId" uuid NOT NULL,
        "votingPlanTime" TIMESTAMP,
        "plannedStationId" uuid,
        "stationCheckinAt" TIMESTAMP,
        "votedBadgeClaimedAt" TIMESTAMP,
        "notificationsSent" integer NOT NULL DEFAULT 0,
        "remindersSnoozed" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gotv_engagement" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_gotv_engagement_user_election" UNIQUE ("appUserId", "electionId"),
        CONSTRAINT "FK_gotv_engagement_appUserId" FOREIGN KEY ("appUserId")
          REFERENCES "app_users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_gotv_engagement_electionId" FOREIGN KEY ("electionId")
          REFERENCES "primary_elections"("id") ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_gotv_engagement_appUserId" ON "gotv_engagement" ("appUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_gotv_engagement_electionId" ON "gotv_engagement" ("electionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_gotv_engagement_stationCheckinAt" ON "gotv_engagement" ("stationCheckinAt")
    `);

    // Add I_VOTED to badge_type enum
    await queryRunner.query(`
      ALTER TYPE "badge_type_enum" ADD VALUE IF NOT EXISTS 'i_voted'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_gotv_engagement_stationCheckinAt"`);
    await queryRunner.query(`DROP INDEX "IDX_gotv_engagement_electionId"`);
    await queryRunner.query(`DROP INDEX "IDX_gotv_engagement_appUserId"`);
    await queryRunner.query(`DROP TABLE "gotv_engagement"`);
    // Note: PostgreSQL does not support removing values from enums.
    // The 'i_voted' value will remain in badge_type_enum on rollback.
  }
}
