import { AppDataSource } from '../data-source';
import { Article, ArticleStatus } from '../../modules/articles/entities/article.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Author } from '../../modules/authors/entities/author.entity';
import { Tag } from '../../modules/tags/entities/tag.entity';

/**
 * Rich article seed — long articles with images and all available options.
 *
 * Each article exercises a different set of features:
 * 1. Hero + isMain + alert banner + body blocks + hashtags
 * 2. Breaking news + hero image + high view count
 * 3. Long multi-block analysis piece + tags + reading time
 * 4. Economy article with full caption/credit metadata
 * 5. Society article with all block types (paragraph, quote, heading, image)
 * 6. Security article with subtitle + comments disabled
 * 7. International article with English title + English content
 * 8. Magazine long-read with multiple image blocks
 * 9. Education article with alert banner
 * 10. Culture article with highest engagement + hashtags
 */

const IMAGES = {
  knesset: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=700&fit=crop',
  jerusalem: 'https://images.unsplash.com/photo-1555880192-48ad3a8f6e5d?w=1200&h=700&fit=crop',
  economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=700&fit=crop',
  military: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&h=700&fit=crop',
  community: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=700&fit=crop',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=700&fit=crop',
  culture: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=700&fit=crop',
  conference: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&h=700&fit=crop',
  flag: 'https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=1200&h=700&fit=crop',
  city: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=1200&h=700&fit=crop',
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 59), 0, 0);
  return d;
}

export async function seedRichArticles(): Promise<void> {
  console.log('📰 Seeding rich articles with images and all options...');

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

  const tagsByName = (...names: string[]) =>
    tags.filter((t) => names.includes(t.nameHe ?? t.nameEn ?? ''));

  const articlesData: Partial<Article>[] = [
    // ── 1. Main hero article ───────────────────────────────────────────────
    {
      title: 'ראש הממשלה נתניהו: "הממשלה תפעל למען כלל אזרחי ישראל ולחיזוק הקואליציה הרחבה"',
      titleEn: 'PM Netanyahu: "The government will act for all citizens and strengthen the broad coalition"',
      subtitle: 'בנאום מרגש במליאת הכנסת, ראש הממשלה הציג את יעדי הממשלה לשנה הקרובה תוך הדגשת הצרכים הביטחוניים והכלכליים של המדינה',
      slug: 'netanyahu-coalition-speech-2026',
      content: `<p>ראש הממשלה בנימין נתניהו נשא היום נאום מקיף במליאת הכנסת, בו הציג את תוכניות הממשלה לשנה הקרובה. הנאום, שנמשך כשעה וחצי, כיסה מגוון רחב של נושאים — מהמדיניות הביטחונית ועד לתוכניות הכלכליות החדשות.</p>

<p>נתניהו פתח את דבריו בהתייחסות לאתגרים הביטחוניים הניצבים בפני ישראל: "אנחנו חיים בשכנות עם אויבים שמבקשים את השמדתנו. ממשלת ישראל לא תנוח ולא תשקוט עד שתבטיח את ביטחון כל אזרח ואזרחית בישראל."</p>

<p>בהמשך דבריו, עסק ראש הממשלה בתוכניות הכלכליות: "אנחנו מתכוונים להוריד את יוקר המחיה, לפתוח את שוק הדיור לדור הצעיר, ולהביא עשרות אלפי מקומות עבודה חדשים לפריפריה." הוא הציג נתונים לפיהם המשק הישראלי צמח ב-3.2% בשנה האחרונה, למרות האתגרים הגיאופוליטיים.</p>

<p>חברי הקואליציה קיבלו את הנאום בתשואות חמות, בעוד שחברי האופוזיציה הצביעו על פערים בין ההבטחות למציאות. יו"ר האופוזיציה יאיר לפיד אמר בתגובה: "המילים יפות, אבל הישראלים צריכים מעשים, לא הבטחות."</p>

<p>בתחום הבינלאומי, התייחס נתניהו ליחסי ישראל עם ארה"ב ואירופה: "הברית עם ארצות הברית היא עמוד התווך של מדיניות החוץ שלנו, ואנחנו פועלים לחיזוקה בכל הדרגים."</p>

<p>הנאום הסתיים בקריאה לאחדות לאומית: "יש לנו מחלוקות, אבל כולנו אוהבים את ישראל. בואו נפעל יחד למען עתידה."</p>`,
      heroImageUrl: IMAGES.knesset,
      heroImageCaption: 'ראש הממשלה נתניהו נואם במליאת הכנסת',
      heroImageCaptionHe: 'ראש הממשלה בנימין נתניהו במהלך הנאום ההיסטורי במליאת הכנסת',
      heroImageCredit: 'צילום: דובר הכנסת',
      heroImageFullUrl: IMAGES.knesset,
      isHero: true,
      isMain: true,
      isBreaking: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(0),
      viewCount: 48200,
      shareCount: 3100,
      readingTimeMinutes: 8,
      allowComments: true,
      alertBannerEnabled: true,
      alertBannerText: 'שידור חי: דיון בכנסת עכשיו',
      alertBannerColor: '#0099DB',
      hashtags: ['כנסת', 'קואליציה', 'נתניהו', 'פוליטיקה'],
      bodyBlocks: [
        { type: 'heading', level: 2, text: 'הנקודות המרכזיות בנאום' },
        { type: 'paragraph', text: 'ראש הממשלה הציג שלושה צירים מרכזיים: ביטחון, כלכלה ואחדות לאומית.' },
        { type: 'quote', text: 'אנחנו מחויבים לעתיד המדינה כאחד — ימין ושמאל, דתיים וחילונים, יהודים וערבים שרוצים לחיות בשלום.', author: 'בנימין נתניהו, ראש הממשלה' },
        { type: 'heading', level: 2, text: 'התוכנית הכלכלית' },
        { type: 'paragraph', text: 'הממשלה מתכננת להשיק תוכנית חדשה להוזלת יוקר המחיה בהיקף של 15 מיליארד שקל.' },
        { type: 'image', url: IMAGES.conference, caption: 'ישיבת הממשלה לקראת הנאום', credit: 'לע"מ' },
        { type: 'heading', level: 2, text: 'תגובות האופוזיציה' },
        { type: 'paragraph', text: 'מנהיגי האופוזיציה הגיבו בביקורת מתונה, תוך הכרה בחלק מהיעדים שהוצגו.' },
      ],
      category: catBySlug('politics'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 2. Breaking news ────────────────────────────────────────────────────
    {
      title: 'מבזק: פיגוע טרור נסכל בירושלים — שני מחבלים חוסלו',
      titleEn: 'BREAKING: Terror attack thwarted in Jerusalem — two terrorists neutralized',
      subtitle: 'כוחות הביטחון פעלו בזריזות ומנעו פיגוע רציחה המוני בלב ירושלים',
      slug: 'breaking-terror-thwarted-jerusalem-2026',
      content: `<p><strong>עדכון אחרון 14:35:</strong> כוחות הביטחון אישרו כי האיום הוסר לחלוטין. שני החשודים חוסלו בשטח ואין נפגעים בצד הישראלי.</p>

<p>שירות הביטחון הכללי (שב"כ) ויחידות מיוחדות של משטרת ישראל נסכלו הבוקר פיגוע טרור מתוכנן בלב ירושלים. לפי המידע שנמסר לתקשורת, שני מחבלים מזוינים ניסו לחדור לאזור מרוכז אוכלוסייה במרכז העיר.</p>

<p>ראש הממשלה אמר בתגובה: "אני מברך את לוחמי שב"כ, המשטרה ויחידות הסיור המיוחדות על הפעולה המקצועית. הם הצילו היום חיי אדם רבים."</p>

<p>שר הביטחון ציין כי המודיעין שהוביל לסיכול הגיע ממקורות מרובים ולאחר מעקב של מספר ימים. "זו הוכחה נוספת שמערכת הביטחון שלנו פועלת ביעילות מרבית."</p>

<p>האזור הוחזר לשגרה לאחר כשלוש שעות של סגירה. הרשויות ממשיכות לפעול לאיתור תאים נוספים שעשויים להיות קשורים לתקרית.</p>`,
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
        { type: 'paragraph', text: 'הפיגוע נסכל בשעה 11:20 בבוקר, כשהמחבלים ניסו לחדור לשוק מחנה יהודה.' },
        { type: 'quote', text: 'המחויבות שלנו לביטחון אזרחי ישראל היא ללא תנאי ותמשיך 24 שעות ביממה.', author: 'שר הביטחון' },
      ],
      category: catBySlug('security'),
      authorEntity: authors[1] ?? authors[0] ?? undefined,
    },

    // ── 3. Long analysis — politics ─────────────────────────────────────────
    {
      title: 'ניתוח מעמיק: הליכוד לקראת הבחירות הפנימיות — מי ינצח את מירוץ הרשימה?',
      subtitle: 'סקירה מקיפה של כוחות המשיכה בתוך מפלגת הליכוד, הפלגים השונים ומה צופן העתיד לרשימה הבאה',
      slug: 'likud-primaries-deep-analysis-2026',
      content: `<p>הליכוד עומד בפני אחד הרגעים המכוננים בתולדותיו. הבחירות הפנימיות לרשימת הכנסת, שיתקיימו בשבועות הקרובים, צפויות לשנות את פני המפלגה ולקבוע מי יוביל אותה לעשור הבא.</p>

<h2>הפלגים בתוך הליכוד</h2>
<p>בתוך הליכוד פועלים מספר פלגים מרכזיים, שכל אחד מהם מציג ראייה שונה על עתיד המפלגה. הפלג ה"ותיק" מונה חברים שנבחרו בעבר ומבקשים לשמר את מעמדם. לעומתם, ה"צעירים" — רוב מתחת לגיל 45 — מבקשים לחדש ולהזרים דם חדש לסיעה.</p>

<p>פלג שלישי, ה"פריפריה", מתמקד בייצוג הנאות לגליל, הנגב וערי הפיתוח. בשנים האחרונות גדל כוחו של פלג זה, כאשר ראש הממשלה נתניהו עצמו הביע תמיכה בחיזוק ייצוג הפריפריה.</p>

<h2>המועמדים הבולטים</h2>
<p>מקרב המועמדים הבולטים ניתן למנות מספר שמות שנשמעים בהקשר של המקומות הראשונים ברשימה:</p>
<p><strong>יולי אדלשטיין</strong> — שר ותיק ומנוסה, בעל ניסיון דיפלומטי רחב ונשיא כנסת לשעבר. נהנה מתמיכה רחבה בקרב ותיקי המפלגה.</p>
<p><strong>ישראל כץ</strong> — שר האוצר לשעבר, בעל שורשים חזקים בפריפריה ותמיכה בקרב חברי מרכז המפלגה.</p>
<p><strong>ניר ברקת</strong> — ראש עיריית ירושלים לשעבר ושר הכלכלה הנוכחי, מביא עמו מותג של הצלחה ניהולית.</p>

<h2>מה יקבע את התוצאה?</h2>
<p>בחירות הפנימיות בליכוד מבוססות על מצביעי מרכז המפלגה — כ-140 אלף חברים הזכאים להצביע. מחקרים מראים שהמצביעים הפעילים ביותר הם בני 45 ומעלה, גברים, ותושבי הפריפריה — פרופיל שנותן יתרון לוותיקים ולמתמודדים עם שורשי פריפריה.</p>

<p>לצד מבנה הבוחרים, גורמי המפתח כוללים: קמפיינים של WhatsApp בקרב חברי מפלגה, תמיכה של ראש הממשלה (שנמנע מהצהרות פומביות), ומשאבים כספיים לפרסום.</p>

<h2>מה אומרים הסקרים?</h2>
<p>לפי סקר פנימי שנערך בקרב חברי מרכז הליכוד, אדלשטיין מוביל ב-28%, ברקת שני ב-22%, וכץ שלישי ב-19%. כ-31% מהנשאלים טרם החליטו — ואלה הם שיכריעו את התוצאה.</p>`,
      heroImageUrl: IMAGES.conference,
      heroImageCaption: 'כינוס מרכז הליכוד — ארכיון',
      heroImageCredit: 'צילום: קובי גדעון, לע"מ',
      heroImageFullUrl: IMAGES.conference,
      isHero: false,
      isBreaking: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(1),
      viewCount: 29700,
      shareCount: 2200,
      readingTimeMinutes: 12,
      allowComments: true,
      hashtags: ['ליכוד', 'פריימריז', 'בחירות', 'רשימה'],
      bodyBlocks: [
        { type: 'heading', level: 2, text: 'הפלגים בתוך הליכוד' },
        { type: 'paragraph', text: 'שלושה פלגים עיקריים מעצבים את הדינמיקה הפנימית: הוותיקים, הצעירים והפריפריה.' },
        { type: 'image', url: IMAGES.knesset, caption: 'ישיבת מרכז הליכוד', credit: 'לע"מ' },
        { type: 'heading', level: 2, text: 'המועמדים הבולטים' },
        { type: 'paragraph', text: 'אדלשטיין, כץ וברקת — שלושת הראשונים בסקרים הפנימיים.' },
        { type: 'quote', text: 'הבחירות הפנימיות הן הלב הפועם של הדמוקרטיה הפנימית שלנו.', author: 'ח"כ ותיק בליכוד' },
        { type: 'heading', level: 2, text: 'תחזית לתוצאה' },
        { type: 'paragraph', text: 'כ-31% מחברי המרכז טרם החליטו — הם יכריעו את הבחירות.' },
      ],
      category: catBySlug('politics'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 4. Economy — full image metadata ─────────────────────────────────────
    {
      title: 'התקציב החדש: הממשלה מאשרת חבילת סיוע של 25 מיליארד שקל לאזרחים',
      titleEn: 'New budget: Government approves NIS 25 billion relief package for citizens',
      subtitle: 'חבילת הסיוע הגדולה בתולדות המדינה תכלול הפחתת מע"מ, סובסידיות לשכר דירה ורפורמה בשוק האנרגיה',
      slug: 'budget-relief-package-25-billion-2026',
      content: `<p>הממשלה אישרה אתמול בלילה חבילת סיוע כלכלית חסרת תקדים בהיקף של 25 מיליארד שקל. החבילה, שגובשה על ידי שר האוצר בשיתוף עם כלל שרי הממשלה, מיועדת להתמודד עם יוקר המחיה שמטריד את הישראלים כבר שנים.</p>

<p>הסעיפים המרכזיים בחבילה:</p>
<p><strong>הפחתת מע"מ:</strong> המע"מ יופחת מ-17% ל-15% בפועל על קבוצת מוצרי הצריכה הבסיסיים — לחם, חלב, ביצים, ירקות ופירות. הפחתה זו צפויה לחסוך לכל משפחה ממוצעת כ-3,600 שקל בשנה.</p>
<p><strong>סובסידיות לשכר דירה:</strong> זכאים חדשים יוכלו לקבל עד 1,500 שקל לחודש כסובסידיה לשכר דירה. המדיניות תחול על זוגות צעירים עד גיל 35 שהכנסתם המשולבת אינה עולה על 20,000 שקל.</p>
<p><strong>רפורמה באנרגיה:</strong> תעריפי החשמל יופחתו ב-12% לאחר שינוי שיטת החישוב של רשות החשמל. זהו שינוי מבני שיישפיע על כ-3 מיליון משקי בית.</p>

<p>שר האוצר הדגיש: "זוהי לא חבילה פוליטית, זוהי תוכנית כלכלית מבוססת נתונים. כל שקל שהוצאנו עבר בחינה קפדנית של הלשכה המרכזית לסטטיסטיקה ושל בנק ישראל."</p>

<p>בנק ישראל פרסם הודעה שבה ציין כי החבילה "מאוזנת ואחראית" אך הזהיר מפני אינפלציה עקב עלייה בביקוש. הריבית צפויה להישאר יציבה בינתיים.</p>`,
      heroImageUrl: IMAGES.economy,
      heroImageCaption: 'שר האוצר בהכרזה על התוכנית הכלכלית',
      heroImageCaptionHe: 'שר האוצר מציג את חבילת הסיוע הכלכלית ההיסטורית',
      heroImageCredit: 'צילום: אמיל סלמן, הארץ',
      heroImageFullUrl: IMAGES.economy,
      isHero: false,
      isBreaking: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(1),
      viewCount: 67400,
      shareCount: 4800,
      readingTimeMinutes: 7,
      allowComments: true,
      hashtags: ['תקציב', 'כלכלה', 'יוקרמחיה', 'מעמד'],
      bodyBlocks: [
        { type: 'heading', level: 2, text: 'הפחתת מע"מ — מה זה אומר לי?' },
        { type: 'paragraph', text: 'כל משפחה ממוצעת תחסוך כ-3,600 שקל בשנה על מוצרי הצריכה הבסיסיים.' },
        { type: 'heading', level: 2, text: 'סובסידיה לשכר דירה' },
        { type: 'paragraph', text: 'זוגות צעירים עד גיל 35 יוכלו לקבל עד 1,500 ש"ח לחודש.' },
        { type: 'quote', text: 'כל שקל שהוצאנו עבר בחינה קפדנית. זוהי תוכנית אחראית.', author: 'שר האוצר' },
      ],
      category: catBySlug('economy'),
      authorEntity: authors[2] ?? authors[0] ?? undefined,
    },

    // ── 5. Society — all block types ──────────────────────────────────────────
    {
      title: 'שינוי היסטורי: הממשלה מכריזה על תוכנית חדשה לחיזוק קהילות הפריפריה',
      subtitle: 'תוכנית "ישראל במרכז" תשקיע 8 מיליארד שקל בתשתיות, תעסוקה וחינוך בעשרים ערי פיתוח',
      slug: 'periphery-investment-plan-2026',
      content: `<p>הממשלה השיקה אתמול את תוכנית "ישראל במרכז" — יוזמה חסרת תקדים שמטרתה לשנות את מפת הפיתוח של ישראל ולהביא את הפריפריה לחזית הצמיחה הלאומית.</p>

<p>התוכנית, שתמומן מתקציב מיוחד שאושר בממשלה, תפעל לאורך חמש שנים ותתמקד בשלושה צירים מרכזיים: תשתיות תחבורה, פיתוח כלכלי ורפורמה במערכת החינוך.</p>

<p>לפי הנתונים שפרסמה הממשלה, 20 ערים ייהנו מהתוכנית: דימונה, נתיבות, שדרות, קריית שמונה, עכו, לוד, רמלה, נהריה, עפולה ועוד. בכל עיר יוקם "מרכז תעסוקה ופיתוח" שיעניק שירותים לחברות המבקשות להתמקם באזורים אלה.</p>`,
      heroImageUrl: IMAGES.community,
      heroImageCaption: 'טקס השקת התוכנית בעיר דימונה',
      heroImageCredit: 'צילום: דוד רובינגר',
      isHero: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(2),
      viewCount: 21300,
      shareCount: 1700,
      readingTimeMinutes: 6,
      allowComments: true,
      hashtags: ['פריפריה', 'חברה', 'תעסוקה', 'פיתוח'],
      bodyBlocks: [
        { type: 'heading', level: 2, text: 'שלושת הצירים המרכזיים' },
        { type: 'paragraph', text: 'תשתיות תחבורה — פיתוח כלכלי — רפורמה בחינוך.' },
        { type: 'image', url: IMAGES.community, caption: 'קהילה בפריפריה — ארכיון', credit: 'לע"מ' },
        { type: 'quote', text: 'הפריפריה היא לב המדינה. הגיע הזמן לשים אותה במרכז.', author: 'שר הפנים' },
        { type: 'paragraph', text: '20 ערים ייהנו מהשקעה של 8 מיליארד שקל לאורך 5 שנים.' },
      ],
      category: catBySlug('society'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 6. Security — no comments + subtitle ─────────────────────────────────
    {
      title: 'צבא ישראל סיכל מתקפת כטב"ם משולשת בגבול הצפון',
      titleEn: 'IDF thwarts triple drone attack on northern border',
      subtitle: 'שלושה כטב"מים חמושים יורטו בהצלחה על ידי מערכות ההגנה האווירית — אין נפגעים',
      slug: 'idf-drone-attack-north-thwarted-2026',
      content: `<p>צבא ישראל הודיע הערב כי יחידות ההגנה האווירית יירטו שלושה כטב"מים חמושים שניסו לחדור לשטח ישראל מכיוון לבנון. האירוע התרחש בין השעות 22:00 ל-23:30.</p>

<p>לפי הצהרת הצבא, שלושת הכטב"מים זוהו בזמן אמת על ידי מערכות מעקב מתקדמות ויורטו לפני שהגיעו לכל יישוב ישראלי. שרפות קלות שפרצו בשטח פתוח סמוך לגבול כובו על ידי כבאים.</p>

<p>ראש מטה הצבא ציין: "מערכות ההגנה שלנו פועלות בצורה מיטבית. כל ניסיון פגיעה באזרחים ייפגש בתגובה מיידית ומדויקת."</p>

<p>אין בשלב זה אישור לגבי הגורם שעמד מאחורי המתקפה, אך מקורות ביטחוניים מצביעים על ארגון חזבאללה.</p>`,
      heroImageUrl: IMAGES.military,
      heroImageCredit: 'צילום: דובר צה"ל',
      isBreaking: true,
      isHero: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(0),
      viewCount: 88100,
      shareCount: 6300,
      readingTimeMinutes: 3,
      allowComments: false,
      hashtags: ['מבזק', 'ביטחון', 'צפון', 'כטבם'],
      bodyBlocks: [
        { type: 'paragraph', text: 'שלושת הכטב"מים זוהו בזמן אמת ויורטו לפני כניסה לשטח מאוכלס.' },
        { type: 'quote', text: 'כל ניסיון פגיעה באזרחים ייפגש בתגובה מיידית ומדויקת.', author: 'ראש מטה הצבא' },
      ],
      category: catBySlug('security'),
      authorEntity: authors[1] ?? authors[0] ?? undefined,
    },

    // ── 7. International — English content ───────────────────────────────────
    {
      title: 'ביקור היסטורי: נשיא ארה"ב מגיע לישראל — על סדר היום: שלום אזורי ועצירת הגרעין האיראני',
      titleEn: 'Historic visit: US President arrives in Israel — agenda: regional peace and stopping Iranian nuclear program',
      subtitle: 'הביקור הנוכחי הוא הראשון מאז כינון הממשלה החדשה ונחשב לחשוב ביותר בעשור האחרון',
      slug: 'us-president-israel-visit-2026',
      content: `<p>נשיא ארצות הברית נחת הבוקר בנתב"ג לביקור רשמי בן שלושה ימים בישראל. הביקור, שתוכנן מזה חודשים, מתרחש על רקע המתיחות הגוברת סביב התוכנית הגרעינית של איראן ומאמצי השלום האזוריים.</p>

<p>בטקס הקבלה בנתב"ג, ציין ראש הממשלה נתניהו: "הברית בין ישראל לארה"ב חזקה מאי פעם. אנחנו מצפים לדיונים פורייניים על כל הנושאים המרכזיים."</p>

<p>הנשיא האמריקאי אמר בתגובה: "ישראל תמיד תוכל לסמוך על ארצות הברית. נאמנות זו אינה מותנית."</p>

<p>על סדר היום:</p>
<p>• שיחות ביטחוניות על תוכנית הגרעין האיראנית ואפשרויות לעצירתה</p>
<p>• קידום הסכמי אברהם והרחבתם למדינות ערב נוספות</p>
<p>• שיתוף פעולה כלכלי-טכנולוגי בהיקף של 10 מיליארד דולר</p>
<p>• מסגרת לפתרון הסכסוך הישראלי-פלסטיני</p>`,
      contentEn: `<p>The US President landed this morning at Ben Gurion Airport for a three-day official visit to Israel. The visit, planned for months, comes against the backdrop of growing tensions over Iran's nuclear program and regional peace efforts.</p>

<p>At the reception ceremony, PM Netanyahu stated: "The alliance between Israel and the United States is stronger than ever. We look forward to fruitful discussions on all key issues."</p>

<p>The American President responded: "Israel can always count on the United States. This loyalty is unconditional."</p>`,
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
        { type: 'heading', level: 2, text: 'מה על סדר היום?' },
        { type: 'paragraph', text: 'גרעין איראן, הסכמי אברהם, שיתוף פעולה כלכלי ופתרון הסכסוך.' },
        { type: 'image', url: IMAGES.flag, caption: 'הדגלים בנתב"ג', credit: 'AP' },
        { type: 'quote', text: 'ישראל תמיד תוכל לסמוך על ארצות הברית. נאמנות זו אינה מותנית.', author: 'נשיא ארה"מ' },
      ],
      category: catBySlug('politics'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 8. Magazine long-read ──────────────────────────────────────────────────
    {
      title: 'ראיון בלעדי: השר שמאמין בדור הצעיר — "הם עתיד ישראל ואנחנו חייבים להם יותר"',
      subtitle: 'שיחה מרתקת עם השר שהפך לאחד הפוליטיקאים הפופולריים ביותר בקרב הצעירים',
      slug: 'minister-youth-exclusive-interview-2026',
      content: `<p>"אני זוכר את עצמי בגיל 22, בלי עבודה, בלי דירה, עם חלומות ענקיים ופחדים גדולים עוד יותר," מספר השר בראיון בלעדי לאפליקציה. "אז אני מבין בדיוק את מה שהצעירים חווים היום."</p>

<p>השר, שעלה לשורות הפוליטיקה לפני שנים ספורות בלבד, הפך בזמן קצר לאחד הקולות הצעירים והנשמעים ביותר בממשלה. בגיל 39 הוא אחד השרים הצעירים שכיהנו אי פעם בממשלה, ובסקרים הפנימיים של הליכוד הוא ממוקם גבוה בקרב מצביעים מתחת לגיל 40.</p>

<h2>על יוקר המחיה</h2>
<p>"כשאני מדבר עם צעירים, הם לא מדברים על פוליטיקה. הם מדברים על שכר דירה, על מחיר הסל בסופר, על האם הם יוכלו לפרנס משפחה. זו המציאות שלהם, וזה צריך להיות סדר היום שלנו."</p>

<p>הוא מציג נתון מדאיג: "40% מהצעירים בגילאי 25-35 מוציאים יותר מ-40% מהכנסתם על שכר דירה. זה לא ייתכן בשום כלכלה בריאה."</p>

<h2>על הדיגיטל כלי שלטוני</h2>
<p>"ממשלות צריכות לדבר בשפה של האזרחים. אם הצעיר שלי מנהל את כל חייו בסמארטפון, אז השירותים הממשלתיים צריכים להיות שם גם. אנחנו מתכוונים להעביר 80% מהשירותים הממשלתיים לדיגיטל עד 2028."</p>

<h2>על הפוליטיקה הפנימית</h2>
<p>כשאני שואל על הבחירות הפנימיות, הוא מחייך: "אני לא מדבר על פוליטיקה פנימית בפומבי. אני מדבר על מה שאני עושה בשבילם." ואז, אחרי הפסקה: "אבל כן, אני מתמודד."</p>`,
      heroImageUrl: IMAGES.conference,
      heroImageCaption: 'השר בפגישה עם צעירים — ארכיון',
      heroImageCredit: 'צילום: ניר כפרי',
      isHero: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(3),
      viewCount: 38900,
      shareCount: 3400,
      readingTimeMinutes: 15,
      allowComments: true,
      hashtags: ['ראיון', 'צעירים', 'מגזין', 'ליכוד'],
      bodyBlocks: [
        { type: 'heading', level: 2, text: 'על יוקר המחיה' },
        { type: 'paragraph', text: '40% מהצעירים מוציאים יותר מ-40% מהכנסתם על שכר דירה.' },
        { type: 'quote', text: 'אני זוכר את עצמי בגיל 22, בלי עבודה, בלי דירה, עם חלומות ענקיים ופחדים גדולים עוד יותר.', author: 'השר' },
        { type: 'image', url: IMAGES.city, caption: 'תל אביב — שוק הנדל"ן', credit: 'Getty Images' },
        { type: 'heading', level: 2, text: 'על הדיגיטל כלי שלטוני' },
        { type: 'paragraph', text: '80% מהשירותים הממשלתיים יעברו לדיגיטל עד 2028.' },
      ],
      category: catBySlug('magazine'),
      authorEntity: authors[0] ?? undefined,
    },

    // ── 9. Education — alert banner ───────────────────────────────────────────
    {
      title: 'רפורמת חינוך פורצת דרך: תלמידי ישראל יחויבו ב-2 שנות קוד ובינה מלאכותית',
      subtitle: 'שינוי מקיף בתוכנית הלימודים הלאומית — קוד, AI ויזמות יהפכו לחלק בלתי נפרד מהחינוך הבסיסי',
      slug: 'education-reform-code-ai-mandatory-2026',
      content: `<p>שר החינוך הכריז היום על רפורמה שתשנה את פני מערכת החינוך הישראלית: החל משנה"ל תשפ"ז, כל תלמידי ישראל יחויבו ללמוד שתי שנות מחשוב, קוד ובינה מלאכותית — החל מכיתה ד'.</p>

<p>הרפורמה, שגובשה לאורך שנתיים של עבודה משותפת עם מומחים מהתעשייה האקדמיה, מבוססת על ממצאים ממוסדות חינוכיים מובילים בעולם: אסטוניה, סינגפור ופינלנד.</p>

<p>"כל ילד בישראל, ללא קשר לרקע כלכלי או גיאוגרפי, יקבל את הכלים לשגשג בכלכלת המאה ה-21," אמר שר החינוך. "זה לא פריבילגיה, זה זכות."</p>

<p>הרפורמה כוללת:</p>
<p>• חינוך לקוד (Python בסיסי) החל מכיתה ד'</p>
<p>• מודול AI ואתיקה דיגיטלית בכיתות ז'-ט'</p>
<p>• מסלול יזמות טכנולוגית בתיכון (כ-200 שעות)</p>
<p>• הכשרת 15,000 מורים חדשים לתחום</p>`,
      heroImageUrl: IMAGES.education,
      heroImageCaption: 'שיעור קוד בבית ספר יסודי — ארכיון',
      heroImageCredit: 'צילום: משרד החינוך',
      alertBannerEnabled: true,
      alertBannerText: 'עדכון: ועדת החינוך של הכנסת תדון בהצעה ביום ג\' הקרוב',
      alertBannerColor: '#7B1FA2',
      isHero: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(4),
      viewCount: 44600,
      shareCount: 5200,
      readingTimeMinutes: 6,
      allowComments: true,
      hashtags: ['חינוך', 'קוד', 'AI', 'רפורמה'],
      bodyBlocks: [
        { type: 'paragraph', text: 'החל משנה"ל תשפ"ז — קוד ו-AI חובה לכל ילד בישראל.' },
        { type: 'heading', level: 2, text: 'מה ילמדו הילדים?' },
        { type: 'paragraph', text: 'Python בסיסי, אתיקה דיגיטלית, ויזמות טכנולוגית.' },
        { type: 'quote', text: 'כל ילד בישראל יקבל את הכלים לשגשג בכלכלת המאה ה-21. זה לא פריבילגיה, זה זכות.', author: 'שר החינוך' },
      ],
      category: catBySlug('education'),
      authorEntity: authors[2] ?? authors[0] ?? undefined,
    },

    // ── 10. Culture — highest engagement ──────────────────────────────────────
    {
      title: 'פסטיבל ירושלים 2026: תרבות ישראלית פורצת גבולות בפסטיבל הגדול בתולדות המדינה',
      subtitle: '250 הופעות, 40 מדינות ו-300 אלף מבקרים צפויים — הפסטיבל שישים את ירושלים על מפת התרבות העולמית',
      slug: 'jerusalem-festival-2026',
      content: `<p>ירושלים תהפוך השנה לבירת התרבות העולמית. פסטיבל ירושלים 2026, שיפתח את שעריו בחודש הבא, מתגייס לשבור את כל השיאים — 250 הופעות, אמנים מ-40 מדינות, ו-300 אלף מבקרים צפויים מרחבי העולם.</p>

<p>הפסטיבל, שמתקיים בתדירות דו-שנתית, הגיע השנה לרמה חדשה. לראשונה, תוקצב בצורה שווה תרבות ערבית-ישראלית לצד יצירה יהודית, עם 40 הופעות של אמנים ערבים-ישראלים בלב הפסטיבל.</p>

<p>מנהל אמנותי של הפסטיבל: "ירושלים היא עיר של כמה קולות. הפסטיבל חוגג את כל הקולות האלה."</p>

<p>הופעות מרכזיות:</p>
<p>• אנסמבל קמרי ירושלים — פרמיירה של יצירה חדשה</p>
<p>• להקת בת-שבע — הבכורה העולמית של יצירה של אוהד נהרין</p>
<p>• אמן בינלאומי שיוכרז בשבוע הקרוב</p>
<p>• ערב מוזיקה ערבית-ישראלית — חגיגת שיתוף פעולה</p>`,
      heroImageUrl: IMAGES.culture,
      heroImageCaption: 'הופעה בפסטיבל ירושלים 2024 — ארכיון',
      heroImageCredit: 'צילום: רמי שלוש',
      heroImageFullUrl: IMAGES.culture,
      isHero: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: daysAgo(5),
      viewCount: 31800,
      shareCount: 2900,
      readingTimeMinutes: 5,
      allowComments: true,
      hashtags: ['תרבות', 'ירושלים', 'פסטיבל', 'אמנות'],
      bodyBlocks: [
        { type: 'paragraph', text: '250 הופעות, 40 מדינות, 300 אלף מבקרים — הפסטיבל הגדול בתולדות המדינה.' },
        { type: 'image', url: IMAGES.culture, caption: 'פסטיבל ירושלים 2024', credit: 'רמי שלוש' },
        { type: 'quote', text: 'ירושלים היא עיר של כמה קולות. הפסטיבל חוגג את כל הקולות האלה.', author: 'מנהל אמנותי' },
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
      skipped++;
      continue;
    }

    const article = articleRepo.create({
      ...data,
      tags: tagsByName('ליכוד', 'כנסת', 'ממשלה'),
    } as Partial<Article>);

    await articleRepo.save(article);
    created++;
    console.log(`  ✅ ${article.title?.substring(0, 60)}...`);
  }

  console.log(`\n📰 Rich articles seeded: ${created} created, ${skipped} already existed.\n`);
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
