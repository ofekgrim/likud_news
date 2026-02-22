import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceMembers1708400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
      ADD COLUMN IF NOT EXISTS "slug" varchar(200) UNIQUE,
      ADD COLUMN IF NOT EXISTS "office" varchar(300),
      ADD COLUMN IF NOT EXISTS "phone" varchar(50),
      ADD COLUMN IF NOT EXISTS "email" varchar(300),
      ADD COLUMN IF NOT EXISTS "website" varchar(500),
      ADD COLUMN IF NOT EXISTS "coverImageUrl" varchar(2000),
      ADD COLUMN IF NOT EXISTS "personalPageHtml" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "office",
      DROP COLUMN IF EXISTS "phone",
      DROP COLUMN IF EXISTS "email",
      DROP COLUMN IF EXISTS "website",
      DROP COLUMN IF EXISTS "coverImageUrl",
      DROP COLUMN IF EXISTS "personalPageHtml"
    `);
  }
}
