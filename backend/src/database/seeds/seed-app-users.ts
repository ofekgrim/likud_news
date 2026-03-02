import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

/**
 * Seed script for app users (~30 users with varied roles).
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-app-users.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-app-users.ts --force  # replace existing
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

// ── Raw user data ──────────────────────────────────────────────────────────────

interface SeedUser {
  displayName: string;
  phone: string;
  email: string;
  bio: string;
  role: 'guest' | 'member' | 'verified_member';
  membershipId: string | null;
  membershipStatus: 'unverified' | 'pending' | 'verified' | 'expired';
  membershipVerifiedAt: Date | null;
  isActive: boolean;
  notificationPrefs: Record<string, unknown>;
}

const users: SeedUser[] = [
  // ── Guests (10) ────────────────────────────────────────────────────────────
  {
    displayName: 'דוד כהן',
    phone: '+972-50-123-4567',
    email: 'david.cohen@gmail.com',
    bio: 'תושב תל אביב, עוקב אחרי חדשות פוליטיות ואוהד ספורט.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, dailyDigest: false },
  },
  {
    displayName: 'שרה לוי',
    phone: '+972-52-234-5678',
    email: 'sarah.levi@yahoo.com',
    bio: 'סטודנטית למדעי המדינה באוניברסיטת בר אילן. מתעניינת בפוליטיקה ישראלית.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, categories: true },
  },
  {
    displayName: 'יוסף מזרחי',
    phone: '+972-54-345-6789',
    email: 'yosef.mizrachi@walla.co.il',
    bio: 'פנסיונר מבאר שבע. קורא חדשות כל יום ומשתף עם חברים.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: false, dailyDigest: true },
  },
  {
    displayName: 'רחל אברהם',
    phone: '+972-53-456-7890',
    email: 'rachel.avraham@hotmail.com',
    bio: 'מורה לספרות בתיכון בירושלים. אוהבת לקרוא ולכתוב על פוליטיקה.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, weeklyNewsletter: true },
  },
  {
    displayName: 'משה פרץ',
    phone: '+972-58-567-8901',
    email: 'moshe.peretz@gmail.com',
    bio: 'נהג מונית מחיפה. שומע רדיו כל היום ומתעדכן בחדשות.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: false, // inactive user
    notificationPrefs: { breakingNews: false, dailyDigest: false },
  },
  {
    displayName: 'נועה גולדברג',
    phone: '+972-50-678-9012',
    email: 'noa.goldberg@gmail.com',
    bio: 'מעצבת גרפית מרמת גן. עוקבת אחרי חדשות הטכנולוגיה והפוליטיקה.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, categories: false, dailyDigest: true },
  },
  {
    displayName: 'אלון ביטון',
    phone: '+972-52-789-0123',
    email: 'alon.biton@outlook.com',
    bio: 'מהנדס תוכנה בהייטק. מתעניין בכלכלה ובפוליטיקה ביטחונית.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, security: true },
  },
  {
    displayName: 'תמר שושן',
    phone: '+972-54-890-1234',
    email: 'tamar.shoshan@gmail.com',
    bio: 'אחות בבית חולים בנצרת. קוראת חדשות בזמן ההפסקות.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true },
  },
  {
    displayName: 'עומר חדד',
    phone: '+972-53-901-2345',
    email: 'omer.hadad@walla.co.il',
    bio: 'חייל משוחרר מאשדוד. מתכנן ללמוד משפטים ומתעניין בפוליטיקה.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, dailyDigest: true, categories: true },
  },
  {
    displayName: 'הילה רוזנברג',
    phone: '+972-58-012-3456',
    email: 'hila.rosenberg@gmail.com',
    bio: 'עורכת דין מפתח תקווה. פעילה בהתנדבות וקוראת חדשות יומית.',
    role: 'guest',
    membershipId: null,
    membershipStatus: 'unverified',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, weeklyNewsletter: true, dailyDigest: false },
  },

  // ── Members (10) ──────────────────────────────────────────────────────────
  {
    displayName: 'אברהם דהן',
    phone: '+972-50-111-2233',
    email: 'avraham.dahan@likud.org.il',
    bio: 'חבר ליכוד פעיל מנתניה. משתתף בכל כנסים ואירועים של התנועה.',
    role: 'member',
    membershipId: 'LK-2024-00101',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, primaryUpdates: true },
  },
  {
    displayName: 'מיכל סויסה',
    phone: '+972-52-222-3344',
    email: 'michal.suissa@likud.org.il',
    bio: 'יועצת תקשורת ופעילה מרכזית בסניף הליכוד בהרצליה.',
    role: 'member',
    membershipId: 'LK-2024-00102',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, categories: true },
  },
  {
    displayName: 'יעקב עמר',
    phone: '+972-54-333-4455',
    email: 'yaakov.amar@likud.org.il',
    bio: 'בעל עסק קטן מאילת. חבר ליכוד מ-2015 ופעיל בדרום.',
    role: 'member',
    membershipId: 'LK-2024-00103',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, dailyDigest: true, primaryUpdates: true },
  },
  {
    displayName: 'ליאת בן דוד',
    phone: '+972-53-444-5566',
    email: 'liat.bendavid@likud.org.il',
    bio: 'רואת חשבון מרחובות. פעילה בוועדות הכספים של הסניף המקומי.',
    role: 'member',
    membershipId: 'LK-2024-00104',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: false, partyEvents: true, weeklyNewsletter: true },
  },
  {
    displayName: 'אורי נחמיאס',
    phone: '+972-58-555-6677',
    email: 'uri.nachmias@likud.org.il',
    bio: 'מורה לאזרחות ופעיל חינוכי בתנועה. מארגן ימי עיון לנוער.',
    role: 'member',
    membershipId: 'LK-2024-00105',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, dailyDigest: true },
  },
  {
    displayName: 'שירי אזולאי',
    phone: '+972-50-666-7788',
    email: 'shiri.azoulay@likud.org.il',
    bio: 'עיתונאית לשעבר. כעת פעילה מרכזית בסניף הליכוד בבת ים.',
    role: 'member',
    membershipId: 'LK-2024-00106',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: false, // inactive member
    notificationPrefs: { breakingNews: true, categories: true },
  },
  {
    displayName: 'גיל אוחיון',
    phone: '+972-52-777-8899',
    email: 'gil.ohion@likud.org.il',
    bio: 'קצין מילואים ועורך דין. חבר ליכוד ופעיל בתחום הביטחון.',
    role: 'member',
    membershipId: 'LK-2024-00107',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, security: true, primaryUpdates: true },
  },
  {
    displayName: 'דנה מלכה',
    phone: '+972-54-888-9900',
    email: 'dana.malka@likud.org.il',
    bio: 'אדריכלית מכפר סבא. חברת ליכוד חדשה, מתעניינת בשיכון ודיור.',
    role: 'member',
    membershipId: 'LK-2024-00108',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: false, dailyDigest: true },
  },
  {
    displayName: 'רון אלבז',
    phone: '+972-53-999-0011',
    email: 'ron.elbaz@likud.org.il',
    bio: 'מאמן כדורגל מעפולה. פעיל בתנועת הנוער של הליכוד בצפון.',
    role: 'member',
    membershipId: 'LK-2024-00109',
    membershipStatus: 'expired',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true },
  },
  {
    displayName: 'קרן יפרח',
    phone: '+972-58-100-2233',
    email: 'keren.yifrach@likud.org.il',
    bio: 'פסיכולוגית חינוכית מראשון לציון. חברת הנהלת הסניף.',
    role: 'member',
    membershipId: 'LK-2024-00110',
    membershipStatus: 'pending',
    membershipVerifiedAt: null,
    isActive: true,
    notificationPrefs: { breakingNews: true, weeklyNewsletter: true, primaryUpdates: true },
  },

  // ── Verified Members (10) ─────────────────────────────────────────────────
  {
    displayName: 'יצחק שמעוני',
    phone: '+972-50-200-3344',
    email: 'yitzhak.shimoni@likud.org.il',
    bio: 'ראש סניף הליכוד בפתח תקווה. חבר מרכז התנועה מ-2010.',
    role: 'verified_member',
    membershipId: 'LK-2023-00001',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-05-15'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, primaryUpdates: true, votingReminders: true },
  },
  {
    displayName: 'רותי מלמד',
    phone: '+972-52-300-4455',
    email: 'ruti.melamed@likud.org.il',
    bio: 'חברת מרכז הליכוד ותיקה מירושלים. פעילה בתחום החינוך והחברה.',
    role: 'verified_member',
    membershipId: 'LK-2023-00002',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-06-20'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, primaryUpdates: true, categories: true },
  },
  {
    displayName: 'חיים אבוטבול',
    phone: '+972-54-400-5566',
    email: 'chaim.abutbul@likud.org.il',
    bio: 'חבר מרכז ופעיל בנציגות בית שמש. עוסק בקידום פרויקטים קהילתיים.',
    role: 'verified_member',
    membershipId: 'LK-2023-00003',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-03-10'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, dailyDigest: true, votingReminders: true },
  },
  {
    displayName: 'אסתר כהן-צדק',
    phone: '+972-53-500-6677',
    email: 'ester.cohentsedek@likud.org.il',
    bio: 'מנהלת בית ספר בדימונה. חברת מרכז ופעילה למען החינוך בפריפריה.',
    role: 'verified_member',
    membershipId: 'LK-2023-00004',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-07-01'),
    isActive: true,
    notificationPrefs: { breakingNews: true, primaryUpdates: true, weeklyNewsletter: true },
  },
  {
    displayName: 'עמוס סגל',
    phone: '+972-58-600-7788',
    email: 'amos.segal@likud.org.il',
    bio: 'יזם הייטק מהרצליה. תורם ופעיל בוועדות כלכלה וחדשנות של התנועה.',
    role: 'verified_member',
    membershipId: 'LK-2023-00005',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-04-18'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, primaryUpdates: true, dailyDigest: true, security: true },
  },
  {
    displayName: 'מזל טוב-שבו',
    phone: '+972-50-700-8899',
    email: 'mazal.tovshevo@likud.org.il',
    bio: 'פעילת שטח ותיקה מאשקלון. מארגנת אירועים ומפגשים למען הקהילה.',
    role: 'verified_member',
    membershipId: 'LK-2023-00006',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-08-25'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, votingReminders: true },
  },
  {
    displayName: 'בני גנות',
    phone: '+972-52-800-9900',
    email: 'beni.ganot@likud.org.il',
    bio: 'נציג ליכוד במועצת העיר נתניה. חבר מרכז ויו"ר ועדת ביקורת סניפית.',
    role: 'verified_member',
    membershipId: 'LK-2023-00007',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-02-14'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, primaryUpdates: true, categories: true, votingReminders: true },
  },
  {
    displayName: 'סיגלית ברוש',
    phone: '+972-54-900-0011',
    email: 'sigalit.brosh@likud.org.il',
    bio: 'עובדת סוציאלית מחדרה. פעילה בתחום הרווחה והשוויון החברתי בתנועה.',
    role: 'verified_member',
    membershipId: 'LK-2023-00008',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2023-09-30'),
    isActive: false, // inactive verified member
    notificationPrefs: { breakingNews: false, partyEvents: true, weeklyNewsletter: true },
  },
  {
    displayName: 'זאב ליברמן',
    phone: '+972-53-010-1122',
    email: 'zeev.liberman@likud.org.il',
    bio: 'רופא משפחה מטבריה. חבר מרכז וותיק תנועה מ-2005, פעיל בצפון.',
    role: 'verified_member',
    membershipId: 'LK-2022-00009',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2022-11-20'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, primaryUpdates: true, dailyDigest: true },
  },
  {
    displayName: 'נורית חלבי',
    phone: '+972-58-020-2233',
    email: 'nurit.halabi@likud.org.il',
    bio: 'גמלאית צה"ל בדרגת סא"ל. חברת מרכז הליכוד ופעילה לקידום נשים בפוליטיקה.',
    role: 'verified_member',
    membershipId: 'LK-2022-00010',
    membershipStatus: 'verified',
    membershipVerifiedAt: new Date('2022-12-05'),
    isActive: true,
    notificationPrefs: { breakingNews: true, partyEvents: true, primaryUpdates: true, votingReminders: true, security: true },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateDeviceId(index: number): string {
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return `device-${hex(0xa0b1c2d3 + index)}-${hex(0xe4f50000 + index * 31)}-${hex(0x12340000 + index * 17)}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ── Main seed function ─────────────────────────────────────────────────────────

async function seedAppUsers() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing users ─────────────────────────────────────────────
    const existingCount = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "app_users"`,
    )) as { count: string }[];

    const count = parseInt(existingCount[0].count, 10);

    if (count > 0 && !forceReseed) {
      console.log(
        `Table already has ${count} app users. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && count > 0) {
      console.log(`Deleting ${count} existing app users...`);
      await queryRunner.query(`DELETE FROM "app_users"`);
      console.log('Cleared existing app users.');
    }

    // ── Hash the shared password ─────────────────────────────────────────
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // ── Insert users ─────────────────────────────────────────────────────
    console.log(`Seeding ${users.length} app users...`);

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const deviceId = generateDeviceId(i);
      const avatarSeed = encodeURIComponent(u.displayName);
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`;
      const lastLoginAt = randomDate(new Date('2025-06-01'), new Date('2026-02-20'));
      const createdAt = randomDate(new Date('2024-01-01'), new Date('2025-05-31'));

      await queryRunner.query(
        `INSERT INTO "app_users"
           ("id", "deviceId", "phone", "email", "passwordHash", "displayName",
            "avatarUrl", "bio", "role", "membershipId", "membershipStatus",
            "membershipVerifiedAt", "preferredCategories", "notificationPrefs",
            "lastLoginAt", "isActive", "createdAt", "updatedAt")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13::jsonb,
            $14, $15, $16, $16)`,
        [
          deviceId,                                           // $1
          u.phone,                                            // $2
          u.email,                                            // $3
          passwordHash,                                       // $4
          u.displayName,                                      // $5
          avatarUrl,                                          // $6
          u.bio,                                              // $7
          u.role,                                             // $8
          u.membershipId,                                     // $9
          u.membershipStatus,                                 // $10
          u.membershipVerifiedAt,                             // $11
          '{}',                                               // $12 preferredCategories
          JSON.stringify(u.notificationPrefs),                // $13
          lastLoginAt,                                        // $14
          u.isActive,                                         // $15
          createdAt,                                          // $16 createdAt & updatedAt
        ],
      );

      const roleTag = u.role === 'guest' ? 'GUEST' : u.role === 'member' ? 'MEMBER' : 'VERIFIED';
      const activeTag = u.isActive ? '' : ' [INACTIVE]';
      console.log(`  ${String(i + 1).padStart(2, ' ')}. ${u.displayName} (${roleTag})${activeTag}`);
    }

    await queryRunner.commitTransaction();
    console.log(`\nDone! Seeded ${users.length} app users.`);
    console.log(`  - Guests:           ${users.filter(u => u.role === 'guest').length}`);
    console.log(`  - Members:          ${users.filter(u => u.role === 'member').length}`);
    console.log(`  - Verified Members: ${users.filter(u => u.role === 'verified_member').length}`);
    console.log(`  - Inactive:         ${users.filter(u => !u.isActive).length}`);
    console.log(`  - Password:         Password123! (bcrypt hashed)`);
  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedAppUsers();
