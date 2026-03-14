import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReferralSystem1711600000000 implements MigrationInterface {
  name = 'ReferralSystem1711600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add referral code column to app_users
    await queryRunner.query(`
      ALTER TABLE "app_users"
      ADD COLUMN IF NOT EXISTS "referralCode" VARCHAR(8) UNIQUE
    `);

    // Create user_referrals table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_referrals" (
        "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
        "referrerId" UUID NOT NULL,
        "refereeId"  UUID NOT NULL UNIQUE,
        "code"       VARCHAR(8) NOT NULL,
        "claimedAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_referrals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_referrals_referrer" FOREIGN KEY ("referrerId")
          REFERENCES "app_users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_referrals_referee" FOREIGN KEY ("refereeId")
          REFERENCES "app_users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_referrals_referrer" ON "user_referrals" ("referrerId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_referrals"`);
    await queryRunner.query(`ALTER TABLE "app_users" DROP COLUMN IF EXISTS "referralCode"`);
  }
}
