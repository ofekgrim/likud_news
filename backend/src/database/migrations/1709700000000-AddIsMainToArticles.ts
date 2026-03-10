import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add isMain column to articles table
 *
 * Adds a boolean flag to mark an article as the main/featured article.
 * Only one article should have isMain=true at any time (enforced by application logic).
 * Creates a partial index for quick lookup of the main article.
 */
export class AddIsMainToArticles1709700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isMain column with default false
    await queryRunner.query(`
      ALTER TABLE "articles"
      ADD COLUMN "isMain" boolean NOT NULL DEFAULT false;
    `);

    // Create partial index for quick lookup of main article
    // (index only stores rows where isMain=true, typically just 1 row)
    await queryRunner.query(`
      CREATE INDEX "idx_articles_is_main"
      ON "articles"("isMain")
      WHERE "isMain" = true;
    `);

    // Add comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "articles"."isMain" IS 'Marks this article as the main/featured article (only 1 should be true)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_articles_is_main";`);

    // Remove column
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "isMain";`);
  }
}
