import { AppDataSource } from '../data-source';

/**
 * Seed script for Likud primary candidates.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-candidates.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-candidates.ts --force  # replace existing
 */

const candidates = [
  { fullName: 'בנימין נתניהו', district: 'ארצי', position: 'ראש הממשלה', bio: 'ראש ממשלת ישראל ויו"ר תנועת הליכוד. משרת בתפקיד מאז 2009.' },
  { fullName: 'ישראל כ"ץ', district: 'מרכז', position: 'שר החוץ', bio: 'חבר כנסת ותיק ושר בכיר בליכוד. כיהן כשר התחבורה, שר האוצר ושר החוץ.' },
  { fullName: 'יולי אדלשטיין', district: 'מרכז', position: 'שר הבריאות', bio: 'עולה מברית המועצות לשעבר. כיהן כיו"ר הכנסת ושר הבריאות.' },
  { fullName: 'ניר ברקת', district: 'ירושלים', position: 'שר הכלכלה', bio: 'ראש עיריית ירושלים לשעבר. יזם הייטק ומנהיגות עירונית.' },
  { fullName: 'יואב גלנט', district: 'דרום', position: 'שר הביטחון', bio: 'אלוף במיל. וחבר כנסת. כיהן כשר הביטחון ושר השיכון.' },
  { fullName: 'מירי רגב', district: 'דרום', position: 'שרת התחבורה', bio: 'דוברת צה"ל לשעבר בדרגת תת-אלוף. כיהנה כשרת התרבות ושרת התחבורה.' },
  { fullName: 'גדעון סער', district: 'מרכז', position: 'שר המשפטים', bio: 'חבר כנסת ומשפטן. כיהן כשר הפנים ושר החינוך.' },
  { fullName: 'אבי דיכטר', district: 'דרום', position: 'שר החקלאות', bio: 'ראש השב"כ לשעבר. מומחה ביטחון ולוחם טרור.' },
  { fullName: 'דוד ביטן', district: 'צפון', position: 'יו"ר הקואליציה', bio: 'סגן ראש עיריית ראשון לציון לשעבר. כיהן כיו"ר הקואליציה.' },
  { fullName: 'שלמה קרעי', district: 'מרכז', position: 'שר התקשורת', bio: 'חבר כנסת ואיש עסקים. פעיל מרכזי בליכוד בגוש דן.' },
  { fullName: 'אופיר אקוניס', district: 'צפון', position: 'שר המדע', bio: 'חבר כנסת מהצפון. כיהן כשר המדע, הטכנולוגיה והחלל.' },
  { fullName: 'חיים כץ', district: 'מרכז', position: 'שר הרווחה', bio: 'חבר כנסת ותיק ויו"ר ועדת הכספים. מומחה בתחום הרווחה.' },
  { fullName: 'צחי הנגבי', district: 'ירושלים', position: 'יו"ר המועצה לביטחון לאומי', bio: 'חבר כנסת ותיק. כיהן בתפקידי ביטחון ומודיעין רבים.' },
  { fullName: 'עמיר אוחנה', district: 'מרכז', position: 'יו"ר הכנסת', bio: 'קצין משטרה לשעבר. הפוליטיקאי הגאה הראשון בליכוד. כיהן כשר המשפטים.' },
  { fullName: 'מאי גולן', district: 'דרום', position: 'שרת הנגב והגליל', bio: 'פעילה חברתית שהפכה לפוליטיקאית. נבחרה לכנסת ב-2022.' },
  { fullName: 'דני דנון', district: 'ארצי', position: 'שגריר ישראל באו"ם', bio: 'שגריר ישראל באומות המאוחדות. חבר כנסת לשעבר ופעיל ליכוד ותיק.' },
  { fullName: 'בועז ביסמוט', district: 'דרום', position: 'חבר כנסת', bio: 'עיתונאי ופרשן פוליטי לשעבר. נבחר לכנסת במסגרת הליכוד.' },
  { fullName: 'אריאל קלנר', district: 'מרכז', position: 'חבר כנסת', bio: 'חבר כנסת צעיר מהליכוד. משרת בוועדת החוץ והביטחון.' },
  { fullName: 'תלי גוטליב', district: 'צפון', position: 'חברת כנסת', bio: 'חברת כנסת מטבריה. פעילה בנושאי חברה וקהילה.' },
  { fullName: 'פאטין מולא', district: 'צפון', position: 'חברת כנסת', bio: 'נציגה דרוזית בליכוד. פעילה לקידום מגזר המיעוטים.' },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\u0590-\u05FF\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedCandidates() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Find or create election ──────────────────────────────────────
    let electionId: string;
    const existingElections = (await queryRunner.query(
      `SELECT "id" FROM "primary_elections" ORDER BY "createdAt" DESC LIMIT 1`,
    )) as { id: string }[];

    if (existingElections.length > 0) {
      electionId = existingElections[0].id;
      console.log(`Using existing election: ${electionId}`);
    } else {
      const result = await queryRunner.query(
        `INSERT INTO "primary_elections" ("id", "title", "subtitle", "description", "status", "isActive", "electionDate")
         VALUES (uuid_generate_v4(), $1, $2, $3, 'upcoming', true, $4)
         RETURNING "id"`,
        [
          'פריימריז הליכוד 2026',
          'בחירות מקדימות לראשות הליכוד',
          'הפריימריז הקרובים של תנועת הליכוד לבחירת רשימת המועמדים לכנסת.',
          new Date('2026-06-15'),
        ],
      );
      electionId = result[0].id;
      console.log(`Created election: ${electionId} — פריימריז הליכוד 2026`);
    }

    // ── Check existing candidates ────────────────────────────────────
    const existingCount = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "candidates" WHERE "electionId" = $1`,
      [electionId],
    )) as { count: string }[];

    if (parseInt(existingCount[0].count, 10) > 0 && !forceReseed) {
      console.log(
        `Election already has ${existingCount[0].count} candidates. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed) {
      await queryRunner.query(
        `DELETE FROM "candidates" WHERE "electionId" = $1`,
        [electionId],
      );
      console.log('Cleared existing candidates for this election.');
    }

    // ── Insert candidates ────────────────────────────────────────────
    console.log(`Seeding ${candidates.length} candidates...`);

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const slug = slugify(c.fullName);
      const socialLinks = JSON.stringify({
        twitter: `https://twitter.com/${slug}`,
        facebook: `https://facebook.com/${slug}`,
      });

      await queryRunner.query(
        `INSERT INTO "candidates"
           ("id", "electionId", "fullName", "slug", "district", "position", "bio", "socialLinks", "sortOrder", "isActive")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7::jsonb, $8, true)`,
        [electionId, c.fullName, slug, c.district, c.position, c.bio, socialLinks, i],
      );
      console.log(`  ${i + 1}. ${c.fullName} (${c.district})`);
    }

    await queryRunner.commitTransaction();
    console.log(`\nDone! Seeded ${candidates.length} candidates.`);
  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedCandidates();
