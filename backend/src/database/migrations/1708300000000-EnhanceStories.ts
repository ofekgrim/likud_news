import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceStories1708300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "videoUrl" varchar(2000)`);
    await queryRunner.query(`ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "durationSeconds" integer DEFAULT 5 NOT NULL`);
    await queryRunner.query(`ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "mediaType" varchar(10) DEFAULT 'image' NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN IF EXISTS "mediaType"`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN IF EXISTS "durationSeconds"`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN IF EXISTS "videoUrl"`);
  }
}
