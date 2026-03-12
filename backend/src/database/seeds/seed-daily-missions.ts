import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed script for daily missions pool + sample user assignments.
 *
 * Prerequisites: seed-app-users.ts must have been run first.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-daily-missions.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-daily-missions.ts --force  # replace existing
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

// ── Mission type + frequency enums (must match entity enums) ────────────────

type MissionType =
  | 'read_article'
  | 'complete_quiz'
  | 'vote_poll'
  | 'share_content'
  | 'check_membership'
  | 'rsvp_event'
  | 'view_candidate'
  | 'use_matcher';

type MissionFrequency = 'daily' | 'weekly' | 'once_per_cycle';

// ── Mission pool definitions ────────────────────────────────────────────────

interface MissionDefinition {
  type: MissionType;
  descriptionHe: string;
  descriptionEn: string;
  points: number;
  frequency: MissionFrequency;
  iconName: string;
}

const MISSION_POOL: MissionDefinition[] = [
  {
    type: 'read_article',
    descriptionHe: 'קרא כתבה היום',
    descriptionEn: "Read today's top article",
    points: 5,
    frequency: 'daily',
    iconName: 'article',
  },
  {
    type: 'read_article',
    descriptionHe: 'קרא 3 כתבות',
    descriptionEn: 'Read 3 articles',
    points: 15,
    frequency: 'daily',
    iconName: 'library_books',
  },
  {
    type: 'complete_quiz',
    descriptionHe: 'השלם את החידון היומי',
    descriptionEn: 'Complete the daily quiz',
    points: 20,
    frequency: 'daily',
    iconName: 'quiz',
  },
  {
    type: 'vote_poll',
    descriptionHe: 'הצבע בסקר',
    descriptionEn: "Vote in today's poll",
    points: 10,
    frequency: 'daily',
    iconName: 'how_to_vote',
  },
  {
    type: 'share_content',
    descriptionHe: 'שתף כתבה בוואטסאפ',
    descriptionEn: 'Share an article to WhatsApp',
    points: 15,
    frequency: 'daily',
    iconName: 'share',
  },
  {
    type: 'share_content',
    descriptionHe: 'שתף תוצאות החידון',
    descriptionEn: 'Share your quiz results',
    points: 15,
    frequency: 'daily',
    iconName: 'share',
  },
  {
    type: 'check_membership',
    descriptionHe: 'בדוק את סטטוס החברות שלך',
    descriptionEn: 'Check your membership status',
    points: 20,
    frequency: 'weekly',
    iconName: 'card_membership',
  },
  {
    type: 'rsvp_event',
    descriptionHe: 'אשר הגעה לאירוע',
    descriptionEn: 'RSVP to an upcoming event',
    points: 25,
    frequency: 'daily',
    iconName: 'event_available',
  },
  {
    type: 'view_candidate',
    descriptionHe: 'צפה בפרופיל מועמד',
    descriptionEn: 'View a candidate profile',
    points: 8,
    frequency: 'daily',
    iconName: 'person_search',
  },
  {
    type: 'use_matcher',
    descriptionHe: 'מצא את המועמד שלך',
    descriptionEn: 'Use the candidate matcher',
    points: 30,
    frequency: 'once_per_cycle',
    iconName: 'psychology',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function randomCompletedAt(dateStr: string): Date {
  // Random time today between 06:00 and 22:00
  const hours = Math.floor(Math.random() * 16) + 6;
  const minutes = Math.floor(Math.random() * 60);
  return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Main seed function ──────────────────────────────────────────────────────

async function seedDailyMissions() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ───────────────────────────────────────────
    const existingMissions = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "daily_missions"`,
    )) as { count: string }[];
    const missionsCount = parseInt(existingMissions[0].count, 10);

    if (missionsCount > 0 && !forceReseed) {
      console.log(
        `Table already has ${missionsCount} missions. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && missionsCount > 0) {
      console.log('Deleting existing daily mission data...');
      await queryRunner.query(`DELETE FROM "user_daily_missions"`);
      await queryRunner.query(`DELETE FROM "daily_missions"`);
      console.log('Cleared existing daily mission data.');
    }

    // ── Insert mission pool ───────────────────────────────────────────
    console.log('\nSeeding daily_missions pool...');

    const insertedMissionIds: string[] = [];

    for (const mission of MISSION_POOL) {
      const result = (await queryRunner.query(
        `INSERT INTO "daily_missions"
           ("id", "type", "descriptionHe", "descriptionEn", "points", "iconName", "isActive", "frequency")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)
         RETURNING "id"`,
        [
          mission.type,
          mission.descriptionHe,
          mission.descriptionEn,
          mission.points,
          mission.iconName,
          true,
          mission.frequency,
        ],
      )) as { id: string }[];

      insertedMissionIds.push(result[0].id);

      console.log(
        `  [${mission.frequency.padEnd(14)}] ${mission.descriptionHe.padEnd(25)} / ${mission.descriptionEn.padEnd(35)} +${mission.points} pts`,
      );
    }

    console.log(`\nInserted ${insertedMissionIds.length} missions into the pool.`);

    // ── Seed sample user_daily_missions ───────────────────────────────
    console.log('\nSeeding user_daily_missions...');

    // Fetch first 8 app users
    const appUsers = (await queryRunner.query(
      `SELECT "id", "displayName" FROM "app_users" WHERE "isActive" = true ORDER BY "createdAt" LIMIT 8`,
    )) as Array<{ id: string; displayName: string }>;

    if (appUsers.length === 0) {
      console.error('No app users found! Run seed-app-users.ts first.');
      await queryRunner.rollbackTransaction();
      process.exit(1);
    }

    // Take 5-8 users (whichever we have)
    const selectedUsers = appUsers.slice(0, Math.min(8, appUsers.length));
    console.log(`Assigning missions to ${selectedUsers.length} users for today.`);

    const today = todayDateString();
    let totalAssignments = 0;
    let totalCompleted = 0;

    // Completion patterns per user index — varying completion states
    // true = completed, false = not completed
    const completionPatterns: boolean[][] = [
      [true, true, true],    // User 0: all done
      [true, true, false],   // User 1: 2 of 3
      [true, false, false],  // User 2: 1 of 3
      [false, false, false], // User 3: none done
      [true, true, false],   // User 4: 2 of 3
      [false, true, false],  // User 5: 1 of 3
      [true, false, true],   // User 6: 2 of 3
      [false, false, false], // User 7: none done
    ];

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      const pattern = completionPatterns[i] || [false, false, false];

      // Pick 3 random missions for this user
      const userMissionIds = pickRandom(insertedMissionIds, 3);

      const userMissionDetails: string[] = [];

      for (let j = 0; j < userMissionIds.length; j++) {
        const missionId = userMissionIds[j];
        const isCompleted = pattern[j];
        const completedAt = isCompleted ? randomCompletedAt(today) : null;

        await queryRunner.query(
          `INSERT INTO "user_daily_missions"
             ("id", "appUserId", "missionId", "date", "isCompleted", "completedAt")
           VALUES
             (uuid_generate_v4(), $1, $2, $3, $4, $5)`,
          [
            user.id,
            missionId,
            today,
            isCompleted,
            completedAt,
          ],
        );

        totalAssignments++;
        if (isCompleted) totalCompleted++;

        // Fetch mission description for logging
        const missionInfo = (await queryRunner.query(
          `SELECT "descriptionHe", "points" FROM "daily_missions" WHERE "id" = $1`,
          [missionId],
        )) as { descriptionHe: string; points: number }[];

        const status = isCompleted ? 'DONE' : 'TODO';
        userMissionDetails.push(
          `${status} ${missionInfo[0].descriptionHe} (+${missionInfo[0].points})`,
        );
      }

      console.log(`  ${user.displayName.padEnd(20)} → ${userMissionDetails.join(' | ')}`);
    }

    console.log(`\nTotal assignments: ${totalAssignments}`);
    console.log(`Completed: ${totalCompleted}  |  Pending: ${totalAssignments - totalCompleted}`);

    // ── Commit ────────────────────────────────────────────────────────
    await queryRunner.commitTransaction();

    // ── Summary ───────────────────────────────────────────────────────
    console.log('\n=== Daily Missions seed complete! ===');
    console.log(`  - Mission pool:         ${insertedMissionIds.length} missions`);
    console.log(`  - Users assigned:       ${selectedUsers.length}`);
    console.log(`  - Total assignments:    ${totalAssignments}`);
    console.log(`  - Completed:            ${totalCompleted}`);
    console.log(`  - Pending:              ${totalAssignments - totalCompleted}`);
    console.log(`  - Date:                 ${today}`);

    // Frequency breakdown
    console.log('\n  - Pool breakdown by frequency:');
    const freqCounts: Record<string, number> = {};
    for (const m of MISSION_POOL) {
      freqCounts[m.frequency] = (freqCounts[m.frequency] || 0) + 1;
    }
    for (const [freq, cnt] of Object.entries(freqCounts)) {
      console.log(`      ${freq.padEnd(16)} ${cnt} missions`);
    }

    // Type breakdown
    console.log('\n  - Pool breakdown by type:');
    const typeCounts: Record<string, number> = {};
    for (const m of MISSION_POOL) {
      typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
    }
    for (const [type, cnt] of Object.entries(typeCounts)) {
      console.log(`      ${type.padEnd(20)} ${cnt} ${cnt > 1 ? 'variants' : 'variant'}`);
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

void seedDailyMissions();
