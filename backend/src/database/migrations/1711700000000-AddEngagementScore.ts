import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEngagementScore1711700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_users" ADD "engagementScore" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`CREATE INDEX "IDX_app_users_engagementScore" ON "app_users" ("engagementScore")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_app_users_engagementScore"`);
    await queryRunner.query(`ALTER TABLE "app_users" DROP COLUMN "engagementScore"`);
  }
}
