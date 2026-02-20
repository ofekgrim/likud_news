import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhancedArticles1708100000000 implements MigrationInterface {
  name = 'EnhancedArticles1708100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Authors ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "authors" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nameHe"              varchar(200) NOT NULL,
        "nameEn"              varchar(200),
        "roleHe"              varchar(200),
        "roleEn"              varchar(200),
        "bioHe"               text,
        "avatarUrl"           varchar(2000),
        "avatarThumbnailUrl"  varchar(2000),
        "email"               varchar(200),
        "socialLinks"         jsonb NOT NULL DEFAULT '{}',
        "userId"              uuid,
        "isActive"            boolean NOT NULL DEFAULT true,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_authors" PRIMARY KEY ("id"),
        CONSTRAINT "FK_authors_user" FOREIGN KEY ("userId")
          REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // ─── Tags ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "tag_type_enum" AS ENUM ('topic', 'person', 'location')
    `);

    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nameHe"    varchar(200) NOT NULL,
        "nameEn"    varchar(200),
        "slug"      varchar(200) NOT NULL,
        "tagType"   "tag_type_enum" NOT NULL DEFAULT 'topic',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_slug" UNIQUE ("slug")
      )
    `);

    // ─── Article–Tags join table (ManyToMany) ───────────────────────────
    await queryRunner.query(`
      CREATE TABLE "article_tags" (
        "articlesId" uuid NOT NULL,
        "tagsId"     uuid NOT NULL,
        CONSTRAINT "PK_article_tags" PRIMARY KEY ("articlesId", "tagsId"),
        CONSTRAINT "FK_article_tags_article" FOREIGN KEY ("articlesId")
          REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_article_tags_tag" FOREIGN KEY ("tagsId")
          REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // ─── Comments ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "articleId"   uuid NOT NULL,
        "parentId"    uuid,
        "authorName"  varchar(200) NOT NULL,
        "authorEmail" varchar(200),
        "body"        text NOT NULL,
        "isApproved"  boolean NOT NULL DEFAULT false,
        "isPinned"    boolean NOT NULL DEFAULT false,
        "likesCount"  int NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comments_article" FOREIGN KEY ("articleId")
          REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_comments_parent" FOREIGN KEY ("parentId")
          REFERENCES "comments" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // ─── Add new columns to articles ────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "bodyBlocks" jsonb NOT NULL DEFAULT '[]'
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "alertBannerText" varchar(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "alertBannerEnabled" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "alertBannerColor" varchar(7) NOT NULL DEFAULT '#E53935'
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "heroImageCredit" varchar(200)
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "heroImageCaptionHe" varchar(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "heroImageFullUrl" varchar(2000)
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "authorId" uuid,
        ADD CONSTRAINT "FK_articles_author" FOREIGN KEY ("authorId")
          REFERENCES "authors" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "allowComments" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "readingTimeMinutes" int NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD COLUMN "shareCount" int NOT NULL DEFAULT 0
    `);

    // ─── Indexes ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX "idx_comments_article" ON "comments" ("articleId", "isApproved", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_comments_approved" ON "comments" ("isApproved")
        WHERE "isApproved" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_tags_slug" ON "tags" ("slug")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_article_tags_article" ON "article_tags" ("articlesId")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_article_tags_tag" ON "article_tags" ("tagsId")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_authors_active" ON "authors" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_authors_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_article_tags_tag"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_article_tags_article"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tags_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_approved"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comments_article"`);

    // Drop new columns from articles (reverse order)
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "shareCount"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "readingTimeMinutes"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "allowComments"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "FK_articles_author"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "authorId"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "heroImageFullUrl"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "heroImageCaptionHe"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "heroImageCredit"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "alertBannerColor"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "alertBannerEnabled"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "alertBannerText"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "bodyBlocks"`);

    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "comments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "article_tags" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "authors" CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "tag_type_enum"`);
  }
}
