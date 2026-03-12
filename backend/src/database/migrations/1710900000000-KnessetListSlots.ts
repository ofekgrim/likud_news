import { MigrationInterface, QueryRunner } from 'typeorm';

export class KnessetListSlots1710900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum
    await queryRunner.query(
      `CREATE TYPE "knesset_slot_type_enum" AS ENUM('leader', 'reserved_minority', 'reserved_woman', 'national', 'district')`,
    );

    // Create table
    await queryRunner.query(`
      CREATE TABLE "knesset_list_slots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "electionId" uuid NOT NULL,
        "slotNumber" integer NOT NULL,
        "slotType" "knesset_slot_type_enum" NOT NULL DEFAULT 'national',
        "candidateId" uuid,
        "isConfirmed" boolean NOT NULL DEFAULT false,
        "assignedById" uuid,
        "confirmedById" uuid,
        "confirmedAt" TIMESTAMP,
        "notes" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_knesset_list_slots" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knesset_list_slots_election_slot" UNIQUE ("electionId", "slotNumber"),
        CONSTRAINT "FK_knesset_list_slots_election" FOREIGN KEY ("electionId") REFERENCES "primary_elections"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_knesset_list_slots_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE SET NULL
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_knesset_list_slots_election" ON "knesset_list_slots" ("electionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_knesset_list_slots_candidate" ON "knesset_list_slots" ("candidateId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "knesset_list_slots"`);
    await queryRunner.query(`DROP TYPE "knesset_slot_type_enum"`);
  }
}
