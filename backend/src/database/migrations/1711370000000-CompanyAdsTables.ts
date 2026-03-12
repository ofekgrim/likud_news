import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyAdsTables1711370000000 implements MigrationInterface {
  name = 'CompanyAdsTables1711370000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company_advertisers (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        name varchar(255) NOT NULL,
        "logoUrl" varchar(2000) NULL,
        website varchar(2000) NULL,
        "contactEmail" varchar(255) NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_advertisers" PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company_ads (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        "advertiserId" uuid NOT NULL,
        "adType" varchar(30) NOT NULL,
        title varchar(500) NOT NULL,
        "contentHe" text NULL,
        "imageUrl" varchar(2000) NULL,
        "ctaUrl" varchar(2000) NULL,
        "ctaLabelHe" varchar(100) NULL,
        "dailyBudgetNis" decimal(10,2) NOT NULL DEFAULT 0,
        "cpmNis" decimal(10,2) NOT NULL DEFAULT 0,
        impressions integer NOT NULL DEFAULT 0,
        clicks integer NOT NULL DEFAULT 0,
        "startDate" date NULL,
        "endDate" date NULL,
        "isApproved" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        status varchar(20) NOT NULL DEFAULT 'pending',
        "rejectionReason" text NULL,
        "approvedAt" TIMESTAMP NULL,
        "rejectedAt" TIMESTAMP NULL,
        "pausedAt" TIMESTAMP NULL,
        "endedAt" TIMESTAMP NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_ads" PRIMARY KEY (id),
        CONSTRAINT "FK_company_ads_advertiser" FOREIGN KEY ("advertiserId")
          REFERENCES company_advertisers(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_company_ads_advertiserId" ON company_ads ("advertiserId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_company_ads_adType" ON company_ads ("adType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_company_ads_status" ON company_ads (status)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS company_ads`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_advertisers`);
  }
}
