import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ─── Check if already seeded ──────────────────────────────────────
    const existingUsers = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "users"`,
    )) as { count: string }[];
    if (parseInt(existingUsers[0].count, 10) > 0) {
      console.log('Database already seeded. Skipping.');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ─── 1. Seed Super Admin User ─────────────────────────────────────
    console.log('Seeding users...');
    const passwordHash = await bcrypt.hash('Admin123!', 12);

    await queryRunner.query(
      `INSERT INTO "users" ("id", "email", "name", "passwordHash", "role", "isActive")
       VALUES (
         uuid_generate_v4(),
         $1, $2, $3, 'super_admin', true
       )`,
      ['admin@likud.org.il', 'מנהל ראשי', passwordHash],
    );
    console.log('  -> Created super_admin user: admin@likud.org.il');

    // ─── 2. Seed Categories ───────────────────────────────────────────
    console.log('Seeding categories...');
    const categories = [
      {
        name: 'פוליטיקה',
        nameEn: 'Politics',
        slug: 'politics',
        color: '#1A237E',
        sortOrder: 1,
      },
      {
        name: 'ביטחון',
        nameEn: 'Security',
        slug: 'security',
        color: '#B71C1C',
        sortOrder: 2,
      },
      {
        name: 'כלכלה',
        nameEn: 'Economy',
        slug: 'economy',
        color: '#1B5E20',
        sortOrder: 3,
      },
      {
        name: 'חברה',
        nameEn: 'Society',
        slug: 'society',
        color: '#E65100',
        sortOrder: 4,
      },
      {
        name: 'חינוך',
        nameEn: 'Education',
        slug: 'education',
        color: '#4A148C',
        sortOrder: 5,
      },
      {
        name: 'בריאות',
        nameEn: 'Health',
        slug: 'health',
        color: '#006064',
        sortOrder: 6,
      },
      {
        name: 'ספורט',
        nameEn: 'Sports',
        slug: 'sports',
        color: '#F57F17',
        sortOrder: 7,
      },
      {
        name: 'תרבות',
        nameEn: 'Culture',
        slug: 'culture',
        color: '#880E4F',
        sortOrder: 8,
      },
    ];

    const categoryIds: string[] = [];
    for (const cat of categories) {
      const result = (await queryRunner.query(
        `INSERT INTO "categories" ("id", "name", "nameEn", "slug", "color", "sortOrder", "isActive")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true)
         RETURNING "id"`,
        [cat.name, cat.nameEn, cat.slug, cat.color, cat.sortOrder],
      )) as { id: string }[];
      categoryIds.push(result[0].id);
      console.log(`  -> Created category: ${cat.name} (${cat.nameEn})`);
    }

    // ─── 3. Seed Members ──────────────────────────────────────────────
    console.log('Seeding members...');
    const members = [
      {
        name: 'בנימין נתניהו',
        nameEn: 'Benjamin Netanyahu',
        title: 'ראש הממשלה',
        titleEn: 'Prime Minister',
        bio: 'ראש ממשלת ישראל ויושב ראש תנועת הליכוד.',
        sortOrder: 1,
      },
      {
        name: 'ישראל כ"ץ',
        nameEn: 'Israel Katz',
        title: 'שר החוץ',
        titleEn: 'Minister of Foreign Affairs',
        bio: 'חבר כנסת ושר בכיר בתנועת הליכוד.',
        sortOrder: 2,
      },
      {
        name: 'ניר ברקת',
        nameEn: 'Nir Barkat',
        title: 'שר הכלכלה',
        titleEn: 'Minister of Economy',
        bio: 'ראש עיריית ירושלים לשעבר וחבר כנסת מטעם הליכוד.',
        sortOrder: 3,
      },
      {
        name: 'יולי אדלשטיין',
        nameEn: 'Yuli Edelstein',
        title: 'שר הבריאות',
        titleEn: 'Minister of Health',
        bio: 'יושב ראש הכנסת לשעבר וחבר כנסת מטעם הליכוד.',
        sortOrder: 4,
      },
      {
        name: 'מירי רגב',
        nameEn: 'Miri Regev',
        title: 'שרת התחבורה',
        titleEn: 'Minister of Transportation',
        bio: 'דוברת צה"ל לשעבר וחברת כנסת מטעם הליכוד.',
        sortOrder: 5,
      },
    ];

    const memberIds: string[] = [];
    for (const member of members) {
      const result = (await queryRunner.query(
        `INSERT INTO "members" ("id", "name", "nameEn", "title", "titleEn", "bio", "isActive", "sortOrder")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, $6)
         RETURNING "id"`,
        [
          member.name,
          member.nameEn,
          member.title,
          member.titleEn,
          member.bio,
          member.sortOrder,
        ],
      )) as { id: string }[];
      memberIds.push(result[0].id);
      console.log(`  -> Created member: ${member.name}`);
    }

    // ─── 4. Seed Authors ─────────────────────────────────────────────
    console.log('Seeding authors...');
    const authors = [
      {
        nameHe: 'יוסי כהן',
        nameEn: 'Yossi Cohen',
        roleHe: 'כתב פוליטי',
        roleEn: 'Political Correspondent',
        bioHe: 'כתב פוליטי בכיר המכסה את הנעשה בכנסת ובממשלה.',
        isActive: true,
      },
      {
        nameHe: 'שרה לוי',
        nameEn: 'Sarah Levy',
        roleHe: 'עורכת חדשות',
        roleEn: 'News Editor',
        bioHe: 'עורכת חדשות בכירה עם ניסיון של למעלה מ-15 שנה בתקשורת.',
        isActive: true,
      },
    ];

    const authorIds: string[] = [];
    for (const author of authors) {
      const result = (await queryRunner.query(
        `INSERT INTO "authors" ("id", "nameHe", "nameEn", "roleHe", "roleEn", "bioHe", "isActive")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
         RETURNING "id"`,
        [
          author.nameHe,
          author.nameEn,
          author.roleHe,
          author.roleEn,
          author.bioHe,
          author.isActive,
        ],
      )) as { id: string }[];
      authorIds.push(result[0].id);
      console.log(`  -> Created author: ${author.nameHe}`);
    }

    // ─── 5. Seed Tags ──────────────────────────────────────────────────
    console.log('Seeding tags...');
    const tags = [
      { nameHe: 'פוליטיקה', nameEn: 'Politics', slug: 'politics', tagType: 'topic' },
      { nameHe: 'ביטחון לאומי', nameEn: 'National Security', slug: 'national-security', tagType: 'topic' },
      { nameHe: 'כלכלה', nameEn: 'Economy', slug: 'economy', tagType: 'topic' },
      { nameHe: 'בנימין נתניהו', nameEn: 'Benjamin Netanyahu', slug: 'netanyahu', tagType: 'person' },
      { nameHe: 'ירושלים', nameEn: 'Jerusalem', slug: 'jerusalem', tagType: 'location' },
    ];

    const tagIds: string[] = [];
    for (const tag of tags) {
      const result = (await queryRunner.query(
        `INSERT INTO "tags" ("id", "nameHe", "nameEn", "slug", "tagType")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4::tag_type_enum)
         RETURNING "id"`,
        [tag.nameHe, tag.nameEn, tag.slug, tag.tagType],
      )) as { id: string }[];
      tagIds.push(result[0].id);
      console.log(`  -> Created tag: ${tag.nameHe} (${tag.nameEn})`);
    }

    // ─── 6. Seed Articles ─────────────────────────────────────────────
    console.log('Seeding articles...');
    const now = new Date();

    const articles = [
      {
        title: 'ראש הממשלה נתניהו: "נמשיך להוביל את מדינת ישראל קדימה"',
        subtitle: 'ראש הממשלה נשא נאום מרכזי בכנס הליכוד השנתי',
        content:
          'ראש הממשלה בנימין נתניהו נשא היום נאום מרכזי בכנס השנתי של תנועת הליכוד. בנאומו, התייחס נתניהו להישגי הממשלה בתחום הביטחון, הכלכלה והחברה. "אנחנו ממשיכים להוביל את מדינת ישראל קדימה, עם כלכלה חזקה, ביטחון מוצק ומעמד בינלאומי חסר תקדים", אמר נתניהו.',
        slug: 'netanyahu-likud-annual-conference',
        status: 'published',
        isHero: true,
        isBreaking: false,
        categoryIndex: 0,
        publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'נאום מרכזי בכנס השנתי', level: 2 },
          { type: 'paragraph', text: 'ראש הממשלה בנימין נתניהו נשא היום נאום מרכזי בכנס השנתי של תנועת הליכוד. בנאומו, התייחס נתניהו להישגי הממשלה בתחום הביטחון, הכלכלה והחברה.' },
          { type: 'image', url: 'https://placehold.co/800x400', caption: 'ראש הממשלה בכנס הליכוד' },
          { type: 'paragraph', text: '"אנחנו ממשיכים להוביל את מדינת ישראל קדימה, עם כלכלה חזקה, ביטחון מוצק ומעמד בינלאומי חסר תקדים", אמר נתניהו.' },
          { type: 'quote', text: 'אנחנו ממשיכים להוביל את מדינת ישראל קדימה' },
        ]),
      },
      {
        title: 'דחיפה דיפלומטית: ישראל חותמת על הסכם שיתוף פעולה חדש',
        subtitle: 'הסכם היסטורי בתחום הטכנולוגיה והמסחר',
        content:
          'מדינת ישראל חתמה היום על הסכם שיתוף פעולה חדש עם מדינה נוספת באזור. ההסכם כולל שיתוף פעולה בתחומי הטכנולוגיה, המסחר, החקלאות והחינוך. שר החוץ ישראל כ"ץ ציין כי מדובר בהישג דיפלומטי משמעותי שממשיך את מגמת הסכמי אברהם.',
        slug: 'new-diplomatic-agreement-signed',
        status: 'published',
        isHero: false,
        isBreaking: true,
        categoryIndex: 0,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: true,
        alertBannerText: 'מבזק: הסכם דיפלומטי חדש נחתם',
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'הסכם היסטורי בתחום הטכנולוגיה והמסחר', level: 2 },
          { type: 'paragraph', text: 'מדינת ישראל חתמה היום על הסכם שיתוף פעולה חדש עם מדינה נוספת באזור. ההסכם כולל שיתוף פעולה בתחומי הטכנולוגיה, המסחר, החקלאות והחינוך.' },
          { type: 'paragraph', text: 'שר החוץ ישראל כ"ץ ציין כי מדובר בהישג דיפלומטי משמעותי שממשיך את מגמת הסכמי אברהם.' },
        ]),
      },
      {
        title: 'מערכת הביטחון מציגה: תכנית רב-שנתית חדשה לחיזוק צה"ל',
        subtitle: 'תקציב ייעודי לפיתוח יכולות טכנולוגיות מתקדמות',
        content:
          'שר הביטחון הציג היום את התכנית הרב-שנתית החדשה לחיזוק צה"ל. התכנית כוללת השקעות משמעותיות בטכנולוגיות מתקדמות, סייבר, ומערכות נשק חדשניות. "אנחנו מבטיחים את העליונות הביטחונית של ישראל לעשורים הבאים", נאמר בהצהרה רשמית.',
        slug: 'new-multi-year-defense-plan',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 1,
        publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'תכנית רב-שנתית חדשה', level: 2 },
          { type: 'paragraph', text: 'שר הביטחון הציג היום את התכנית הרב-שנתית החדשה לחיזוק צה"ל. התכנית כוללת השקעות משמעותיות בטכנולוגיות מתקדמות, סייבר, ומערכות נשק חדשניות.' },
          { type: 'quote', text: 'אנחנו מבטיחים את העליונות הביטחונית של ישראל לעשורים הבאים' },
        ]),
      },
      {
        title: 'הכלכלה הישראלית ממשיכה לצמוח: נתונים חיוביים ברבעון האחרון',
        subtitle: 'עלייה בייצוא הטכנולוגי ובהשקעות זרות',
        content:
          'הלשכה המרכזית לסטטיסטיקה פרסמה היום נתונים חיוביים על הכלכלה הישראלית ברבעון האחרון. הנתונים מצביעים על צמיחה של 3.5% בתוצר המקומי הגולמי, עלייה בייצוא הטכנולוגי ועלייה משמעותית בהשקעות זרות. שר הכלכלה ניר ברקת ציין כי הנתונים משקפים את המדיניות הכלכלית הנכונה של הממשלה.',
        slug: 'economy-positive-growth-quarter',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 2,
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'נתונים חיוביים ברבעון האחרון', level: 2 },
          { type: 'paragraph', text: 'הלשכה המרכזית לסטטיסטיקה פרסמה היום נתונים חיוביים על הכלכלה הישראלית ברבעון האחרון.' },
          { type: 'paragraph', text: 'הנתונים מצביעים על צמיחה של 3.5% בתוצר המקומי הגולמי, עלייה בייצוא הטכנולוגי ועלייה משמעותית בהשקעות זרות.' },
          { type: 'paragraph', text: 'שר הכלכלה ניר ברקת ציין כי הנתונים משקפים את המדיניות הכלכלית הנכונה של הממשלה.' },
        ]),
      },
      {
        title: 'רפורמה חדשה בחינוך: שיפור תנאי המורים ותכניות לימוד מעודכנות',
        subtitle: 'התכנית תיושם בהדרגה החל משנת הלימודים הבאה',
        content:
          'שר החינוך הציג היום רפורמה מקיפה במערכת החינוך הישראלית. הרפורמה כוללת שיפור משמעותי בתנאי ההעסקה של מורים, עדכון תכניות הלימוד בתחומי המדעים והטכנולוגיה, והשקעה בתשתיות חינוכיות. "החינוך הוא הבסיס לעתיד המדינה", ציין השר.',
        slug: 'education-reform-teachers-curriculum',
        status: 'published',
        isHero: true,
        isBreaking: false,
        categoryIndex: 4,
        publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'רפורמה מקיפה במערכת החינוך', level: 2 },
          { type: 'paragraph', text: 'שר החינוך הציג היום רפורמה מקיפה במערכת החינוך הישראלית. הרפורמה כוללת שיפור משמעותי בתנאי ההעסקה של מורים, עדכון תכניות הלימוד בתחומי המדעים והטכנולוגיה, והשקעה בתשתיות חינוכיות.' },
          { type: 'quote', text: 'החינוך הוא הבסיס לעתיד המדינה' },
        ]),
      },
      {
        title: 'פרויקט תשתיות לאומי: כביש מהיר חדש יקשר בין צפון לדרום',
        subtitle: 'הפרויקט צפוי להפחית את זמני הנסיעה ב-30%',
        content:
          'שרת התחבורה מירי רגב הכריזה היום על פרויקט תשתיות לאומי חדש לסלילת כביש מהיר שיקשר בין צפון הארץ לדרומה. הפרויקט, בהשקעה של מיליארדי שקלים, צפוי להפחית את זמני הנסיעה ב-30% ולהניע פיתוח כלכלי באזורי הפריפריה.',
        slug: 'national-highway-project-north-south',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 3,
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'פרויקט תשתיות לאומי', level: 2 },
          { type: 'paragraph', text: 'שרת התחבורה מירי רגב הכריזה היום על פרויקט תשתיות לאומי חדש לסלילת כביש מהיר שיקשר בין צפון הארץ לדרומה.' },
          { type: 'paragraph', text: 'הפרויקט, בהשקעה של מיליארדי שקלים, צפוי להפחית את זמני הנסיעה ב-30% ולהניע פיתוח כלכלי באזורי הפריפריה.' },
        ]),
      },
      {
        title: 'מערכת הבריאות: תכנית חדשה להרחבת שירותי הרפואה בפריפריה',
        subtitle: 'הקמת מרכזים רפואיים חדשים בנגב ובגליל',
        content:
          'שר הבריאות יולי אדלשטיין הציג היום תכנית מקיפה להרחבת שירותי הבריאות בפריפריה. התכנית כוללת הקמת מרכזים רפואיים חדשים, גיוס רופאים מומחים ושדרוג הציוד הרפואי בבתי החולים הקיימים. "כל אזרח בישראל זכאי לשירותי בריאות ברמה הגבוהה ביותר", אמר השר.',
        slug: 'health-services-expansion-periphery',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 5,
        publishedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'תכנית להרחבת שירותי הרפואה', level: 2 },
          { type: 'paragraph', text: 'שר הבריאות יולי אדלשטיין הציג היום תכנית מקיפה להרחבת שירותי הבריאות בפריפריה.' },
          { type: 'paragraph', text: 'התכנית כוללת הקמת מרכזים רפואיים חדשים, גיוס רופאים מומחים ושדרוג הציוד הרפואי בבתי החולים הקיימים.' },
          { type: 'quote', text: 'כל אזרח בישראל זכאי לשירותי בריאות ברמה הגבוהה ביותר' },
        ]),
      },
      {
        title: 'נבחרת ישראל בכדורגל: ניצחון מרשים במשחק הוקדמה',
        subtitle: 'שער ניצחון בדקה ה-89 הקפיץ את האוהדים',
        content:
          'נבחרת ישראל בכדורגל ניצחה הערב במשחק מוקדמות בתוצאה מרשימה. שער הניצחון נקלע בדקה ה-89 של המשחק, מה שהקפיץ את עשרות אלפי האוהדים ביציעים. מאמן הנבחרת ציין כי הקבוצה הראתה רוח לחימה ונחישות.',
        slug: 'israel-football-impressive-victory',
        status: 'published',
        isHero: false,
        isBreaking: true,
        categoryIndex: 6,
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: true,
        alertBannerText: 'מבזק: ניצחון מרשים לנבחרת ישראל',
        readingTimeMinutes: 1,
        bodyBlocks: JSON.stringify([
          { type: 'paragraph', text: 'נבחרת ישראל בכדורגל ניצחה הערב במשחק מוקדמות בתוצאה מרשימה. שער הניצחון נקלע בדקה ה-89 של המשחק, מה שהקפיץ את עשרות אלפי האוהדים ביציעים.' },
          { type: 'paragraph', text: 'מאמן הנבחרת ציין כי הקבוצה הראתה רוח לחימה ונחישות.' },
        ]),
      },
      {
        title: 'פסטיבל תרבות ישראלי בינלאומי ייערך בירושלים',
        subtitle: 'אמנים מ-30 מדינות ישתתפו בפסטיבל',
        content:
          'עיריית ירושלים הכריזה היום על קיום פסטיבל תרבות בינלאומי גדול שייערך בבירה. הפסטיבל יכלול הופעות מוזיקה, תיאטרון, ריקוד ואמנות חזותית, עם השתתפות אמנים מ-30 מדינות שונות. "ירושלים היא בירת התרבות של ישראל", ציינה ראש העירייה.',
        slug: 'international-culture-festival-jerusalem',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 7,
        publishedAt: new Date(now.getTime() - 9 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'פסטיבל תרבות בינלאומי בירושלים', level: 2 },
          { type: 'paragraph', text: 'עיריית ירושלים הכריזה היום על קיום פסטיבל תרבות בינלאומי גדול שייערך בבירה.' },
          { type: 'paragraph', text: 'הפסטיבל יכלול הופעות מוזיקה, תיאטרון, ריקוד ואמנות חזותית, עם השתתפות אמנים מ-30 מדינות שונות.' },
          { type: 'quote', text: 'ירושלים היא בירת התרבות של ישראל' },
        ]),
      },
      {
        title: 'טיוטת חוק חדש: הגנה על זכויות עובדי ההייטק',
        subtitle: 'הצעת החוק תידון בוועדת הכלכלה של הכנסת',
        content:
          'חברי כנסת מהליכוד הגישו היום הצעת חוק חדשה שמטרתה להגן על זכויות עובדי ההייטק בישראל. הצעת החוק כוללת הסדרת תנאי עבודה, הגנה על אופציות עובדים ומנגנוני פיצוי במקרה של פיטורים. הצעת החוק צפויה להידון בוועדת הכלכלה של הכנסת בשבועות הקרובים.',
        slug: 'new-bill-hightech-workers-rights',
        status: 'draft',
        isHero: false,
        isBreaking: false,
        categoryIndex: 2,
        publishedAt: null,
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'הגנה על זכויות עובדי ההייטק', level: 2 },
          { type: 'paragraph', text: 'חברי כנסת מהליכוד הגישו היום הצעת חוק חדשה שמטרתה להגן על זכויות עובדי ההייטק בישראל.' },
          { type: 'paragraph', text: 'הצעת החוק כוללת הסדרת תנאי עבודה, הגנה על אופציות עובדים ומנגנוני פיצוי במקרה של פיטורים.' },
        ]),
      },
    ];

    const articleIds: string[] = [];
    for (const article of articles) {
      const result = (await queryRunner.query(
        `INSERT INTO "articles" (
          "id", "title", "subtitle", "content", "slug", "status",
          "isHero", "isBreaking", "categoryId", "publishedAt", "viewCount",
          "bodyBlocks", "authorId", "alertBannerEnabled", "alertBannerText",
          "readingTimeMinutes"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5::article_status_enum,
          $6, $7, $8, $9, $10,
          $11::jsonb, $12, $13, $14, $15
        )
        RETURNING "id"`,
        [
          article.title,
          article.subtitle,
          article.content,
          article.slug,
          article.status,
          article.isHero,
          article.isBreaking,
          categoryIds[article.categoryIndex],
          article.publishedAt,
          Math.floor(Math.random() * 5000),
          article.bodyBlocks,
          authorIds[article.authorIndex],
          article.alertBannerEnabled,
          (article as any).alertBannerText || null,
          article.readingTimeMinutes,
        ],
      )) as { id: string }[];
      articleIds.push(result[0].id);
      console.log(`  -> Created article: ${article.slug}`);
    }

    // ─── 7. Link some articles to members ─────────────────────────────
    console.log('Linking articles to members...');
    const articleMemberLinks = [
      { articleIdx: 0, memberIdx: 0 },
      { articleIdx: 1, memberIdx: 1 },
      { articleIdx: 2, memberIdx: 0 },
      { articleIdx: 3, memberIdx: 2 },
      { articleIdx: 4, memberIdx: 0 },
      { articleIdx: 5, memberIdx: 4 },
      { articleIdx: 6, memberIdx: 3 },
      { articleIdx: 7, memberIdx: 0 },
    ];

    for (const link of articleMemberLinks) {
      await queryRunner.query(
        `INSERT INTO "article_members" ("articlesId", "membersId")
         VALUES ($1, $2)`,
        [articleIds[link.articleIdx], memberIds[link.memberIdx]],
      );
    }
    console.log(
      `  -> Linked ${articleMemberLinks.length} article-member relations`,
    );

    // ─── 8. Link some articles to tags ──────────────────────────────────
    console.log('Linking articles to tags...');
    const articleTagLinks = [
      { articleIdx: 0, tagIdx: 0 }, // Netanyahu conference -> Politics
      { articleIdx: 0, tagIdx: 3 }, // Netanyahu conference -> Netanyahu
      { articleIdx: 1, tagIdx: 0 }, // Diplomatic agreement -> Politics
      { articleIdx: 2, tagIdx: 1 }, // Defense plan -> National Security
      { articleIdx: 3, tagIdx: 2 }, // Economy growth -> Economy
      { articleIdx: 4, tagIdx: 0 }, // Education reform -> Politics
      { articleIdx: 5, tagIdx: 0 }, // Highway project -> Politics
      { articleIdx: 6, tagIdx: 0 }, // Health expansion -> Politics
      { articleIdx: 7, tagIdx: 0 }, // Football victory -> Politics (general)
      { articleIdx: 8, tagIdx: 4 }, // Culture festival -> Jerusalem
      { articleIdx: 9, tagIdx: 2 }, // Hightech bill -> Economy
    ];

    for (const link of articleTagLinks) {
      await queryRunner.query(
        `INSERT INTO "article_tags" ("articlesId", "tagsId")
         VALUES ($1, $2)`,
        [articleIds[link.articleIdx], tagIds[link.tagIdx]],
      );
    }
    console.log(
      `  -> Linked ${articleTagLinks.length} article-tag relations`,
    );

    // ─── 9. Update first article with ALL block types ─────────────────
    console.log('Updating first article with all block types...');
    const allBlockTypes = JSON.stringify([
      {
        id: 'blk-heading-1',
        type: 'heading',
        text: 'נאום מרכזי בכנס השנתי של הליכוד',
        level: 2,
      },
      {
        id: 'blk-paragraph-1',
        type: 'paragraph',
        text: 'ראש הממשלה <strong>בנימין נתניהו</strong> נשא היום נאום מרכזי בכנס השנתי של תנועת הליכוד. בנאומו, התייחס נתניהו להישגי הממשלה בתחום הביטחון, הכלכלה והחברה. <a href="https://example.com">קרא עוד</a> על ההישגים.',
      },
      {
        id: 'blk-image-1',
        type: 'image',
        url: 'https://placehold.co/800x400/0099DB/FFFFFF?text=Likud+Conference',
        captionHe: 'ראש הממשלה בכנס הליכוד השנתי',
        credit: 'צילום: לשכת העיתונות הממשלתית',
        altText: 'ראש הממשלה נואם בכנס',
      },
      {
        id: 'blk-paragraph-2',
        type: 'paragraph',
        text: '"אנחנו ממשיכים להוביל את מדינת ישראל קדימה, עם כלכלה חזקה, ביטחון מוצק ומעמד בינלאומי חסר תקדים", אמר נתניהו בפני אלפי המשתתפים.',
      },
      {
        id: 'blk-youtube-1',
        type: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        caption: 'סרטון מתוך הכנס השנתי',
        credit: 'ערוץ הליכוד',
      },
      {
        id: 'blk-video-1',
        type: 'video',
        source: 'youtube',
        videoId: 'jNQXAC9IVRw',
        thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
        caption: 'סרטון וידאו מוטמע מ-YouTube',
        credit: 'YouTube',
      },
      {
        id: 'blk-divider-1',
        type: 'divider',
      },
      {
        id: 'blk-heading-2',
        type: 'heading',
        text: 'עיקרי הנאום',
        level: 3,
      },
      {
        id: 'blk-bullet-1',
        type: 'bullet_list',
        items: [
          'חיזוק הכלכלה הישראלית והגדלת הייצוא',
          'המשך מדיניות הביטחון האיתנה',
          'הרחבת הסכמי אברהם למדינות נוספות',
          'השקעה במערכת החינוך והבריאות',
          'פיתוח תשתיות ברחבי הארץ',
        ],
      },
      {
        id: 'blk-quote-1',
        type: 'quote',
        text: 'אנחנו ממשיכים להוביל את מדינת ישראל קדימה — עם כלכלה חזקה, ביטחון מוצק ומעמד בינלאומי חסר תקדים.',
        attribution: 'ראש הממשלה בנימין נתניהו',
      },
      {
        id: 'blk-tweet-1',
        type: 'tweet',
        tweetId: '1893016827498922099',
        authorHandle: 'Netanyahu',
        previewText: 'הכנס השנתי של הליכוד — ערב מרגש עם אלפי פעילים!',
        caption: 'ציוץ ממשרד ראש הממשלה',
      },
      {
        id: 'blk-paragraph-3',
        type: 'paragraph',
        text: 'הכנס נחתם בשירה משותפת של המנון התנועה. <em>אלפי פעילים</em> נכחו באירוע שנערך באולם הגדול בתל אביב.',
      },
      {
        id: 'blk-article-link-1',
        type: 'article_link',
        linkedArticleId: articleIds[1],
        displayStyle: 'card',
        linkedArticle: {
          title: articles[1].title,
          heroImageUrl: null,
          slug: articles[1].slug,
        },
      },
      {
        id: 'blk-heading-3',
        type: 'heading',
        text: 'סיכום',
        level: 4,
      },
      {
        id: 'blk-paragraph-4',
        type: 'paragraph',
        text: 'הכנס השנתי של הליכוד סימן את תחילתה של שנת בחירות חדשה עם אופטימיות ותחושת שליחות. ראש הממשלה קרא לפעילים להתגייס ולפעול למען המפלגה והמדינה.',
      },
    ]);

    await queryRunner.query(
      `UPDATE "articles" SET "bodyBlocks" = $1::jsonb, "readingTimeMinutes" = 5
       WHERE "id" = $2`,
      [allBlockTypes, articleIds[0]],
    );
    console.log('  -> Updated first article with all 15 blocks (11 types)');

    // ─── 10. Seed Ticker Items ─────────────────────────────────────────
    console.log('Seeding ticker items...');
    const tickerItems = [
      {
        text: 'ראש הממשלה נתניהו ייפגש עם נשיא ארה"ב בבית הלבן בשבוע הבא',
        position: 1,
        articleIdx: 0,
      },
      {
        text: 'הכנסת אישרה את חוק התקציב ברוב של 61 תומכים',
        position: 2,
        articleIdx: null,
      },
      {
        text: 'עלייה של 15% בתיירות לישראל ברבעון האחרון',
        position: 3,
        articleIdx: null,
      },
      {
        text: 'פרויקט הרכבת הקלה בתל אביב צפוי להיפתח בחודשים הקרובים',
        position: 4,
        articleIdx: 5,
      },
      {
        text: 'ישראל זכתה במדליית זהב באולימפיאדה הבינלאומית למתמטיקה',
        position: 5,
        articleIdx: null,
      },
    ];

    for (const item of tickerItems) {
      await queryRunner.query(
        `INSERT INTO "ticker_items" ("id", "text", "articleId", "position", "isActive")
         VALUES (uuid_generate_v4(), $1, $2, $3, true)`,
        [
          item.text,
          item.articleIdx !== null ? articleIds[item.articleIdx] : null,
          item.position,
        ],
      );
      console.log(`  -> Created ticker item: ${item.text.substring(0, 50)}...`);
    }

    // ─── Commit ───────────────────────────────────────────────────────
    await queryRunner.commitTransaction();
    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed failed, rolling back...', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seed();
