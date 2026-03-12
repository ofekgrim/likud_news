import { MigrationInterface, QueryRunner } from 'typeorm';

export class DonationsTables1711200000000 implements MigrationInterface {
  name = 'DonationsTables1711200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create enums ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "donation_recipient_type_enum" AS ENUM ('candidate', 'party')
    `);

    await queryRunner.query(`
      CREATE TYPE "payment_provider_enum" AS ENUM ('stripe', 'tranzila')
    `);

    await queryRunner.query(`
      CREATE TYPE "donation_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded')
    `);

    // ── Create donations table ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "donations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "donorAppUserId" uuid NOT NULL,
        "recipientType" "donation_recipient_type_enum" NOT NULL,
        "recipientCandidateId" uuid,
        "amountNis" decimal(10,2) NOT NULL,
        "teutatZehutHash" varchar(64) NOT NULL,
        "paymentProvider" "payment_provider_enum" NOT NULL DEFAULT 'stripe',
        "paymentIntentId" varchar(500),
        "status" "donation_status_enum" NOT NULL DEFAULT 'pending',
        "receiptUrl" varchar(2000),
        "comptrollerBatchId" varchar(200),
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_donations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_donations_donorAppUserId" FOREIGN KEY ("donorAppUserId")
          REFERENCES "app_users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_donations_recipientCandidateId" FOREIGN KEY ("recipientCandidateId")
          REFERENCES "candidates"("id") ON DELETE SET NULL
      )
    `);

    // ── Indexes ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX "IDX_donations_donorAppUserId" ON "donations" ("donorAppUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_donations_recipientCandidateId" ON "donations" ("recipientCandidateId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_donations_status" ON "donations" ("status")
    `);

    // Composite index for cap checking queries
    await queryRunner.query(`
      CREATE INDEX "IDX_donations_cap_check" ON "donations" ("donorAppUserId", "recipientType", "recipientCandidateId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_donations_cap_check"`);
    await queryRunner.query(`DROP INDEX "IDX_donations_status"`);
    await queryRunner.query(`DROP INDEX "IDX_donations_recipientCandidateId"`);
    await queryRunner.query(`DROP INDEX "IDX_donations_donorAppUserId"`);
    await queryRunner.query(`DROP TABLE "donations"`);
    await queryRunner.query(`DROP TYPE "donation_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_provider_enum"`);
    await queryRunner.query(`DROP TYPE "donation_recipient_type_enum"`);
  }
}
