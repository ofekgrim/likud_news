/**
 * Seed Notification Logs for Every Content Type
 *
 * Creates notification_logs + notification_receipts in the DB for every
 * possible content type: article, poll, event, election, quiz, custom.
 * Also fetches real content IDs from the database when available.
 *
 * This populates the in-app notification inbox so you can test deep linking,
 * badge counts, mark-as-read, and the inbox UI.
 *
 * Usage:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-all-notifications.ts
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'likud',
  password: process.env.DB_PASSWORD || 'likud_dev',
  database: process.env.DB_DATABASE || 'likud_news',
});

interface NotificationSeed {
  title: string;
  body: string;
  imageUrl?: string;
  contentType: string;
  contentId?: string;
  data?: Record<string, string>;
}

async function main() {
  await dataSource.initialize();
  console.log('✅ Database connected\n');

  // -----------------------------------------------------------------------
  // 1. Fetch real content from the database
  // -----------------------------------------------------------------------

  const safeQuery = async (sql: string): Promise<any[]> => {
    try { return await dataSource.query(sql); }
    catch { return []; }
  };

  const [articles, polls, events, elections, quizzes] = await Promise.all([
    safeQuery(
      `SELECT id, title, slug, "heroImageUrl"
       FROM articles
       WHERE "deletedAt" IS NULL AND status = 'published'
       ORDER BY "publishedAt" DESC NULLS LAST
       LIMIT 3`,
    ),
    safeQuery(
      `SELECT id, question FROM community_polls
       WHERE "isActive" = true
       ORDER BY "createdAt" DESC LIMIT 2`,
    ),
    safeQuery(
      `SELECT id, title, location, "imageUrl"
       FROM campaign_events
       ORDER BY "startTime" DESC LIMIT 2`,
    ),
    safeQuery(
      `SELECT id, title FROM elections
       ORDER BY "createdAt" DESC LIMIT 1`,
    ),
    safeQuery(
      `SELECT id, title FROM quizzes
       WHERE "isActive" = true
       ORDER BY "createdAt" DESC LIMIT 1`,
    ),
  ]);

  console.log(`📊 Found content:`);
  console.log(`   Articles: ${articles.length}`);
  console.log(`   Polls: ${polls.length}`);
  console.log(`   Events: ${events.length}`);
  console.log(`   Elections: ${elections.length}`);
  console.log(`   Quizzes: ${quizzes.length}`);

  // -----------------------------------------------------------------------
  // 2. Build notification seeds for every content type
  // -----------------------------------------------------------------------

  const notifications: NotificationSeed[] = [];

  // --- Articles ---
  if (articles.length > 0) {
    // Regular article
    const art1 = articles[0];
    notifications.push({
      title: 'כתבה חדשה',
      body: art1.title,
      imageUrl: art1.heroImageUrl || null,
      contentType: 'article',
      contentId: art1.id,
      data: { articleSlug: art1.slug },
    });

    // Breaking news article
    if (articles.length > 1) {
      const art2 = articles[1];
      notifications.push({
        title: '🔴 מבזק',
        body: art2.title,
        imageUrl: art2.heroImageUrl || null,
        contentType: 'article',
        contentId: art2.id,
        data: { articleSlug: art2.slug },
      });
    }

    // Article update
    if (articles.length > 2) {
      const art3 = articles[2];
      notifications.push({
        title: 'עדכון לכתבה',
        body: `הכתבה "${art3.title}" עודכנה עם מידע חדש`,
        imageUrl: art3.heroImageUrl || null,
        contentType: 'article',
        contentId: art3.id,
        data: { articleSlug: art3.slug },
      });
    }
  } else {
    // Fallback if no articles exist
    notifications.push({
      title: 'כתבה חדשה',
      body: 'ראש הממשלה נתניהו: "ישראל תמשיך לפעול בנחישות"',
      contentType: 'article',
      data: { articleSlug: 'netanyahu-statement' },
    });

    notifications.push({
      title: '🔴 מבזק',
      body: 'דיווח: ישיבת קבינט ביטחונית מיוחדת תתקיים הערב',
      contentType: 'article',
      data: { articleSlug: 'cabinet-meeting' },
    });
  }

  // --- Polls ---
  if (polls.length > 0) {
    notifications.push({
      title: 'סקר חדש',
      body: polls[0].question,
      contentType: 'poll',
      contentId: polls[0].id,
    });

    if (polls.length > 1) {
      notifications.push({
        title: 'סקר שבועי',
        body: polls[1].question,
        contentType: 'poll',
        contentId: polls[1].id,
      });
    }
  } else {
    notifications.push({
      title: 'סקר חדש',
      body: 'מי לדעתכם המועמד המתאים ביותר לתפקיד שר החוץ?',
      contentType: 'poll',
    });
  }

  // --- Events ---
  if (events.length > 0) {
    const ev = events[0];
    notifications.push({
      title: 'אירוע חדש',
      body: `${ev.title}${ev.location ? ` - ${ev.location}` : ''}`,
      imageUrl: ev.imageUrl || null,
      contentType: 'event',
      contentId: ev.id,
    });

    if (events.length > 1) {
      const ev2 = events[1];
      notifications.push({
        title: 'תזכורת אירוע',
        body: `האירוע "${ev2.title}" מתחיל בקרוב!`,
        imageUrl: ev2.imageUrl || null,
        contentType: 'event',
        contentId: ev2.id,
      });
    }
  } else {
    notifications.push({
      title: 'אירוע חדש',
      body: 'כנס חברי הליכוד - מרכז הכנסים בירושלים',
      contentType: 'event',
    });

    notifications.push({
      title: 'תזכורת אירוע',
      body: 'מפגש סניף תל אביב מתחיל בעוד שעה!',
      contentType: 'event',
    });
  }

  // --- Elections ---
  if (elections.length > 0) {
    const el = elections[0];
    notifications.push({
      title: 'הבחירות החלו!',
      body: `${el.title} - הצביעו עכשיו`,
      contentType: 'election',
      contentId: el.id,
    });

    notifications.push({
      title: 'עדכון בחירות',
      body: `${el.title} - אחוז ההצבעה עולה, בואו להשפיע!`,
      contentType: 'election',
      contentId: el.id,
    });
  } else {
    notifications.push({
      title: 'הבחירות החלו!',
      body: 'פריימריז הליכוד 2026 - הצביעו עכשיו',
      contentType: 'election',
    });

    notifications.push({
      title: 'עדכון בחירות',
      body: '72% הצבעה! בואו להשפיע על התוצאה',
      contentType: 'election',
    });
  }

  // --- Quiz ---
  if (quizzes.length > 0) {
    const q = quizzes[0];
    notifications.push({
      title: 'שאלון התאמה חדש',
      body: `${q.title} - גלו איזה מועמד הכי מתאים לכם`,
      contentType: 'quiz',
      contentId: q.id,
    });
  } else {
    notifications.push({
      title: 'שאלון התאמה חדש',
      body: 'שאלון התאמת מועמדים - 10 שאלות, 3 דקות',
      contentType: 'quiz',
    });
  }

  // --- Custom / General ---
  notifications.push({
    title: 'ברוכים הבאים!',
    body: 'תודה שהצטרפתם לאפליקציית מצודת הליכוד. כאן תמצאו חדשות, אירועים וסקרים.',
    contentType: 'custom',
  });

  notifications.push({
    title: 'עדכון מערכת',
    body: 'גרסה חדשה זמינה! עדכנו את האפליקציה לחוויה משופרת.',
    contentType: 'custom',
  });

  notifications.push({
    title: 'הודעת חברות',
    body: 'חברותכם בליכוד אושרה בהצלחה. כעת תוכלו להצביע בפריימריז.',
    contentType: 'custom',
    data: { deepLink: '/membership' },
  });

  console.log(`\n📨 Seeding ${notifications.length} notifications...\n`);

  // -----------------------------------------------------------------------
  // 3. Insert notification_logs
  // -----------------------------------------------------------------------

  const logIds: string[] = [];
  const now = new Date();

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    // Stagger sentAt so they appear in order in the inbox
    const sentAt = new Date(now.getTime() - (notifications.length - i) * 60_000);

    const result = await dataSource.query(
      `INSERT INTO notification_logs
        (title, body, "imageUrl", "contentType", "contentId", data, "audienceRules", status, "totalTargeted", "totalSent", "sentAt", "completedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', 1, 1, $8, $8)
       RETURNING id`,
      [
        n.title,
        n.body,
        n.imageUrl || null,
        n.contentType,
        n.contentId || null,
        n.data ? JSON.stringify(n.data) : null,
        JSON.stringify({ type: 'all' }),
        sentAt,
      ],
    );

    const logId = result[0].id;
    logIds.push(logId);
    console.log(`   ✅ [${n.contentType.padEnd(10)}] ${n.title}`);
  }

  // -----------------------------------------------------------------------
  // 4. Create receipts for all devices (populates inbox)
  // -----------------------------------------------------------------------

  // Get all known device IDs (from push_tokens or app_users)
  let devices: Array<{ deviceId: string; userId: string | null }> = [];

  try {
    devices = await dataSource.query(
      `SELECT DISTINCT "deviceId", (
         SELECT id FROM app_users au WHERE au."deviceId" = pt."deviceId" LIMIT 1
       ) as "userId"
       FROM push_tokens pt
       WHERE "isActive" = true`,
    );
  } catch {
    // push_tokens might not exist, try app_users
  }

  if (devices.length === 0) {
    try {
      devices = await dataSource.query(
        `SELECT DISTINCT "deviceId", id as "userId"
         FROM app_users
         WHERE "deviceId" IS NOT NULL
         LIMIT 10`,
      );
    } catch {
      // app_users might not have deviceId column
    }
  }

  // Always add a test device so the inbox has data
  const testDeviceId = 'test-device-seed';
  if (!devices.some((d) => d.deviceId === testDeviceId)) {
    devices.push({ deviceId: testDeviceId, userId: null });
  }

  console.log(`\n📱 Creating receipts for ${devices.length} device(s)...`);

  let receiptCount = 0;
  for (const device of devices) {
    for (const logId of logIds) {
      await dataSource.query(
        `INSERT INTO notification_receipts
          ("logId", "deviceId", "userId", status)
         VALUES ($1, $2, $3, 'delivered')
         ON CONFLICT DO NOTHING`,
        [logId, device.deviceId, device.userId],
      );
      receiptCount++;
    }
    console.log(`   ✅ ${device.deviceId}: ${logIds.length} receipts`);
  }

  // -----------------------------------------------------------------------
  // 5. Summary
  // -----------------------------------------------------------------------

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Seeded ${logIds.length} notifications × ${devices.length} devices = ${receiptCount} receipts`);
  console.log('='.repeat(60));
  console.log('\nBreakdown:');
  const typeCounts: Record<string, number> = {};
  for (const n of notifications) {
    typeCounts[n.contentType] = (typeCounts[n.contentType] || 0) + 1;
  }
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`   ${type.padEnd(12)} ${count}`);
  }

  console.log('\n📋 Test the inbox:');
  console.log(`   GET /api/v1/notifications/inbox?deviceId=${devices[0]?.deviceId}`);
  console.log('\n📋 Test deep links by tapping each notification in the app inbox.');

  await dataSource.destroy();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
