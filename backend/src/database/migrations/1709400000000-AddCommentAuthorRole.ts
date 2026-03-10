import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentAuthorRole1709400000000 implements MigrationInterface {
  name = 'AddCommentAuthorRole1709400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "authorRole" varchar(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comments" DROP COLUMN IF EXISTS "authorRole"`,
    );
  }
}
