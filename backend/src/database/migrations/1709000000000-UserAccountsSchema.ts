import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAccountsSchema1709000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum Types ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "app_user_role_enum" AS ENUM ('guest', 'member', 'verified_member')
    `);
    await queryRunner.query(`
      CREATE TYPE "membership_status_enum" AS ENUM ('unverified', 'pending', 'verified', 'expired')
    `);
    await queryRunner.query(`
      CREATE TYPE "otp_purpose_enum" AS ENUM ('login', 'verify')
    `);

    // ── 1. app_users ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "app_users" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deviceId"               varchar(200) NOT NULL,
        "phone"                  varchar(50),
        "email"                  varchar(300),
        "passwordHash"           varchar(500),
        "displayName"            varchar(200),
        "avatarUrl"              varchar(2000),
        "bio"                    text,
        "role"                   "app_user_role_enum" NOT NULL DEFAULT 'guest',
        "membershipId"           varchar(100),
        "membershipStatus"       "membership_status_enum" NOT NULL DEFAULT 'unverified',
        "membershipVerifiedAt"   TIMESTAMP,
        "preferredCategories"    uuid[] DEFAULT '{}',
        "notificationPrefs"      jsonb NOT NULL DEFAULT '{}',
        "lastLoginAt"            TIMESTAMP,
        "isActive"               boolean NOT NULL DEFAULT true,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_app_users_deviceId" UNIQUE ("deviceId")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_app_users_phone" ON "app_users" ("phone") WHERE "phone" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_app_users_email" ON "app_users" ("email") WHERE "email" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_app_users_membership_status" ON "app_users" ("membershipStatus")
    `);

    // ── 2. refresh_tokens ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      uuid NOT NULL,
        "tokenHash"   varchar(500) NOT NULL,
        "deviceId"    varchar(200) NOT NULL,
        "platform"    varchar(20),
        "expiresAt"   TIMESTAMP NOT NULL,
        "isRevoked"   boolean NOT NULL DEFAULT false,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_user_device" ON "refresh_tokens" ("userId", "deviceId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_expires" ON "refresh_tokens" ("expiresAt") WHERE "isRevoked" = false
    `);

    // ── 3. otp_codes ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "otp_codes" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "phone"       varchar(50) NOT NULL,
        "codeHash"    varchar(500) NOT NULL,
        "purpose"     "otp_purpose_enum" NOT NULL DEFAULT 'login',
        "expiresAt"   TIMESTAMP NOT NULL,
        "attempts"    int NOT NULL DEFAULT 0,
        "isUsed"      boolean NOT NULL DEFAULT false,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_otp_codes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_otp_codes_phone" ON "otp_codes" ("phone", "purpose", "isUsed")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_otp_codes_expires" ON "otp_codes" ("expiresAt") WHERE "isUsed" = false
    `);

    // ── 4. email_verifications ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "email_verifications" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      uuid NOT NULL,
        "email"       varchar(300) NOT NULL,
        "tokenHash"   varchar(500) NOT NULL,
        "expiresAt"   TIMESTAMP NOT NULL,
        "isUsed"      boolean NOT NULL DEFAULT false,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_verifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_email_verifications_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_email_verifications_token" ON "email_verifications" ("tokenHash") WHERE "isUsed" = false
    `);

    // ── 5. bookmark_folders ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "bookmark_folders" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      uuid NOT NULL,
        "name"        varchar(200) NOT NULL,
        "color"       varchar(20),
        "sortOrder"   int NOT NULL DEFAULT 0,
        "isPublic"    boolean NOT NULL DEFAULT false,
        "shareToken"  varchar(100),
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookmark_folders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookmark_folders_user" FOREIGN KEY ("userId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_bookmark_folders_user" ON "bookmark_folders" ("userId", "sortOrder")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_bookmark_folders_share" ON "bookmark_folders" ("shareToken") WHERE "shareToken" IS NOT NULL
    `);

    // ── 6. user_follows ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_follows" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "followerId"   uuid NOT NULL,
        "followeeId"   uuid NOT NULL,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_follows" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_follows_follower" FOREIGN KEY ("followerId")
          REFERENCES "app_users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_follows_followee" FOREIGN KEY ("followeeId")
          REFERENCES "members" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_follows" UNIQUE ("followerId", "followeeId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_follows_follower" ON "user_follows" ("followerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_follows_followee" ON "user_follows" ("followeeId")
    `);

    // ── ALTER existing tables ───────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "user_favorites"
      ADD COLUMN IF NOT EXISTS "userId" uuid REFERENCES "app_users" ("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "folderId" uuid REFERENCES "bookmark_folders" ("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "note" text
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_favorites_user" ON "user_favorites" ("userId") WHERE "userId" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "reading_history"
      ADD COLUMN IF NOT EXISTS "userId" uuid REFERENCES "app_users" ("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_history_user" ON "reading_history" ("userId") WHERE "userId" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "push_tokens"
      ADD COLUMN IF NOT EXISTS "userId" uuid REFERENCES "app_users" ("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_push_tokens_user" ON "push_tokens" ("userId") WHERE "userId" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD COLUMN IF NOT EXISTS "userId" uuid REFERENCES "app_users" ("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "authorAvatarUrl" varchar(2000)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Revert ALTER tables ─────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "authorAvatarUrl"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "userId"`);
    await queryRunner.query(`ALTER TABLE "push_tokens" DROP COLUMN IF EXISTS "userId"`);
    await queryRunner.query(`ALTER TABLE "reading_history" DROP COLUMN IF EXISTS "userId"`);
    await queryRunner.query(`ALTER TABLE "user_favorites" DROP COLUMN IF EXISTS "note"`);
    await queryRunner.query(`ALTER TABLE "user_favorites" DROP COLUMN IF EXISTS "folderId"`);
    await queryRunner.query(`ALTER TABLE "user_favorites" DROP COLUMN IF EXISTS "userId"`);

    // ── Drop tables ─────────────────────────────────────────────────────
    await queryRunner.query(`DROP TABLE IF EXISTS "user_follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookmark_folders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_verifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "app_users"`);

    // ── Drop enums ──────────────────────────────────────────────────────
    await queryRunner.query(`DROP TYPE IF EXISTS "otp_purpose_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "membership_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "app_user_role_enum"`);
  }
}
