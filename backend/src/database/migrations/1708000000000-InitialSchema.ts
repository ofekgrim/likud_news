import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1708000000000 implements MigrationInterface {
  name = 'InitialSchema1708000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ─── Users ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('super_admin', 'admin', 'editor')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email"         varchar(200) NOT NULL,
        "name"          varchar(200) NOT NULL,
        "passwordHash"  varchar(500) NOT NULL,
        "role"          "user_role_enum" NOT NULL DEFAULT 'editor',
        "isActive"      boolean NOT NULL DEFAULT true,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // ─── Categories ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"       varchar(200) NOT NULL,
        "nameEn"     varchar(200),
        "slug"       varchar(200) NOT NULL,
        "iconUrl"    varchar(2000),
        "sortOrder"  int NOT NULL DEFAULT 0,
        "isActive"   boolean NOT NULL DEFAULT true,
        "color"      varchar(7),
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_categories_slug" ON "categories" ("slug")
    `);

    // ─── Members ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "members" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"            varchar(200) NOT NULL,
        "nameEn"          varchar(200),
        "title"           varchar(300),
        "titleEn"         varchar(300),
        "bio"             text,
        "bioEn"           text,
        "photoUrl"        varchar(2000),
        "socialTwitter"   varchar(500),
        "socialFacebook"  varchar(500),
        "socialInstagram" varchar(500),
        "isActive"        boolean NOT NULL DEFAULT true,
        "sortOrder"       int NOT NULL DEFAULT 0,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_members" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_members_active" ON "members" ("isActive", "sortOrder")
    `);

    // ─── Articles ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "article_status_enum" AS ENUM ('draft', 'published', 'archived')
    `);

    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title"            varchar(500) NOT NULL,
        "titleEn"          varchar(500),
        "subtitle"         varchar(1000),
        "content"          text NOT NULL,
        "contentEn"        text,
        "heroImageUrl"     varchar(2000),
        "heroImageCaption" varchar(500),
        "author"           varchar(200),
        "hashtags"         text,
        "status"           "article_status_enum" NOT NULL DEFAULT 'draft',
        "isHero"           boolean NOT NULL DEFAULT false,
        "isBreaking"       boolean NOT NULL DEFAULT false,
        "viewCount"        int NOT NULL DEFAULT 0,
        "slug"             varchar(500) NOT NULL,
        "publishedAt"      TIMESTAMP,
        "categoryId"       uuid,
        "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt"        TIMESTAMP,
        CONSTRAINT "PK_articles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_articles_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_articles_category" FOREIGN KEY ("categoryId")
          REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_articles_published" ON "articles" ("publishedAt" DESC)
        WHERE "status" = 'published'
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_articles_category" ON "articles" ("categoryId", "publishedAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_articles_breaking" ON "articles" ("isBreaking", "publishedAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_articles_hero" ON "articles" ("isHero")
        WHERE "isHero" = true
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_articles_slug" ON "articles" ("slug")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_articles_search" ON "articles"
        USING GIN(to_tsvector('simple', coalesce("title",'') || ' ' || coalesce("content",'')))
    `);

    // ─── Article–Members join table (ManyToMany) ────────────────────────
    await queryRunner.query(`
      CREATE TABLE "article_members" (
        "articlesId" uuid NOT NULL,
        "membersId"  uuid NOT NULL,
        CONSTRAINT "PK_article_members" PRIMARY KEY ("articlesId", "membersId"),
        CONSTRAINT "FK_article_members_article" FOREIGN KEY ("articlesId")
          REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_article_members_member" FOREIGN KEY ("membersId")
          REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_article_members_articlesId" ON "article_members" ("articlesId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_article_members_membersId" ON "article_members" ("membersId")
    `);

    // ─── Ticker Items ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ticker_items" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "text"       varchar(500) NOT NULL,
        "linkUrl"    varchar(2000),
        "articleId"  uuid,
        "position"   int NOT NULL DEFAULT 0,
        "isActive"   boolean NOT NULL DEFAULT true,
        "expiresAt"  TIMESTAMP,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticker_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticker_items_article" FOREIGN KEY ("articleId")
          REFERENCES "articles" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ticker_active" ON "ticker_items" ("isActive", "position")
        WHERE "isActive" = true
    `);

    // ─── Media ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "media_type_enum" AS ENUM ('image', 'video', 'audio', 'document')
    `);

    await queryRunner.query(`
      CREATE TABLE "media" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename"   varchar(500) NOT NULL,
        "url"        varchar(2000) NOT NULL,
        "s3Key"      varchar(2000) NOT NULL,
        "type"       "media_type_enum" NOT NULL,
        "mimeType"   varchar(100) NOT NULL,
        "size"       bigint NOT NULL DEFAULT 0,
        "width"      int,
        "height"     int,
        "duration"   int,
        "caption"    varchar(500),
        "altText"    varchar(300),
        "articleId"  uuid,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_media" PRIMARY KEY ("id"),
        CONSTRAINT "FK_media_article" FOREIGN KEY ("articleId")
          REFERENCES "articles" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // ─── Contact Messages ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "contact_messages" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"      varchar(200) NOT NULL,
        "email"     varchar(200) NOT NULL,
        "phone"     varchar(50),
        "subject"   varchar(500) NOT NULL,
        "message"   text NOT NULL,
        "isRead"    boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contact_messages" PRIMARY KEY ("id")
      )
    `);

    // ─── User Favorites ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_favorites" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deviceId"  varchar(200) NOT NULL,
        "articleId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_favorites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_favorites_device_article" UNIQUE ("deviceId", "articleId"),
        CONSTRAINT "FK_user_favorites_article" FOREIGN KEY ("articleId")
          REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_favorites_device" ON "user_favorites" ("deviceId", "createdAt" DESC)
    `);

    // ─── Reading History ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "reading_history" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deviceId"  varchar(200) NOT NULL,
        "articleId" uuid NOT NULL,
        "read_at"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reading_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reading_history_article" FOREIGN KEY ("articleId")
          REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_history_device" ON "reading_history" ("deviceId", "read_at" DESC)
    `);

    // ─── Push Tokens ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "push_tokens" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deviceId"  varchar(200) NOT NULL,
        "token"     varchar(500) NOT NULL,
        "platform"  varchar(20) NOT NULL,
        "isActive"  boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_tokens" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "push_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reading_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_favorites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticker_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "article_members" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "members" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "media_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "article_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);

    // Drop extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
