import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendOtpCodes1709200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename column phone → identifier to support email targets
    await queryRunner.query(
      `ALTER TABLE "otp_codes" RENAME COLUMN "phone" TO "identifier"`,
    );

    // Widen column to accommodate emails
    await queryRunner.query(
      `ALTER TABLE "otp_codes" ALTER COLUMN "identifier" TYPE varchar(300)`,
    );

    // Add new enum values for phone/email change purposes
    await queryRunner.query(
      `ALTER TYPE "otp_purpose_enum" ADD VALUE IF NOT EXISTS 'phone_change'`,
    );
    await queryRunner.query(
      `ALTER TYPE "otp_purpose_enum" ADD VALUE IF NOT EXISTS 'email_change'`,
    );

    // Drop old index and create new one with renamed column
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_otp_codes_phone"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_otp_codes_identifier" ON "otp_codes" ("identifier", "purpose", "isUsed")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_otp_codes_identifier"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_codes" ALTER COLUMN "identifier" TYPE varchar(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_codes" RENAME COLUMN "identifier" TO "phone"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_otp_codes_phone" ON "otp_codes" ("phone", "purpose", "isUsed")`,
    );
  }
}
