import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMemberBioBlocks1708500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
      ADD COLUMN IF NOT EXISTS "bioBlocks" jsonb NOT NULL DEFAULT '[]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "members"
      DROP COLUMN IF EXISTS "bioBlocks"
    `);
  }
}
