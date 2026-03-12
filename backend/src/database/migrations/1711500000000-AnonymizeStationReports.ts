import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnonymizeStationReports1711500000000 implements MigrationInterface {
  name = 'AnonymizeStationReports1711500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop FK and old userId column, replace with one-way hash
    await queryRunner.query(
      `ALTER TABLE "station_reports" DROP CONSTRAINT IF EXISTS "FK_station_reports_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_reports" ADD COLUMN "userIdHash" varchar(64)`,
    );
    // Backfill: SHA-256 hash of existing userId values
    await queryRunner.query(
      `UPDATE "station_reports" SET "userIdHash" = encode(sha256("userId"::text::bytea), 'hex')`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_reports" ALTER COLUMN "userIdHash" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_reports" DROP COLUMN "userId"`,
    );
    // Add soft-delete column
    await queryRunner.query(
      `ALTER TABLE "station_reports" ADD COLUMN "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_station_reports_userIdHash" ON "station_reports" ("userIdHash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_station_reports_userIdHash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_reports" DROP COLUMN IF EXISTS "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_reports" ADD COLUMN "userId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "station_reports" DROP COLUMN IF EXISTS "userIdHash"`,
    );
  }
}
