import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationSystem1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "notification_content_type_enum" AS ENUM ('article', 'poll', 'event', 'election', 'quiz', 'custom')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_log_status_enum" AS ENUM ('pending', 'sending', 'sent', 'failed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_schedule_type_enum" AS ENUM ('once', 'recurring')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_receipt_status_enum" AS ENUM ('sent', 'delivered', 'opened', 'failed')
    `);

    // notification_templates
    await queryRunner.query(`
      CREATE TABLE "notification_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "titleTemplate" varchar(500) NOT NULL,
        "bodyTemplate" text NOT NULL,
        "imageUrlTemplate" varchar(2000),
        "contentType" "notification_content_type_enum" NOT NULL,
        "triggerEvent" varchar(100),
        "isAutoTrigger" boolean NOT NULL DEFAULT false,
        "defaultAudience" jsonb NOT NULL DEFAULT '{}',
        "variables" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdById" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_templates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_templates_name" UNIQUE ("name"),
        CONSTRAINT "FK_notification_templates_user" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // notification_logs
    await queryRunner.query(`
      CREATE TABLE "notification_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "templateId" uuid,
        "title" varchar(500) NOT NULL,
        "body" text NOT NULL,
        "imageUrl" varchar(2000),
        "contentType" varchar(50) NOT NULL,
        "contentId" uuid,
        "data" jsonb,
        "audienceRules" jsonb NOT NULL DEFAULT '{}',
        "sentById" uuid,
        "status" "notification_log_status_enum" NOT NULL DEFAULT 'pending',
        "totalTargeted" int NOT NULL DEFAULT 0,
        "totalSent" int NOT NULL DEFAULT 0,
        "totalFailed" int NOT NULL DEFAULT 0,
        "totalOpened" int NOT NULL DEFAULT 0,
        "scheduledAt" TIMESTAMP,
        "sentAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "errorMessage" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_logs_template" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_notification_logs_user" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Indexes for notification_logs
    await queryRunner.query(`CREATE INDEX "idx_notification_logs_status" ON "notification_logs" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_notification_logs_sent_at" ON "notification_logs" ("sentAt" DESC)`);
    await queryRunner.query(`CREATE INDEX "idx_notification_logs_content" ON "notification_logs" ("contentType", "contentId")`);

    // notification_schedules
    await queryRunner.query(`
      CREATE TABLE "notification_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "templateId" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "scheduleType" "notification_schedule_type_enum" NOT NULL,
        "scheduledAt" TIMESTAMP,
        "cronExpression" varchar(100),
        "timezone" varchar(50) NOT NULL DEFAULT 'Asia/Jerusalem',
        "audienceRules" jsonb NOT NULL DEFAULT '{}',
        "contextData" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "lastRunAt" TIMESTAMP,
        "nextRunAt" TIMESTAMP,
        "createdById" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_schedules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_schedules_template" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notification_schedules_user" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_notification_schedules_next_run" ON "notification_schedules" ("nextRunAt") WHERE "isActive" = true`);

    // notification_receipts
    await queryRunner.query(`
      CREATE TABLE "notification_receipts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "logId" uuid NOT NULL,
        "pushTokenId" uuid,
        "deviceId" varchar(200) NOT NULL,
        "userId" uuid,
        "status" "notification_receipt_status_enum" NOT NULL DEFAULT 'sent',
        "failureReason" varchar(500),
        "openedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_receipts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_receipts_log" FOREIGN KEY ("logId") REFERENCES "notification_logs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notification_receipts_user" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_notification_receipts_log" ON "notification_receipts" ("logId")`);
    await queryRunner.query(`CREATE INDEX "idx_notification_receipts_user" ON "notification_receipts" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_notification_receipts_device" ON "notification_receipts" ("deviceId", "createdAt" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_receipts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_templates"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_receipt_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_schedule_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_log_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_content_type_enum"`);
  }
}
