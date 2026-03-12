import { AppDataSource } from '../data-source';
import { Article, ArticleStatus } from '../../modules/articles/entities/article.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Author } from '../../modules/authors/entities/author.entity';
import { Tag } from '../../modules/tags/entities/tag.entity';

/**
 * Rich article seed — long articles with images and all available options.
 *
 * IMPORTANT: `content` (HTML) is ONLY used by the TTS player and AI summary.
 * The article page renders ONLY `bodyBlocks`. So all visible content must live
 * in bodyBlocks. Each <p> → paragraph block, each <h2> → heading block, etc.
 *
 * Block types supported by BlockRenderer:
 *   paragraph  – { type, text }          (text may contain inline HTML: <b>, <a>, etc.)
 *   heading    – { type, level, text }    (level: 2 | 3 | 4)
 *   image      – { type, url, caption, credit }
 *   quote      – { type, text, author }
 *   bullet_list– { type, items: string[] }
 *   divider    – { type }
 *   youtube    – { type, videoId }
 *   tweet      – { type, tweetUrl }
 *   article_link–{ type, articleId }
 */

const IMAGES = {
  knesset:    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=700&fit=crop',
  jerusalem:  'https://images.unsplash.com/photo-1555880192-48ad3a8f6e5d?w=1200&h=700&fit=crop',
  economy:    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=700&fit=crop',
  military:   'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&h=700&fit=crop',
  community:  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=700&fit=crop',
  education:  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=700&fit=crop',
  culture:    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=700&fit=crop',
  conference: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&h=700&fit=crop',
  flag:       'https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=1200&h=700&fit=crop',
  city:       'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=1200&h=700&fit=crop',
};

function p(text: string) { return { type: 'paragraph', text }; }
function h2(text: string) { return { type: 'heading', level: 2, text }; }
function h3(text: string) { return { type: 'heading', level: 3, text }; }
function img(url: string, caption: string, credit = 'ארכיון') { return { type: 'image', url, caption, credit }; }
function quote(text: string, author: string) { return { type: 'quote', text, author }; }
function bullets(items: string[]) { return { type: 'bullet_list', items }; }
function divider() { return { type: 'divider' }; }

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 59), 0, 0);
  return d;
}

export async function seedRichArticles(): Promise<void> {
  console.log('📰 Seeding rich articles with full bodyBlocks content...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const articleRepo = AppDataSource.getRepository(Article);
  const categoryRepo = AppDataSource.getRepository(Category);
  const authorRepo = AppDataSource.getRepository(Author);
  const tagRepo = AppDataSource.getRepository(Tag);

  const categories = await categoryRepo.find();
  if (categories.length === 0) {
    console.log('⚠️  No categories found — run the main seed first.');
    return;
  }

  const authors = await authorRepo.find();
  const tags = await tagRepo.find();

  const catBySlug = (slug: string) =>
    categories.find((c) => c.slug === slug) ?? categories[0];

  const tagsBySlug = (...slugs: string[]) =>
    tags.filter((t) => slugs.includes(t.slug ?? ''));

  const articlesData: Partial<Article>[] = [

    // ── 1. Main hero — isMain + isHero + alertBanner ──────────────────────────
    {
      title: 'ראש הממשלה נתניהו: "הממשלה תפעל למען כלל אזרחי ישראל ולחיזוק הקואליציה הרחבה"',
      titleEn: 'PM Netanyahu: "The government will act for all citizens and strengthen the broad coalition"',
      subtitle: 'בנאום מרגש במליאת הכנסת, ראש הממשלה הציג את יעדי הממשלה לשנה הקרובה תוך הדגשת הצרכים הביטחוניים והכלכליים של המדינה',
      slug: 'netanyahu-coalition-speech-2026',
      // content is plain text — used only for TTS & AI summary
      content: 'ראש הממשלה בנימין נתניהו נשא היום נאום מקיף במליאת הכנסת, בו הציג את תוכניות הממשלה לשנה הקרובה.',
      heroImageUrl: IMAGES.knesset,
      heroImageCaption: 'ראש הממשלה נתניהו נואם במליאת הכנסת',
      heroImageCaptionHe: 'ראש הממשלה בנימין נתניהו במהלך הנאום ההיסטורי במליאת הכנסת',
      heroImageCredit: 'צילום: דובר הכנסת',
      heroImageFullUrl: IMAGES.knesset,
      isHero: true,
      isMain: true,
      alertBannerEnabled: true,
      alertBannerText: 'שידור חי: דיון בכנסת עכשיו',
      alertBannerColor: '#0099DB',
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(0),
      viewCount: 48200,
      shareCount: 3100,
      readingTimeMinutes: 8,
      allowComments: true,
      hashtags: ['כנסת', 'קואליציה', 'נתניהו', 'פוליטיקה'],
      bodyBlocks: [
        p('ראש הממשלה בנימין נתניהו נשא היום נאום מקיף במליאת הכנסת, בו הציג את תוכניות הממשלה לשנה הקרובה. הנאום, שנמשך כשעה וחצי, כיסה מגוון רחב של נושאים — מהמדיניות הביטחונית ועד לתוכניות הכלכליות החדשות.'),
        p('נתניהו פתח את דבריו בהתייחסות לאתגרים הביטחוניים: <strong>"אנחנו חיים בשכנות עם אויבים שמבקשים את השמדתנו. ממשלת ישראל לא תנוח ולא תשקוט עד שתבטיח את ביטחון כל אזרח ואזרחית בישראל."</strong>'),
        img(IMAGES.knesset, 'ראש הממשלה נתניהו במליאת הכנסת', 'צילום: דובר הכנסת'),
        h2('הנקודות המרכזיות בנאום'),
        p('ראש הממשלה הציג שלושה צירים מרכזיים: ביטחון, כלכלה ואחדות לאומית. בתחום הכלכלי, הוא הציג נתונים לפיהם המשק הישראלי צמח ב-3.2% בשנה האחרונה, למרות האתגרים הגיאופוליטיים.'),
        bullets([
          'הפחתת יוקר המחיה — חבילה בהיקף 15 מיליארד שקל',
          'פתיחת שוק הדיור לדור הצעיר',
          'עשרות אלפי מקומות עבודה חדשים לפריפריה',
          'חיזוק ברית ישראל-ארה"מ',
        ]),
        h2('התוכנית הכלכלית'),
        p('הממשלה מתכננת להשיק תוכנית חדשה להוזלת יוקר המחיה. בין הצעדים: הפחתת מע"מ על מוצרי בסיס, סובסידיות לשכר דירה לזוגות צעירים, ורפורמה בשוק האנרגיה שתפחית חשבונות חשמל ב-12%.'),
        img(IMAGES.conference, 'ישיבת הממשלה לקראת הנאום', 'לע"מ'),
        h2('תגובות האופוזיציה'),
        p('חברי הקואליציה קיבלו את הנאום בתשואות חמות, בעוד שחברי האופוזיציה הצביעו על פערים בין ההבטחות למציאות.'),
        quote('אנחנו מחויבים לעתיד המדינה כאחד — ימין ושמאל, דתיים וחילונים, יהודים וערבים שרוצים לחיות בשלום.', 'בנימין נתניהו, ראש הממשלה'),
        p('יו"ר האופוזיציה יאיר לפיד אמר בתגובה: "המילים יפות, אבל הישראלים צריכים מעשים, לא הבטחות."'),
        divider(),
        p('הנאום הסתיים בקריאה לאחדות לאומית: "יש לנו מחלוקות, אבל כולנו אוהבים את ישראל. בואו נפעל יחד למען עתידה."'),
      ],
      category: catBySlug('politics'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 2. Breaking news — isBreaking + no comments ───────────────────────────
    {
      title: 'מבזק: פיגוע טרור נסכל בירושלים — שני מחבלים חוסלו',
      titleEn: 'BREAKING: Terror attack thwarted in Jerusalem — two terrorists neutralized',
      subtitle: 'כוחות הביטחון פעלו בזריזות ומנעו פיגוע רציחה המוני בלב ירושלים',
      slug: 'breaking-terror-thwarted-jerusalem-2026',
      content: 'שירות הביטחון הכללי ויחידות מיוחדות של משטרת ישראל נסכלו הבוקר פיגוע טרור מתוכנן בלב ירושלים.',
      heroImageUrl: IMAGES.jerusalem,
      heroImageCaption: 'ירושלים — צילום ארכיון',
      heroImageCredit: 'צילום: אלכס קולומויסקי, ידיעות אחרונות',
      isBreaking: true,
      isHero: true,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(0),
      viewCount: 112500,
      shareCount: 8900,
      readingTimeMinutes: 4,
      allowComments: false,
      hashtags: ['מבזק', 'ביטחון', 'ירושלים', 'טרור'],
      bodyBlocks: [
        p('<strong>עדכון אחרון 14:35:</strong> כוחות הביטחון אישרו כי האיום הוסר לחלוטין. שני החשודים חוסלו בשטח ואין נפגעים בצד הישראלי.'),
        p('שירות הביטחון הכללי (שב"כ) ויחידות מיוחדות של משטרת ישראל נסכלו הבוקר פיגוע טרור מתוכנן בלב ירושלים. לפי המידע שנמסר לתקשורת, שני מחבלים מזוינים ניסו לחדור לאזור מרוכז אוכלוסייה במרכז העיר.'),
        img(IMAGES.jerusalem, 'ירושלים — כוחות הביטחון בשטח', 'דובר משטרת ישראל'),
        p('הפיגוע נסכל בשעה 11:20 בבוקר, כשהמחבלים ניסו לחדור לשוק מחנה יהודה. שוטרים ממרחק זיהו את החשודים ופעלו בנחישות.'),
        quote('המחויבות שלנו לביטחון אזרחי ישראל היא ללא תנאי ותמשיך 24 שעות ביממה.', 'שר הביטחון'),
        p('ראש הממשלה אמר בתגובה: "אני מברך את לוחמי שב"כ, המשטרה ויחידות הסיור המיוחדות על הפעולה המקצועית. הם הצילו היום חיי אדם רבים."'),
        p('שר הביטחון ציין כי המודיעין שהוביל לסיכול הגיע ממקורות מרובים ולאחר מעקב של מספר ימים. האזור הוחזר לשגרה לאחר כשלוש שעות של סגירה.'),
      ],
      category: catBySlug('security'),
      authorEntity: authors[1] ?? authors[0] ?? undefined,
    },

    // ── 3. Long political analysis ────────────────────────────────────────────
    {
      title: 'ניתוח מעמיק: הליכוד לקראת הבחירות הפנימיות — מי ינצח את מירוץ הרשימה?',
      subtitle: 'סקירה מקיפה של כוחות המשיכה בתוך מפלגת הליכוד, הפלגים השונים ומה צופן העתיד לרשימה הבאה',
      slug: 'likud-primaries-deep-analysis-2026',
      content: 'הליכוד עומד בפני אחד הרגעים המכוננים בתולדותיו. הבחירות הפנימיות לרשימת הכנסת צפויות לשנות את פני המפלגה.',
      heroImageUrl: IMAGES.conference,
      heroImageCaption: 'כינוס מרכז הליכוד — ארכיון',
      heroImageCredit: 'צילום: קובי גדעון, לע"מ',
      heroImageFullUrl: IMAGES.conference,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(1),
      viewCount: 29700,
      shareCount: 2200,
      readingTimeMinutes: 12,
      allowComments: true,
      hashtags: ['ליכוד', 'פריימריז', 'בחירות', 'רשימה'],
      bodyBlocks: [
        p('הליכוד עומד בפני אחד הרגעים המכוננים בתולדותיו. הבחירות הפנימיות לרשימת הכנסת, שיתקיימו בשבועות הקרובים, צפויות לשנות את פני המפלגה ולקבוע מי יוביל אותה לעשור הבא.'),
        h2('הפלגים בתוך הליכוד'),
        p('בתוך הליכוד פועלים מספר פלגים מרכזיים, שכל אחד מהם מציג ראייה שונה על עתיד המפלגה. <strong>הפלג הוותיק</strong> מונה חברים שנבחרו בעבר ומבקשים לשמר את מעמדם. לעומתם, <strong>הצעירים</strong> — רוב מתחת לגיל 45 — מבקשים לחדש ולהזרים דם חדש לסיעה.'),
        p('פלג שלישי, <strong>הפריפריה</strong>, מתמקד בייצוג הנאות לגליל, הנגב וערי הפיתוח. בשנים האחרונות גדל כוחו של פלג זה, כאשר ראש הממשלה נתניהו עצמו הביע תמיכה בחיזוק ייצוג הפריפריה.'),
        img(IMAGES.knesset, 'ישיבת מרכז הליכוד', 'לע"מ'),
        h2('המועמדים הבולטים'),
        p('מקרב המועמדים הבולטים ניתן למנות מספר שמות שנשמעים בהקשר של המקומות הראשונים ברשימה:'),
        bullets([
          'יולי אדלשטיין — שר ותיק ומנוסה, בעל ניסיון דיפלומטי רחב ונשיא כנסת לשעבר',
          'ישראל כץ — שר האוצר לשעבר, בעל שורשים חזקים בפריפריה',
          'ניר ברקת — ראש עיריית ירושלים לשעבר, מביא מותג של הצלחה ניהולית',
        ]),
        quote('הבחירות הפנימיות הן הלב הפועם של הדמוקרטיה הפנימית שלנו.', 'ח"כ ותיק בליכוד'),
        h2('מבנה הבוחרים'),
        p('בחירות הפנימיות בליכוד מבוססות על מצביעי מרכז המפלגה — כ-140 אלף חברים הזכאים להצביע. מחקרים מראים שהמצביעים הפעילים ביותר הם בני 45 ומעלה, גברים, ותושבי הפריפריה.'),
        img(IMAGES.conference, 'מרכז הליכוד בפעולה', 'צילום: ארכיון'),
        h2('מה אומרים הסקרים?'),
        p('לפי סקר פנימי שנערך בקרב חברי מרכז הליכוד, <strong>אדלשטיין מוביל ב-28%, ברקת שני ב-22%, וכץ שלישי ב-19%</strong>. כ-31% מהנשאלים טרם החליטו — ואלה הם שיכריעו את התוצאה.'),
        divider(),
        h2('תחזית'),
        p('עם שלושה שבועות לבחירות, הכל עדיין פתוח. הכרטיס המנצח יהיה היכולת לגייס את הבוחרים הלא-מחויבים — ושם, יכולות הארגון של כל קמפיין יקבעו הכל.'),
      ],
      category: catBySlug('politics'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 4. Economy — full image metadata ──────────────────────────────────────
    {
      title: 'התקציב החדש: הממשלה מאשרת חבילת סיוע של 25 מיליארד שקל לאזרחים',
      titleEn: 'New budget: Government approves NIS 25 billion relief package for citizens',
      subtitle: 'חבילת הסיוע הגדולה בתולדות המדינה תכלול הפחתת מע"מ, סובסידיות לשכר דירה ורפורמה בשוק האנרגיה',
      slug: 'budget-relief-package-25-billion-2026',
      content: 'הממשלה אישרה חבילת סיוע כלכלית חסרת תקדים בהיקף של 25 מיליארד שקל.',
      heroImageUrl: IMAGES.economy,
      heroImageCaption: 'שר האוצר בהכרזה על התוכנית הכלכלית',
      heroImageCaptionHe: 'שר האוצר מציג את חבילת הסיוע הכלכלית ההיסטורית',
      heroImageCredit: 'צילום: אמיל סלמן, הארץ',
      heroImageFullUrl: IMAGES.economy,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(1),
      viewCount: 67400,
      shareCount: 4800,
      readingTimeMinutes: 7,
      allowComments: true,
      hashtags: ['תקציב', 'כלכלה', 'יוקרמחיה', 'מעמד'],
      bodyBlocks: [
        p('הממשלה אישרה אתמול בלילה חבילת סיוע כלכלית חסרת תקדים בהיקף של <strong>25 מיליארד שקל</strong>. החבילה, שגובשה על ידי שר האוצר בשיתוף עם כלל שרי הממשלה, מיועדת להתמודד עם יוקר המחיה שמטריד את הישראלים כבר שנים.'),
        img(IMAGES.economy, 'שר האוצר מציג את החבילה הכלכלית', 'אמיל סלמן, הארץ'),
        h2('הפחתת מע"מ — מה זה אומר לי?'),
        p('המע"מ יופחת מ-17% ל-15% בפועל על קבוצת מוצרי הצריכה הבסיסיים — לחם, חלב, ביצים, ירקות ופירות. <strong>הפחתה זו צפויה לחסוך לכל משפחה ממוצעת כ-3,600 שקל בשנה.</strong>'),
        h2('סובסידיה לשכר דירה'),
        p('זכאים חדשים יוכלו לקבל עד <strong>1,500 שקל לחודש</strong> כסובסידיה לשכר דירה. המדיניות תחול על זוגות צעירים עד גיל 35 שהכנסתם המשולבת אינה עולה על 20,000 שקל.'),
        h2('רפורמה באנרגיה'),
        p('תעריפי החשמל יופחתו ב-12% לאחר שינוי שיטת החישוב של רשות החשמל. זהו שינוי מבני שיישפיע על כ-3 מיליון משקי בית.'),
        bullets([
          'הפחתת מע"מ: חיסכון של 3,600 ש"ח בשנה למשפחה',
          'סובסידיה לדירה: עד 1,500 ש"ח לחודש לזוגות צעירים',
          'הפחתת חשמל: ירידה של 12% בחשבון החשמל',
          'מענקי תעסוקה לפריפריה: 500 מיליון שקל',
        ]),
        quote('כל שקל שהוצאנו עבר בחינה קפדנית של הלשכה המרכזית לסטטיסטיקה ושל בנק ישראל. זוהי תוכנית אחראית.', 'שר האוצר'),
        divider(),
        h2('תגובת בנק ישראל'),
        p('בנק ישראל פרסם הודעה שבה ציין כי החבילה "מאוזנת ואחראית" אך הזהיר מפני אינפלציה עקב עלייה בביקוש. הריבית צפויה להישאר יציבה בינתיים.'),
      ],
      category: catBySlug('economy'),
      authorEntity: authors[2] ?? authors[0] ?? undefined,
    },

    // ── 5. Society — all block types showcase ─────────────────────────────────
    {
      title: 'שינוי היסטורי: הממשלה מכריזה על תוכנית חדשה לחיזוק קהילות הפריפריה',
      subtitle: 'תוכנית "ישראל במרכז" תשקיע 8 מיליארד שקל בתשתיות, תעסוקה וחינוך בעשרים ערי פיתוח',
      slug: 'periphery-investment-plan-2026',
      content: 'הממשלה השיקה את תוכנית "ישראל במרכז" — יוזמה חסרת תקדים לשינוי מפת הפיתוח של ישראל.',
      heroImageUrl: IMAGES.community,
      heroImageCaption: 'טקס השקת התוכנית בעיר דימונה',
      heroImageCredit: 'צילום: דוד רובינגר',
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(2),
      viewCount: 21300,
      shareCount: 1700,
      readingTimeMinutes: 6,
      allowComments: true,
      hashtags: ['פריפריה', 'חברה', 'תעסוקה', 'פיתוח'],
      bodyBlocks: [
        p('הממשלה השיקה אתמול את תוכנית <strong>"ישראל במרכז"</strong> — יוזמה חסרת תקדים שמטרתה לשנות את מפת הפיתוח של ישראל ולהביא את הפריפריה לחזית הצמיחה הלאומית.'),
        p('התוכנית, שתמומן מתקציב מיוחד שאושר בממשלה, תפעל לאורך חמש שנים ותתמקד בשלושה צירים מרכזיים: תשתיות תחבורה, פיתוח כלכלי ורפורמה במערכת החינוך.'),
        img(IMAGES.community, 'טקס השקת התוכנית בדימונה', 'דוד רובינגר'),
        h2('שלושת הצירים המרכזיים'),
        h3('תשתיות תחבורה'),
        p('הרחבת מסלולי רכבת לנגב ולגליל, סלילת כבישים מהירים חדשים, והקמת 3 נמלי אוויר אזוריים. ההשקעה: 3.2 מיליארד שקל.'),
        h3('פיתוח כלכלי'),
        p('בכל עיר יוקם "מרכז תעסוקה ופיתוח" שיעניק שירותים לחברות המבקשות להתמקם באזורים אלה. תמריצי מס אטרקטיביים יוצעו לעסקים שיפתחו סניפים בפריפריה.'),
        h3('חינוך'),
        p('הכפלת תקצוב בתי הספר בפריפריה, הבאת 2,000 מורים מצוינים לערי הפיתוח, ובניית 50 מרכזי נוער חדשים.'),
        quote('הפריפריה היא לב המדינה. הגיע הזמן לשים אותה במרכז.', 'שר הפנים'),
        divider(),
        h2('הערים שייהנו מהתוכנית'),
        bullets([
          'דימונה — השקעה של 800 מיליון שקל',
          'נתיבות ושדרות — 600 מיליון שקל',
          'קריית שמונה — 550 מיליון שקל',
          'עכו ונהריה — 700 מיליון שקל',
          'לוד ורמלה — 900 מיליון שקל',
          'עפולה ומגדל העמק — 480 מיליון שקל',
        ]),
        img(IMAGES.city, 'עיר פיתוח בנגב — ארכיון', 'לע"מ'),
        p('לפי הנתונים שפרסמה הממשלה, 20 ערים ייהנו מהתוכנית לאורך חמש השנים הקרובות, עם יעד של יצירת 40,000 מקומות עבודה חדשים.'),
      ],
      category: catBySlug('society'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 6. Security — no comments ─────────────────────────────────────────────
    {
      title: 'צבא ישראל סיכל מתקפת כטב"ם משולשת בגבול הצפון',
      titleEn: 'IDF thwarts triple drone attack on northern border',
      subtitle: 'שלושה כטב"מים חמושים יורטו בהצלחה על ידי מערכות ההגנה האווירית — אין נפגעים',
      slug: 'idf-drone-attack-north-thwarted-2026',
      content: 'צבא ישראל הודיע כי יחידות ההגנה האווירית יירטו שלושה כטב"מים חמושים שניסו לחדור לשטח ישראל מכיוון לבנון.',
      heroImageUrl: IMAGES.military,
      heroImageCredit: 'צילום: דובר צה"ל',
      isBreaking: true,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(0),
      viewCount: 88100,
      shareCount: 6300,
      readingTimeMinutes: 3,
      allowComments: false,
      hashtags: ['מבזק', 'ביטחון', 'צפון', 'כטבם'],
      bodyBlocks: [
        p('צבא ישראל הודיע הערב כי יחידות ההגנה האווירית יירטו שלושה כטב"מים חמושים שניסו לחדור לשטח ישראל מכיוון לבנון. האירוע התרחש בין השעות 22:00 ל-23:30.'),
        img(IMAGES.military, 'יחידות הגנה אווירית בפעולה', 'דובר צה"ל'),
        p('לפי הצהרת הצבא, שלושת הכטב"מים זוהו בזמן אמת על ידי מערכות מעקב מתקדמות ויורטו לפני שהגיעו לכל יישוב ישראלי. שרפות קלות שפרצו בשטח פתוח סמוך לגבול כובו על ידי כבאים.'),
        quote('מערכות ההגנה שלנו פועלות בצורה מיטבית. כל ניסיון פגיעה באזרחים ייפגש בתגובה מיידית ומדויקת.', 'ראש מטה הצבא'),
        p('ראש הממשלה אמר בתגובה: "אני מברך את לוחמי מערכת ההגנה האווירית. הם שוב הוכיחו את עדיפות ישראל המבצעית."'),
        p('אין בשלב זה אישור לגבי הגורם שעמד מאחורי המתקפה, אך מקורות ביטחוניים מצביעים על ארגון חזבאללה. הרשויות ממשיכות לפעול לאיתור תאים נוספים.'),
      ],
      category: catBySlug('security'),
      authorEntity: authors[1] ?? authors[0] ?? undefined,
    },

    // ── 7. International — English title + English content ───────────────────
    {
      title: 'ביקור היסטורי: נשיא ארה"ב מגיע לישראל — על סדר היום: שלום אזורי ועצירת הגרעין האיראני',
      titleEn: 'Historic visit: US President arrives in Israel — agenda: regional peace and stopping Iranian nuclear program',
      subtitle: 'הביקור הנוכחי הוא הראשון מאז כינון הממשלה החדשה ונחשב לחשוב ביותר בעשור האחרון',
      slug: 'us-president-israel-visit-2026',
      content: 'נשיא ארצות הברית נחת בנתב"ג לביקור רשמי בן שלושה ימים בישראל על רקע המתיחות סביב התוכנית הגרעינית של איראן.',
      contentEn: 'The US President landed at Ben Gurion Airport for a three-day official visit to Israel, against the backdrop of growing tensions over Iran\'s nuclear program.',
      heroImageUrl: IMAGES.flag,
      heroImageCaption: 'הנשיא האמריקאי ולצדו ראש הממשלה בנתב"ג',
      heroImageCredit: 'צילום: סוכנות AP',
      heroImageFullUrl: IMAGES.flag,
      isHero: true,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(2),
      viewCount: 54200,
      shareCount: 4100,
      readingTimeMinutes: 9,
      allowComments: true,
      hashtags: ['ארהב', 'ישראל', 'דיפלומטיה', 'ביקור'],
      bodyBlocks: [
        p('נשיא ארצות הברית נחת הבוקר בנתב"ג לביקור רשמי בן שלושה ימים בישראל. הביקור, שתוכנן מזה חודשים, מתרחש על רקע המתיחות הגוברת סביב התוכנית הגרעינית של איראן ומאמצי השלום האזוריים.'),
        img(IMAGES.flag, 'טקס קבלת הפנים בנתב"ג', 'סוכנות AP'),
        p('בטקס הקבלה בנתב"ג, ציין ראש הממשלה נתניהו: "הברית בין ישראל לארה"מ חזקה מאי פעם. אנחנו מצפים לדיונים פורייניים על כל הנושאים המרכזיים."'),
        quote('ישראל תמיד תוכל לסמוך על ארצות הברית. נאמנות זו אינה מותנית.', 'נשיא ארה"מ'),
        h2('סדר היום המלא'),
        bullets([
          'שיחות ביטחוניות על תוכנית הגרעין האיראנית ואפשרויות לעצירתה',
          'קידום הסכמי אברהם והרחבתם למדינות ערב נוספות',
          'שיתוף פעולה כלכלי-טכנולוגי בהיקף של 10 מיליארד דולר',
          'מסגרת לפתרון הסכסוך הישראלי-פלסטיני',
        ]),
        h2('הרקע לביקור'),
        p('הביקור מגיע בעיתוי רגיש: דיווחים על התקדמות מהירה בתוכנית הגרעין האיראנית גברו בשבועות האחרונים, ומקורות מודיעיניים מציינים שאיראן עלולה להגיע לסף גרעיני תוך חצי שנה.'),
        img(IMAGES.conference, 'פגישת ראשי המדינות', 'לע"מ'),
        p('מקורות דיפלומטיים בוושינגטון מציינים שהנשיא מגיע עם הצעות קונקרטיות — אך גם עם ציפיות ברורות מישראל לגבי ריסון בנוגע לפעילות צבאית חד-צדדית.'),
        divider(),
        h2('מה מצפים הישראלים?'),
        p('סקרים שפורסמו ערב הביקור מראים ש-67% מהישראלים מצפים שהביקור יוביל לתוצאות מוחשיות בנושא איראן. 58% תומכים בתיאום מלא עם ארה"מ לפני כל פעולה צבאית.'),
      ],
      category: catBySlug('politics'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 8. Magazine long-read — multiple images ────────────────────────────────
    {
      title: 'ראיון בלעדי: השר שמאמין בדור הצעיר — "הם עתיד ישראל ואנחנו חייבים להם יותר"',
      subtitle: 'שיחה מרתקת עם השר שהפך לאחד הפוליטיקאים הפופולריים ביותר בקרב הצעירים',
      slug: 'minister-youth-exclusive-interview-2026',
      content: 'ראיון מרתק עם השר על יוקר המחיה, הדיגיטל כלי שלטוני, ועתיד הפוליטיקה הישראלית.',
      heroImageUrl: IMAGES.conference,
      heroImageCaption: 'השר בפגישה עם צעירים — ארכיון',
      heroImageCredit: 'צילום: ניר כפרי',
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(3),
      viewCount: 38900,
      shareCount: 3400,
      readingTimeMinutes: 15,
      allowComments: true,
      hashtags: ['ראיון', 'צעירים', 'מגזין', 'ליכוד'],
      bodyBlocks: [
        p('"אני זוכר את עצמי בגיל 22, בלי עבודה, בלי דירה, עם חלומות ענקיים ופחדים גדולים עוד יותר," מספר השר בראיון בלעדי לאפליקציה. "אז אני מבין בדיוק את מה שהצעירים חווים היום."'),
        p('השר, שעלה לשורות הפוליטיקה לפני שנים ספורות בלבד, הפך בזמן קצר לאחד הקולות הצעירים והנשמעים ביותר בממשלה. בגיל 39 הוא אחד השרים הצעירים שכיהנו אי פעם בממשלה.'),
        img(IMAGES.conference, 'השר בפגישה עם יזמים צעירים בתל אביב', 'ניר כפרי'),
        h2('על יוקר המחיה'),
        p('"כשאני מדבר עם צעירים, הם לא מדברים על פוליטיקה. הם מדברים על שכר דירה, על מחיר הסל בסופר, על האם הם יוכלו לפרנס משפחה. זו המציאות שלהם, וזה צריך להיות סדר היום שלנו."'),
        p('הוא מציג נתון מדאיג: <strong>"40% מהצעירים בגילאי 25-35 מוציאים יותר מ-40% מהכנסתם על שכר דירה. זה לא ייתכן בשום כלכלה בריאה."</strong>'),
        quote('הדור הצעיר לא מבקש לנצח — הוא מבקש הזדמנות. ועל כך אנחנו צריכים לתת מענה.', 'השר'),
        img(IMAGES.city, 'שוק הנדל"ן בתל אביב — מחירים שמנשרים', 'Getty Images'),
        h2('על הדיגיטל כלי שלטוני'),
        p('"ממשלות צריכות לדבר בשפה של האזרחים. אם הצעיר שלי מנהל את כל חייו בסמארטפון, אז השירותים הממשלתיים צריכים להיות שם גם."'),
        p('הוא מציג תוכנית שאפתנית: <strong>"אנחנו מתכוונים להעביר 80% מהשירותים הממשלתיים לדיגיטל עד 2028."</strong> המשמעות: הגשת מסמכים, תשלומי מס, תיאום עם מוסדות ממשלתיים — הכל מהסמארטפון.'),
        bullets([
          'השקת "Gov-ID" — זהות דיגיטלית אחת לכל השירותים',
          'אפליקציה ממשלתית אחת שמחליפה 40 אפליקציות שונות',
          'תשלומים ממשלתיים ב-3 קליקים',
          'צ\'אטבוט ממשלתי זמין 24/7',
        ]),
        h2('על הפוליטיקה הפנימית'),
        p('כשאני שואל על הבחירות הפנימיות, הוא מחייך: "אני לא מדבר על פוליטיקה פנימית בפומבי. אני מדבר על מה שאני עושה בשבילם."'),
        p('ואז, אחרי הפסקה: "אבל כן, אני מתמודד."'),
        divider(),
        h2('מה הוא אומר לצעיר שמתייאש?'),
        quote('תישארו. ישראל צריכה אתכם. אנחנו בונים פה משהו שאף מדינה אחרת לא בנתה — ועוד לא גמרנו.', 'השר, בסיום הראיון'),
      ],
      category: catBySlug('magazine'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 9. Education — alert banner ───────────────────────────────────────────
    {
      title: 'רפורמת חינוך פורצת דרך: תלמידי ישראל יחויבו ב-2 שנות קוד ובינה מלאכותית',
      subtitle: 'שינוי מקיף בתוכנית הלימודים הלאומית — קוד, AI ויזמות יהפכו לחלק בלתי נפרד מהחינוך הבסיסי',
      slug: 'education-reform-code-ai-mandatory-2026',
      content: 'שר החינוך הכריז על רפורמה שתחייב כל תלמיד בישראל ללמוד קוד ובינה מלאכותית.',
      heroImageUrl: IMAGES.education,
      heroImageCaption: 'שיעור קוד בבית ספר יסודי — ארכיון',
      heroImageCredit: 'צילום: משרד החינוך',
      alertBannerEnabled: true,
      alertBannerText: 'עדכון: ועדת החינוך של הכנסת תדון בהצעה ביום ג\' הקרוב',
      alertBannerColor: '#7B1FA2',
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(4),
      viewCount: 44600,
      shareCount: 5200,
      readingTimeMinutes: 6,
      allowComments: true,
      hashtags: ['חינוך', 'קוד', 'AI', 'רפורמה'],
      bodyBlocks: [
        p('שר החינוך הכריז היום על רפורמה שתשנה את פני מערכת החינוך הישראלית: <strong>החל משנה"ל תשפ"ז, כל תלמידי ישראל יחויבו ללמוד שתי שנות מחשוב, קוד ובינה מלאכותית — החל מכיתה ד\'.</strong>'),
        img(IMAGES.education, 'שיעור קוד בכיתה יסודית', 'משרד החינוך'),
        p('הרפורמה, שגובשה לאורך שנתיים של עבודה משותפת עם מומחים מהתעשייה האקדמיה, מבוססת על ממצאים ממוסדות חינוכיים מובילים בעולם: אסטוניה, סינגפור ופינלנד.'),
        quote('כל ילד בישראל, ללא קשר לרקע כלכלי או גיאוגרפי, יקבל את הכלים לשגשג בכלכלת המאה ה-21. זה לא פריבילגיה, זה זכות.', 'שר החינוך'),
        h2('מה ילמדו הילדים?'),
        bullets([
          'כיתה ד\'-ו\': Python בסיסי, לוגיקה חישובית, יצירה דיגיטלית',
          'כיתה ז\'-ט\': בינה מלאכותית, אתיקה דיגיטלית, נתונים ואלגוריתמים',
          'כיתה י\'-י"ב: מסלול יזמות טכנולוגית (200 שעות), פרויקט סיום',
          'אפשרות למסלול מורחב ל-5 יחידות בגרות במדעי המחשב',
        ]),
        h2('כיצד תתממן הרפורמה?'),
        p('התוכנית תמומן על ידי שילוב של תקציב ממשלתי (2.4 מיליארד שקל), מענקים מחברות הייטק, וקרן ייעודית שהוקמה על ידי האיגוד הישראלי לתעשיות מתקדמות.'),
        img(IMAGES.city, 'מרכז הייטק ישראלי — הדגם שהרפורמה מכוונת לייצר', 'Getty Images'),
        h2('מה אומרים המורים?'),
        p('ארגון המורים קיבל את הרפורמה בחשדנות. יו"ר הארגון: "אנחנו תומכים ביעד, אבל 15,000 מורים חדשים לא גדלים על עצים. צריך להשקיע קודם בהכשרה."'),
        divider(),
        p('הרפורמה עוברת כעת לאישור ועדת החינוך של הכנסת. ההצבעה צפויה בשבוע הבא.'),
      ],
      category: catBySlug('education'),
      authorEntity: authors[2] ?? authors[0] ?? undefined,
    },

    // ── 10. Culture — highest shareCount ─────────────────────────────────────
    {
      title: 'פסטיבל ירושלים 2026: תרבות ישראלית פורצת גבולות בפסטיבל הגדול בתולדות המדינה',
      subtitle: '250 הופעות, 40 מדינות ו-300 אלף מבקרים צפויים — הפסטיבל שישים את ירושלים על מפת התרבות העולמית',
      slug: 'jerusalem-festival-2026',
      content: 'פסטיבל ירושלים 2026 יפתח את שעריו בחודש הבא עם 250 הופעות ואמנים מ-40 מדינות.',
      heroImageUrl: IMAGES.culture,
      heroImageCaption: 'הופעה בפסטיבל ירושלים 2024 — ארכיון',
      heroImageCredit: 'צילום: רמי שלוש',
      heroImageFullUrl: IMAGES.culture,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(5),
      viewCount: 31800,
      shareCount: 2900,
      readingTimeMinutes: 5,
      allowComments: true,
      hashtags: ['תרבות', 'ירושלים', 'פסטיבל', 'אמנות'],
      bodyBlocks: [
        p('ירושלים תהפוך השנה לבירת התרבות העולמית. <strong>פסטיבל ירושלים 2026</strong>, שיפתח את שעריו בחודש הבא, מתגייס לשבור את כל השיאים — 250 הופעות, אמנים מ-40 מדינות, ו-300 אלף מבקרים צפויים מרחבי העולם.'),
        img(IMAGES.culture, 'הופעה קודמת בפסטיבל ירושלים', 'רמי שלוש'),
        p('הפסטיבל, שמתקיים בתדירות דו-שנתית, הגיע השנה לרמה חדשה. לראשונה, תוקצב בצורה שווה תרבות ערבית-ישראלית לצד יצירה יהודית, עם 40 הופעות של אמנים ערבים-ישראלים בלב הפסטיבל.'),
        quote('ירושלים היא עיר של כמה קולות. הפסטיבל חוגג את כל הקולות האלה.', 'המנהל האמנותי'),
        h2('הופעות מרכזיות'),
        bullets([
          'אנסמבל קמרי ירושלים — פרמיירה של יצירה חדשה שהוזמנה לפסטיבל',
          'להקת בת-שבע — הבכורה העולמית של יצירה חדשה של אוהד נהרין',
          'אמן בינלאומי שיוכרז בשבוע הקרוב',
          'ערב מוזיקה ערבית-ישראלית — חגיגת שיתוף פעולה',
          'תיאטרון הבימה — הצגת ילדים בערבית ועברית',
        ]),
        img(IMAGES.jerusalem, 'ירושלים — העיר שמארחת את הפסטיבל', 'Getty Images'),
        h2('מה חדש השנה?'),
        p('השנה, לראשונה בתולדות הפסטיבל, יתקיימו הופעות בשכונות מגוון — מרמות אשכול ועד ג\'בל מוכבר. הרעיון: להביא תרבות לאנשים, לא רק אנשים לתרבות.'),
        divider(),
        h2('איך רוכשים כרטיסים?'),
        p('כרטיסים ניתן לרכוש דרך אתר הפסטיבל הרשמי, בכל רשתות הכרטיסים, ובקופות הבמות המשתתפות. מחירים: 50-350 שקל להופעה, ומנוי מלא ב-990 שקל.'),
      ],
      category: catBySlug('culture'),
      authorEntity: authors[0] ?? undefined,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const data of articlesData) {
    const existing = await articleRepo.findOne({ where: { slug: data.slug } });
    if (existing) {
      // Update bodyBlocks on existing articles
      await articleRepo.update({ slug: data.slug }, { bodyBlocks: data.bodyBlocks });
      skipped++;
      continue;
    }

    const article = articleRepo.create({
      ...data,
      tags: tagsBySlug('politics', 'economy', 'security'),
    } as Partial<Article>);

    await articleRepo.save(article);
    created++;
    console.log(`  ✅ ${article.title?.substring(0, 60)}...`);
  }

  console.log(`\n📰 Rich articles: ${created} created, ${skipped} updated.\n`);
}

// Run directly
if (require.main === module) {
  seedRichArticles()
    .then(() => {
      console.log('✅ Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}
