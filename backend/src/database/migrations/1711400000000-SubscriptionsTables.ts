import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionsTables1711400000000 implements MigrationInterface {
  name = 'SubscriptionsTables1711400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create enums ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "subscription_tier_enum" AS ENUM ('vip_monthly', 'vip_annual')
    `);

    await queryRunner.query(`
      CREATE TYPE "subscription_provider_enum" AS ENUM ('apple', 'google', 'direct')
    `);

    await queryRunner.query(`
      CREATE TYPE "subscription_status_enum" AS ENUM ('active', 'expired', 'cancelled', 'trial', 'grace_period')
    `);

    // ── Create member_subscriptions table ─────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "member_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "appUserId" uuid NOT NULL,
        "tier" "subscription_tier_enum" NOT NULL,
        "provider" "subscription_provider_enum" NOT NULL,
        "externalSubscriptionId" varchar(500) NOT NULL,
        "status" "subscription_status_enum" NOT NULL DEFAULT 'active',
        "startedAt" TIMESTAMP NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "cancelledAt" TIMESTAMP,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_member_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_member_subscriptions_appUserId" FOREIGN KEY ("appUserId")
          REFERENCES "app_users"("id") ON DELETE CASCADE
      )
    `);

    // ── Indexes ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX "IDX_member_subscriptions_appUserId" ON "member_subscriptions" ("appUserId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_member_subscriptions_externalId" ON "member_subscriptions" ("externalSubscriptionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_member_subscriptions_status" ON "member_subscriptions" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_member_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_member_subscriptions_externalId"`);
    await queryRunner.query(`DROP INDEX "IDX_member_subscriptions_appUserId"`);
    await queryRunner.query(`DROP TABLE "member_subscriptions"`);
    await queryRunner.query(`DROP TYPE "subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_provider_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_tier_enum"`);
  }
}
