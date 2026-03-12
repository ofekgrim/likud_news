import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShareLinks1710200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create content type enum
    await queryRunner.query(`
      CREATE TYPE "share_content_type_enum" AS ENUM ('article', 'candidate', 'quiz_result', 'event', 'poll')
    `);

    // Create share_links table
    await queryRunner.query(`
      CREATE TABLE "share_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contentType" "share_content_type_enum" NOT NULL,
        "contentId" uuid NOT NULL,
        "shortCode" varchar(8) NOT NULL,
        "ogTitle" varchar(500),
        "ogDescription" text,
        "ogImageUrl" varchar(2000),
        "utmSource" varchar(100),
        "utmMedium" varchar(100),
        "utmCampaign" varchar(100),
        "clickCount" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_share_links" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_share_links_short_code" UNIQUE ("shortCode")
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_share_links_short_code" ON "share_links" ("shortCode")`);
    await queryRunner.query(`CREATE INDEX "idx_share_links_content" ON "share_links" ("contentType", "contentId")`);
    await queryRunner.query(`CREATE INDEX "idx_share_links_created_at" ON "share_links" ("createdAt" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "share_links"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "share_content_type_enum"`);
  }
}
