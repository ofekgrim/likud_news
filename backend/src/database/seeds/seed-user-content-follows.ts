import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed script for user_content_follows (personalized feed data).
 *
 * Prerequisites: seed-app-users.ts must have been run first.
 * Also expects categories, authors, members, and tags to exist.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-user-content-follows.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-user-content-follows.ts --force  # replace existing
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

// ── Content follow type enum (must match content_follow_type_enum) ───────────

type ContentFollowType = 'category' | 'member' | 'author' | 'tag';

// ── Follow profiles — vary follow counts by user engagement level ────────────

interface FollowProfile {
  label: string;
  categories: [number, number]; // [min, max] follows
  authors: [number, number];
  members: [number, number];
  tags: [number, number];
}

// Power user — follows a lot of content
const powerProfile: FollowProfile = {
  label: 'power',
  categories: [3, 4],
  authors: [2, 3],
  members: [2, 2],
  tags: [4, 5],
};

// Active user — regular follower
const activeProfile: FollowProfile = {
  label: 'active',
  categories: [3, 4],
  authors: [2, 3],
  members: [1, 2],
  tags: [3, 4],
};

// Moderate user — follows some content
const moderateProfile: FollowProfile = {
  label: 'moderate',
  categories: [2, 3],
  authors: [1, 2],
  members: [1, 1],
  tags: [2, 3],
};

// Light user — minimal follows
const lightProfile: FollowProfile = {
  label: 'light',
  categories: [2, 2],
  authors: [1, 1],
  members: [1, 1],
  tags: [2, 2],
};

// Minimal user — barely any follows
const minimalProfile: FollowProfile = {
  label: 'minimal',
  categories: [2, 2],
  authors: [1, 1],
  members: [0, 1],
  tags: [2, 2],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

/**
 * Pick `count` random unique items from an array.
 * If the array has fewer items than `count`, returns all items (shuffled).
 */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ── Main seed function ──────────────────────────────────────────────────────

async function seedUserContentFollows() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ───────────────────────────────────────────
    const existingFollows = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "user_content_follows"`,
    )) as { count: string }[];
    const followsCount = parseInt(existingFollows[0].count, 10);

    if (followsCount > 0 && !forceReseed) {
      console.log(
        `Table already has ${followsCount} follow entries. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && followsCount > 0) {
      console.log('Deleting existing user content follows...');
      await queryRunner.query(`DELETE FROM "user_content_follows"`);
      console.log('Cleared existing follows data.');
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

    // ── Fetch followable content ──────────────────────────────────────
    const categories = (await queryRunner.query(
      `SELECT "id", "name" FROM "categories" WHERE "isActive" = true ORDER BY "sortOrder"`,
    )) as Array<{ id: string; name: string }>;

    const authors = (await queryRunner.query(
      `SELECT "id", "nameHe" FROM "authors" WHERE "isActive" = true ORDER BY "createdAt"`,
    )) as Array<{ id: string; nameHe: string }>;

    const members = (await queryRunner.query(
      `SELECT "id", "name" FROM "members" WHERE "isActive" = true ORDER BY "sortOrder"`,
    )) as Array<{ id: string; name: string }>;

    const tags = (await queryRunner.query(
      `SELECT "id", "nameHe" FROM "tags" ORDER BY "createdAt"`,
    )) as Array<{ id: string; nameHe: string }>;

    console.log(`Available content to follow:`);
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Authors:    ${authors.length}`);
    console.log(`  Members:    ${members.length}`);
    console.log(`  Tags:       ${tags.length}`);

    if (
      categories.length === 0 &&
      authors.length === 0 &&
      members.length === 0 &&
      tags.length === 0
    ) {
      console.warn(
        'No followable content found. Seed categories, authors, members, and tags first.',
      );
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ── Assign follow profiles to users ───────────────────────────────
    // Verified members -> power or active
    // Members -> active or moderate
    // Guests -> moderate, light, or minimal
    // Inactive -> minimal

    const userProfiles: Array<{
      userId: string;
      displayName: string;
      role: string;
      profile: FollowProfile;
    }> = [];

    let verifiedIdx = 0;
    let memberIdx = 0;
    let guestIdx = 0;

    for (const user of appUsers) {
      let profile: FollowProfile;

      if (!user.isActive) {
        profile = minimalProfile;
      } else if (user.role === 'verified_member') {
        profile = verifiedIdx % 3 === 0 ? powerProfile : activeProfile;
        verifiedIdx++;
      } else if (user.role === 'member') {
        profile = memberIdx % 3 === 0 ? activeProfile : moderateProfile;
        memberIdx++;
      } else {
        const patterns = [moderateProfile, lightProfile, lightProfile, minimalProfile];
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

    // ── Insert user_content_follows ───────────────────────────────────
    console.log('\nSeeding user_content_follows...');

    let totalFollowsInserted = 0;
    const typeCounts: Record<ContentFollowType, number> = {
      category: 0,
      author: 0,
      member: 0,
      tag: 0,
    };

    // Date range: follows created over the last 6 months
    const dateStart = new Date('2025-09-01');
    const dateEnd = new Date('2026-02-25');

    for (const { userId, displayName, role, profile } of userProfiles) {
      let userFollowCount = 0;
      const followDetails: string[] = [];

      // ── Category follows ──────────────────────────────────────────
      if (categories.length > 0) {
        const count = randomInt(...profile.categories);
        const picked = pickRandom(categories, count);
        for (const cat of picked) {
          const createdAt = randomDate(dateStart, dateEnd);
          await queryRunner.query(
            `INSERT INTO "user_content_follows"
               ("id", "userId", "type", "targetId", "createdAt")
             VALUES
               (uuid_generate_v4(), $1, $2, $3, $4)`,
            [userId, 'category', cat.id, createdAt],
          );
          userFollowCount++;
          typeCounts.category++;
        }
        followDetails.push(`${picked.length} cat`);
      }

      // ── Author follows ────────────────────────────────────────────
      if (authors.length > 0) {
        const count = randomInt(...profile.authors);
        const picked = pickRandom(authors, count);
        for (const author of picked) {
          const createdAt = randomDate(dateStart, dateEnd);
          await queryRunner.query(
            `INSERT INTO "user_content_follows"
               ("id", "userId", "type", "targetId", "createdAt")
             VALUES
               (uuid_generate_v4(), $1, $2, $3, $4)`,
            [userId, 'author', author.id, createdAt],
          );
          userFollowCount++;
          typeCounts.author++;
        }
        followDetails.push(`${picked.length} auth`);
      }

      // ── Member follows ────────────────────────────────────────────
      if (members.length > 0) {
        const count = randomInt(...profile.members);
        if (count > 0) {
          const picked = pickRandom(members, count);
          for (const member of picked) {
            const createdAt = randomDate(dateStart, dateEnd);
            await queryRunner.query(
              `INSERT INTO "user_content_follows"
                 ("id", "userId", "type", "targetId", "createdAt")
               VALUES
                 (uuid_generate_v4(), $1, $2, $3, $4)`,
              [userId, 'member', member.id, createdAt],
            );
            userFollowCount++;
            typeCounts.member++;
          }
          followDetails.push(`${picked.length} mem`);
        }
      }

      // ── Tag follows ───────────────────────────────────────────────
      if (tags.length > 0) {
        const count = randomInt(...profile.tags);
        const picked = pickRandom(tags, count);
        for (const tag of picked) {
          const createdAt = randomDate(dateStart, dateEnd);
          await queryRunner.query(
            `INSERT INTO "user_content_follows"
               ("id", "userId", "type", "targetId", "createdAt")
             VALUES
               (uuid_generate_v4(), $1, $2, $3, $4)`,
            [userId, 'tag', tag.id, createdAt],
          );
          userFollowCount++;
          typeCounts.tag++;
        }
        followDetails.push(`${picked.length} tag`);
      }

      totalFollowsInserted += userFollowCount;

      const roleTag =
        role === 'guest'
          ? 'GUEST'
          : role === 'member'
            ? 'MEMBER'
            : 'VERIFIED';
      console.log(
        `  ${displayName.padEnd(20)} (${roleTag.padEnd(8)}) ${profile.label.padEnd(8)} -> ${userFollowCount} follows [${followDetails.join(', ')}]`,
      );
    }

    // ── Commit ────────────────────────────────────────────────────────
    await queryRunner.commitTransaction();

    // ── Summary ───────────────────────────────────────────────────────
    console.log('\nSeed complete!');
    console.log(`  - Users processed:     ${userProfiles.length}`);
    console.log(`  - Total follows:       ${totalFollowsInserted}`);
    console.log(`  - By type:`);
    console.log(`      category:  ${typeCounts.category}`);
    console.log(`      author:    ${typeCounts.author}`);
    console.log(`      member:    ${typeCounts.member}`);
    console.log(`      tag:       ${typeCounts.tag}`);
    console.log(`  - Follow profiles:`);
    const profileCounts = { power: 0, active: 0, moderate: 0, light: 0, minimal: 0 };
    for (const { profile } of userProfiles) {
      profileCounts[profile.label as keyof typeof profileCounts]++;
    }
    for (const [label, cnt] of Object.entries(profileCounts)) {
      console.log(`      ${label.padEnd(10)} ${cnt} users`);
    }

    // ── Top followers preview ─────────────────────────────────────────
    const topFollowers = (await AppDataSource.query(
      `SELECT "userId", COUNT(*) as count
       FROM "user_content_follows"
       GROUP BY "userId"
       ORDER BY count DESC
       LIMIT 5`,
    )) as Array<{ userId: string; count: string }>;

    if (topFollowers.length > 0) {
      console.log('\n  - Top 5 followers:');
      for (let i = 0; i < topFollowers.length; i++) {
        const { userId, count } = topFollowers[i];
        const user = userProfiles.find((u) => u.userId === userId);
        const name = user?.displayName || userId.slice(0, 8);
        console.log(
          `      #${i + 1} ${name.padEnd(20)} ${count} follows`,
        );
      }
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

void seedUserContentFollows();
