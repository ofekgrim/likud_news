import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed script for gamification data (user_points + user_badges).
 *
 * Prerequisites: seed-app-users.ts must have been run first.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-gamification.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-gamification.ts --force  # replace existing
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

// ── Point Action enum values (must match point_action_enum) ─────────────────

type PointAction =
  | 'quiz_complete'
  | 'endorsement'
  | 'poll_vote'
  | 'event_rsvp'
  | 'comment'
  | 'share'
  | 'login_streak'
  | 'profile_complete';

type BadgeType =
  | 'quiz_taker'
  | 'first_vote'
  | 'endorser'
  | 'poll_voter'
  | 'event_goer'
  | 'top_contributor'
  | 'early_bird'
  | 'social_sharer';

// ── Points per action (matches what the app awards in practice) ─────────────

const POINTS_MAP: Record<PointAction, number> = {
  quiz_complete: 50,
  endorsement: 20,
  poll_vote: 15,
  event_rsvp: 30,
  comment: 10,
  share: 5,
  login_streak: 10,
  profile_complete: 25,
};

// ── Badge thresholds (from GamificationService.checkAndAwardBadges) ─────────

const BADGE_THRESHOLDS: Array<{
  badge: BadgeType;
  action: PointAction;
  threshold: number;
}> = [
  { badge: 'quiz_taker', action: 'quiz_complete', threshold: 1 },
  { badge: 'first_vote', action: 'poll_vote', threshold: 1 },
  { badge: 'endorser', action: 'endorsement', threshold: 1 },
  { badge: 'poll_voter', action: 'poll_vote', threshold: 3 },
  { badge: 'event_goer', action: 'event_rsvp', threshold: 3 },
  { badge: 'social_sharer', action: 'share', threshold: 5 },
  { badge: 'early_bird', action: 'login_streak', threshold: 7 },
  // top_contributor is points-based (≥500), handled separately
];

// ── User activity profiles ──────────────────────────────────────────────────
// Each profile defines how many of each action a user should have.
// We'll assign profiles to users based on their role.

interface ActivityProfile {
  label: string;
  actions: Partial<Record<PointAction, number>>;
}

// Power user — verified members who are very active
const powerUser: ActivityProfile = {
  label: 'power',
  actions: {
    quiz_complete: 3,
    endorsement: 8,
    poll_vote: 6,
    event_rsvp: 5,
    comment: 15,
    share: 10,
    login_streak: 12,
    profile_complete: 1,
  },
};

// Active user — regular members
const activeUser: ActivityProfile = {
  label: 'active',
  actions: {
    quiz_complete: 2,
    endorsement: 4,
    poll_vote: 4,
    event_rsvp: 3,
    comment: 8,
    share: 6,
    login_streak: 8,
    profile_complete: 1,
  },
};

// Moderate user — casual members
const moderateUser: ActivityProfile = {
  label: 'moderate',
  actions: {
    quiz_complete: 1,
    endorsement: 2,
    poll_vote: 3,
    event_rsvp: 1,
    comment: 4,
    share: 3,
    login_streak: 5,
    profile_complete: 1,
  },
};

// Light user — guests who just browse
const lightUser: ActivityProfile = {
  label: 'light',
  actions: {
    poll_vote: 1,
    comment: 2,
    share: 1,
    login_streak: 3,
  },
};

// Minimal user — barely engaged
const minimalUser: ActivityProfile = {
  label: 'minimal',
  actions: {
    comment: 1,
    login_streak: 1,
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function randomMetadata(action: PointAction): Record<string, unknown> {
  switch (action) {
    case 'quiz_complete':
      return { score: Math.floor(Math.random() * 40) + 60 }; // 60-100
    case 'endorsement':
      return { candidateIndex: Math.floor(Math.random() * 5) };
    case 'poll_vote':
      return { pollIndex: Math.floor(Math.random() * 10) };
    case 'event_rsvp':
      return { eventIndex: Math.floor(Math.random() * 8) };
    case 'comment':
      return { articleIndex: Math.floor(Math.random() * 20) };
    case 'share':
      return {
        platform: ['whatsapp', 'telegram', 'facebook', 'twitter', 'copy_link'][
          Math.floor(Math.random() * 5)
        ],
      };
    case 'login_streak':
      return { day: Math.floor(Math.random() * 30) + 1 };
    case 'profile_complete':
      return { fields: ['avatar', 'bio', 'phone'] };
    default:
      return {};
  }
}

// ── Main seed function ──────────────────────────────────────────────────────

async function seedGamification() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ───────────────────────────────────────────
    const existingPoints = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "user_points"`,
    )) as { count: string }[];
    const pointsCount = parseInt(existingPoints[0].count, 10);

    if (pointsCount > 0 && !forceReseed) {
      console.log(
        `Table already has ${pointsCount} point entries. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && pointsCount > 0) {
      console.log('Deleting existing gamification data...');
      await queryRunner.query(`DELETE FROM "user_badges"`);
      await queryRunner.query(`DELETE FROM "user_points"`);
      console.log('Cleared existing gamification data.');
    }

    // ── Fetch all app users ───────────────────────────────────────────
    const appUsers = (await queryRunner.query(
      `SELECT "id", "displayName", "role", "isActive" FROM "app_users" ORDER BY "createdAt"`,
    )) as Array<{
      id: string;
      displayName: string;
      role: string;
      isActive: boolean;
    }>;

    if (appUsers.length === 0) {
      console.error('No app users found! Run seed-app-users.ts first.');
      await queryRunner.rollbackTransaction();
      process.exit(1);
    }

    console.log(`Found ${appUsers.length} app users.`);

    // ── Assign activity profiles to users ─────────────────────────────
    // Verified members → power or active
    // Members → active or moderate
    // Guests → moderate, light, or minimal
    // Inactive → minimal

    const userProfiles: Array<{
      userId: string;
      displayName: string;
      role: string;
      profile: ActivityProfile;
    }> = [];

    let verifiedIdx = 0;
    let memberIdx = 0;
    let guestIdx = 0;

    for (const user of appUsers) {
      let profile: ActivityProfile;

      if (!user.isActive) {
        profile = minimalUser;
      } else if (user.role === 'verified_member') {
        // Alternate power and active for verified members
        profile = verifiedIdx % 3 === 0 ? powerUser : activeUser;
        verifiedIdx++;
      } else if (user.role === 'member') {
        // Alternate active and moderate for members
        profile = memberIdx % 3 === 0 ? activeUser : moderateUser;
        memberIdx++;
      } else {
        // Guests: light or minimal, some moderate
        const patterns = [moderateUser, lightUser, lightUser, minimalUser];
        profile = patterns[guestIdx % patterns.length];
        guestIdx++;
      }

      userProfiles.push({
        userId: user.id,
        displayName: user.displayName,
        role: user.role,
        profile,
      });
    }

    // ── Insert user_points ────────────────────────────────────────────
    console.log('\nSeeding user_points...');

    let totalPointsInserted = 0;
    const userPointTotals: Map<string, number> = new Map();
    const userActionCounts: Map<string, Map<PointAction, number>> = new Map();

    // Date range: activities spread over the last 6 months
    const dateStart = new Date('2025-09-01');
    const dateEnd = new Date('2026-02-25');

    for (const { userId, displayName, role, profile } of userProfiles) {
      const actionCounts = new Map<PointAction, number>();
      let userTotal = 0;

      for (const [action, count] of Object.entries(profile.actions) as Array<
        [PointAction, number]
      >) {
        const pts = POINTS_MAP[action];

        for (let i = 0; i < count; i++) {
          const earnedAt = randomDate(dateStart, dateEnd);
          const metadata = randomMetadata(action);

          await queryRunner.query(
            `INSERT INTO "user_points"
               ("id", "userId", "action", "points", "metadata", "earnedAt")
             VALUES
               (uuid_generate_v4(), $1, $2, $3, $4::jsonb, $5)`,
            [
              userId,
              action,
              pts,
              JSON.stringify(metadata),
              earnedAt,
            ],
          );

          totalPointsInserted++;
          userTotal += pts;
        }

        actionCounts.set(action, count);
      }

      userPointTotals.set(userId, userTotal);
      userActionCounts.set(userId, actionCounts);

      const roleTag =
        role === 'guest'
          ? 'GUEST'
          : role === 'member'
            ? 'MEMBER'
            : 'VERIFIED';
      console.log(
        `  ${displayName.padEnd(20)} (${roleTag.padEnd(8)}) ${profile.label.padEnd(8)} → ${userTotal} pts`,
      );
    }

    console.log(`\nTotal point entries: ${totalPointsInserted}`);

    // ── Insert user_badges ────────────────────────────────────────────
    console.log('\nSeeding user_badges...');

    let totalBadgesInserted = 0;

    for (const { userId, displayName } of userProfiles) {
      const actionCounts = userActionCounts.get(userId)!;
      const totalPts = userPointTotals.get(userId) || 0;
      const earnedBadges: BadgeType[] = [];

      // Check threshold-based badges
      for (const { badge, action, threshold } of BADGE_THRESHOLDS) {
        const count = actionCounts.get(action) || 0;
        if (count >= threshold) {
          earnedBadges.push(badge);
        }
      }

      // Check top_contributor (points-based)
      if (totalPts >= 500) {
        earnedBadges.push('top_contributor');
      }

      // Insert badges with earned dates slightly after their qualifying actions
      for (const badge of earnedBadges) {
        const earnedAt = randomDate(
          new Date('2025-10-01'),
          new Date('2026-02-25'),
        );

        await queryRunner.query(
          `INSERT INTO "user_badges"
             ("id", "userId", "badgeType", "earnedAt")
           VALUES
             (uuid_generate_v4(), $1, $2, $3)`,
          [userId, badge, earnedAt],
        );

        totalBadgesInserted++;
      }

      if (earnedBadges.length > 0) {
        console.log(
          `  ${displayName.padEnd(20)} → ${earnedBadges.length} badges: ${earnedBadges.join(', ')}`,
        );
      }
    }

    console.log(`\nTotal badges inserted: ${totalBadgesInserted}`);

    // ── Commit ────────────────────────────────────────────────────────
    await queryRunner.commitTransaction();

    // ── Summary ───────────────────────────────────────────────────────
    console.log('\n✅ Gamification seed complete!');
    console.log(`  - Users with activity:  ${userProfiles.length}`);
    console.log(`  - Total point entries:  ${totalPointsInserted}`);
    console.log(`  - Total badges:         ${totalBadgesInserted}`);
    console.log('  - Activity profiles:');
    const profileCounts = { power: 0, active: 0, moderate: 0, light: 0, minimal: 0 };
    for (const { profile } of userProfiles) {
      profileCounts[profile.label as keyof typeof profileCounts]++;
    }
    for (const [label, cnt] of Object.entries(profileCounts)) {
      console.log(`      ${label.padEnd(10)} ${cnt} users`);
    }

    // Leaderboard preview
    console.log('\n  - Top 5 leaderboard:');
    const sorted = [...userPointTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (let i = 0; i < sorted.length; i++) {
      const [uid, pts] = sorted[i];
      const user = userProfiles.find((u) => u.userId === uid)!;
      console.log(
        `      #${i + 1} ${user.displayName.padEnd(20)} ${pts} pts`,
      );
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

void seedGamification();
