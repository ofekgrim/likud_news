import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdPlacementsTables1711300000000 implements MigrationInterface {
  name = 'AdPlacementsTables1711300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create enum ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "ad_placement_type_enum" AS ENUM ('profile_featured', 'feed_sponsored', 'push_notification', 'quiz_end')
    `);

    // ── Create candidate_ad_placements table ─────────────────────────
    await queryRunner.query(`
      CREATE TABLE "candidate_ad_placements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "candidateId" uuid NOT NULL,
        "placementType" "ad_placement_type_enum" NOT NULL,
        "title" varchar(500) NOT NULL,
        "contentHe" text NOT NULL,
        "imageUrl" varchar(2000),
        "targetingRules" jsonb,
        "dailyBudgetNis" decimal(10,2) NOT NULL,
        "cpmNis" decimal(10,2) NOT NULL,
        "impressions" int NOT NULL DEFAULT 0,
        "clicks" int NOT NULL DEFAULT 0,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "isApproved" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_ad_placements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ad_placements_candidateId" FOREIGN KEY ("candidateId")
          REFERENCES "candidates"("id") ON DELETE CASCADE
      )
    `);

    // ── Indexes ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX "IDX_ad_placements_candidateId" ON "candidate_ad_placements" ("candidateId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ad_placements_placementType" ON "candidate_ad_placements" ("placementType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ad_placements_isApproved" ON "candidate_ad_placements" ("isApproved")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ad_placements_isActive" ON "candidate_ad_placements" ("isActive")
    `);

    // Composite index for active placement queries
    await queryRunner.query(`
      CREATE INDEX "IDX_ad_placements_active_lookup" ON "candidate_ad_placements" ("placementType", "isApproved", "isActive", "startDate", "endDate")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ad_placements_active_lookup"`);
    await queryRunner.query(`DROP INDEX "IDX_ad_placements_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_ad_placements_isApproved"`);
    await queryRunner.query(`DROP INDEX "IDX_ad_placements_placementType"`);
    await queryRunner.query(`DROP INDEX "IDX_ad_placements_candidateId"`);
    await queryRunner.query(`DROP TABLE "candidate_ad_placements"`);
    await queryRunner.query(`DROP TYPE "ad_placement_type_enum"`);
  }
}
