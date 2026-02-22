import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentStorySupport1708300001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "articleId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "storyId" uuid`);
    await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_story" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_comments_storyId" ON "comments" ("storyId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_storyId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_story"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "storyId"`);
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "articleId" SET NOT NULL`);
  }
}
