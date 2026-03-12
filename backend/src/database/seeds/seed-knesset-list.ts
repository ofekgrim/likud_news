import { AppDataSource } from '../data-source';

/**
 * Seed script for the Likud Knesset list slots.
 *
 * Requires seed-candidates to have been run first (needs an election and candidates).
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-knesset-list.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-knesset-list.ts --force  # replace existing
 */

interface SlotDefinition {
  slotNumber: number;
  slotType: 'leader' | 'reserved_minority' | 'reserved_woman' | 'national' | 'district';
  candidateIndex: number | null; // index into fetched candidates array, or null for unassigned
}

function buildSlotDefinitions(): SlotDefinition[] {
  const slots: SlotDefinition[] = [];
  let candidateIdx = 0;

  // Slot 1: leader (Netanyahu)
  slots.push({ slotNumber: 1, slotType: 'leader', candidateIndex: candidateIdx++ });

  // Slots 2-5: reserved seats
  slots.push({ slotNumber: 2, slotType: 'reserved_woman', candidateIndex: candidateIdx++ });
  slots.push({ slotNumber: 3, slotType: 'reserved_minority', candidateIndex: candidateIdx++ });
  slots.push({ slotNumber: 4, slotType: 'reserved_woman', candidateIndex: candidateIdx++ });
  slots.push({ slotNumber: 5, slotType: 'reserved_minority', candidateIndex: candidateIdx++ });

  // Slots 6-25: national
  for (let i = 6; i <= 25; i++) {
    slots.push({ slotNumber: i, slotType: 'national', candidateIndex: candidateIdx++ });
  }

  // Slots 26-35: district
  for (let i = 26; i <= 35; i++) {
    slots.push({ slotNumber: i, slotType: 'district', candidateIndex: candidateIdx++ });
  }

  // Slots 36-40: national (unassigned)
  for (let i = 36; i <= 40; i++) {
    slots.push({ slotNumber: i, slotType: 'national', candidateIndex: null });
  }

  return slots;
}

async function seedKnessetList() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Find the latest primary election ────────────────────────────
    const elections = (await queryRunner.query(
      `SELECT "id", "title" FROM "primary_elections" ORDER BY "createdAt" DESC LIMIT 1`,
    )) as { id: string; title: string }[];

    if (elections.length === 0) {
      console.error('No primary elections found. Run seed-candidates first.');
      process.exit(1);
    }

    const electionId = elections[0].id;
    console.log(`Using election: ${elections[0].title} (${electionId})`);

    // ── Check existing slots ────────────────────────────────────────
    const existingCount = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "knesset_list_slots" WHERE "electionId" = $1`,
      [electionId],
    )) as { count: string }[];

    if (parseInt(existingCount[0].count, 10) > 0 && !forceReseed) {
      console.log(
        `Election already has ${existingCount[0].count} knesset list slots. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed) {
      await queryRunner.query(
        `DELETE FROM "knesset_list_slots" WHERE "electionId" = $1`,
        [electionId],
      );
      console.log('Cleared existing knesset list slots for this election.');
    }

    // ── Fetch all candidates for this election ──────────────────────
    const candidates = (await queryRunner.query(
      `SELECT "id", "fullName" FROM "candidates" WHERE "electionId" = $1 ORDER BY "sortOrder" ASC`,
      [electionId],
    )) as { id: string; fullName: string }[];

    console.log(`Found ${candidates.length} candidates for assignment.`);

    // ── Build and insert slots ──────────────────────────────────────
    const slotDefs = buildSlotDefinitions();
    const confirmedAt = new Date();

    console.log(`Seeding ${slotDefs.length} knesset list slots...`);

    for (const slot of slotDefs) {
      const candidateId =
        slot.candidateIndex !== null && slot.candidateIndex < candidates.length
          ? candidates[slot.candidateIndex].id
          : null;
      const isConfirmed = slot.slotNumber <= 10;
      const candidateName =
        slot.candidateIndex !== null && slot.candidateIndex < candidates.length
          ? candidates[slot.candidateIndex].fullName
          : '(unassigned)';

      await queryRunner.query(
        `INSERT INTO "knesset_list_slots"
           ("id", "electionId", "slotNumber", "slotType", "candidateId", "isConfirmed", "confirmedAt")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)`,
        [
          electionId,
          slot.slotNumber,
          slot.slotType,
          candidateId,
          isConfirmed,
          isConfirmed ? confirmedAt : null,
        ],
      );

      const status = isConfirmed ? '✓' : ' ';
      console.log(
        `  [${status}] ${String(slot.slotNumber).padStart(2, ' ')}. ${slot.slotType.padEnd(17, ' ')} — ${candidateName}`,
      );
    }

    await queryRunner.commitTransaction();

    // ── Summary ─────────────────────────────────────────────────────
    const assigned = slotDefs.filter(
      (s) => s.candidateIndex !== null && s.candidateIndex < candidates.length,
    ).length;
    const unassigned = slotDefs.length - assigned;
    const confirmed = slotDefs.filter((s) => s.slotNumber <= 10).length;

    console.log(`\nDone! Seeded ${slotDefs.length} knesset list slots.`);
    console.log(`  Assigned:    ${assigned}`);
    console.log(`  Unassigned:  ${unassigned}`);
    console.log(`  Confirmed:   ${confirmed}`);
  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedKnessetList();
