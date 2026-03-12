import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdContentLinking1711360000000 implements MigrationInterface {
  name = 'AdContentLinking1711360000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE candidate_ad_placements
        ADD COLUMN IF NOT EXISTS "linkedContentType" varchar(50) NULL,
        ADD COLUMN IF NOT EXISTS "linkedContentId" varchar(36) NULL,
        ADD COLUMN IF NOT EXISTS "ctaUrl" varchar(2000) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE candidate_ad_placements DROP COLUMN IF EXISTS "ctaUrl"`);
    await queryRunner.query(`ALTER TABLE candidate_ad_placements DROP COLUMN IF EXISTS "linkedContentId"`);
    await queryRunner.query(`ALTER TABLE candidate_ad_placements DROP COLUMN IF EXISTS "linkedContentType"`);
  }
}
