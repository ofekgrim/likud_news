/**
 * Seed script: GOTV (Get Out The Vote) engagement data.
 *
 * Creates gotv_engagement records for existing app users linked to the active election.
 * Generates a mix of engagement states: planned, checked-in, badge-claimed, notified, snoozed.
 *
 * Prerequisites: seed-app-users.ts and seed-elections.ts must have been run first.
 *
 * Usage:
 *   cd backend && npx ts-node src/database/seeds/seed-gotv.ts          # skip if exists
 *   cd backend && npx ts-node src/database/seeds/seed-gotv.ts --force  # replace existing
 */

import { AppDataSource } from '../data-source';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns a date in Israeli timezone (UTC+2 / UTC+3) at a given hour. */
function israelDate(baseDate: Date, hour: number, minuteRange = 59): Date {
  const d = new Date(baseDate);
  d.setHours(hour, rand(0, minuteRange), rand(0, 59), 0);
  return d;
}

/** Returns a date N days before the given date at a specific hour. */
function daysBefore(baseDate: Date, days: number, hour: number): Date {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Engagement profiles — each defines a different GOTV state
// ---------------------------------------------------------------------------

interface NotificationEntry {
  type: string;
  sentAt: string;
}

/**
 * Builds a full notification sequence relative to the election date.
 * The standard GOTV notification cadence:
 *   - pre_election_7d:        7 days before, 10:00
 *   - pre_election_3d:        3 days before, 10:00
 *   - pre_election_1d:        1 day before,  18:00
 *   - election_day_morning:   election day,  07:30
 *   - election_day_afternoon: election day,  14:00
 */
function fullNotificationSequence(electionDate: Date): NotificationEntry[] {
  return [
    { type: 'pre_election_7d', sentAt: daysBefore(electionDate, 7, 10).toISOString() },
    { type: 'pre_election_3d', sentAt: daysBefore(electionDate, 3, 10).toISOString() },
    { type: 'pre_election_1d', sentAt: daysBefore(electionDate, 1, 18).toISOString() },
    { type: 'election_day_morning', sentAt: israelDate(electionDate, 7, 30).toISOString() },
    { type: 'election_day_afternoon', sentAt: israelDate(electionDate, 14, 0).toISOString() },
  ];
}

interface EngagementProfile {
  label: string;
  hasVotingPlan: boolean;
  hasCheckin: boolean;
  hasBadge: boolean;
  notificationsSent: number;
  snoozedReminders: string[];
  remindersEnabled: boolean;
  /** Function that builds the notification log relative to the election date. */
  buildNotificationLog: (electionDate: Date) => NotificationEntry[];
}

const PROFILES: EngagementProfile[] = [
  // Full funnel — planned, checked in, claimed badge → full notification sequence
  {
    label: 'full_funnel',
    hasVotingPlan: true,
    hasCheckin: true,
    hasBadge: true,
    notificationsSent: 3,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[1], seq[3]]; // 7d, 3d, election morning
    },
  },
  {
    label: 'full_funnel',
    hasVotingPlan: true,
    hasCheckin: true,
    hasBadge: true,
    notificationsSent: 2,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[3]]; // 7d, election morning
    },
  },
  // Checked in but didn't claim badge → pre-election + election day morning
  {
    label: 'checked_in_no_badge',
    hasVotingPlan: true,
    hasCheckin: true,
    hasBadge: false,
    notificationsSent: 2,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[1]]; // 7d, 3d
    },
  },
  {
    label: 'checked_in_no_badge',
    hasVotingPlan: true,
    hasCheckin: true,
    hasBadge: false,
    notificationsSent: 1,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0]]; // 7d only
    },
  },
  // Planned but didn't show up → pre-election notifications
  {
    label: 'planned_only',
    hasVotingPlan: true,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 3,
    snoozedReminders: ['reminder_morning'],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[1], seq[2]]; // 7d, 3d, 1d
    },
  },
  {
    label: 'planned_only',
    hasVotingPlan: true,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 2,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[1]]; // 7d, 3d
    },
  },
  {
    label: 'planned_only',
    hasVotingPlan: true,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 4,
    snoozedReminders: ['reminder_morning', 'reminder_afternoon'],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[1], seq[2], seq[3]]; // 7d, 3d, 1d, election morning
    },
  },
  // Snoozed heavily, never voted — reminders DISABLED
  {
    label: 'snoozed',
    hasVotingPlan: true,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 5,
    snoozedReminders: ['reminder_morning', 'reminder_afternoon', 'reminder_evening'],
    remindersEnabled: false,
    buildNotificationLog: (ed) => fullNotificationSequence(ed), // got all 5 then disabled
  },
  {
    label: 'snoozed',
    hasVotingPlan: false,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 3,
    snoozedReminders: ['reminder_morning', 'reminder_afternoon'],
    remindersEnabled: false,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[1], seq[2]]; // 7d, 3d, 1d — then disabled
    },
  },
  // Notified but no plan set → only pre-election reminders
  {
    label: 'notified_only',
    hasVotingPlan: false,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 2,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0], seq[1]]; // 7d, 3d
    },
  },
  {
    label: 'notified_only',
    hasVotingPlan: false,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 1,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[0]]; // 7d only
    },
  },
  // Completely fresh — just created, no engagement, empty notification log
  {
    label: 'fresh',
    hasVotingPlan: false,
    hasCheckin: false,
    hasBadge: false,
    notificationsSent: 0,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: () => [],
  },
  // Walked in without a plan, checked in → only election day morning notification
  {
    label: 'walk_in',
    hasVotingPlan: false,
    hasCheckin: true,
    hasBadge: true,
    notificationsSent: 1,
    snoozedReminders: [],
    remindersEnabled: true,
    buildNotificationLog: (ed) => {
      const seq = fullNotificationSequence(ed);
      return [seq[3]]; // election_day_morning only
    },
  },
];

// Realistic voting plan hours (Israeli election day)
const PLAN_HOURS = [7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedGotv() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ── Check existing data ─────────────────────────────────────────────
    const existing = (await qr.query(
      `SELECT COUNT(*) AS count FROM "gotv_engagement"`,
    )) as { count: string }[];
    const existingCount = parseInt(existing[0].count, 10);

    if (existingCount > 0 && !forceReseed) {
      console.log(
        `Table already has ${existingCount} engagement records. Use --force to reseed.`,
      );
      await qr.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && existingCount > 0) {
      console.log('Deleting existing GOTV engagement data...');
      await qr.query(`DELETE FROM "gotv_engagement"`);
      console.log('Cleared existing GOTV data.');
    }

    // ── Fetch active election ───────────────────────────────────────────
    const elections = (await qr.query(
      `SELECT "id", "electionDate" FROM "primary_elections" WHERE "isActive" = true ORDER BY "electionDate" DESC LIMIT 1`,
    )) as { id: string; electionDate: string }[];

    if (elections.length === 0) {
      console.error('No active election found! Run seed-elections.ts first.');
      await qr.rollbackTransaction();
      process.exit(1);
    }

    const election = elections[0];
    const electionDate = new Date(election.electionDate);
    console.log(`Using election ${election.id} (date: ${electionDate.toISOString().split('T')[0]})`);

    // ── Fetch app users ─────────────────────────────────────────────────
    const appUsers = (await qr.query(
      `SELECT "id", "displayName" FROM "app_users" WHERE "isActive" = true ORDER BY "createdAt" LIMIT 15`,
    )) as { id: string; displayName: string }[];

    if (appUsers.length === 0) {
      console.error('No app users found! Run seed-app-users.ts first.');
      await qr.rollbackTransaction();
      process.exit(1);
    }

    console.log(`Found ${appUsers.length} active app users.`);

    // ── Fetch polling stations for this election ────────────────────────
    const stations = (await qr.query(
      `SELECT "id", "name" FROM "polling_stations" WHERE "electionId" = $1 LIMIT 20`,
      [election.id],
    )) as { id: string; name: string }[];

    const hasStations = stations.length > 0;
    if (!hasStations) {
      console.log('No polling stations found — plannedStationId will be NULL.');
    } else {
      console.log(`Found ${stations.length} polling stations.`);
    }

    // ── Create GOTV engagement records ──────────────────────────────────
    console.log('\nSeeding gotv_engagement...');

    const usersToSeed = appUsers.slice(0, PROFILES.length);
    let insertedCount = 0;

    for (let i = 0; i < usersToSeed.length; i++) {
      const user = usersToSeed[i];
      const profile = PROFILES[i];

      // Voting plan time — a specific hour on election day
      const votingPlanTime = profile.hasVotingPlan
        ? israelDate(electionDate, pick(PLAN_HOURS))
        : null;

      // Planned station
      const plannedStationId =
        profile.hasVotingPlan && hasStations ? pick(stations).id : null;

      // Station check-in — 0-30 minutes after planned time, or random hour if walk-in
      let stationCheckinAt: Date | null = null;
      if (profile.hasCheckin) {
        if (votingPlanTime) {
          stationCheckinAt = new Date(votingPlanTime.getTime() + rand(0, 30) * 60_000);
        } else {
          stationCheckinAt = israelDate(electionDate, pick(PLAN_HOURS));
        }
      }

      // Badge claim — 5-60 minutes after check-in
      const votedBadgeClaimedAt =
        profile.hasBadge && stationCheckinAt
          ? new Date(stationCheckinAt.getTime() + rand(5, 60) * 60_000)
          : null;

      // Snoozed reminders as JSON array
      const remindersSnoozed = JSON.stringify(profile.snoozedReminders);

      // Notification log — JSONB array of { type, sentAt } entries
      const notificationLog = JSON.stringify(profile.buildNotificationLog(electionDate));

      await qr.query(
        `INSERT INTO "gotv_engagement"
          ("id", "appUserId", "electionId", "votingPlanTime", "plannedStationId",
           "stationCheckinAt", "votedBadgeClaimedAt", "notificationsSent",
           "remindersSnoozed",
           "createdAt", "updatedAt")
        VALUES
          (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW(), NOW())`,
        [
          user.id,
          election.id,
          votingPlanTime,
          plannedStationId,
          stationCheckinAt,
          votedBadgeClaimedAt,
          profile.notificationsSent,
          remindersSnoozed,
        ],
      );

      insertedCount++;

      const logEntries = profile.buildNotificationLog(electionDate);
      const statusParts: string[] = [];
      if (profile.hasVotingPlan) statusParts.push('planned');
      if (profile.hasCheckin) statusParts.push('checked-in');
      if (profile.hasBadge) statusParts.push('badge');
      if (profile.notificationsSent > 0)
        statusParts.push(`${profile.notificationsSent} notifs`);
      if (logEntries.length > 0)
        statusParts.push(`${logEntries.length} log entries`);
      if (!profile.remindersEnabled) statusParts.push('reminders OFF');
      if (profile.snoozedReminders.length > 0)
        statusParts.push(`${profile.snoozedReminders.length} snoozed`);
      if (statusParts.length === 0) statusParts.push('fresh');

      console.log(
        `  ${user.displayName.padEnd(20)} [${profile.label.padEnd(20)}] → ${statusParts.join(', ')}`,
      );
    }

    // ── Commit ──────────────────────────────────────────────────────────
    await qr.commitTransaction();

    // ── Summary ─────────────────────────────────────────────────────────
    const profileCounts: Record<string, number> = {};
    for (let i = 0; i < usersToSeed.length; i++) {
      const label = PROFILES[i].label;
      profileCounts[label] = (profileCounts[label] || 0) + 1;
    }

    console.log('\n\u2705 GOTV seed complete!');
    console.log(`  - Engagement records: ${insertedCount}`);
    console.log(`  - Election:           ${election.id}`);
    console.log('  - Profile breakdown:');
    for (const [label, count] of Object.entries(profileCounts)) {
      console.log(`      ${label.padEnd(22)} ${count} users`);
    }
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('\u274c GOTV seed failed:', err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seedGotv();
