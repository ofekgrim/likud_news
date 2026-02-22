#!/usr/bin/env npx tsx
/**
 * Seed Articles Script
 * Creates tags, authors, and 50 articles across all categories.
 *
 * Usage:
 *   npx tsx scripts/seed-articles.ts
 *
 * Prerequisites:
 *   - Backend running on localhost:9090
 *   - Base seed data applied (categories, admin user)
 */

const API = process.env.API_URL || 'http://localhost:9090/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@likud.org.il';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin123!';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; nameEn: string; slug: string; }
interface Tag { id: string; nameHe: string; slug: string; }
interface Author { id: string; nameHe: string; }

interface ArticleDef {
  title: string;
  subtitle: string;
  slug: string;
  categorySlug: string;
  tagSlugs: string[];
  authorSlug: string;
  bodyBlocks: Record<string, unknown>[];
  isHero?: boolean;
  isBreaking?: boolean;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

let token = '';

async function login(): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  token = data.accessToken;
  console.log('✓ Logged in as admin');
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} — ${err}`);
  }
  return res.json();
}

// ─── New Tags to Create ──────────────────────────────────────────────────────

const NEW_TAGS = [
  { nameHe: 'כלכלה', nameEn: 'Economy', slug: 'economy', tagType: 'topic' },
  { nameHe: 'חינוך', nameEn: 'Education', slug: 'education', tagType: 'topic' },
  { nameHe: 'בריאות', nameEn: 'Health', slug: 'health', tagType: 'topic' },
  { nameHe: 'ספורט', nameEn: 'Sports', slug: 'sports', tagType: 'topic' },
  { nameHe: 'תרבות', nameEn: 'Culture', slug: 'culture', tagType: 'topic' },
  { nameHe: 'טכנולוגיה', nameEn: 'Technology', slug: 'technology', tagType: 'topic' },
  { nameHe: 'דיפלומטיה', nameEn: 'Diplomacy', slug: 'diplomacy', tagType: 'topic' },
  { nameHe: 'חברה', nameEn: 'Society', slug: 'society', tagType: 'topic' },
  { nameHe: 'הסכמי אברהם', nameEn: 'Abraham Accords', slug: 'abraham-accords', tagType: 'topic' },
  { nameHe: 'נגב וגליל', nameEn: 'Negev & Galilee', slug: 'negev-galilee', tagType: 'location' },
  { nameHe: 'תל אביב', nameEn: 'Tel Aviv', slug: 'tel-aviv', tagType: 'location' },
  { nameHe: 'חיפה', nameEn: 'Haifa', slug: 'haifa', tagType: 'location' },
  { nameHe: 'יריב לפיד', nameEn: 'Yariv Lapid', slug: 'yariv-lapid', tagType: 'person' },
  { nameHe: 'גדעון סער', nameEn: 'Gideon Saar', slug: 'gideon-saar', tagType: 'person' },
  { nameHe: 'ניר ברקת', nameEn: 'Nir Barkat', slug: 'nir-barkat', tagType: 'person' },
];

// ─── New Authors to Create ───────────────────────────────────────────────────

const NEW_AUTHORS = [
  { nameHe: 'דוד לוי', nameEn: 'David Levy', slug: 'david-levy', roleHe: 'כתב ביטחוני', roleEn: 'Security Correspondent', bioHe: 'כתב ביטחוני ותיק, מסקר את הזירה הביטחונית מזה 20 שנה.', email: 'david@likud.org.il', isActive: true },
  { nameHe: 'מיכל אברהם', nameEn: 'Michal Avraham', slug: 'michal-avraham', roleHe: 'כתבת כלכלית', roleEn: 'Economics Reporter', bioHe: 'כתבת כלכלית מומחית בשווקי ההון והטכנולוגיה.', email: 'michal@likud.org.il', isActive: true },
  { nameHe: 'אורי שמש', nameEn: 'Uri Shemesh', slug: 'uri-shemesh', roleHe: 'כתב חברה', roleEn: 'Society Reporter', bioHe: 'כתב לנושאי חברה, חינוך ורווחה.', email: 'uri@likud.org.il', isActive: true },
  { nameHe: 'רונית בן-דוד', nameEn: 'Ronit Ben-David', slug: 'ronit-ben-david', roleHe: 'כתבת תרבות', roleEn: 'Culture Correspondent', bioHe: 'כתבת תרבות וספורט, מלווה אירועים בינלאומיים.', email: 'ronit@likud.org.il', isActive: true },
  { nameHe: 'עמית כהן', nameEn: 'Amit Cohen', slug: 'amit-cohen', roleHe: 'כתב דיפלומטי', roleEn: 'Diplomatic Correspondent', bioHe: 'כתב דיפלומטי בכיר, מסקר את משרד החוץ והיחסים הבינלאומיים.', email: 'amit@likud.org.il', isActive: true },
];

// ─── Article Templates ───────────────────────────────────────────────────────

const ARTICLES: ArticleDef[] = [
  // ── Politics (8) ───────────────────────────────────────────────────────
  {
    title: 'הכנסת אישרה בקריאה ראשונה את חוק התקציב לשנת 2026',
    subtitle: 'התקציב כולל תוספת של 10 מיליארד שקלים לביטחון ולחינוך',
    slug: 'knesset-budget-2026-first-reading',
    categorySlug: 'politics',
    tagSlugs: ['knesset', 'netanyahu', 'economy'],
    authorSlug: 'amit-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'אישור התקציב בקריאה ראשונה', level: 2 },
      { type: 'paragraph', text: 'מליאת הכנסת אישרה הערב ברוב של 64 תומכים מול 56 מתנגדים את חוק התקציב לשנת 2026 בקריאה ראשונה. התקציב כולל תוספת משמעותית של 10 מיליארד שקלים המיועדים לביטחון ולחינוך.' },
      { type: 'quote', text: 'זהו תקציב אחראי שמשלב צמיחה כלכלית עם ביטחון לאומי', attribution: 'שר האוצר' },
      { type: 'paragraph', text: 'האופוזיציה ביקרה את התקציב וטענה כי הוא אינו מתייחס מספיק לשכבות החלשות. הדיון על הקריאה השנייה והשלישית צפוי להתקיים בעוד שבועיים.' },
    ],
  },
  {
    title: 'ראש הממשלה נפגש עם נשיא צרפת בפריז לדיון בסוגיות אזוריות',
    subtitle: 'השניים דנו בהרחבת שיתוף הפעולה הכלכלי והביטחוני',
    slug: 'pm-france-president-paris-meeting',
    categorySlug: 'politics',
    tagSlugs: ['netanyahu', 'diplomacy', 'abraham-accords'],
    authorSlug: 'amit-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'פסגה ישראלית-צרפתית בפריז', level: 2 },
      { type: 'paragraph', text: 'ראש הממשלה בנימין נתניהו נפגש היום עם נשיא צרפת בארמון האליזה. השניים דנו בהרחבת שיתוף הפעולה הכלכלי, בלחימה בטרור בינלאומי ובסוגיות אזוריות.' },
      { type: 'paragraph', text: 'בתום הפגישה פרסמו המנהיגים הצהרה משותפת המבטאת מחויבות לחיזוק היחסים הדו-צדדיים.' },
    ],
  },
  {
    title: 'ועדת החוקה אישרה הצעת חוק חדשה לחיזוק שלטון החוק',
    subtitle: 'ההצעה כוללת הגברת עצמאות הרשות השופטת',
    slug: 'constitution-committee-rule-of-law-bill',
    categorySlug: 'politics',
    tagSlugs: ['knesset', 'gideon-saar'],
    authorSlug: 'yael-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'חיזוק שלטון החוק', level: 2 },
      { type: 'paragraph', text: 'ועדת החוקה, חוק ומשפט אישרה היום הצעת חוק חדשה שמטרתה לחזק את שלטון החוק בישראל.' },
      { type: 'bullet_list', items: ['הגברת עצמאות הרשות השופטת', 'שיפור מנגנוני הפיקוח הממשלתיים', 'הגנה על זכויות האזרח'] },
    ],
  },
  {
    title: 'סקר: 62% מהציבור תומכים בהרחבת הסכמי אברהם',
    subtitle: 'הסקר מצביע על תמיכה רחבה בנורמליזציה עם מדינות ערב נוספות',
    slug: 'poll-abraham-accords-support-62-percent',
    categorySlug: 'politics',
    tagSlugs: ['netanyahu', 'abraham-accords', 'diplomacy'],
    authorSlug: 'yael-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'תמיכה ציבורית בהסכמי אברהם', level: 2 },
      { type: 'paragraph', text: 'סקר חדש שנערך על ידי מכון דיאלוג מצביע על כך ש-62% מהציבור הישראלי תומכים בהרחבת הסכמי אברהם למדינות ערב נוספות.' },
      { type: 'paragraph', text: 'בקרב בוחרי הקואליציה התמיכה עומדת על 78%, בעוד שבקרב בוחרי האופוזיציה היא עומדת על 51%.' },
    ],
  },
  {
    title: 'הממשלה הקימה צוות משימה לקידום רפורמה בשירות הציבורי',
    subtitle: 'הרפורמה תכלול דיגיטליזציה של שירותים ממשלתיים',
    slug: 'government-task-force-public-service-reform',
    categorySlug: 'politics',
    tagSlugs: ['knesset', 'netanyahu', 'technology'],
    authorSlug: 'yael-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'רפורמה מקיפה בשירות הציבורי', level: 2 },
      { type: 'paragraph', text: 'ראש הממשלה הודיע על הקמת צוות משימה בינמשרדי שיוביל רפורמה מקיפה בשירות הציבורי. הרפורמה תכלול דיגיטליזציה מלאה של שירותים ממשלתיים, שיפור יעילות הבירוקרטיה וקיצור זמני המתנה.' },
    ],
  },
  {
    title: 'שר החוץ סיים סיור דיפלומטי מוצלח באפריקה',
    subtitle: 'הסיור כלל ביקורים ב-4 מדינות וחתימה על הסכמי סחר',
    slug: 'foreign-minister-africa-diplomatic-tour',
    categorySlug: 'politics',
    tagSlugs: ['diplomacy', 'economy'],
    authorSlug: 'amit-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'דיפלומטיה ישראלית באפריקה', level: 2 },
      { type: 'paragraph', text: 'שר החוץ סיים היום סיור דיפלומטי בן שבוע ב-4 מדינות באפריקה. במהלך הסיור נחתמו הסכמי סחר, שיתוף פעולה חקלאי והסכמים בתחום המים.' },
      { type: 'paragraph', text: '"אפריקה היא יבשת ההזדמנויות עבור ישראל", אמר השר בסיום הסיור.' },
    ],
  },
  {
    title: 'הליכוד פתח במבצע רישום חברים חדשים ברחבי הארץ',
    subtitle: 'המטרה: 50,000 חברים חדשים עד סוף השנה',
    slug: 'likud-new-members-registration-campaign',
    categorySlug: 'politics',
    tagSlugs: ['knesset', 'society'],
    authorSlug: 'yael-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'מבצע רישום חברים חדשים', level: 2 },
      { type: 'paragraph', text: 'תנועת הליכוד פתחה היום במבצע רישום חברים חדשים ברחבי הארץ, עם דגש על צעירים ועולים חדשים.' },
      { type: 'paragraph', text: 'המבצע כולל אירועי הרשמה בקמפוסים, מרכזים קהילתיים ובאופן מקוון.' },
    ],
  },
  {
    title: 'הכנסת אישרה חוק חדש להגברת השקיפות בפעילות הממשלה',
    subtitle: 'החוק מחייב פרסום מלא של פרוטוקולים ממשלתיים תוך 30 יום',
    slug: 'knesset-government-transparency-law',
    categorySlug: 'politics',
    tagSlugs: ['knesset', 'gideon-saar'],
    authorSlug: 'yael-cohen',
    bodyBlocks: [
      { type: 'heading', text: 'שקיפות ממשלתית מלאה', level: 2 },
      { type: 'paragraph', text: 'מליאת הכנסת אישרה ברוב גדול חוק חדש המחייב את הממשלה לפרסם את כל פרוטוקולי הישיבות תוך 30 יום.' },
      { type: 'quote', text: 'השקיפות היא הבסיס לדמוקרטיה בריאה', attribution: 'יושב ראש הכנסת' },
    ],
  },

  // ── Security (6) ───────────────────────────────────────────────────────
  {
    title: 'צה"ל חשף מערכת הגנה חדשנית נגד איומי מל"טים',
    subtitle: 'מערכת "שומר שמיים" תוצב בגבול הצפון תוך חודשים',
    slug: 'idf-new-drone-defense-system-north',
    categorySlug: 'security',
    tagSlugs: ['national-security', 'technology'],
    authorSlug: 'david-levy',
    bodyBlocks: [
      { type: 'heading', text: 'מערכת הגנה חדשנית נגד מל"טים', level: 2 },
      { type: 'paragraph', text: 'צה"ל חשף היום מערכת הגנה חדשנית בשם "שומר שמיים" המיועדת להתמודדות עם איומי מל"טים. המערכת משלבת בינה מלאכותית וטכנולוגיית לייזר.' },
      { type: 'paragraph', text: 'ראש אגף המודיעין: "מדובר בקפיצה טכנולוגית משמעותית ביכולות ההגנה של ישראל".' },
    ],
  },
  {
    title: 'ישראל וארה"ב חתמו על הסכם ביטחוני עשרתי חדש',
    subtitle: 'ההסכם כולל סיוע צבאי של 50 מיליארד דולר',
    slug: 'israel-us-ten-year-security-agreement',
    categorySlug: 'security',
    tagSlugs: ['national-security', 'netanyahu', 'diplomacy'],
    authorSlug: 'david-levy',
    bodyBlocks: [
      { type: 'heading', text: 'הסכם ביטחוני היסטורי עם ארה"ב', level: 2 },
      { type: 'paragraph', text: 'ישראל וארצות הברית חתמו היום בוושינגטון על הסכם סיוע ביטחוני חדש לעשר שנים, הכולל סיוע צבאי בהיקף חסר תקדים של 50 מיליארד דולר.' },
      { type: 'quote', text: 'הברית בין ישראל לארה"ב חזקה מתמיד', attribution: 'ראש הממשלה' },
    ],
  },
  {
    title: 'תרגיל ימי רב-לאומי יצא לדרך בים התיכון בהשתתפות חיל הים',
    subtitle: '12 מדינות משתתפות בתרגיל הגדול ביותר באזור',
    slug: 'multinational-naval-exercise-mediterranean',
    categorySlug: 'security',
    tagSlugs: ['national-security', 'diplomacy'],
    authorSlug: 'david-levy',
    bodyBlocks: [
      { type: 'heading', text: 'תרגיל ימי רב-לאומי', level: 2 },
      { type: 'paragraph', text: 'חיל הים הישראלי משתתף בתרגיל ימי רב-לאומי מקיף בים התיכון, בו לוקחות חלק 12 מדינות ועשרות כלי שיט.' },
      { type: 'paragraph', text: 'התרגיל כולל סימולציות של מבצעים נגד טרור ימי, חילוץ והצלה ולוחמה ימית.' },
    ],
  },
  {
    title: 'המוסד סיכל ניסיון פיגוע בשגרירות ישראלית באירופה',
    subtitle: 'שני חשודים נעצרו בשיתוף פעולה עם גורמי ביטחון מקומיים',
    slug: 'mossad-foiled-embassy-attack-europe',
    categorySlug: 'security',
    tagSlugs: ['national-security'],
    authorSlug: 'david-levy',
    bodyBlocks: [
      { type: 'heading', text: 'סיכול ניסיון פיגוע', level: 2 },
      { type: 'paragraph', text: 'המוסד סיכל ניסיון פיגוע שתוכנן נגד שגרירות ישראלית באחת ממדינות אירופה. שני חשודים נעצרו בשיתוף פעולה עם שירותי הביטחון המקומיים.' },
    ],
  },
  {
    title: 'תעשייה אווירית חשפה טיל חדש בעל טווח מוגבר',
    subtitle: 'הטיל החדש ישפר משמעותית את יכולות ההרתעה של ישראל',
    slug: 'iai-new-long-range-missile-unveiled',
    categorySlug: 'security',
    tagSlugs: ['national-security', 'technology'],
    authorSlug: 'david-levy',
    bodyBlocks: [
      { type: 'heading', text: 'טיל חדש מתעשייה אווירית', level: 2 },
      { type: 'paragraph', text: 'התעשייה האווירית לישראל חשפה היום טיל חדש בעל טווח מוגבר, המהווה שדרוג משמעותי ביכולות ההרתעה של צה"ל.' },
      { type: 'paragraph', text: 'הטיל פותח במשך חמש שנים ועבר בהצלחה סדרת ניסויים מבצעיים.' },
    ],
  },
  {
    title: 'שב"כ: ירידה של 40% בניסיונות פיגוע בשנה האחרונה',
    subtitle: 'ראש השב"כ מייחס את הירידה לשיתוף פעולה מודיעיני משופר',
    slug: 'shin-bet-40-percent-drop-terror-attempts',
    categorySlug: 'security',
    tagSlugs: ['national-security', 'knesset', 'technology'],
    authorSlug: 'david-levy',
    bodyBlocks: [
      { type: 'heading', text: 'ירידה בניסיונות פיגוע', level: 2 },
      { type: 'paragraph', text: 'ראש השב"כ הציג היום בוועדת החוץ והביטחון נתונים לפיהם חלה ירידה של 40% בניסיונות פיגוע בשנה האחרונה.' },
      { type: 'bullet_list', items: ['שיפור מודיעיני משמעותי', 'שיתוף פעולה עם רשות פלסטינית', 'טכנולוגיה מתקדמת לאיתור מחבלים'] },
    ],
  },

  // ── Economy (6) ────────────────────────────────────────────────────────
  {
    title: 'הבנק המרכזי הפחית את הריבית ב-0.25% לעידוד הצמיחה',
    subtitle: 'ריבית בנק ישראל ירדה ל-3.75% בעקבות נתוני אינפלציה נמוכים',
    slug: 'bank-of-israel-rate-cut-025',
    categorySlug: 'economy',
    tagSlugs: ['economy', 'knesset'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'הפחתת ריבית לעידוד צמיחה', level: 2 },
      { type: 'paragraph', text: 'בנק ישראל הודיע היום על הפחתת ריבית של 0.25% לרמה של 3.75%, בעקבות נתוני אינפלציה נמוכים מהצפוי.' },
      { type: 'quote', text: 'המשק הישראלי מפגין חוסן, אך נדרשת תמיכה בצמיחה', attribution: 'נגיד בנק ישראל' },
    ],
  },
  {
    title: 'סטארט-אפ ישראלי גייס 500 מיליון דולר בסבב הגדול ביותר השנה',
    subtitle: 'חברת AI-Med מפתחת בינה מלאכותית לאבחון רפואי',
    slug: 'israeli-startup-500m-funding-ai-med',
    categorySlug: 'economy',
    tagSlugs: ['economy', 'technology', 'health', 'tel-aviv'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'גיוס שיא בהייטק הישראלי', level: 2 },
      { type: 'paragraph', text: 'חברת AI-Med הישראלית גייסה 500 מיליון דולר בסבב C — הגיוס הגדול ביותר בהייטק הישראלי השנה. החברה מפתחת מערכת בינה מלאכותית לאבחון רפואי מוקדם.' },
      { type: 'paragraph', text: 'המערכת כבר נמצאת בשימוש ב-200 בתי חולים ב-15 מדינות.' },
    ],
  },
  {
    title: 'יצוא החקלאות הישראלית שבר שיא: 3 מיליארד דולר',
    subtitle: 'טכנולוגיות חקלאות מתקדמות מובילות את הצמיחה',
    slug: 'israeli-agriculture-exports-record-3b',
    categorySlug: 'economy',
    tagSlugs: ['economy', 'technology', 'negev-galilee'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'שיא ביצוא חקלאי', level: 2 },
      { type: 'paragraph', text: 'יצוא החקלאות הישראלית הגיע לשיא חסר תקדים של 3 מיליארד דולר, עלייה של 22% לעומת השנה הקודמת.' },
      { type: 'bullet_list', items: ['טכנולוגיות השקיה חכמות', 'חממות אוטומטיות', 'זנים עמידים בבצורת', 'פתרונות אריזה מתקדמים'] },
    ],
  },
  {
    title: 'הממשלה אישרה תוכנית להקמת 3 אזורי תעשייה חדשים בנגב',
    subtitle: 'האזורים יכללו הטבות מס ותמריצים למעסיקים',
    slug: 'government-3-new-industrial-zones-negev',
    categorySlug: 'economy',
    tagSlugs: ['economy', 'netanyahu', 'negev-galilee', 'nir-barkat'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'אזורי תעשייה חדשים בנגב', level: 2 },
      { type: 'paragraph', text: 'הממשלה אישרה תוכנית להקמת 3 אזורי תעשייה חדשים בנגב, שיכללו הטבות מס, תמריצים למעסיקים ותשתיות תחבורה מתקדמות.' },
      { type: 'paragraph', text: 'התוכנית צפויה ליצור 15,000 מקומות עבודה חדשים באזור.' },
    ],
  },
  {
    title: 'האבטלה בישראל ירדה לשפל היסטורי של 3.2%',
    subtitle: 'שוק העבודה הישראלי ממשיך להפגין חוזקה חסרת תקדים',
    slug: 'unemployment-historic-low-3-2-percent',
    categorySlug: 'economy',
    tagSlugs: ['economy', 'society'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'שפל היסטורי באבטלה', level: 2 },
      { type: 'paragraph', text: 'הלשכה המרכזית לסטטיסטיקה פרסמה היום נתונים לפיהם שיעור האבטלה בישראל ירד ל-3.2%, הנמוך ביותר בתולדות המדינה.' },
    ],
  },
  {
    title: 'בורסת תל אביב הגיעה לשיא חדש: מדד ת"א 35 חצה 2,500 נקודות',
    subtitle: 'המשקיעים אופטימיים לגבי הכלכלה הישראלית',
    slug: 'tel-aviv-stock-exchange-ta35-record-2500',
    categorySlug: 'economy',
    tagSlugs: ['economy', 'tel-aviv', 'technology'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'הבורסה בשיא', level: 2 },
      { type: 'paragraph', text: 'מדד ת"א 35 חצה היום לראשונה את רף 2,500 הנקודות, שיא חדש לבורסת תל אביב. המניות המובילות היו מתחומי הבנקאות, ההייטק והנדל"ן.' },
    ],
  },

  // ── Society (6) ────────────────────────────────────────────────────────
  {
    title: 'עמותה ישראלית זכתה בפרס בינלאומי על פרויקט דו-קיום',
    subtitle: 'הפרויקט מפעיל 50 מרכזים לדו-קיום יהודי-ערבי ברחבי הארץ',
    slug: 'israeli-ngo-international-coexistence-award',
    categorySlug: 'society',
    tagSlugs: ['society', 'jerusalem'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'פרס בינלאומי לדו-קיום', level: 2 },
      { type: 'paragraph', text: 'עמותת "גשרים" הישראלית זכתה בפרס האו"ם לדו-קיום על הפעלת 50 מרכזים לפעילות משותפת יהודית-ערבית ברחבי הארץ.' },
    ],
  },
  {
    title: 'הממשלה השיקה תוכנית לאומית לקליטת עולים מאתיופיה',
    subtitle: 'התוכנית כוללת דיור, תעסוקה ולימודי שפה',
    slug: 'national-program-ethiopian-immigration-absorption',
    categorySlug: 'society',
    tagSlugs: ['society', 'netanyahu', 'jerusalem'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'תוכנית קליטה לעולי אתיופיה', level: 2 },
      { type: 'paragraph', text: 'הממשלה השיקה תוכנית מקיפה לקליטת עולים מאתיופיה בתקציב של 2 מיליארד שקלים, הכוללת מענקי דיור, ליווי תעסוקתי ולימודי עברית אינטנסיביים.' },
    ],
  },
  {
    title: 'מחקר חדש: הישראלים מדורגים בין 10 העמים המאושרים בעולם',
    subtitle: 'ישראל עלתה שני מקומות במדד האושר העולמי',
    slug: 'israel-top-10-happiest-nations-study',
    categorySlug: 'society',
    tagSlugs: ['society'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'ישראל בעשירייה המאושרת', level: 2 },
      { type: 'paragraph', text: 'דו"ח האושר העולמי של האו"ם מדרג את ישראל במקום ה-8 מבין 150 מדינות, עלייה של שני מקומות לעומת השנה הקודמת.' },
    ],
  },
  {
    title: 'פרויקט חדש יספק ארוחות חמות ל-20,000 קשישים בודדים',
    subtitle: 'שיתוף פעולה בין הממשלה, עיריות וארגוני התנדבות',
    slug: 'hot-meals-project-20000-elderly',
    categorySlug: 'society',
    tagSlugs: ['society', 'knesset'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'ארוחות חמות לקשישים', level: 2 },
      { type: 'paragraph', text: 'משרד הרווחה השיק פרויקט חדש שיספק ארוחות חמות יומיות ל-20,000 קשישים בודדים ברחבי הארץ, בשיתוף עיריות וארגוני התנדבות.' },
    ],
  },
  {
    title: 'עיריית חיפה פתחה מרכז חדשנות חברתית ראשון מסוגו',
    subtitle: 'המרכז ישמש כחממה ליזמים חברתיים מכל המגזרים',
    slug: 'haifa-social-innovation-center-launch',
    categorySlug: 'society',
    tagSlugs: ['society', 'haifa', 'technology'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'חדשנות חברתית בחיפה', level: 2 },
      { type: 'paragraph', text: 'עיריית חיפה חנכה מרכז חדשנות חברתית ראשון מסוגו בישראל, שישמש כחממה ליזמים חברתיים מכל המגזרים והרקעים.' },
      { type: 'paragraph', text: 'המרכז יעניק מלגות, חונכות עסקית וגישה לרשת משקיעים.' },
    ],
  },
  {
    title: 'תנועת ההתנדבות בישראל הגיעה לשיא: מיליון מתנדבים פעילים',
    subtitle: 'עלייה של 30% במספר המתנדבים בשנתיים האחרונות',
    slug: 'israel-volunteering-record-1-million',
    categorySlug: 'society',
    tagSlugs: ['society', 'education'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'שיא בהתנדבות', level: 2 },
      { type: 'paragraph', text: 'מספר המתנדבים הפעילים בישראל הגיע למיליון, עלייה של 30% בשנתיים האחרונות. התנדבות בתחום החינוך והקשישים מובילה את הצמיחה.' },
    ],
  },

  // ── Education (6) ──────────────────────────────────────────────────────
  {
    title: 'ישראל תהיה המדינה הראשונה עם חינוך AI חובה בתיכון',
    subtitle: 'תלמידים ילמדו בינה מלאכותית כמקצוע חובה מכיתה י',
    slug: 'israel-mandatory-ai-education-high-school',
    categorySlug: 'education',
    tagSlugs: ['education', 'technology', 'knesset'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'חינוך AI חובה בתיכונים', level: 2 },
      { type: 'paragraph', text: 'משרד החינוך הכריז כי החל מהשנה הבאה, כל תלמידי התיכון בישראל ילמדו בינה מלאכותית כמקצוע חובה — הראשונה בעולם ליישם תוכנית כזו.' },
      { type: 'bullet_list', items: ['יסודות למידת מכונה', 'אתיקה בבינה מלאכותית', 'פרויקט פיתוח אישי', 'שיתוף פעולה עם חברות הייטק'] },
    ],
  },
  {
    title: 'האוניברסיטה העברית דורגה בין 50 האוניברסיטאות המובילות בעולם',
    subtitle: 'הדירוג מייחס את ההישג למחקר בתחומי AI ומדעי החיים',
    slug: 'hebrew-university-top-50-world-ranking',
    categorySlug: 'education',
    tagSlugs: ['education', 'jerusalem', 'technology'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'דירוג עולמי מרשים', level: 2 },
      { type: 'paragraph', text: 'האוניברסיטה העברית בירושלים דורגה במקום ה-47 בדירוג האוניברסיטאות העולמי, בזכות הישגים מחקריים בתחומי הבינה המלאכותית ומדעי החיים.' },
    ],
  },
  {
    title: 'תוכנית חדשה תכשיר 10,000 מורים לטכנולוגיה תוך 3 שנים',
    subtitle: 'המורים ילמדו תכנות, סייבר ובינה מלאכותית',
    slug: 'train-10000-tech-teachers-3-years',
    categorySlug: 'education',
    tagSlugs: ['education', 'technology'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'הכשרת מורים לטכנולוגיה', level: 2 },
      { type: 'paragraph', text: 'משרד החינוך ורשות החדשנות השיקו תוכנית משותפת להכשרת 10,000 מורים לטכנולוגיה תוך 3 שנים, במטרה לסגור את הפער הדיגיטלי במערכת החינוך.' },
    ],
  },
  {
    title: 'תלמידים ישראלים זכו ב-5 מדליות באולימפיאדת המתמטיקה',
    subtitle: 'הישג היסטורי: 3 מדליות זהב ו-2 כסף',
    slug: 'israeli-students-5-medals-math-olympiad',
    categorySlug: 'education',
    tagSlugs: ['education', 'sports'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'הישג באולימפיאדת מתמטיקה', level: 2 },
      { type: 'paragraph', text: 'משלחת ישראל לאולימפיאדת המתמטיקה הבינלאומית שבה עם 5 מדליות: 3 זהב ו-2 כסף — ההישג הטוב ביותר בתולדות ישראל בתחרות.' },
      { type: 'quote', text: 'הילדים האלה הם העתיד של אומת הסטארט-אפ', attribution: 'שרת החינוך' },
    ],
  },
  {
    title: 'הטכניון פתח קמפוס חדש בניו יורק למחקר כמותי',
    subtitle: 'הקמפוס יתמחה במימון כמותי ובינה מלאכותית פיננסית',
    slug: 'technion-new-york-campus-quantitative-research',
    categorySlug: 'education',
    tagSlugs: ['education', 'haifa', 'economy'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'קמפוס טכניון בניו יורק', level: 2 },
      { type: 'paragraph', text: 'הטכניון חנך קמפוס חדש במנהטן שיתמחה במחקר כמותי ובינה מלאכותית פיננסית, בשיתוף פעולה עם בנקי השקעות מובילים.' },
    ],
  },
  {
    title: 'פרויקט "ספרים לכולם" יחלק מיליון ספרים לילדי הפריפריה',
    subtitle: 'הפרויקט מבוסס על תרומות מהציבור ומגורמים עסקיים',
    slug: 'books-for-all-million-books-periphery',
    categorySlug: 'education',
    tagSlugs: ['education', 'negev-galilee', 'society'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'מיליון ספרים לפריפריה', level: 2 },
      { type: 'paragraph', text: 'פרויקט "ספרים לכולם" החל בחלוקת מיליון ספרים לילדים בפריפריה, בשיתוף 200 בתי ספר ו-50 ספריות ציבוריות.' },
    ],
  },

  // ── Health (6) ─────────────────────────────────────────────────────────
  {
    title: 'חוקרים ישראלים פיתחו חיסון חדש נגד סוג נדיר של סרטן',
    subtitle: 'החיסון הראה תוצאות מבטיחות בניסויים קליניים בשלב 3',
    slug: 'israeli-researchers-rare-cancer-vaccine',
    categorySlug: 'health',
    tagSlugs: ['health', 'technology'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'פריצת דרך בחקר הסרטן', level: 2 },
      { type: 'paragraph', text: 'חוקרים ממכון ויצמן למדע פיתחו חיסון חדשני נגד סוג נדיר של סרטן הלבלב, שהראה תוצאות מבטיחות בניסויים קליניים בשלב 3.' },
      { type: 'paragraph', text: 'החיסון הצליח לצמצם את הגידול ב-70% מהמטופלים שהשתתפו בניסוי.' },
    ],
  },
  {
    title: 'ישראל תשיק מערכת בריאות דיגיטלית חדשה עד סוף השנה',
    subtitle: 'כל המידע הרפואי של המטופלים יהיה נגיש באפליקציה אחת',
    slug: 'israel-digital-health-system-launch',
    categorySlug: 'health',
    tagSlugs: ['health', 'technology', 'knesset'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'בריאות דיגיטלית', level: 2 },
      { type: 'paragraph', text: 'משרד הבריאות הכריז על השקת מערכת בריאות דיגיטלית חדשה שתאפשר לכל אזרח לגשת לכל המידע הרפואי שלו באפליקציה אחת.' },
      { type: 'bullet_list', items: ['תוצאות בדיקות מעבדה', 'צילומי רנטגן ו-MRI', 'מרשמים וחיסונים', 'תורים לרופאים', 'שיחות וידאו עם רופא'] },
    ],
  },
  {
    title: 'בית חולים ישראלי ביצע את ניתוח הלב הרובוטי הראשון בעולם',
    subtitle: 'הניתוח בוצע באמצעות רובוט כירורגי חדשני של חברה ישראלית',
    slug: 'first-robotic-heart-surgery-israel',
    categorySlug: 'health',
    tagSlugs: ['health', 'technology', 'tel-aviv'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'ניתוח לב רובוטי ראשון', level: 2 },
      { type: 'paragraph', text: 'בית החולים שיבא תל השומר ביצע את ניתוח הלב הרובוטי המלא הראשון בעולם, באמצעות רובוט כירורגי שפותח על ידי חברה ישראלית.' },
      { type: 'quote', text: 'זהו צעד ענק עבור הרפואה הישראלית והעולמית', attribution: 'מנהל בית החולים' },
    ],
  },
  {
    title: 'מחקר: שיטת טיפול ישראלית חדשה מצליחה לטפל בדיכאון עמיד',
    subtitle: 'הטיפול משלב סטימולציה מגנטית עם טיפול פסיכולוגי',
    slug: 'israeli-treatment-resistant-depression-breakthrough',
    categorySlug: 'health',
    tagSlugs: ['health', 'tel-aviv'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'טיפול חדש בדיכאון עמיד', level: 2 },
      { type: 'paragraph', text: 'חוקרים מאוניברסיטת תל אביב פיתחו שיטת טיפול חדשה לדיכאון עמיד לטיפול, המשלבת סטימולציה מגנטית טרנס-גולגולתית עם טיפול קוגניטיבי-התנהגותי.' },
    ],
  },
  {
    title: 'קופות החולים ישפרו את זמני ההמתנה לרופאים מומחים',
    subtitle: 'הרפורמה מגבילה את זמן ההמתנה ל-14 יום לכל היותר',
    slug: 'health-reform-specialist-wait-time-14-days',
    categorySlug: 'health',
    tagSlugs: ['health', 'knesset', 'society'],
    authorSlug: 'uri-shemesh',
    bodyBlocks: [
      { type: 'heading', text: 'רפורמה בזמני המתנה', level: 2 },
      { type: 'paragraph', text: 'שר הבריאות הודיע על רפורמה המגבילה את זמן ההמתנה לרופא מומחה ל-14 יום לכל היותר. קופות החולים שלא יעמדו ביעד ייקנסו.' },
    ],
  },
  {
    title: 'ישראל פיתחה בדיקת דם חדשנית לגילוי מוקדם של 12 סוגי סרטן',
    subtitle: 'בדיקה אחת יכולה לזהות סימנים מוקדמים של מחלות קשות',
    slug: 'israel-blood-test-early-detection-12-cancers',
    categorySlug: 'health',
    tagSlugs: ['health', 'technology'],
    authorSlug: 'michal-avraham',
    bodyBlocks: [
      { type: 'heading', text: 'בדיקת דם מהפכנית', level: 2 },
      { type: 'paragraph', text: 'חוקרים ישראלים פיתחו בדיקת דם חדשנית שיכולה לזהות סימנים מוקדמים של 12 סוגי סרטן שונים באמצעות ניתוח חלבוני פלזמה.' },
    ],
  },

  // ── Sports (6) ─────────────────────────────────────────────────────────
  {
    title: 'מכבי תל אביב זכתה באליפות אירופה בכדורסל',
    subtitle: 'הניצחון בגמר נגד ריאל מדריד — 87-82 בהארכה',
    slug: 'maccabi-ta-euroleague-championship-win',
    categorySlug: 'sports',
    tagSlugs: ['sports', 'tel-aviv'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'מכבי ת"א — אלופת אירופה', level: 2 },
      { type: 'paragraph', text: 'מכבי תל אביב זכתה באליפות אירופה בכדורסל (יורוליג) לאחר ניצחון דרמטי 87-82 בהארכה על ריאל מדריד בגמר שנערך בקלן.' },
      { type: 'quote', text: 'זו שעה גדולה לכדורסל הישראלי', attribution: 'מאמן מכבי' },
    ],
  },
  {
    title: 'אתלטית ישראלית שברה את שיא העולם בקפיצה לגובה',
    subtitle: 'הנה קרוטץ קפצה 2.10 מטר באליפות העולם',
    slug: 'israeli-athlete-high-jump-world-record',
    categorySlug: 'sports',
    tagSlugs: ['sports'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'שיא עולם בקפיצה לגובה', level: 2 },
      { type: 'paragraph', text: 'האתלטית הישראלית הנה קרוטץ שברה את שיא העולם בקפיצה לגובה נשים עם קפיצה של 2.10 מטר באליפות העולם בבודפשט.' },
    ],
  },
  {
    title: 'הפועל באר שבע תשתתף בליגת האלופות בפעם הראשונה',
    subtitle: 'הקבוצה עלתה לשלב הבתים לאחר ניצחון 3-1 על סלאביה פראג',
    slug: 'hapoel-beer-sheva-champions-league-debut',
    categorySlug: 'sports',
    tagSlugs: ['sports', 'negev-galilee'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'הפועל ב"ש בליגת האלופות', level: 2 },
      { type: 'paragraph', text: 'הפועל באר שבע כתבה היסטוריה כשהעפילה לשלב הבתים של ליגת האלופות בפעם הראשונה בתולדותיה, לאחר ניצחון 3-1 על סלאביה פראג.' },
    ],
  },
  {
    title: 'טניסאי ישראלי עלה לגמר טורניר גראנד סלאם בפעם הראשונה',
    subtitle: 'הישג חסר תקדים לטניס הישראלי באליפות אוסטרליה',
    slug: 'israeli-tennis-player-grand-slam-final',
    categorySlug: 'sports',
    tagSlugs: ['sports', 'diplomacy'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'ישראלי בגמר גראנד סלאם', level: 2 },
      { type: 'paragraph', text: 'הטניסאי הישראלי עלה לגמר אליפות אוסטרליה הפתוחה — ההישג הגדול ביותר בתולדות הטניס הישראלי.' },
    ],
  },
  {
    title: 'נבחרת ישראל בשחייה הציגה הישג היסטורי באולימפיאדת פריז',
    subtitle: '3 מדליות — הקציר הגדול ביותר של ישראל באולימפיאדה',
    slug: 'israel-swimming-team-3-medals-olympics',
    categorySlug: 'sports',
    tagSlugs: ['sports', 'netanyahu'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: '3 מדליות בשחייה', level: 2 },
      { type: 'paragraph', text: 'נבחרת ישראל בשחייה חזרה מהאולימפיאדה עם 3 מדליות — זהב, כסף וארד — הקציר הגדול ביותר מעולם של ישראל באולימפיאדה.' },
      { type: 'paragraph', text: 'ראש הממשלה קיבל את פני השחיינים בטקס חגיגי בנתב"ג.' },
    ],
  },
  {
    title: 'ליגת הכדורגל הישראלית הכריזה על מודל הכנסות חדש',
    subtitle: 'זכויות השידור נמכרו ב-2 מיליארד שקלים לחמש שנים',
    slug: 'israeli-football-league-new-revenue-model',
    categorySlug: 'sports',
    tagSlugs: ['sports', 'economy'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'מודל הכנסות חדש לליגה', level: 2 },
      { type: 'paragraph', text: 'התאחדות הכדורגל הכריזה על מודל הכנסות חדש, כאשר זכויות השידור של הליגה נמכרו ב-2 מיליארד שקלים לחמש שנים — עלייה של 150% לעומת ההסכם הקודם.' },
    ],
  },

  // ── Culture (6) ────────────────────────────────────────────────────────
  {
    title: 'פסטיבל הסרטים הישראלי בירושלים הציג 200 סרטים מ-40 מדינות',
    subtitle: 'הפסטיבל זכה בהכרה בינלאומית כאחד החשובים בעולם',
    slug: 'jerusalem-film-festival-200-films-40-countries',
    categorySlug: 'culture',
    tagSlugs: ['culture', 'jerusalem'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'פסטיבל סרטים בינלאומי', level: 2 },
      { type: 'paragraph', text: 'פסטיבל הסרטים הבינלאומי בירושלים הציג 200 סרטים מ-40 מדינות, בהשתתפות במאים ושחקנים מהשורה הראשונה בעולם.' },
    ],
  },
  {
    title: 'סופרת ישראלית זכתה בפרס נובל לספרות',
    subtitle: 'הפרס הוענק על "יצירה ספרותית שמאירה את המצב האנושי"',
    slug: 'israeli-author-nobel-literature-prize',
    categorySlug: 'culture',
    tagSlugs: ['culture', 'jerusalem', 'netanyahu'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'נובל לספרות — לישראל', level: 2 },
      { type: 'paragraph', text: 'הסופרת הישראלית זכתה בפרס נובל לספרות, ההוקרה הספרותית הגבוהה ביותר בעולם. ועדת הפרס ציינה את "יצירתה הייחודית המאירה את המצב האנושי".' },
      { type: 'quote', text: 'אני מקדישה את הפרס לשפה העברית', attribution: 'הסופרת בנאום הקבלה' },
    ],
  },
  {
    title: 'להקה ישראלית הופכת לראשונה שממלאת אצטדיון בלונדון',
    subtitle: '60,000 כרטיסים נמכרו תוך שעתיים בלבד',
    slug: 'israeli-band-london-stadium-sellout',
    categorySlug: 'culture',
    tagSlugs: ['culture', 'diplomacy'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'הופעה היסטורית בלונדון', level: 2 },
      { type: 'paragraph', text: 'להקה ישראלית הפכה לראשונה בתולדות המוזיקה הישראלית שממלאת אצטדיון בלונדון, כאשר 60,000 כרטיסים נמכרו תוך שעתיים.' },
    ],
  },
  {
    title: 'מוזיאון תל אביב פתח תערוכה חדשה של אמנות דיגיטלית ישראלית',
    subtitle: 'התערוכה מציגה יצירות של 30 אמנים ישראלים מובילים',
    slug: 'tel-aviv-museum-digital-art-exhibition',
    categorySlug: 'culture',
    tagSlugs: ['culture', 'tel-aviv', 'technology'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'אמנות דיגיטלית ישראלית', level: 2 },
      { type: 'paragraph', text: 'מוזיאון תל אביב לאמנות פתח תערוכה חדשה המוקדשת לאמנות דיגיטלית ישראלית, עם יצירות של 30 אמנים מובילים המשלבים טכנולוגיה ואמנות.' },
    ],
  },
  {
    title: 'שחקנית ישראלית קיבלה תפקיד ראשי בסדרת Netflix חדשה',
    subtitle: 'הסדרה צפויה להיות אחת ההפקות הגדולות של הפלטפורמה',
    slug: 'israeli-actress-netflix-lead-role',
    categorySlug: 'culture',
    tagSlugs: ['culture'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'ישראלית בסדרת Netflix', level: 2 },
      { type: 'paragraph', text: 'שחקנית ישראלית קיבלה תפקיד ראשי בסדרת הדרמה החדשה של Netflix, שתקציבה עומד על 200 מיליון דולר. הסדרה צפויה לעלות לשידור בסוף השנה.' },
    ],
  },
  {
    title: 'פסטיבל ערד מוכיח שוב: המוזיקה הישראלית חיה ובועטת',
    subtitle: '150,000 צופים השתתפו בפסטיבל הגדול ביותר מזה עשור',
    slug: 'arad-festival-150000-attendees-record',
    categorySlug: 'culture',
    tagSlugs: ['culture', 'negev-galilee'],
    authorSlug: 'ronit-ben-david',
    bodyBlocks: [
      { type: 'heading', text: 'פסטיבל ערד חוגג שיא', level: 2 },
      { type: 'paragraph', text: 'פסטיבל ערד חגג הישג חסר תקדים עם 150,000 צופים במשך 4 ימים — הפסטיבל הגדול ביותר בעשור האחרון. 80 אמנים ולהקות הופיעו על 5 במות.' },
    ],
  },
];

// ─── Main Script ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🔄 Starting article seed script...\n');

  // 1. Login
  await login();

  // 2. Create new tags
  console.log('\n📌 Creating tags...');
  const existingTags = await apiGet<Tag[]>('/tags');
  const existingTagSlugs = new Set(existingTags.map((t) => t.slug));
  let tagsCreated = 0;

  for (const tag of NEW_TAGS) {
    if (existingTagSlugs.has(tag.slug)) {
      console.log(`  ⏭ Tag "${tag.slug}" already exists`);
      continue;
    }
    try {
      await apiPost('/tags', tag);
      tagsCreated++;
      console.log(`  ✓ Created tag: ${tag.nameHe} (${tag.slug})`);
    } catch (err: unknown) {
      console.log(`  ✗ Tag ${tag.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`  Tags created: ${tagsCreated}, skipped: ${NEW_TAGS.length - tagsCreated}`);

  // 3. Create new authors
  console.log('\n✍️  Creating authors...');
  const existingAuthors = await apiGet<Author[]>('/authors');
  const existingAuthorNames = new Set(existingAuthors.map((a) => a.nameHe));
  let authorsCreated = 0;

  for (const author of NEW_AUTHORS) {
    if (existingAuthorNames.has(author.nameHe)) {
      console.log(`  ⏭ Author "${author.nameHe}" already exists`);
      continue;
    }
    try {
      // Strip slug — not accepted by CreateAuthorDto
      const { slug: _slug, ...payload } = author;
      await apiPost('/authors', payload);
      authorsCreated++;
      console.log(`  ✓ Created author: ${author.nameHe}`);
    } catch (err: unknown) {
      console.log(`  ✗ Author ${author.nameHe}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`  Authors created: ${authorsCreated}, skipped: ${NEW_AUTHORS.length - authorsCreated}`);

  // 4. Refresh reference data
  const categories = await apiGet<Category[]>('/categories');
  const tags = await apiGet<Tag[]>('/tags');
  const authors = await apiGet<(Author & { nameHe: string })[]>('/authors');

  console.log(`\n📊 Reference data: ${categories.length} categories, ${tags.length} tags, ${authors.length} authors\n`);

  const catMap = new Map(categories.map((c) => [c.slug, c.id]));
  const tagMap = new Map(tags.map((t) => [t.slug, t.id]));

  // Map author slugs to IDs using nameHe as proxy
  const authorNameMap = new Map<string, string>();
  for (const a of authors) authorNameMap.set(a.nameHe, a.id);
  // Also add slug-based lookup using NEW_AUTHORS definitions + existing "yael-cohen" style
  const authorSlugMap = new Map<string, string>();
  for (const def of NEW_AUTHORS) {
    const found = authors.find((a) => a.nameHe === def.nameHe);
    if (found) authorSlugMap.set(def.slug, found.id);
  }
  // Map existing author (from seed) with slug "yael-cohen"
  const yaelCohen = authors.find((a) => a.nameHe === 'יעל כהן');
  if (yaelCohen) authorSlugMap.set('yael-cohen', yaelCohen.id);

  // Fallback author
  const fallbackAuthorId = authors[0]?.id;

  // 5. Create articles
  console.log('📰 Creating articles...');
  let created = 0;
  let skipped = 0;

  for (const article of ARTICLES) {
    const categoryId = catMap.get(article.categorySlug);
    if (!categoryId) {
      console.log(`  ⚠ Category "${article.categorySlug}" not found — skipping ${article.slug}`);
      skipped++;
      continue;
    }

    const tagIds = article.tagSlugs
      .map((s) => tagMap.get(s))
      .filter(Boolean) as string[];

    const authorId = authorSlugMap.get(article.authorSlug) || fallbackAuthorId;

    const hoursAgo = created * 2 + 1;
    const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const payload = {
      title: article.title,
      subtitle: article.subtitle,
      slug: article.slug,
      content: article.bodyBlocks
        .filter((b) => b.type === 'paragraph')
        .map((b) => `<p>${(b as { text: string }).text}</p>`)
        .join(''),
      status: 'published',
      categoryId,
      tagIds,
      authorId,
      isHero: article.isHero || false,
      isBreaking: article.isBreaking || false,
      publishedAt,
      bodyBlocks: article.bodyBlocks.map((b, i) => ({ ...b, id: `blk-${article.slug}-${i}` })),
      alertBannerEnabled: false,
      allowComments: true,
      heroImageUrl: `https://placehold.co/800x400/0099DB/FFFFFF?text=${encodeURIComponent(article.categorySlug)}`,
      heroImageCaption: article.subtitle,
    };

    try {
      await apiPost('/articles', payload);
      created++;
      console.log(`  ✓ [${created}/${ARTICLES.length}] ${article.slug} (${article.categorySlug}) [${tagIds.length} tags]`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('slug')) {
        console.log(`  ⏭ ${article.slug} — already exists`);
        skipped++;
      } else {
        console.log(`  ✗ ${article.slug} — ${msg}`);
        skipped++;
      }
    }
  }

  console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}, Total: ${ARTICLES.length}`);

  // 6. Summary
  const catSummary: Record<string, number> = {};
  for (const a of ARTICLES) catSummary[a.categorySlug] = (catSummary[a.categorySlug] || 0) + 1;
  console.log('\nArticles per category:');
  for (const [cat, count] of Object.entries(catSummary).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  const tagUsage: Record<string, number> = {};
  for (const a of ARTICLES) for (const t of a.tagSlugs) tagUsage[t] = (tagUsage[t] || 0) + 1;
  console.log('\nTag usage:');
  for (const [tag, count] of Object.entries(tagUsage).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tag}: ${count}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
