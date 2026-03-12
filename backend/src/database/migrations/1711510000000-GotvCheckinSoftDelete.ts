import { MigrationInterface, QueryRunner } from 'typeorm';

export class GotvCheckinSoftDelete1711510000000 implements MigrationInterface {
  name = 'GotvCheckinSoftDelete1711510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gotv_engagement" ADD COLUMN "deletedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gotv_engagement" DROP COLUMN "deletedAt"`,
    );
  }
}
