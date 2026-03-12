import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdStatusEnhancements1711350000000 implements MigrationInterface {
  name = 'AdStatusEnhancements1711350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status and related timestamp columns
    await queryRunner.query(`
      ALTER TABLE "candidate_ad_placements"
        ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'pending',
        ADD COLUMN "rejectionReason" text,
        ADD COLUMN "approvedAt" timestamp,
        ADD COLUMN "rejectedAt" timestamp,
        ADD COLUMN "pausedAt" timestamp,
        ADD COLUMN "endedAt" timestamp
    `);

    // Add index on status column
    await queryRunner.query(`
      CREATE INDEX "IDX_ad_placements_status"
        ON "candidate_ad_placements" ("status")
    `);

    // Backfill status from existing boolean flags
    await queryRunner.query(`
      UPDATE candidate_ad_placements SET status = CASE
        WHEN "isApproved" = true AND "isActive" = true THEN 'approved'
        WHEN "isApproved" = true AND "isActive" = false THEN 'paused'
        WHEN "isApproved" = false AND "isActive" = false THEN 'rejected'
        ELSE 'pending'
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ad_placements_status"`,
    );

    await queryRunner.query(`
      ALTER TABLE "candidate_ad_placements"
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "rejectionReason",
        DROP COLUMN IF EXISTS "approvedAt",
        DROP COLUMN IF EXISTS "rejectedAt",
        DROP COLUMN IF EXISTS "pausedAt",
        DROP COLUMN IF EXISTS "endedAt"
    `);
  }
}
