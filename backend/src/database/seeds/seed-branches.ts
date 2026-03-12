import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed script for branches and branch weekly scores.
 *
 * Prerequisites: seed-app-users.ts must have been run first.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-branches.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-branches.ts --force  # replace existing
 */

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  database: process.env.DATABASE_NAME || 'likud_news',
  username: process.env.DATABASE_USER || 'likud',
  password: process.env.DATABASE_PASSWORD || 'likud_dev',
  ssl: process.env.DATABASE_SSL === 'true',
  entities: ['src/modules/**/entities/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});

// ── Branch definitions ────────────────────────────────────────────────────

interface BranchDef {
  name: string;
  district: string;
  city: string | null;
}

const BRANCHES: BranchDef[] = [
  // Tel Aviv district
  { name: 'סניף תל אביב מרכז', district: 'תל אביב', city: 'תל אביב-יפו' },
  { name: 'סניף רמת אביב', district: 'תל אביב', city: 'תל אביב-יפו' },
  // Jerusalem district
  { name: 'סניף ירושלים', district: 'ירושלים', city: 'ירושלים' },
  { name: 'סניף מעלה אדומים', district: 'ירושלים', city: 'מעלה אדומים' },
  // Haifa district
  { name: 'סניף חיפה', district: 'חיפה', city: 'חיפה' },
  { name: 'סניף קריות', district: 'חיפה', city: 'קריית ביאליק' },
  // Center district
  { name: 'סניף פתח תקווה', district: 'מרכז', city: 'פתח תקווה' },
  { name: 'סניף ראשון לציון', district: 'מרכז', city: 'ראשון לציון' },
  { name: 'סניף רחובות', district: 'מרכז', city: 'רחובות' },
  // South district
  { name: 'סניף באר שבע', district: 'דרום', city: 'באר שבע' },
  { name: 'סניף אשדוד', district: 'דרום', city: 'אשדוד' },
  // North district
  { name: 'סניף נצרת עילית', district: 'צפון', city: 'נוף הגליל' },
  { name: 'סניף צפת', district: 'צפון', city: 'צפת' },
  // Sharon district
  { name: 'סניף נתניה', district: 'שרון', city: 'נתניה' },
  { name: 'סניף הרצליה', district: 'שרון', city: 'הרצליה' },
];

// ── Score weights per action (must match branches.service.ts) ─────────────

const ACTION_WEIGHTS: Record<string, number> = {
  quiz_complete: 1,
  daily_quiz_complete: 1,
  article_read: 0.3,
  poll_vote: 0.5,
  event_rsvp: 2,
  share: 5,
};

const SCORED_ACTIONS = Object.keys(ACTION_WEIGHTS);

// ── Helpers ───────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get Monday of the given week (ISO week start).
 */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}

// ── Main seed function ────────────────────────────────────────────────────

async function seedBranches() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ───────────────────────────────────────────
    const existingBranches = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "branches"`,
    )) as { count: string }[];
    const branchCount = parseInt(existingBranches[0].count, 10);

    if (branchCount > 0 && !forceReseed) {
      console.log(
        `Table already has ${branchCount} branches. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && branchCount > 0) {
      console.log('Deleting existing branch data...');
      await queryRunner.query(`DELETE FROM "branch_weekly_scores"`);
      // Clear branchId on all app_users before deleting branches
      await queryRunner.query(`UPDATE "app_users" SET "branchId" = NULL`);
      await queryRunner.query(`DELETE FROM "branches"`);
      console.log('Cleared existing branch data.');
    }

    // ── Insert branches ───────────────────────────────────────────────
    console.log('\nSeeding branches...');

    const branchIds: string[] = [];

    for (const def of BRANCHES) {
      const result = (await queryRunner.query(
        `INSERT INTO "branches" ("id", "name", "district", "city", "memberCount", "isActive", "createdAt", "updatedAt")
         VALUES (uuid_generate_v4(), $1, $2, $3, 0, true, NOW(), NOW())
         RETURNING "id"`,
        [def.name, def.district, def.city],
      )) as Array<{ id: string }>;

      branchIds.push(result[0].id);
      console.log(`  Created: ${def.name} (${def.district})`);
    }

    console.log(`\nCreated ${branchIds.length} branches.`);

    // ── Assign app users to random branches ────────────────────────────
    console.log('\nAssigning app users to branches...');

    const appUsers = (await queryRunner.query(
      `SELECT "id", "displayName", "isActive" FROM "app_users" ORDER BY "createdAt"`,
    )) as Array<{ id: string; displayName: string; isActive: boolean }>;

    if (appUsers.length === 0) {
      console.error('No app users found! Run seed-app-users.ts first.');
      await queryRunner.rollbackTransaction();
      process.exit(1);
    }

    // Assign ~80% of users to branches
    let assignedCount = 0;
    const branchMemberCounts: Record<string, number> = {};
    for (const bid of branchIds) {
      branchMemberCounts[bid] = 0;
    }

    for (const user of appUsers) {
      // 80% chance of being assigned
      if (Math.random() > 0.8) continue;

      const branchId = branchIds[Math.floor(Math.random() * branchIds.length)];
      await queryRunner.query(
        `UPDATE "app_users" SET "branchId" = $1 WHERE "id" = $2`,
        [branchId, user.id],
      );

      if (user.isActive) {
        branchMemberCounts[branchId] = (branchMemberCounts[branchId] || 0) + 1;
      }
      assignedCount++;
    }

    // Update memberCount on each branch
    for (const [branchId, count] of Object.entries(branchMemberCounts)) {
      await queryRunner.query(
        `UPDATE "branches" SET "memberCount" = $1 WHERE "id" = $2`,
        [count, branchId],
      );
    }

    console.log(`Assigned ${assignedCount} of ${appUsers.length} users to branches.`);

    // ── Generate weekly scores for 3 weeks ─────────────────────────────
    console.log('\nGenerating weekly scores...');

    const today = new Date();
    const weeks: string[] = [];

    // Current week + 2 previous weeks
    for (let w = 0; w < 3; w++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - w * 7);
      weeks.push(getMonday(d));
    }

    // Reverse so oldest first
    weeks.reverse();
    console.log(`  Weeks: ${weeks.join(', ')}`);

    let totalScoreEntries = 0;

    for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
      const weekStart = weeks[weekIdx];
      console.log(`\n  Week ${weekStart}:`);

      // Collect scored branches for ranking
      const branchScores: Array<{
        branchId: string;
        totalScore: number;
        perCapitaScore: number;
        activeMemberCount: number;
        scoreBreakdown: Record<string, number>;
      }> = [];

      for (let i = 0; i < branchIds.length; i++) {
        const branchId = branchIds[i];
        const memberCount = branchMemberCounts[branchId] || 0;

        if (memberCount === 0) continue;

        // Generate random scores per action type
        const scoreBreakdown: Record<string, number> = {};
        let totalScore = 0;

        for (const action of SCORED_ACTIONS) {
          // Random raw points: proportional to member count
          const rawPoints = randomInt(
            memberCount * 2,
            memberCount * 15,
          );
          const weighted =
            Math.round(rawPoints * ACTION_WEIGHTS[action] * 100) / 100;
          scoreBreakdown[action] = weighted;
          totalScore += weighted;
        }

        totalScore = Math.round(totalScore * 100) / 100;
        const perCapitaScore =
          Math.round((totalScore / memberCount) * 100) / 100;

        branchScores.push({
          branchId,
          totalScore,
          perCapitaScore,
          activeMemberCount: memberCount,
          scoreBreakdown,
        });
      }

      // Sort by perCapitaScore for ranking
      branchScores.sort((a, b) => b.perCapitaScore - a.perCapitaScore);

      // Get previous week's ranks for prevRank
      let prevRankMap: Record<string, number> = {};
      if (weekIdx > 0) {
        const prevScores = (await queryRunner.query(
          `SELECT "branchId", "rank" FROM "branch_weekly_scores" WHERE "weekStart" = $1`,
          [weeks[weekIdx - 1]],
        )) as Array<{ branchId: string; rank: number }>;

        for (const ps of prevScores) {
          prevRankMap[ps.branchId] = ps.rank;
        }
      }

      // Insert scores
      for (let rank = 0; rank < branchScores.length; rank++) {
        const s = branchScores[rank];
        const currentRank = rank + 1;
        const prevRank = prevRankMap[s.branchId] || null;

        await queryRunner.query(
          `INSERT INTO "branch_weekly_scores"
             ("id", "branchId", "weekStart", "totalScore", "perCapitaScore",
              "activeMemberCount", "rank", "prevRank", "scoreBreakdown", "createdAt")
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())`,
          [
            s.branchId,
            weekStart,
            s.totalScore,
            s.perCapitaScore,
            s.activeMemberCount,
            currentRank,
            prevRank,
            JSON.stringify(s.scoreBreakdown),
          ],
        );

        totalScoreEntries++;

        const branchDef = BRANCHES[branchIds.indexOf(s.branchId)];
        const rankDelta =
          prevRank != null
            ? prevRank - currentRank > 0
              ? ` (+${prevRank - currentRank})`
              : prevRank - currentRank < 0
                ? ` (${prevRank - currentRank})`
                : ' (=)'
            : '';

        console.log(
          `    #${String(currentRank).padStart(2)} ${(branchDef?.name || s.branchId).padEnd(25)} ` +
            `per-capita: ${String(s.perCapitaScore).padStart(7)} | ` +
            `total: ${String(s.totalScore).padStart(8)} | ` +
            `members: ${String(s.activeMemberCount).padStart(3)}${rankDelta}`,
        );
      }
    }

    // ── Commit ─────────────────────────────────────────────────────────
    await queryRunner.commitTransaction();

    // ── Summary ────────────────────────────────────────────────────────
    console.log('\n--- Seed complete ---');
    console.log(`  Branches created:       ${branchIds.length}`);
    console.log(`  Users assigned:         ${assignedCount}`);
    console.log(`  Weekly score entries:   ${totalScoreEntries}`);
    console.log(`  Weeks covered:          ${weeks.join(', ')}`);

    // District breakdown
    console.log('\n  District breakdown:');
    const districtCounts: Record<string, number> = {};
    for (const def of BRANCHES) {
      districtCounts[def.district] = (districtCounts[def.district] || 0) + 1;
    }
    for (const [district, count] of Object.entries(districtCounts)) {
      console.log(`    ${district.padEnd(15)} ${count} branches`);
    }
  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedBranches();
