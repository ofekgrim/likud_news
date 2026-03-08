/**
 * Seed script: Add more articles for feed pagination testing.
 *
 * Creates 30 additional published articles with varied dates and categories.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-more-articles.ts
 *   npx ts-node src/database/seeds/seed-more-articles.ts --force  # replace existing
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  database: process.env.DATABASE_NAME || 'likud_news',
  username: process.env.DATABASE_USER || 'likud',
  password: process.env.DATABASE_PASSWORD || 'likud_dev',
  ssl: process.env.DATABASE_SSL === 'true',
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function slug(title: string): string {
  return title
    .replace(/[^\w\u0590-\u05FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80)
    .toLowerCase();
}

const ARTICLES = [
  { title: 'נתניהו נפגש עם נשיא ארה"ב בבית הלבן', subtitle: 'שני המנהיגים דנו בנושאים אסטרטגיים וביטחוניים', daysAgo: 0, isBreaking: true },
  { title: 'תכנית חדשה להורדת מחירי הדיור', subtitle: 'שר האוצר מציג רפורמה מקיפה בשוק הנדל"ן', daysAgo: 0 },
  { title: 'הצלחה דיפלומטית: הסכם חדש עם מדינה ערבית', subtitle: 'ישראל חותמת על הסכם שיתוף פעולה כלכלי', daysAgo: 0 },
  { title: 'חוק חדש לחיזוק הביטחון הלאומי אושר בכנסת', subtitle: 'הכנסת אישרה ברוב קולות את החוק החדש', daysAgo: 1 },
  { title: 'השקעות חדשות בתשתיות הנגב', subtitle: 'ממשלת ישראל מקצה תקציב של מיליארדי שקלים לפיתוח הנגב', daysAgo: 1 },
  { title: 'שר החינוך מציג רפורמה חדשה במערכת החינוך', subtitle: 'התכנית כוללת הגדלת שעות לימוד ושיפור תנאי המורים', daysAgo: 1 },
  { title: 'ישראל בחזית הטכנולוגיה: פיתוחים חדשים בתחום הבינה המלאכותית', subtitle: 'חברות ישראליות מובילות את המהפכה הטכנולוגית', daysAgo: 1 },
  { title: 'הליכוד מגייס אלפי פעילים חדשים', subtitle: 'קמפיין הצטרפות מוצלח מביא לזינוק במספר החברים', daysAgo: 2 },
  { title: 'פרויקט חדש לשיקום שכונות ותיקות', subtitle: 'התכנית תשנה את פני ערי הפריפריה', daysAgo: 2 },
  { title: 'הישג ישראלי: פרס נובל לחוקר מהטכניון', subtitle: 'פרופסור ישראלי זוכה בפרס היוקרתי בתחום הכימיה', daysAgo: 2 },
  { title: 'ועדת החוץ והביטחון דנה באיומים האזוריים', subtitle: 'הוועדה בחנה את המצב הביטחוני בגבול הצפון', daysAgo: 2 },
  { title: 'הגירה חיובית: עלייה של 20% בהגירה לישראל', subtitle: 'אלפי עולים חדשים מגיעים מארצות שונות', daysAgo: 3 },
  { title: 'תחבורה ציבורית: קו רכבת חדש לבאר שבע', subtitle: 'הפרויקט יקצר את זמן הנסיעה מהמרכז לדרום', daysAgo: 3 },
  { title: 'ועידת האקלים: ישראל מציגה תכנית לאנרגיה ירוקה', subtitle: 'מדינת ישראל מתחייבת להפחתת פליטות עד 2035', daysAgo: 3 },
  { title: 'שוק ההון הישראלי רושם שיא חדש', subtitle: 'מדד תל אביב 35 שובר שיאים בזכות הייטק', daysAgo: 3 },
  { title: 'רפורמה בבריאות: ביטוח שיניים חינם עד גיל 18', subtitle: 'שר הבריאות מכריז על הרחבת סל הבריאות', daysAgo: 4 },
  { title: 'הצבא מציג מערכת הגנה חדשה', subtitle: 'כיפת ברזל מתקדמת תגן על שטחים נרחבים יותר', daysAgo: 4 },
  { title: 'ספורט: נבחרת ישראל מנצחת בכדורגל', subtitle: 'ניצחון דרמטי במשחק מוקדמות אליפות אירופה', daysAgo: 4 },
  { title: 'תרבות: פסטיבל הסרטים הבינלאומי בירושלים', subtitle: 'סרט ישראלי זוכה בפרס הגדול של הפסטיבל', daysAgo: 5 },
  { title: 'חקלאות חכמה: טכנולוגיות חדשות בערבה', subtitle: 'חקלאים ישראלים מפתחים שיטות השקיה מתקדמות', daysAgo: 5 },
  { title: 'יום הזיכרון: טקסים ממלכתיים ברחבי הארץ', subtitle: 'ישראל מתייחדת עם זכר חלליה', daysAgo: 5 },
  { title: 'שיתוף פעולה חדש עם הודו בתחום המים', subtitle: 'הסכם דו-לאומי לפיתוח טכנולוגיות מים', daysAgo: 6 },
  { title: 'הליכוד: פרימריז למועמדי הכנסת', subtitle: 'מועמדים חדשים ומפתיעים ברשימת המפלגה', daysAgo: 6 },
  { title: 'מערכת המשפט: שופטים חדשים מונו לבית המשפט העליון', subtitle: 'הוועדה לבחירת שופטים השלימה את ההליך', daysAgo: 6 },
  { title: 'תיירות: שיא חדש במספר התיירים בישראל', subtitle: 'מיליוני תיירים מבקרים בארץ השנה', daysAgo: 7 },
  { title: 'סייבר: ישראל חוסמת מתקפת סייבר גדולה', subtitle: 'מערך הסייבר הלאומי מנטרל איום מבחוץ', daysAgo: 7 },
  { title: 'חינוך: תכנית חדשה ללימודי מדעים בבתי ספר', subtitle: 'משרד החינוך משיק תכנית מחשבים חדשה', daysAgo: 7 },
  { title: 'כלכלה: האבטלה בישראל ברמה הנמוכה ביותר', subtitle: 'שוק העבודה הישראלי ממשיך להתאושש', daysAgo: 8 },
  { title: 'דיפלומטיה: ישראל פותחת שגרירות חדשה באפריקה', subtitle: 'היחסים עם מדינות אפריקה מתחזקים', daysAgo: 8 },
  { title: 'בריאות: חיסון חדש פותח בישראל', subtitle: 'מכון ויצמן מפתח חיסון פורץ דרך', daysAgo: 9 },
];

async function seedMoreArticles() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Get existing article count
    const existing = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "articles" WHERE "status" = 'published'`,
    )) as { count: string }[];
    const count = parseInt(existing[0].count, 10);
    console.log(`Existing published articles: ${count}`);

    if (count >= 20 && !forceReseed) {
      console.log('Already have enough articles. Use --force to add more.');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // Get a category and author for the articles
    const categories = (await queryRunner.query(
      `SELECT "id", "name" FROM "categories" LIMIT 5`,
    )) as { id: string; name: string }[];

    const authors = (await queryRunner.query(
      `SELECT "id", "nameHe" FROM "authors" LIMIT 3`,
    )) as { id: string; nameHe: string }[];

    if (categories.length === 0) {
      console.log('No categories found. Run category seeds first.');
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    const defaultCategoryId = categories[0].id;
    const defaultAuthorId = authors.length > 0 ? authors[0].id : null;

    console.log(`Using ${categories.length} categories, ${authors.length} authors\n`);

    let created = 0;
    for (let i = 0; i < ARTICLES.length; i++) {
      const article = ARTICLES[i];
      const categoryId = categories[i % categories.length].id;
      const authorId = authors.length > 0 ? authors[i % authors.length].id : null;
      const articleSlug = slug(article.title) + '-' + (i + 100);
      const publishedAt = daysAgo(article.daysAgo);

      // Check if article with same title exists
      const dup = await queryRunner.query(
        `SELECT "id" FROM "articles" WHERE "title" = $1 LIMIT 1`,
        [article.title],
      );
      if (dup.length > 0) continue;

      const content = `<p>${article.subtitle}</p><p>זוהי כתבה לדוגמה שנוצרה לצורכי בדיקה של מערכת הפיד. תוכן הכתבה כולל מידע על ${article.title}.</p><p>פרטים נוספים יתווספו בהמשך.</p>`;

      await queryRunner.query(
        `INSERT INTO "articles"
           ("id", "title", "subtitle", "slug", "content", "status",
            "categoryId", "authorId", "publishedAt",
            "isBreaking", "isHero", "viewCount", "shareCount",
            "readingTimeMinutes", "allowComments")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, 'published',
            $5, $6, $7,
            $8, false, $9, $10,
            $11, true)`,
        [
          article.title,
          article.subtitle,
          articleSlug,
          content,
          categoryId,
          authorId,
          publishedAt,
          article.isBreaking ?? false,
          Math.floor(Math.random() * 500), // viewCount
          Math.floor(Math.random() * 50),  // shareCount
          Math.floor(Math.random() * 5) + 2, // readingTimeMinutes
        ],
      );
      created++;
      console.log(`  ✅ ${article.title.substring(0, 50)}...`);
    }

    await queryRunner.commitTransaction();

    console.log('\n════════════════════════════════════');
    console.log(`  ✅ Created ${created} new articles`);
    console.log('════════════════════════════════════');
    console.log('\nFeed should now have multiple pages of content.');
  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedMoreArticles();
