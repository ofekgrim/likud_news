import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';

async function seed() {
  const forceReseed = process.argv.includes('--force');
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
    if (parseInt(existingUsers[0].count, 10) > 0 && !forceReseed) {
      console.log('Database already seeded. Use --force to reseed.');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && parseInt(existingUsers[0].count, 10) > 0) {
      console.log('Force reseed: clearing existing data...');
      // Delete in reverse dependency order
      await queryRunner.query('DELETE FROM "comments"');
      await queryRunner.query('DELETE FROM "article_tags"');
      await queryRunner.query('DELETE FROM "article_members"');
      await queryRunner.query('DELETE FROM "stories"');
      await queryRunner.query('DELETE FROM "ticker_items"');
      await queryRunner.query('DELETE FROM "media"');
      await queryRunner.query('DELETE FROM "articles"');
      await queryRunner.query('DELETE FROM "tags"');
      await queryRunner.query('DELETE FROM "authors"');
      await queryRunner.query('DELETE FROM "members"');
      await queryRunner.query('DELETE FROM "categories"');
      await queryRunner.query('DELETE FROM "users"');
      console.log('Existing data cleared.');
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
      {
        name: 'וידאו',
        nameEn: 'Video',
        slug: 'video',
        color: '#D32F2F',
        sortOrder: 9,
      },
      {
        name: 'מגזין',
        nameEn: 'Magazine',
        slug: 'magazine',
        color: '#7B1FA2',
        sortOrder: 10,
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
        bio: 'ראש ממשלת ישראל ויושב ראש תנועת הליכוד. ראש הממשלה הארוך ביותר בתולדות המדינה.',
        slug: 'benjamin-netanyahu',
        photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
        office: 'משרד ראש הממשלה, ירושלים',
        phone: '+972-2-670-5555',
        email: 'pm@pmo.gov.il',
        website: 'https://www.pmo.gov.il',
        socialTwitter: 'https://x.com/netanyahu',
        socialFacebook: 'https://facebook.com/Netanyahu',
        socialInstagram: 'https://instagram.com/benjamin.netanyahu',
        coverImageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=400&fit=crop',
        personalPageHtml: '<h2>בנימין נתניהו - ראש ממשלת ישראל</h2><p>בנימין (ביבי) נתניהו הוא ראש ממשלת ישראל ויושב ראש תנועת הליכוד. נתניהו משמש כראש הממשלה הארוך ביותר בתולדות ישראל.</p><h3>קריירה פוליטית</h3><p>נתניהו נבחר לראשונה לכנסת בשנת 1988 ושימש בתפקידים בכירים כולל שגריר ישראל באו"ם, סגן שר החוץ ושר האוצר.</p><h3>הישגים</h3><ul><li>הסכמי אברהם - נורמליזציה עם מדינות ערב</li><li>מבצע חיסונים מהיר נגד קורונה</li><li>חיזוק הכלכלה הישראלית</li></ul>',
        sortOrder: 1,
        bioBlocks: [
          { id: 'nb-1', type: 'heading', text: 'בנימין נתניהו — ראש ממשלת ישראל', level: 2 },
          { id: 'nb-2', type: 'image', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=500&fit=crop', credit: 'Unsplash', captionHe: 'ראש הממשלה בנימין נתניהו', altText: 'Benjamin Netanyahu portrait' },
          { id: 'nb-3', type: 'paragraph', text: 'בנימין (ביבי) נתניהו נולד ב-21 באוקטובר 1949 בתל אביב. הוא ראש ממשלת ישראל ויושב ראש תנועת הליכוד, ומשמש כראש הממשלה הארוך ביותר בתולדות המדינה.' },
          { id: 'nb-4', type: 'heading', text: 'קריירה צבאית', level: 3 },
          { id: 'nb-5', type: 'paragraph', text: 'נתניהו שירת ביחידת סיירת מטכ"ל והשתתף במבצעים מיוחדים. את שירותו הצבאי סיים בדרגת קפטן.' },
          { id: 'nb-6', type: 'quote', text: 'אם המדינה מצפה מהחיילים שלה להילחם, מחובתה לעמוד מאחוריהם.', attribution: 'בנימין נתניהו' },
          { id: 'nb-7', type: 'divider' },
          { id: 'nb-8', type: 'heading', text: 'הישגים מרכזיים', level: 3 },
          { id: 'nb-9', type: 'bullet_list', items: ['הסכמי אברהם — נורמליזציה עם איחוד האמירויות, בחריין, מרוקו וסודן', 'מבצע חיסונים מהיר שהפך את ישראל למובילת עולמית בחיסוני קורונה', 'חיזוק הכלכלה הישראלית והפיכתה למעצמת הייטק עולמית', 'ביסוס יחסים אסטרטגיים עם ארה"ב ומעצמות נוספות'] },
          { id: 'nb-10', type: 'divider' },
          { id: 'nb-11', type: 'heading', text: 'קריירה פוליטית', level: 3 },
          { id: 'nb-12', type: 'paragraph', text: 'נתניהו נבחר לראשונה לכנסת בשנת 1988. שימש כשגריר ישראל באו"ם (1984-1988), סגן שר החוץ (1988-1991), ושר האוצר (2003-2005). כיהן כראש ממשלה לראשונה בין 1996-1999, ושוב מ-2009 ואילך.' },
          { id: 'nb-13', type: 'image', url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=450&fit=crop', credit: 'Unsplash', captionHe: 'נאום בכנס הליכוד', altText: 'Netanyahu at Likud convention' },
          { id: 'nb-14', type: 'youtube', videoId: 'dQw4w9WgXcQ', caption: 'נאום ראש הממשלה נתניהו באו"ם' },
        ],
      },
      {
        name: 'ישראל כ"ץ',
        nameEn: 'Israel Katz',
        title: 'שר החוץ',
        titleEn: 'Minister of Foreign Affairs',
        bio: 'חבר כנסת ושר בכיר בתנועת הליכוד. מהדמויות הבולטות בתנועה עם ניסיון של עשרות שנים בפוליטיקה.',
        slug: 'israel-katz',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        office: 'משרד החוץ, ירושלים',
        phone: '+972-2-530-3111',
        email: 'sar@mfa.gov.il',
        website: 'https://www.mfa.gov.il',
        socialTwitter: 'https://x.com/Israel_katz',
        socialFacebook: 'https://facebook.com/IsraelKatzOfficial',
        socialInstagram: '',
        coverImageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=400&fit=crop',
        personalPageHtml: '<h2>ישראל כ"ץ - שר החוץ</h2><p>ישראל כ"ץ הוא פוליטיקאי ישראלי המכהן כשר החוץ. חבר מרכז הליכוד ומהדמויות הבולטות בתנועה.</p>',
        sortOrder: 2,
        bioBlocks: [
          { id: 'ik-1', type: 'heading', text: 'ישראל כ"ץ — שר החוץ', level: 2 },
          { id: 'ik-2', type: 'image', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop', credit: 'Unsplash', captionHe: 'שר החוץ ישראל כ"ץ', altText: 'Israel Katz portrait' },
          { id: 'ik-3', type: 'paragraph', text: 'ישראל כ"ץ הוא פוליטיקאי ישראלי ותיק, חבר הכנסת ושר בכיר בממשלות ישראל. כ"ץ הוא מהדמויות הבולטות והמשפיעות ביותר בתנועת הליכוד.' },
          { id: 'ik-4', type: 'heading', text: 'תפקידים בממשלה', level: 3 },
          { id: 'ik-5', type: 'bullet_list', items: ['שר החוץ', 'שר התחבורה והבטיחות בדרכים (לשעבר)', 'שר המודיעין (לשעבר)', 'שר האוצר (לשעבר)', 'שר החקלאות (לשעבר)'] },
          { id: 'ik-6', type: 'divider' },
          { id: 'ik-7', type: 'heading', text: 'הישגים', level: 3 },
          { id: 'ik-8', type: 'paragraph', text: 'בתקופת כהונתו כשר התחבורה קידם כ"ץ פרויקטי תשתית ענקיים, כולל הרכבת הקלה בתל אביב, הרחבת כביש 6 ושדרוג מערכת הרכבות.' },
          { id: 'ik-9', type: 'quote', text: 'ישראל חייבת להיות מובילה בדיפלומטיה בינלאומית ולחזק את מעמדה בזירה הגלובלית.', attribution: 'ישראל כ"ץ' },
        ],
      },
      {
        name: 'ניר ברקת',
        nameEn: 'Nir Barkat',
        title: 'שר הכלכלה',
        titleEn: 'Minister of Economy',
        bio: 'ראש עיריית ירושלים לשעבר, יזם הייטק וחבר כנסת מטעם הליכוד.',
        slug: 'nir-barkat',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        office: 'משרד הכלכלה והתעשייה, ירושלים',
        phone: '+972-2-666-2000',
        email: 'sar@economy.gov.il',
        website: 'https://www.gov.il/he/departments/ministry_of_economy',
        socialTwitter: 'https://x.com/NirBarkat',
        socialFacebook: 'https://facebook.com/NirBarkat',
        socialInstagram: 'https://instagram.com/nirbarkat',
        coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop',
        personalPageHtml: '<h2>ניר ברקת - שר הכלכלה</h2><p>ניר ברקת הוא איש עסקים ופוליטיקאי, כיהן כראש עיריית ירושלים ומכהן כעת כשר הכלכלה והתעשייה.</p><h3>ניסיון מקצועי</h3><p>ברקת ייסד חברות הייטק מובילות וכיהן כראש עיריית ירושלים בין 2008-2018.</p>',
        sortOrder: 3,
        bioBlocks: [
          { id: 'br-1', type: 'heading', text: 'ניר ברקת — שר הכלכלה והתעשייה', level: 2 },
          { id: 'br-2', type: 'paragraph', text: 'ניר ברקת הוא יזם הייטק, איש עסקים ופוליטיקאי ישראלי. כיהן כראש עיריית ירושלים בין 2008 ל-2018, ומכהן כעת כשר הכלכלה והתעשייה.' },
          { id: 'br-3', type: 'image', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop', credit: 'Unsplash', captionHe: 'שר הכלכלה ניר ברקת', altText: 'Economy ministry building' },
          { id: 'br-4', type: 'heading', text: 'עולם ההייטק', level: 3 },
          { id: 'br-5', type: 'paragraph', text: 'ברקת הקים מספר חברות הייטק מצליחות, בהן BRM Group שהשקיעה בעשרות חברות טכנולוגיה. הניסיון העסקי שלו מהווה בסיס לתפיסה הכלכלית שלו כשר.' },
          { id: 'br-6', type: 'quote', text: 'הכלכלה הישראלית היא מנוע הצמיחה של המדינה. עלינו לטפח חדשנות ויזמות.', attribution: 'ניר ברקת' },
          { id: 'br-7', type: 'divider' },
          { id: 'br-8', type: 'heading', text: 'ירושלים — עיר הבירה', level: 3 },
          { id: 'br-9', type: 'paragraph', text: 'בתקופת כהונתו כראש עיריית ירושלים, ברקת הוביל פרויקטים משמעותיים לפיתוח העיר, כולל הרכבת הקלה, פארק טכנולוגי והתחדשות עירונית.' },
          { id: 'br-10', type: 'bullet_list', items: ['הקמת פארק הייטק בהר חוצבים', 'פיתוח תשתיות תחבורה כולל הרכבת הקלה', 'חיזוק התיירות — מ-2 מיליון ל-4 מיליון תיירים בשנה', 'השקעה בחינוך ורווחה'] },
          { id: 'br-11', type: 'image', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=450&fit=crop', credit: 'Unsplash', captionHe: 'ירושלים — עיר ההייטק', altText: 'Jerusalem skyline' },
          { id: 'br-12', type: 'youtube', videoId: 'dQw4w9WgXcQ', caption: 'ניר ברקת על חזון הכלכלה הישראלית' },
        ],
      },
      {
        name: 'יולי אדלשטיין',
        nameEn: 'Yuli Edelstein',
        title: 'שר הבריאות',
        titleEn: 'Minister of Health',
        bio: 'אסיר ציון לשעבר, יושב ראש הכנסת לשעבר וחבר כנסת מטעם הליכוד.',
        slug: 'yuli-edelstein',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        office: 'משרד הבריאות, ירושלים',
        phone: '+972-2-508-1111',
        email: 'sar@health.gov.il',
        website: 'https://www.health.gov.il',
        socialTwitter: 'https://x.com/YuliEdelstein',
        socialFacebook: 'https://facebook.com/YuliEdelstein',
        socialInstagram: '',
        coverImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=400&fit=crop',
        personalPageHtml: '<h2>יולי אדלשטיין - שר הבריאות</h2><p>יולי אדלשטיין הוא פוליטיקאי ישראלי, עולה מברית המועצות ואסיר ציון לשעבר. כיהן כיושב ראש הכנסת.</p>',
        sortOrder: 4,
        bioBlocks: [
          { id: 'ye-1', type: 'heading', text: 'יולי אדלשטיין — שר הבריאות', level: 2 },
          { id: 'ye-2', type: 'image', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=500&fit=crop', credit: 'Unsplash', captionHe: 'שר הבריאות יולי אדלשטיין', altText: 'Yuli Edelstein portrait' },
          { id: 'ye-3', type: 'paragraph', text: 'יולי יואל אדלשטיין נולד ב-5 בפברואר 1958 בצ\'רנובצי, אוקראינה (בריה"מ לשעבר). הוא עלה לישראל ב-1987 לאחר שנות מאסר בכלא סובייטי בשל פעילותו הציונית.' },
          { id: 'ye-4', type: 'heading', text: 'אסיר ציון', level: 3 },
          { id: 'ye-5', type: 'paragraph', text: 'אדלשטיין נעצר ב-1984 על ידי השלטונות הסובייטיים בגין "החזקת סמים" — אשמה מפוברקת שנועדה להעניש אותו על הוראת עברית ופעילות ציונית. ריצה שלוש שנות מאסר במחנות עבודה בסיביר.' },
          { id: 'ye-6', type: 'quote', text: 'החירות אינה מובנת מאליה. נלחמתי עליה בכלא הסובייטי ואמשיך להילחם עליה בכנסת ישראל.', attribution: 'יולי אדלשטיין' },
          { id: 'ye-7', type: 'divider' },
          { id: 'ye-8', type: 'heading', text: 'תפקידים ציבוריים', level: 3 },
          { id: 'ye-9', type: 'bullet_list', items: ['יושב ראש הכנסת ה-19, ה-20 וה-21 (2013-2020)', 'שר הבריאות', 'שר הקליטה (לשעבר)', 'שר ההסברה והתפוצות (לשעבר)'] },
          { id: 'ye-10', type: 'paragraph', text: 'כיושב ראש הכנסת, אדלשטיין ידוע בניהול ישיבות בכבוד ובמקצועיות, ובקידום הדיאלוג הפרלמנטרי הבינלאומי.' },
        ],
      },
      {
        name: 'מירי רגב',
        nameEn: 'Miri Regev',
        title: 'שרת התחבורה',
        titleEn: 'Minister of Transportation',
        bio: 'דוברת צה"ל לשעבר, שרת התרבות והספורט לשעבר וחברת כנסת מטעם הליכוד.',
        slug: 'miri-regev',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
        office: 'משרד התחבורה, ירושלים',
        phone: '+972-3-954-4000',
        email: 'sar@mot.gov.il',
        website: 'https://www.gov.il/he/departments/ministry_of_transport',
        socialTwitter: 'https://x.com/MiriRegev',
        socialFacebook: 'https://facebook.com/MiriRegevOfficial',
        socialInstagram: 'https://instagram.com/maboreket',
        coverImageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&h=400&fit=crop',
        personalPageHtml: '<h2>מירי רגב - שרת התחבורה</h2><p>מירי רגב היא פוליטיקאית ישראלית וקצינה בכירה לשעבר בצה"ל. כיהנה כדוברת צה"ל ושרת התרבות והספורט.</p>',
        sortOrder: 5,
        bioBlocks: [
          { id: 'mr-1', type: 'heading', text: 'מירי רגב — שרת התחבורה והבטיחות בדרכים', level: 2 },
          { id: 'mr-2', type: 'image', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=500&fit=crop', credit: 'Unsplash', captionHe: 'שרת התחבורה מירי רגב', altText: 'Miri Regev portrait' },
          { id: 'mr-3', type: 'paragraph', text: 'מירי רגב היא פוליטיקאית ישראלית, חברת הכנסת מטעם הליכוד וקצינה בכירה לשעבר בצה"ל. רגב שימשה כדוברת צה"ל ובעקבות כך זכתה לפרסום רב בציבור הישראלי.' },
          { id: 'mr-4', type: 'heading', text: 'שירות צבאי', level: 3 },
          { id: 'mr-5', type: 'paragraph', text: 'רגב שירתה בצה"ל והגיעה לדרגת תת-אלוף. בין תפקידיה הבולטים: דוברת צה"ל (2005-2007), שם ניהלה את תקשורת הצבא מול הציבור והתקשורת הבינלאומית.' },
          { id: 'mr-6', type: 'divider' },
          { id: 'mr-7', type: 'heading', text: 'שרת התרבות והספורט', level: 3 },
          { id: 'mr-8', type: 'paragraph', text: 'בתקופת כהונתה כשרת התרבות והספורט (2015-2020), רגב קידמה את הנגשת התרבות לפריפריה וחיזקה את ענף הספורט הישראלי.' },
          { id: 'mr-9', type: 'bullet_list', items: ['הנגשת מופעי תרבות לפריפריה', 'תמיכה בספורט ההישגי הישראלי', 'קידום סינמה ותרבות ישראלית בעולם', 'פיתוח מתקני ספורט ברשויות מקומיות'] },
          { id: 'mr-10', type: 'quote', text: 'התחבורה היא עורק החיים של המדינה. השקעה בתשתיות היא השקעה בעתיד.', attribution: 'מירי רגב' },
          { id: 'mr-11', type: 'heading', text: 'תחבורה ותשתיות', level: 3 },
          { id: 'mr-12', type: 'paragraph', text: 'כשרת התחבורה, רגב מובילה מהפכת תחבורה ציבורית כולל הרחבת הרכבת הקלה, פיתוח נתיבי אוטובוס מהירים ושדרוג תשתיות הכבישים.' },
          { id: 'mr-13', type: 'image', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=450&fit=crop', credit: 'Unsplash', captionHe: 'תחבורה ציבורית בישראל', altText: 'Public transport in Israel' },
          { id: 'mr-14', type: 'youtube', videoId: 'dQw4w9WgXcQ', caption: 'שרת התחבורה מירי רגב על תוכנית התחבורה הלאומית' },
        ],
      },
    ];

    const memberIds: string[] = [];
    for (const member of members) {
      const result = (await queryRunner.query(
        `INSERT INTO "members" ("id", "name", "nameEn", "title", "titleEn", "bio", "isActive", "sortOrder",
         "slug", "photoUrl", "office", "phone", "email", "website", "socialTwitter", "socialFacebook", "socialInstagram",
         "coverImageUrl", "personalPageHtml", "bioBlocks")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, $6,
         $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING "id"`,
        [
          member.name,
          member.nameEn,
          member.title,
          member.titleEn,
          member.bio,
          member.sortOrder,
          member.slug,
          member.photoUrl,
          member.office,
          member.phone,
          member.email,
          member.website,
          member.socialTwitter || null,
          member.socialFacebook || null,
          member.socialInstagram || null,
          member.coverImageUrl,
          member.personalPageHtml,
          JSON.stringify(member.bioBlocks),
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

    // ── Auto-create person tags for members ─────────────────────────────
    console.log('Creating person tags for members...');
    for (const member of members) {
      const tagSlug = member.name
        .replace(/[^\w\u0590-\u05FF]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

      const existing = await queryRunner.query(
        `SELECT "id" FROM "tags" WHERE "slug" = $1`,
        [tagSlug],
      );
      if (existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO "tags" ("id", "nameHe", "nameEn", "slug", "tagType")
           VALUES (uuid_generate_v4(), $1, $2, $3, 'person'::tag_type_enum)`,
          [member.name, member.nameEn || null, tagSlug],
        );
      }
    }
    console.log('  ✓ Person tags created for all members');

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
        heroImageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=450&fit=crop',
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'נאום מרכזי בכנס השנתי', level: 2 },
          { type: 'paragraph', text: 'ראש הממשלה בנימין נתניהו נשא היום נאום מרכזי בכנס השנתי של תנועת הליכוד. בנאומו, התייחס נתניהו להישגי הממשלה בתחום הביטחון, הכלכלה והחברה.' },
          { type: 'image', url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=400&fit=crop', caption: 'ראש הממשלה בכנס הליכוד' },
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
        heroImageUrl: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&h=450&fit=crop',
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
        heroImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop',
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
        heroImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
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
        heroImageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
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
        heroImageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=450&fit=crop',
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
      // ── New articles (indices 10-24): 3 per category ──────────────
      {
        title: 'הקואליציה אישרה חוק חדש להגברת השקיפות בממשלה',
        subtitle: 'החוק מחייב פרסום פרוטוקולים של ישיבות ממשלה בתוך 30 יום',
        content: 'הכנסת אישרה הלילה בקריאה שנייה ושלישית את חוק השקיפות הממשלתית, ביוזמת סיעת הליכוד. החוק החדש מחייב את מזכירות הממשלה לפרסם פרוטוקולים מלאים של ישיבות ממשלה בתוך 30 יום מקיומן.',
        slug: 'coalition-transparency-law-approved',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 0,
        publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'חוק השקיפות אושר ברוב של 61 חברי כנסת', level: 2 },
          { type: 'paragraph', text: 'הכנסת אישרה הלילה בקריאה שנייה ושלישית את חוק השקיפות הממשלתית, ביוזמת סיעת הליכוד.' },
          { type: 'paragraph', text: 'ראש הממשלה נתניהו ציין כי "החוק הזה מוכיח שהליכוד מחויב לשקיפות מלאה מול הציבור".' },
        ]),
      },
      {
        title: 'מערכת כיפת ברזל החדשה עברה ניסוי מוצלח בנגב',
        subtitle: 'הדור הבא של כיפת ברזל מסוגל ליירט מספר כפול של איומים בו-זמנית',
        content: 'משרד הביטחון הודיע היום על השלמת ניסוי מוצלח של הדור הבא של מערכת כיפת ברזל. המערכת המשודרגת הדגימה יכולת יירוט של מספר כפול של טילים בו-זמנית.',
        slug: 'iron-dome-next-gen-successful-test',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 1,
        publishedAt: new Date(now.getTime() - 11 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 4,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'הניסוי בוצע בהצלחה מלאה באזור הנגב', level: 2 },
          { type: 'paragraph', text: 'משרד הביטחון הודיע היום על השלמת ניסוי מוצלח של הדור הבא של מערכת כיפת ברזל.' },
          { type: 'paragraph', text: 'שר הביטחון הדגיש כי "מדובר בקפיצת מדרגה משמעותית ביכולות ההגנה של ישראל".' },
        ]),
      },
      {
        title: 'ישראל וירדן חתמו על הסכם חדש לשיתוף פעולה ביטחוני בגבול',
        subtitle: 'ההסכם כולל סיורים משותפים ומערכת התרעה משולבת',
        content: 'ישראל וירדן חתמו השבוע על הסכם ביטחוני חדש המרחיב את שיתוף הפעולה בגבול המשותף. ההסכם כולל הקמת חדר מצב משותף וסיורים מתואמים.',
        slug: 'israel-jordan-border-security-agreement',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 1,
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'שיתוף פעולה ביטחוני היסטורי', level: 2 },
          { type: 'paragraph', text: 'ישראל וירדן חתמו השבוע על הסכם ביטחוני חדש המרחיב את שיתוף הפעולה בגבול המשותף.' },
          { type: 'paragraph', text: '"הביטחון ההדדי שלנו תלוי בשיתוף פעולה", אמר ראש הממשלה נתניהו בטקס החתימה.' },
        ]),
      },
      {
        title: 'יצוא ההייטק הישראלי שבר שיא חדש ברבעון האחרון',
        subtitle: 'יצוא שירותי טכנולוגיה הגיע ל-20 מיליארד דולר',
        content: 'הלשכה המרכזית לסטטיסטיקה פרסמה היום נתונים המצביעים על שיא חדש ביצוא ההייטק הישראלי. יצוא שירותי הטכנולוגיה הגיע ל-20 מיליארד דולר.',
        slug: 'tech-exports-record-quarter',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 2,
        publishedAt: new Date(now.getTime() - 13 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'אומת הסטארט-אפ ממשיכה להוביל', level: 2 },
          { type: 'paragraph', text: 'יצוא שירותי הטכנולוגיה הגיע ל-20 מיליארד דולר, עלייה של 18% לעומת הרבעון המקביל אשתקד.' },
          { type: 'paragraph', text: 'תחומי הסייבר והבינה המלאכותית היו המנועים המרכזיים של הצמיחה.' },
        ]),
      },
      {
        title: 'הממשלה אישרה תוכנית לבניית 50,000 דירות חדשות בפריפריה',
        subtitle: 'התוכנית כוללת הקלות במכרזים ותמריצים לקבלנים',
        content: 'הממשלה אישרה היום תוכנית מקיפה לבניית 50,000 יחידות דיור חדשות בפריפריה בהשקעה של 15 מיליארד שקלים.',
        slug: 'government-50k-housing-plan-periphery',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 2,
        publishedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'פתרון מקיף למשבר הדיור בפריפריה', level: 2 },
          { type: 'paragraph', text: 'הממשלה אישרה היום תוכנית מקיפה לבניית 50,000 יחידות דיור חדשות בפריפריה.' },
          { type: 'paragraph', text: 'ראש הממשלה: "הפריפריה היא העתיד של ישראל. אנחנו משקיעים בדיור, בתעסוקה ובתשתיות".' },
        ]),
      },
      {
        title: 'תוכנית חדשה לקליטת עלייה: מרכזי שילוב בכל עיר גדולה',
        subtitle: 'המרכזים יספקו שירותי שפה, תעסוקה ותמיכה קהילתית לעולים חדשים',
        content: 'משרד העלייה והקליטה הכריז היום על הקמת 20 מרכזי שילוב חדשים ברחבי הארץ לעולים חדשים.',
        slug: 'new-immigration-integration-centers',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 3,
        publishedAt: new Date(now.getTime() - 15 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: '20 מרכזי שילוב חדשים ייפתחו ברחבי הארץ', level: 2 },
          { type: 'paragraph', text: 'משרד העלייה והקליטה הכריז על הקמת 20 מרכזי שילוב חדשים במסגרת תוכנית "בית חדש בישראל".' },
          { type: 'paragraph', text: '"כל עולה חדש הוא חיזוק למדינת ישראל", אמר שר העלייה והקליטה.' },
        ]),
      },
      {
        title: 'עיריית ירושלים תקים 12 מתנ"סים חדשים בשכונות מזרח העיר',
        subtitle: 'המתנ"סים יכללו חוגים, ספריות, חדרי מחשבים ומרכזי נוער',
        content: 'עיריית ירושלים פרסמה תוכנית להקמת 12 מרכזים קהילתיים חדשים בשכונות מזרח ירושלים בהשקעה של 500 מיליון שקלים.',
        slug: 'jerusalem-12-new-community-centers-east',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 3,
        publishedAt: new Date(now.getTime() - 16 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'השקעה של 500 מיליון שקלים בקהילות מזרח ירושלים', level: 2 },
          { type: 'paragraph', text: 'עיריית ירושלים פרסמה תוכנית להקמת 12 מרכזים קהילתיים חדשים בשכונות מזרח ירושלים.' },
          { type: 'paragraph', text: '"ירושלים היא עיר אחת לכל תושביה", ציין ראש העיר.' },
        ]),
      },
      {
        title: 'משרד החינוך משיק תוכנית STEM לאומית ב-500 בתי ספר',
        subtitle: 'התוכנית תכלול מעבדות רובוטיקה, קורסי תכנות וסדנאות בינה מלאכותית',
        content: 'משרד החינוך הכריז היום על השקת תוכנית STEM לאומית שתופעל ב-500 בתי ספר ברחבי הארץ.',
        slug: 'national-stem-program-500-schools',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 4,
        publishedAt: new Date(now.getTime() - 17 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'מהפכת ה-STEM בבתי הספר בישראל', level: 2 },
          { type: 'paragraph', text: 'משרד החינוך הכריז על השקת תוכנית STEM לאומית בתקציב של 2 מיליארד שקלים על פני חמש שנים.' },
          { type: 'paragraph', text: 'דגש מיוחד יושם על בתי ספר בפריפריה.' },
        ]),
      },
      {
        title: 'אוניברסיטת בן-גוריון תפתח קמפוס חדש בערד בתמיכת הממשלה',
        subtitle: 'הקמפוס יתמחה במדעי המדבר, אנרגיה מתחדשת וחקלאות חכמה',
        content: 'אוניברסיטת בן-גוריון בנגב הודיעה על פתיחת קמפוס חדש בעיר ערד בתמיכת תקציבית מלאה של הממשלה.',
        slug: 'bgu-new-campus-arad-desert-studies',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 4,
        publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'קמפוס חדש בלב הנגב — השקעה בעתיד', level: 2 },
          { type: 'paragraph', text: 'הקמפוס, שהקמתו מתוקצבת ב-1.5 מיליארד שקלים, יכלול מעבדות מחקר מתקדמות.' },
          { type: 'paragraph', text: '"ערד היא מקום אידיאלי למחקר מדעי המדבר", ציין נשיא האוניברסיטה.' },
        ]),
      },
      {
        title: 'בית חולים חדש ייפתח בבאר שבע עם 800 מיטות אשפוז',
        subtitle: 'המרכז הרפואי החדש יכלול מחלקות ייחודיות לרפואת שטח וטראומה',
        content: 'משרד הבריאות הכריז על הקמת בית חולים חדש בבאר שבע שיכלול 800 מיטות אשפוז בהשקעה של 4 מיליארד שקלים.',
        slug: 'new-hospital-beer-sheva-800-beds',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 5,
        publishedAt: new Date(now.getTime() - 19 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'מרכז רפואי חדש ומתקדם בנגב', level: 2 },
          { type: 'paragraph', text: 'המתחם הרפואי יכלול 800 מיטות אשפוז, חדרי ניתוח מתקדמים ומרכז למחקר קליני.' },
          { type: 'paragraph', text: '"תושבי הנגב זכאים לשירותי בריאות ברמה הגבוהה ביותר", אמר שר הבריאות.' },
        ]),
      },
      {
        title: 'ישראל מובילה מחקר בינלאומי חדשני בתחום בריאות הנפש',
        subtitle: 'מכון וייצמן פיתח שיטת טיפול חדשה בהפרעות חרדה',
        content: 'מכון ויצמן למדע הודיע על פריצת דרך במחקר בריאות הנפש בשיתוף 15 מדינות.',
        slug: 'israel-leads-mental-health-research-breakthrough',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 5,
        publishedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 4,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'פריצת דרך ישראלית ברפואת הנפש', level: 2 },
          { type: 'paragraph', text: 'השיטה החדשה מציגה שיפור של 60% בתסמיני חרדה באמצעות נוירופידבק בזמן אמת.' },
          { type: 'paragraph', text: 'המחקר פורסם בכתב העת Nature Neuroscience.' },
        ]),
      },
      {
        title: 'נבחרת ישראל בכדורסל העפילה לגביע העולם לאחר ניצחון דרמטי',
        subtitle: 'ישראל גברה על צרפת 85-82 בהארכה',
        content: 'נבחרת ישראל בכדורסל העפילה הערב לגביע העולם לאחר ניצחון דרמטי על צרפת 85-82 בהארכה.',
        slug: 'israel-basketball-world-cup-qualification',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 6,
        publishedAt: new Date(now.getTime() - 21 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'ניצחון היסטורי: ישראל בגביע העולם', level: 2 },
          { type: 'paragraph', text: 'אולם בלומפילד ביפו רעד מקריאות השמחה של 10,000 אוהדים.' },
          { type: 'paragraph', text: 'ראש הממשלה נתניהו: "אתם שגרירים של ישראל".' },
        ]),
      },
      {
        title: 'שחיינית ישראלית שברה שיא עולמי ב-200 מטר גב במשחקי המכביה',
        subtitle: 'אנסטסיה גורבנקו סיימה בזמן של 2:03.45',
        content: 'השחיינית הישראלית אנסטסיה גורבנקו שברה את השיא העולמי ב-200 מטר גב במשחקי המכביה בירושלים.',
        slug: 'israeli-swimmer-world-record-maccabiah',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 6,
        publishedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 2,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'שיא עולמי לישראל במשחקי המכביה', level: 2 },
          { type: 'paragraph', text: 'הקהל בבריכה האולימפית הריע בהתלהבות כשהזמן 2:03.45 הופיע על הלוח.' },
          { type: 'paragraph', text: '"ההשקעה של המדינה בספורט התחרותי מניבה הישגים", אמר שר התרבות והספורט.' },
        ]),
      },
      {
        title: 'סרט ישראלי זכה בפרס הזהב בפסטיבל קאן הבינלאומי',
        subtitle: 'הסרט "צללים בנגב" של הבמאי נדב לפיד זכה בדקל הזהב',
        content: 'הסרט הישראלי "צללים בנגב" זכה בדקל הזהב בפסטיבל קאן הבינלאומי.',
        slug: 'israeli-film-wins-cannes-golden-palm',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 7,
        publishedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'דקל הזהב — הישג היסטורי לקולנוע הישראלי', level: 2 },
          { type: 'paragraph', text: 'חבר השופטים תיאר את הסרט כ"יצירת מופת אנושית ומרגשת שחוצה גבולות תרבותיים".' },
          { type: 'paragraph', text: 'שרת התרבות הודיעה על הגדלת תקציב קרן הקולנוע הישראלי ב-50 מיליון שקלים.' },
        ]),
      },
      {
        title: 'מוזיאון ישראל ייפתח אגף חדש המוקדש לאמנות יהודית מהתפוצות',
        subtitle: 'האגף יציג אוספים נדירים מקהילות יהודיות בצפון אפריקה, תימן ואירופה',
        content: 'מוזיאון ישראל בירושלים הכריז על פתיחת אגף חדש שיוקדש לאמנות יהודית מהתפוצות בהשקעה של 200 מיליון שקלים.',
        slug: 'israel-museum-new-diaspora-jewish-art-wing',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 7,
        publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 3,
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'אגף חדש לאמנות יהודית במוזיאון ישראל', level: 2 },
          { type: 'paragraph', text: 'האגף יכלול 15 אולמות תצוגה, מעבדת שימור ומרכז מחקר דיגיטלי.' },
          { type: 'paragraph', text: '"ירושלים היא הבית הטבעי לאמנות היהודית מכל התפוצות", אמר ראש הממשלה.' },
        ]),
      },
      // ── Video articles (categoryIndex: 8) ──────────────────────────────
      {
        title: 'צפו: ראש הממשלה נתניהו בנאום בכנסת על תכנית הביטחון',
        subtitle: 'נאום מלא מישיבת הכנסת המיוחדת',
        content: 'צפו בנאום המלא של ראש הממשלה בנימין נתניהו בכנסת, בו הציג את תכנית הביטחון הלאומית החדשה.',
        slug: 'video-netanyahu-knesset-security-speech',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=450&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        bodyBlocks: JSON.stringify([
          { type: 'youtube', videoId: 'dQw4w9WgXcQ', caption: 'נאום ראש הממשלה בכנסת' },
        ]),
      },
      {
        title: 'סיכום שבועי: הרגעים הבולטים מהכנסת השבוע',
        subtitle: 'כל מה שקרה בכנסת בדקות ספורות',
        content: 'סיכום שבועי של הרגעים הבולטים מישיבות הכנסת השבוע, כולל הצבעות, נאומים ודיונים סוערים.',
        slug: 'video-weekly-knesset-highlights',
        status: 'published',
        isHero: true,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        bodyBlocks: JSON.stringify([
          { type: 'youtube', videoId: 'jNQXAC9IVRw', caption: 'סיכום שבועי מהכנסת' },
        ]),
      },
      {
        title: 'ראיון בלעדי: שר הכלכלה על תוכנית הצמיחה החדשה',
        subtitle: 'ראיון מעמיק עם שר הכלכלה ניר ברקת',
        content: 'בראיון בלעדי, שר הכלכלה ניר ברקת מפרט את תוכנית הצמיחה הכלכלית החדשה וההשפעה הצפויה על חיי האזרחים.',
        slug: 'video-exclusive-economy-minister-interview',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=450&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        bodyBlocks: JSON.stringify([
          { type: 'youtube', videoId: 'dQw4w9WgXcQ', caption: 'ראיון עם שר הכלכלה' },
        ]),
      },
      {
        title: 'צפו: טקס חתימת הסכם שיתוף פעולה בינלאומי',
        subtitle: 'רגעי השיא מטקס החתימה ההיסטורי',
        content: 'צפו ברגעי השיא מטקס החתימה ההיסטורי על הסכם שיתוף פעולה בינלאומי חדש.',
        slug: 'video-international-agreement-signing-ceremony',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&h=450&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        bodyBlocks: JSON.stringify([
          { type: 'youtube', videoId: 'jNQXAC9IVRw', caption: 'טקס חתימת ההסכם' },
        ]),
      },
      {
        title: 'סיור מודרך: פרויקט התשתיות הגדול בנגב',
        subtitle: 'צפו בהתקדמות פרויקט הכביש המהיר צפון-דרום',
        content: 'סיור מצולם באתר הבנייה של פרויקט הכביש המהיר החדש שיקשר בין צפון הארץ לדרומה.',
        slug: 'video-negev-infrastructure-project-tour',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 16 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=450&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        bodyBlocks: JSON.stringify([
          { type: 'youtube', videoId: 'dQw4w9WgXcQ', caption: 'סיור בפרויקט התשתיות' },
        ]),
      },
      // ── Additional video articles — diverse sources (categoryIndex: 8) ──
      {
        title: 'צפו: ח"כ ליכוד בראיון ברשת X על חוק הלאום',
        subtitle: 'ראיון שהפך ויראלי ברשתות החברתיות',
        content: 'ח"כ ליכוד בראיון ויראלי ברשת X, בו הסביר את עמדת המפלגה בנושא חוק הלאום ותגובות הציבור.',
        slug: 'video-x-likud-mk-nationality-law-interview',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=450&fit=crop',
        videoUrl: 'https://x.com/LikudParty/status/1234567890',
        bodyBlocks: JSON.stringify([
          { type: 'tweet', tweetId: '1234567890', authorHandle: 'LikudParty', previewText: 'ח"כ ליכוד בראיון ויראלי על חוק הלאום' },
          { type: 'paragraph', text: 'הראיון המלא שהפך ויראלי ברשתות החברתיות' },
        ]),
      },
      {
        title: 'שידור חי: עצרת הליכוד בכיכר רבין — שידור מפייסבוק',
        subtitle: 'אלפי תומכים התכנסו באירוע מרכזי',
        content: 'שידור חי מעצרת הליכוד ההמונית בכיכר רבין, עם נאומים של בכירי המפלגה והופעות אורחים.',
        slug: 'video-facebook-likud-rally-rabin-square',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop',
        videoUrl: 'https://www.facebook.com/Likud/videos/9876543210',
        bodyBlocks: JSON.stringify([
          { type: 'facebook', postUrl: 'https://www.facebook.com/Likud/videos/9876543210', caption: 'שידור חי מעצרת הליכוד בכיכר רבין' },
          { type: 'paragraph', text: 'צפו בשידור החי המלא מעצרת הליכוד בכיכר רבין' },
        ]),
      },
      {
        title: 'מאחורי הקלעים: יום בשגרת ח"כ — ריל מאינסטגרם',
        subtitle: 'יום שלם עם ח"כ מהליכוד — מהבוקר ועד הלילה',
        content: 'ריל מאינסטגרם שמציג יום בחייו של ח"כ מהליכוד — מפגישות ועדה ועד הצבעות בכנסת.',
        slug: 'video-instagram-reel-mk-daily-life',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 28 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&h=450&fit=crop',
        videoUrl: 'https://www.instagram.com/reel/CxYz1234567',
        bodyBlocks: JSON.stringify([
          { type: 'instagram', postUrl: 'https://www.instagram.com/reel/CxYz1234567', caption: 'יום בחייו של ח"כ מהליכוד' },
          { type: 'paragraph', text: 'ריל ויראלי שמציג את הצד האנושי של הפוליטיקה' },
        ]),
      },
      {
        title: 'דוקומנטרי קצר: 40 שנה להסכם השלום עם מצרים',
        subtitle: 'סרט דוקומנטרי מקורי של מצודת הליכוד',
        content: 'דוקומנטרי קצר מקורי המציין 40 שנה להסכם השלום ההיסטורי עם מצרים, בראשות מנחם בגין.',
        slug: 'video-direct-upload-peace-agreement-documentary',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 32 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&h=450&fit=crop',
        videoUrl: 'https://cdn.likud-news.co.il/videos/peace-documentary.mp4',
        bodyBlocks: JSON.stringify([
          { type: 'video', source: 'upload', url: 'https://cdn.likud-news.co.il/videos/peace-documentary.mp4', caption: 'דוקומנטרי מקורי — 40 שנה להסכם השלום' },
          { type: 'paragraph', text: 'דוקומנטרי מקורי מאת צוות מצודת הליכוד' },
        ]),
      },
      {
        title: 'סיכום ועדת הכספים — דיון תקציב הביטחון',
        subtitle: 'צפו בדיון הסוער על תקציב הביטחון',
        content: 'סיכום מצולם של דיון ועדת הכספים בנושא תקציב הביטחון, כולל רגעי השיא.',
        slug: 'video-youtube-budget-committee-defense',
        status: 'published',
        isHero: false,
        isBreaking: true,
        categoryIndex: 8,
        publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 1,
        heroImageUrl: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800&h=450&fit=crop',
        bodyBlocks: JSON.stringify([
          { type: 'youtube', videoId: 'M7lc1UVf-VE', caption: 'דיון תקציב הביטחון בוועדת הכספים' },
          { type: 'paragraph', text: 'דיון סוער בוועדת הכספים על הקצאות תקציב הביטחון' },
        ]),
      },
      // ── Magazine articles (categoryIndex: 9) ──────────────────────────
      {
        title: 'הליכוד: מסע של 50 שנה — מהמהפך ועד היום',
        subtitle: 'כתבת עומק על ההיסטוריה המפוארת של תנועת הליכוד',
        content: 'כתבת עומק מקיפה על חמישים שנות הליכוד — מהמהפך ההיסטורי של 1977 ועד ימינו. סיפור של מנהיגות, חזון ומסירות למדינת ישראל.',
        slug: 'magazine-likud-50-years-history',
        status: 'published',
        isHero: true,
        isBreaking: false,
        categoryIndex: 9,
        publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 12,
        heroImageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=600&fit=crop',
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'חמישים שנה של מנהיגות', level: 2 },
          { type: 'paragraph', text: 'תנועת הליכוד, שהוקמה בשנת 1973 כאיחוד של מפלגות הימין, הפכה לכוח המוביל בפוליטיקה הישראלית.' },
          { type: 'paragraph', text: 'מהמהפך ההיסטורי של 1977, שבו עלה מנחם בגין לראשות הממשלה, ועד ימינו — הליכוד עיצב את דמותה של ישראל.' },
          { type: 'quote', text: 'הליכוד הוא לא רק מפלגה — הוא תנועה של עם', attribution: 'מנחם בגין' },
        ]),
      },
      {
        title: 'מאחורי הקלעים: יום בחיי חבר כנסת מהליכוד',
        subtitle: 'כתבה מיוחדת מלווה חבר כנסת מרגע ההגעה לכנסת ועד סוף היום',
        content: 'מה קורה מאחורי הקלעים של הכנסת? ליווינו חבר כנסת מהליכוד לאורך יום עבודה שלם כדי לגלות.',
        slug: 'magazine-day-in-life-likud-mk',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 9,
        publishedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 8,
        heroImageUrl: 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1200&h=600&fit=crop',
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'יום בכנסת — מאחורי הקלעים', level: 2 },
          { type: 'paragraph', text: '06:00 — ההגעה לכנסת. חבר הכנסת מתחיל את יומו בפגישת תדרוך עם צוות הלשכה.' },
          { type: 'paragraph', text: 'במהלך היום — ישיבות ועדה, הצבעות במליאה, פגישות עם בוחרים.' },
        ]),
      },
      {
        title: 'ישראל 2030: החזון הכלכלי של הממשלה לעשור הבא',
        subtitle: 'ניתוח מעמיק של תכנית הצמיחה הלאומית',
        content: 'כתבת עומק על תכנית "ישראל 2030" — חזון הממשלה לפיתוח כלכלי, טכנולוגי וחברתי בעשור הקרוב.',
        slug: 'magazine-israel-2030-economic-vision',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 9,
        publishedAt: new Date(now.getTime() - 15 * 60 * 60 * 1000),
        authorIndex: 0,
        alertBannerEnabled: false,
        readingTimeMinutes: 10,
        heroImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=600&fit=crop',
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'תכנית ישראל 2030', level: 2 },
          { type: 'paragraph', text: 'תכנית ישראל 2030 מציבה יעדים שאפתניים: צמיחה כלכלית של 4% בשנה, הפחתת פערים חברתיים ומעבר לאנרגיה מתחדשת.' },
          { type: 'paragraph', text: 'שר הכלכלה: "אנחנו בונים את ישראל של המחר — חזקה, חדשנית ומאוחדת".' },
        ]),
      },
      {
        title: 'פרופיל: הדור הצעיר של מנהיגי הליכוד',
        subtitle: 'הכירו את הפנים החדשות שמעצבות את עתיד התנועה',
        content: 'פרופיל מעמיק של הדור הצעיר של מנהיגי תנועת הליכוד — חברי כנסת צעירים, ראשי ערים ופעילים שמעצבים את עתיד התנועה.',
        slug: 'magazine-young-likud-leaders-profile',
        status: 'published',
        isHero: false,
        isBreaking: false,
        categoryIndex: 9,
        publishedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
        authorIndex: 1,
        alertBannerEnabled: false,
        readingTimeMinutes: 7,
        heroImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop',
        bodyBlocks: JSON.stringify([
          { type: 'heading', text: 'הדור הבא של המנהיגות', level: 2 },
          { type: 'paragraph', text: 'הדור הצעיר של הליכוד מביא עימו חשיבה חדשה, ניסיון מגוון וחזון לעתיד.' },
          { type: 'paragraph', text: 'הכירו את האנשים שיעצבו את פני התנועה בשנים הקרובות.' },
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
          "readingTimeMinutes", "heroImageUrl"
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5::article_status_enum,
          $6, $7, $8, $9, $10,
          $11::jsonb, $12, $13, $14, $15, $16
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
          (article as any).heroImageUrl || null,
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
      // New articles (8-24)
      { articleIdx: 8, memberIdx: 1 },
      { articleIdx: 9, memberIdx: 2 },
      { articleIdx: 10, memberIdx: 0 },
      { articleIdx: 11, memberIdx: 1 },
      { articleIdx: 12, memberIdx: 2 },
      { articleIdx: 13, memberIdx: 3 },
      { articleIdx: 14, memberIdx: 4 },
      { articleIdx: 15, memberIdx: 0 },
      { articleIdx: 16, memberIdx: 1 },
      { articleIdx: 17, memberIdx: 2 },
      { articleIdx: 18, memberIdx: 3 },
      { articleIdx: 19, memberIdx: 4 },
      { articleIdx: 20, memberIdx: 0 },
      { articleIdx: 21, memberIdx: 1 },
      { articleIdx: 22, memberIdx: 2 },
      { articleIdx: 23, memberIdx: 3 },
      { articleIdx: 24, memberIdx: 4 },
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
      // New articles (10-24) — 2 tags each
      { articleIdx: 10, tagIdx: 0 }, // Coalition law -> Politics
      { articleIdx: 10, tagIdx: 3 }, // Coalition law -> Netanyahu
      { articleIdx: 11, tagIdx: 1 }, // Iron Dome -> National Security
      { articleIdx: 11, tagIdx: 0 }, // Iron Dome -> Politics
      { articleIdx: 12, tagIdx: 1 }, // Jordan border -> National Security
      { articleIdx: 12, tagIdx: 3 }, // Jordan border -> Netanyahu
      { articleIdx: 13, tagIdx: 2 }, // Tech exports -> Economy
      { articleIdx: 13, tagIdx: 0 }, // Tech exports -> Politics
      { articleIdx: 14, tagIdx: 2 }, // Housing plan -> Economy
      { articleIdx: 14, tagIdx: 3 }, // Housing plan -> Netanyahu
      { articleIdx: 15, tagIdx: 0 }, // Immigration -> Politics
      { articleIdx: 15, tagIdx: 4 }, // Immigration -> Jerusalem
      { articleIdx: 16, tagIdx: 4 }, // Jerusalem centers -> Jerusalem
      { articleIdx: 16, tagIdx: 0 }, // Jerusalem centers -> Politics
      { articleIdx: 17, tagIdx: 0 }, // STEM program -> Politics
      { articleIdx: 17, tagIdx: 2 }, // STEM program -> Economy
      { articleIdx: 18, tagIdx: 2 }, // BGU campus -> Economy
      { articleIdx: 18, tagIdx: 3 }, // BGU campus -> Netanyahu
      { articleIdx: 19, tagIdx: 0 }, // Hospital -> Politics
      { articleIdx: 19, tagIdx: 2 }, // Hospital -> Economy
      { articleIdx: 20, tagIdx: 0 }, // Mental health -> Politics
      { articleIdx: 20, tagIdx: 1 }, // Mental health -> National Security
      { articleIdx: 21, tagIdx: 3 }, // Basketball -> Netanyahu
      { articleIdx: 21, tagIdx: 4 }, // Basketball -> Jerusalem
      { articleIdx: 22, tagIdx: 4 }, // Swimmer -> Jerusalem
      { articleIdx: 22, tagIdx: 0 }, // Swimmer -> Politics
      { articleIdx: 23, tagIdx: 3 }, // Cannes film -> Netanyahu
      { articleIdx: 23, tagIdx: 0 }, // Cannes film -> Politics
      { articleIdx: 24, tagIdx: 4 }, // Museum art -> Jerusalem
      { articleIdx: 24, tagIdx: 3 }, // Museum art -> Netanyahu
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
        url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=400&fit=crop',
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

    // ─── 11. Seed Stories ─────────────────────────────────────────────
    console.log('Seeding stories...');
    const storyIds: string[] = [];
    const stories = [
      {
        title: 'נתניהו: ישראל מובילה את המזרח התיכון לעידן חדש',
        imageUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
        mediaType: 'image',
        durationSeconds: 5,
        videoUrl: null,
        articleIdx: 0,
        sortOrder: 1,
      },
      {
        title: 'הליכוד מציג: תוכנית כלכלית חדשה',
        imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
        mediaType: 'image',
        durationSeconds: 7,
        videoUrl: null,
        articleIdx: 1,
        sortOrder: 2,
      },
      {
        title: 'סיור בכנסת עם חברי הליכוד',
        imageUrl: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800',
        mediaType: 'image',
        durationSeconds: 10,
        videoUrl: null,
        articleIdx: null,
        sortOrder: 3,
      },
      {
        title: 'ראיון בלעדי עם שר החוץ',
        imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800',
        mediaType: 'video',
        durationSeconds: 15,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        articleIdx: 25,
        sortOrder: 4,
      },
      {
        title: 'הפגנת תמיכה בירושלים',
        imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800',
        mediaType: 'video',
        durationSeconds: 12,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        articleIdx: null,
        sortOrder: 5,
      },
    ];

    for (const story of stories) {
      const result = await queryRunner.query(
        `INSERT INTO "stories" ("id", "title", "imageUrl", "mediaType", "durationSeconds", "videoUrl", "articleId", "sortOrder", "isActive", "expiresAt")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, true, NOW() + INTERVAL '7 days')
         RETURNING "id"`,
        [
          story.title,
          story.imageUrl,
          story.mediaType,
          story.durationSeconds,
          story.videoUrl,
          story.articleIdx !== null ? articleIds[story.articleIdx] : null,
          story.sortOrder,
        ],
      );
      storyIds.push(result[0].id);
      console.log(`  -> Created story: ${story.title}`);
    }

    // ─── 12. Seed Comments ────────────────────────────────────────────
    console.log('Seeding comments...');
    const commentIds: string[] = [];

    // Article comments (spread across first 3 articles)
    const articleComments = [
      // Article 0 — 5 comments
      { articleIdx: 0, authorName: 'דני כהן', body: 'כתבה מצוינת, מסכים עם כל מילה!', isApproved: true, isPinned: true, likesCount: 24 },
      { articleIdx: 0, authorName: 'שרה לוי', body: 'תודה על הסיקור המקצועי', isApproved: true, isPinned: false, likesCount: 12 },
      { articleIdx: 0, authorName: 'יוסי מזרחי', body: 'חשוב שנשמע גם את הצד השני', isApproved: true, isPinned: false, likesCount: 8 },
      { articleIdx: 0, authorName: 'מיכל אברהם', body: 'מחכה לעדכונים נוספים בנושא', isApproved: true, isPinned: false, likesCount: 0 },
      { articleIdx: 0, authorName: 'אבי ישראלי', body: 'הליכוד בכיוון הנכון!', isApproved: true, isPinned: false, likesCount: 15 },

      // Article 1 — 5 comments
      { articleIdx: 1, authorName: 'רון דוד', body: 'מעניין מאוד, תודה על השיתוף', isApproved: true, isPinned: false, likesCount: 6 },
      { articleIdx: 1, authorName: 'נועה גולן', body: 'האם יש תאריך יעד לתוכנית?', isApproved: true, isPinned: false, likesCount: 3 },
      { articleIdx: 1, authorName: 'עמית שלום', body: 'צעד חשוב קדימה', isApproved: true, isPinned: true, likesCount: 18 },
      { articleIdx: 1, authorName: 'ליאור ברק', body: 'צריך לבדוק את הנתונים', isApproved: true, isPinned: false, likesCount: 0 },
      { articleIdx: 1, authorName: 'תמר חיים', body: 'מקווה שזה יצא לפועל', isApproved: true, isPinned: false, likesCount: 9 },

      // Article 2 — 5 comments
      { articleIdx: 2, authorName: 'גיל שמעון', body: 'סיקור מעולה כרגיל', isApproved: true, isPinned: false, likesCount: 7 },
      { articleIdx: 2, authorName: 'הדר כץ', body: 'איפה אפשר לקרוא עוד על הנושא?', isApproved: true, isPinned: false, likesCount: 2 },
      { articleIdx: 2, authorName: 'אלון פרידמן', body: 'ביבי מלך!', isApproved: true, isPinned: false, likesCount: 31 },
      { articleIdx: 2, authorName: 'רחל נתן', body: 'תוכן ממש איכותי', isApproved: true, isPinned: false, likesCount: 0 },
      { articleIdx: 2, authorName: 'משה ביטון', body: 'שיתפתי עם כל המשפחה', isApproved: true, isPinned: false, likesCount: 4 },
    ];

    for (const comment of articleComments) {
      const result = await queryRunner.query(
        `INSERT INTO "comments" ("id", "articleId", "authorName", "body", "isApproved", "isPinned", "likesCount")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
         RETURNING "id"`,
        [
          articleIds[comment.articleIdx],
          comment.authorName,
          comment.body,
          comment.isApproved,
          comment.isPinned,
          comment.likesCount,
        ],
      );
      commentIds.push(result[0].id);
      console.log(`  -> Created comment by ${comment.authorName} on article ${comment.articleIdx}`);
    }

    // Replies to some comments (3 replies)
    const replies = [
      { parentIdx: 0, articleIdx: 0, authorName: 'דניאל רוזן', body: 'מסכים איתך לחלוטין!', isApproved: true, likesCount: 5 },
      { parentIdx: 2, articleIdx: 0, authorName: 'דני כהן', body: 'בהחלט, אבל הכיוון ברור', isApproved: true, likesCount: 3 },
      { parentIdx: 7, articleIdx: 1, authorName: 'רון דוד', body: 'מסכים, זה באמת צעד חשוב', isApproved: true, likesCount: 2 },
    ];

    for (const reply of replies) {
      await queryRunner.query(
        `INSERT INTO "comments" ("id", "articleId", "parentId", "authorName", "body", "isApproved", "isPinned", "likesCount")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, false, $6)`,
        [
          articleIds[reply.articleIdx],
          commentIds[reply.parentIdx],
          reply.authorName,
          reply.body,
          reply.isApproved,
          reply.likesCount,
        ],
      );
      console.log(`  -> Created reply by ${reply.authorName}`);
    }

    // Story comments (3 comments on first 2 stories)
    const storyComments = [
      { storyIdx: 0, authorName: 'יעל דביר', body: 'סטורי מדהים!', isApproved: true, likesCount: 11 },
      { storyIdx: 0, authorName: 'עידו סגל', body: 'תמשיכו ככה', isApproved: true, likesCount: 5 },
      { storyIdx: 1, authorName: 'מאיה לב', body: 'מחכה לעוד תוכן כזה', isApproved: true, likesCount: 8 },
    ];

    for (const comment of storyComments) {
      await queryRunner.query(
        `INSERT INTO "comments" ("id", "storyId", "authorName", "body", "isApproved", "isPinned", "likesCount")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, false, $5)`,
        [
          storyIds[comment.storyIdx],
          comment.authorName,
          comment.body,
          comment.isApproved,
          comment.likesCount,
        ],
      );
      console.log(`  -> Created story comment by ${comment.authorName}`);
    }

    // ─── Commit initial transaction ───────────────────────────────────
    await queryRunner.commitTransaction();
    await queryRunner.release();

    // ─── Additional Seeds (outside transaction) ───────────────────────
    console.log('\n📦 Running additional seed scripts...\n');

    // Import seed functions
    const { seedStories } = require('./seed-stories');
    const { seedArticleAnalytics } = require('./seed-article-analytics');
    const { seedTurnout } = require('./seed-turnout');

    await seedStories(AppDataSource);
    await seedArticleAnalytics(AppDataSource);
    await seedTurnout(AppDataSource);

    console.log('\n✅ All seed scripts completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed, rolling back...', error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
    await AppDataSource.destroy();
    process.exit(1);
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
    await AppDataSource.destroy();
  }
}

void seed();
