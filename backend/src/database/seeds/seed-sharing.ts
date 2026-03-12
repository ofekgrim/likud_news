/**
 * Seed script: Share links test data.
 *
 * Creates share_links records covering all content types (article, candidate, quiz_result, event, poll)
 * with Hebrew OG metadata, UTM params, and varying click counts.
 *
 * Prerequisites: seed articles, candidates, community polls, campaign events, and quizzes first.
 *
 * Usage:
 *   cd backend && npx ts-node src/database/seeds/seed-sharing.ts          # skip if exists
 *   cd backend && npx ts-node src/database/seeds/seed-sharing.ts --force  # replace existing
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

/** Generate an 8-character alphanumeric short code. */
function shortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---------------------------------------------------------------------------
// OG metadata templates (Hebrew)
// ---------------------------------------------------------------------------

interface OgTemplate {
  contentType: 'article' | 'candidate' | 'quiz_result' | 'event' | 'poll';
  titles: string[];
  descriptions: string[];
  utmSources: string[];
  utmMediums: string[];
  utmCampaigns: string[];
}

const OG_TEMPLATES: OgTemplate[] = [
  {
    contentType: 'article',
    titles: [
      'הליכוד: מבט לעתיד הביטחון הלאומי',
      'ראיון בלעדי עם חברי הכנסת',
      'המהלך הכלכלי שישנה את ישראל',
      'תוכנית החירום לדיור בישראל',
      'חזון הליכוד לשנת 2026',
      'הצלחות ממשלת ישראל ברבעון האחרון',
    ],
    descriptions: [
      'קראו את הכתבה המלאה באפליקציית מצודת הליכוד',
      'ניתוח מעמיק של המדיניות החדשה — רק במצודה',
      'הסיפור המלא באפליקציה הרשמית של הליכוד',
      'כל הפרטים על התוכנית החדשה — קראו עכשיו',
    ],
    utmSources: ['app_share', 'whatsapp', 'telegram', 'facebook'],
    utmMediums: ['social', 'messaging', 'referral'],
    utmCampaigns: ['article_share', 'news_viral', 'weekly_digest'],
  },
  {
    contentType: 'candidate',
    titles: [
      'הכירו את המועמד: פרופיל מלא',
      'המועמד שלנו למקדימות הליכוד',
      'עמדות ותוכניות — פרופיל מועמד',
      'למה לבחור במועמד הזה? כל הסיבות',
    ],
    descriptions: [
      'צפו בפרופיל המלא של המועמד באפליקציית מצודת הליכוד',
      'כל העמדות, הניסיון והחזון — במקום אחד',
      'הכירו את המועמד לפני יום הבחירות',
    ],
    utmSources: ['app_share', 'whatsapp', 'twitter'],
    utmMediums: ['social', 'messaging'],
    utmCampaigns: ['candidate_profile', 'primaries_2026'],
  },
  {
    contentType: 'quiz_result',
    titles: [
      'התוצאה שלי: התאמת מועמדים',
      'גיליתי למי אני הכי מתאים — בדקו גם!',
      'תוצאות מבחן ההתאמה למועמדים',
    ],
    descriptions: [
      'עשיתי את מבחן התאמת המועמדים — בואו לגלות גם',
      'איזה מועמד הכי מתאים לכם? בדקו עכשיו באפליקציה',
      'הפתעה! ראו את תוצאת ההתאמה שלי',
    ],
    utmSources: ['app_share', 'whatsapp', 'telegram'],
    utmMediums: ['social', 'viral'],
    utmCampaigns: ['quiz_share', 'candidate_matcher'],
  },
  {
    contentType: 'event',
    titles: [
      'הצטרפו אלינו: כנס הליכוד הגדול',
      'אירוע בחירות — בואו להשפיע!',
      'מפגש חברי הליכוד — הרשמו עכשיו',
      'עצרת תמיכה — כל הפרטים',
    ],
    descriptions: [
      'הרשמו לאירוע דרך אפליקציית מצודת הליכוד',
      'אל תפספסו את האירוע הקרוב — פרטים מלאים באפליקציה',
      'מקומות מוגבלים — הרשמו עכשיו',
    ],
    utmSources: ['app_share', 'whatsapp', 'facebook', 'sms'],
    utmMediums: ['social', 'messaging', 'direct'],
    utmCampaigns: ['event_invite', 'rally_2026', 'member_meetup'],
  },
  {
    contentType: 'poll',
    titles: [
      'הצביעו בסקר: מי המועמד המועדף עליכם?',
      'סקר דעת קהל — מה דעתכם?',
      'שאלת השבוע — הצביעו עכשיו',
    ],
    descriptions: [
      'השתתפו בסקר באפליקציית מצודת הליכוד',
      'דעתכם חשובה — הצביעו עכשיו',
      'ראו את תוצאות הסקר בזמן אמת',
    ],
    utmSources: ['app_share', 'whatsapp', 'telegram'],
    utmMediums: ['social', 'messaging'],
    utmCampaigns: ['poll_share', 'weekly_poll'],
  },
];

// Sample OG image URLs (CDN pattern)
const OG_IMAGES = [
  'https://cdn.metzudat-halikud.co.il/og/article-default.jpg',
  'https://cdn.metzudat-halikud.co.il/og/candidate-profile.jpg',
  'https://cdn.metzudat-halikud.co.il/og/quiz-result.jpg',
  'https://cdn.metzudat-halikud.co.il/og/event-banner.jpg',
  'https://cdn.metzudat-halikud.co.il/og/poll-share.jpg',
  'https://cdn.metzudat-halikud.co.il/og/likud-blue-default.jpg',
];

// ---------------------------------------------------------------------------
// Content type → table mapping for querying real IDs
// ---------------------------------------------------------------------------

interface ContentSource {
  table: string;
  idColumn: string;
  orderBy: string;
  limit: number;
}

const CONTENT_SOURCES: Record<string, ContentSource> = {
  article: { table: 'articles', idColumn: 'id', orderBy: '"createdAt"', limit: 6 },
  candidate: { table: 'candidates', idColumn: 'id', orderBy: '"createdAt"', limit: 4 },
  quiz_result: { table: 'quiz_match_results', idColumn: 'id', orderBy: '"createdAt"', limit: 3 },
  event: { table: 'campaign_events', idColumn: 'id', orderBy: '"createdAt"', limit: 4 },
  poll: { table: 'community_polls', idColumn: 'id', orderBy: '"createdAt"', limit: 3 },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedSharing() {
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
      `SELECT COUNT(*) AS count FROM "share_links"`,
    )) as { count: string }[];
    const existingCount = parseInt(existing[0].count, 10);

    if (existingCount > 0 && !forceReseed) {
      console.log(
        `Table already has ${existingCount} share links. Use --force to reseed.`,
      );
      await qr.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && existingCount > 0) {
      console.log('Deleting existing share links...');
      await qr.query(`DELETE FROM "share_links"`);
      console.log('Cleared existing share links.');
    }

    // ── Fetch content IDs from the database ─────────────────────────────
    console.log('\nFetching content IDs...');

    const contentIds: Record<string, string[]> = {};
    const missingTypes: string[] = [];

    for (const [type, source] of Object.entries(CONTENT_SOURCES)) {
      try {
        const rows = (await qr.query(
          `SELECT "${source.idColumn}" AS id FROM "${source.table}" ORDER BY ${source.orderBy} DESC LIMIT ${source.limit}`,
        )) as { id: string }[];

        if (rows.length > 0) {
          contentIds[type] = rows.map((r) => r.id);
          console.log(`  ${type.padEnd(14)} → ${rows.length} IDs found`);
        } else {
          missingTypes.push(type);
          console.log(`  ${type.padEnd(14)} → 0 IDs (will use generated UUIDs)`);
        }
      } catch {
        missingTypes.push(type);
        console.log(`  ${type.padEnd(14)} → table not found (will use generated UUIDs)`);
      }
    }

    // ── Build share link records ────────────────────────────────────────
    console.log('\nSeeding share_links...');

    // Track generated short codes to ensure uniqueness
    const usedCodes = new Set<string>();
    let insertedCount = 0;
    const typeCounts: Record<string, number> = {};

    // Distribution: articles get the most links, then events, candidates, polls, quiz results
    const distribution: { type: string; count: number }[] = [
      { type: 'article', count: 6 },
      { type: 'candidate', count: 4 },
      { type: 'quiz_result', count: 3 },
      { type: 'event', count: 4 },
      { type: 'poll', count: 3 },
    ];

    for (const { type, count } of distribution) {
      const template = OG_TEMPLATES.find((t) => t.contentType === type)!;
      const ids = contentIds[type] || [];

      for (let i = 0; i < count; i++) {
        // Generate unique short code
        let code: string;
        do {
          code = shortCode();
        } while (usedCodes.has(code));
        usedCodes.add(code);

        // Pick a real content ID or generate a fallback UUID
        const contentId =
          ids.length > 0
            ? ids[i % ids.length]
            : `00000000-0000-4000-a000-${String(i).padStart(12, '0')}`;

        const ogTitle = pick(template.titles);
        const ogDescription = pick(template.descriptions);
        const ogImageUrl = pick(OG_IMAGES);
        const utmSource = pick(template.utmSources);
        const utmMedium = pick(template.utmMediums);
        const utmCampaign = pick(template.utmCampaigns);

        // Click counts: most links get moderate traffic, a few go viral
        let clickCount: number;
        const viralChance = Math.random();
        if (viralChance > 0.9) {
          clickCount = rand(200, 500); // viral
        } else if (viralChance > 0.6) {
          clickCount = rand(50, 199); // popular
        } else if (viralChance > 0.3) {
          clickCount = rand(10, 49); // moderate
        } else {
          clickCount = rand(0, 9); // low
        }

        await qr.query(
          `INSERT INTO "share_links"
            ("id", "contentType", "contentId", "shortCode", "ogTitle", "ogDescription",
             "ogImageUrl", "utmSource", "utmMedium", "utmCampaign", "clickCount",
             "createdAt", "updatedAt")
          VALUES
            (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            type,
            contentId,
            code,
            ogTitle,
            ogDescription,
            ogImageUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            clickCount,
          ],
        );

        insertedCount++;
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        console.log(
          `  [${type.padEnd(12)}] ${code}  clicks=${String(clickCount).padStart(3)}  "${ogTitle.substring(0, 40)}..."`,
        );
      }
    }

    // ── Commit ──────────────────────────────────────────────────────────
    await qr.commitTransaction();

    // ── Summary ─────────────────────────────────────────────────────────
    console.log('\n\u2705 Sharing seed complete!');
    console.log(`  - Total share links: ${insertedCount}`);
    console.log('  - By content type:');
    for (const [type, count] of Object.entries(typeCounts)) {
      console.log(`      ${type.padEnd(14)} ${count} links`);
    }
    if (missingTypes.length > 0) {
      console.log(`  - Note: fallback UUIDs used for: ${missingTypes.join(', ')}`);
    }
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('\u274c Sharing seed failed:', err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seedSharing();
