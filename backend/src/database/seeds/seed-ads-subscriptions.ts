import { AppDataSource } from '../data-source';

/**
 * Seed script for candidate ad placements, company advertisers/ads, and member subscriptions.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-ads-subscriptions.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-ads-subscriptions.ts --force  # replace existing
 *
 * Candidate ad flow:
 *   feed_sponsored + linkedContentType='article' + linkedContentId=<uuid>
 *     → Flutter fetches article data → renders "ממומן" card in feed
 *     → User taps → navigate to article_detail → POST /ads/click → candidate pays
 *   profile_featured → candidate pinned at top of candidates list
 *   push_notification → Firebase push to target districts
 *   quiz_end → card shown after daily quiz
 *
 *   Budget gate: dailySpend = (impressions × cpmNis) / 1000
 *   Ad stops serving when dailySpend ≥ dailyBudgetNis
 */

type AdStatus = 'approved' | 'pending' | 'rejected' | 'paused' | 'ended';

interface AdConfig {
  candidateIndex: number;
  placementType: 'profile_featured' | 'feed_sponsored' | 'push_notification' | 'quiz_end';
  title: string;
  contentHe: string;
  dailyBudget: number;
  cpm: number;
  impressions: number;
  clicks: number;
  // Status
  status: AdStatus;
  isApproved: boolean;
  isActive: boolean;
  // Date range
  daysOffset: number;
  durationDays: number;
  // Optional status-specific
  rejectionReason?: string;
  approvedDaysAgo?: number;
  rejectedDaysAgo?: number;
  pausedDaysAgo?: number;
  endedDaysAgo?: number;
  // Content linking (feed_sponsored → article)
  linkedContentType?: 'article' | 'candidate' | 'poll' | 'event' | 'external';
  linkedContentIndex?: number; // index into fetched articles array
  ctaUrl?: string;
  // Targeting
  districts: string[];
  membersOnly: boolean;
}

const adConfigs: AdConfig[] = [
  // ── APPROVED — no content link ─────────────────────────────────────────
  {
    candidateIndex: 0,
    placementType: 'profile_featured',
    title: 'פרופיל מודגש — מועמד ניסיון בביטחון לאומי',
    contentHe: 'הצביעו לדוד כהן! עשרים שנות ניסיון בביטחון לאומי, שירות בממשלה ומומחיות בביטחון הגבולות. הבחירה הנכונה לפריימריז 2026.',
    dailyBudget: 600, cpm: 28, impressions: 14500, clicks: 820,
    status: 'approved', isApproved: true, isActive: true,
    daysOffset: -12, durationDays: 30, approvedDaysAgo: 11,
    districts: ['תל אביב', 'גוש דן', 'ירושלים'], membersOnly: false,
  },
  {
    candidateIndex: 2,
    placementType: 'quiz_end',
    title: 'מודעת סיום חידון — הצביעו בפריימריז',
    contentHe: 'כל הכבוד! סיימת את החידון. עכשיו הזמן לפעול — הצביעו לאמיר שמיר בפריימריז הליכוד 2026. קולך קובע!',
    dailyBudget: 120, cpm: 18, impressions: 4800, clicks: 310,
    status: 'approved', isApproved: true, isActive: true,
    daysOffset: -6, durationDays: 20, approvedDaysAgo: 5,
    districts: ['ירושלים', 'גוש דן'], membersOnly: true,
  },
  {
    candidateIndex: 1,
    placementType: 'profile_featured',
    title: 'פרופיל מודגש — מובילת הסקרים בצפון',
    contentHe: 'הצביעו לרינה לוי! מובילת הסקרים בגליל ובשרון. ניסיון כשר"פ, מחויבות לפריפריה ועוצמה לאומית. הבחירה של הצפון.',
    dailyBudget: 800, cpm: 35, impressions: 62000, clicks: 5800,
    status: 'approved', isApproved: true, isActive: true,
    daysOffset: -20, durationDays: 45, approvedDaysAgo: 19,
    districts: ['צפון', 'חיפה'], membersOnly: false,
  },
  {
    candidateIndex: 3,
    placementType: 'feed_sponsored',
    title: 'תוכן ממומן — מנהיג הדרום',
    contentHe: 'הצביעו ליוסי ברק! יוצא הנגב, לוחם צוק איתן, ומי שיחזיר את הדרום למרכז הלאומי. ביחד נבנה עתיד בטוח לדרום ישראל.',
    dailyBudget: 550, cpm: 27, impressions: 41000, clicks: 3200,
    status: 'approved', isApproved: true, isActive: true,
    daysOffset: -16, durationDays: 35, approvedDaysAgo: 15,
    districts: ['דרום', 'גוש דן'], membersOnly: false,
  },

  // ── APPROVED — feed_sponsored with article content link ────────────────
  // These ads promote a specific article: candidate pays per click → article_detail opens
  {
    candidateIndex: 1,
    placementType: 'feed_sponsored',
    title: 'תוכן ממומן — תוכנית כלכלית לצמיחה',
    contentHe: 'הצביעו לרינה לוי! תוכנית כלכלית מקיפה: הפחתת יוקר המחיה, 60,000 משרות חדשות ופיתוח הפריפריה. קראו את המאמר המלא.',
    dailyBudget: 400, cpm: 22, impressions: 9200, clicks: 480,
    status: 'approved', isApproved: true, isActive: true,
    daysOffset: -8, durationDays: 25, approvedDaysAgo: 7,
    linkedContentType: 'article', linkedContentIndex: 0,
    districts: ['חיפה', 'צפון', 'דרום'], membersOnly: false,
  },
  {
    candidateIndex: 0,
    placementType: 'feed_sponsored',
    title: 'תוכן ממומן — מאמר ביטחון לאומי',
    contentHe: 'דוד כהן כותב על אתגרי הביטחון הלאומי לאחר ה-7 באוקטובר. קראו את ניתוחו המעמיק בנושא הגבול הצפוני.',
    dailyBudget: 480, cpm: 25, impressions: 18700, clicks: 1340,
    status: 'approved', isApproved: true, isActive: true,
    daysOffset: -10, durationDays: 30, approvedDaysAgo: 9,
    linkedContentType: 'article', linkedContentIndex: 1,
    districts: ['תל אביב', 'גוש דן', 'ירושלים'], membersOnly: false,
  },
  {
    candidateIndex: 4,
    placementType: 'feed_sponsored',
    title: 'תוכן ממומן — תוכנית חברתית',
    contentHe: 'שרה מזרחי — תוכנית חברתית מהפכנית. קראו את המאמר המלא על דיור בר-השגה לצעירים וחינוך ציבורי איכותי.',
    dailyBudget: 300, cpm: 19, impressions: 7200, clicks: 390,
    status: 'approved', isApproved: true, isActive: true,
    daysOffset: -5, durationDays: 20, approvedDaysAgo: 4,
    linkedContentType: 'article', linkedContentIndex: 2,
    districts: ['חיפה', 'דרום', 'צפון'], membersOnly: false,
  },

  // ── PENDING ─────────────────────────────────────────────────────────────
  {
    candidateIndex: 3,
    placementType: 'feed_sponsored',
    title: 'תוכן ממומן — חזון ביטחוני מקיף',
    contentHe: 'הצביעו ליוסי ברק! חזון ביטחוני מקיף להגנה על גבולות ישראל. ניסיון צבאי ומודיעיני של שלושים שנה.',
    dailyBudget: 300, cpm: 21, impressions: 0, clicks: 0,
    status: 'pending', isApproved: false, isActive: true,
    daysOffset: 1, durationDays: 15,
    linkedContentType: 'article', linkedContentIndex: 0,
    districts: ['ארצי'], membersOnly: false,
  },
  {
    candidateIndex: 4,
    placementType: 'push_notification',
    title: 'התראה — מפגש עם המועמד מחר',
    contentHe: 'אל תפספסו! מפגש עם שרה מזרחי מחר בשעה 19:00 בתל אביב. הצטרפו לשידור החי באפליקציה.',
    dailyBudget: 90, cpm: 32, impressions: 0, clicks: 0,
    status: 'pending', isApproved: false, isActive: true,
    daysOffset: 2, durationDays: 5,
    districts: ['תל אביב', 'גוש דן'], membersOnly: false,
  },
  {
    candidateIndex: 0,
    placementType: 'quiz_end',
    title: 'מודעת סיום חידון — הצטרפו לקמפיין',
    contentHe: 'רוצים להשפיע? הצטרפו לקמפיין של דוד כהן — מתנדבים, תרומות ופעילות שטח. יחד ננצח בפריימריז 2026!',
    dailyBudget: 70, cpm: 15, impressions: 0, clicks: 0,
    status: 'pending', isApproved: false, isActive: true,
    daysOffset: 0, durationDays: 30,
    districts: ['ירושלים', 'חיפה', 'צפון'], membersOnly: true,
  },

  // ── REJECTED ────────────────────────────────────────────────────────────
  {
    candidateIndex: 2,
    placementType: 'push_notification',
    title: 'התראה — סקר חדש מראה עלייה',
    contentHe: 'סקר חדש: אמיר שמיר עולה לראשונה למקום הראשון! ראו את הנתונים המלאים באפליקציה.',
    dailyBudget: 80, cpm: 30, impressions: 0, clicks: 0,
    status: 'rejected', isApproved: false, isActive: false,
    daysOffset: -20, durationDays: 7,
    rejectionReason: 'תוכן המודעה מכיל נתוני סקר שלא אומתו. יש לספק מקור מאומת לנתוני הסקר לפני אישור.',
    rejectedDaysAgo: 18,
    districts: ['ארצי'], membersOnly: false,
  },
  {
    candidateIndex: 3,
    placementType: 'profile_featured',
    title: 'פרופיל מודגש — המועמד החזק ביותר',
    contentHe: 'יוסי ברק — המועמד החזק ביותר בסקרים, הכי מנוסה, הכי ראוי. הצביעו לאיש הנכון.',
    dailyBudget: 450, cpm: 26, impressions: 0, clicks: 0,
    status: 'rejected', isApproved: false, isActive: false,
    daysOffset: -15, durationDays: 20,
    rejectionReason: 'שימוש בניסוח עליונות ללא ביסוס עובדתי ("הכי מנוסה", "הכי ראוי"). יש לשנות את הנוסח לתיאור עובדתי.',
    rejectedDaysAgo: 13,
    districts: ['תל אביב', 'ירושלים'], membersOnly: false,
  },

  // ── PAUSED ──────────────────────────────────────────────────────────────
  {
    candidateIndex: 1,
    placementType: 'push_notification',
    title: 'התראה — אירוע ישיבת מרכז',
    contentHe: 'ישיבת מרכז הליכוד הערב — רינה לוי נואמת ב-20:30. בואו לשמוע את החזון לעתיד המפלגה וישראל.',
    dailyBudget: 110, cpm: 31, impressions: 3200, clicks: 290,
    status: 'paused', isApproved: true, isActive: false,
    daysOffset: -14, durationDays: 21, approvedDaysAgo: 13, pausedDaysAgo: 3,
    districts: ['גוש דן', 'תל אביב'], membersOnly: false,
  },
  {
    candidateIndex: 4,
    placementType: 'feed_sponsored',
    title: 'תוכן ממומן — קמפיין מושהה',
    contentHe: 'שרה מזרחי — מחויבות לשינוי חברתי. הקמפיין הושהה זמנית, יחזור בקרוב.',
    dailyBudget: 220, cpm: 19, impressions: 5600, clicks: 230,
    status: 'paused', isApproved: true, isActive: false,
    daysOffset: -18, durationDays: 28, approvedDaysAgo: 17, pausedDaysAgo: 5,
    linkedContentType: 'article', linkedContentIndex: 1,
    districts: ['חיפה', 'דרום', 'צפון'], membersOnly: false,
  },

  // ── ENDED ───────────────────────────────────────────────────────────────
  {
    candidateIndex: 0,
    placementType: 'feed_sponsored',
    title: 'תוכן ממומן — פתיחת הקמפיין',
    contentHe: 'דוד כהן מכריז על מועמדותו לפריימריז הליכוד 2026! הצטרפו לתנועה — כי ישראל ראויה למנהיגות אמיתית.',
    dailyBudget: 280, cpm: 20, impressions: 18000, clicks: 1100,
    status: 'ended', isApproved: false, isActive: false,
    daysOffset: -45, durationDays: 14, approvedDaysAgo: 44, endedDaysAgo: 31,
    districts: ['ארצי'], membersOnly: false,
  },
  {
    candidateIndex: 2,
    placementType: 'profile_featured',
    title: 'פרופיל מודגש — חזון לירושלים',
    contentHe: 'אמיר שמיר — המועמד מירושלים עם חזון לפיתוח הבירה. תחבורה, דיור וחינוך — ירושלים תהיה מופת לכל ישראל.',
    dailyBudget: 320, cpm: 24, impressions: 11500, clicks: 640,
    status: 'ended', isApproved: false, isActive: false,
    daysOffset: -40, durationDays: 10, approvedDaysAgo: 39, endedDaysAgo: 30,
    districts: ['ירושלים'], membersOnly: false,
  },
];

// ── Company advertisers ─────────────────────────────────────────────────────
interface AdvertiserConfig {
  name: string;
  logoUrl: string;
  website: string;
  contactEmail: string;
  isActive: boolean;
}

const advertiserConfigs: AdvertiserConfig[] = [
  {
    name: 'בנק הפועלים דמו',
    logoUrl: 'https://placehold.co/40x40/003399/ffffff?text=BH',
    website: 'https://hapoalim-demo.co.il',
    contactEmail: 'ads@hapoalim-demo.co.il',
    isActive: true,
  },
  {
    name: 'כלל ביטוח דמו',
    logoUrl: 'https://placehold.co/40x40/CC0000/ffffff?text=KL',
    website: 'https://clal-demo.co.il',
    contactEmail: 'marketing@clal-demo.co.il',
    isActive: true,
  },
  {
    name: 'שוק פרש דמו',
    logoUrl: 'https://placehold.co/40x40/2E8B57/ffffff?text=SP',
    website: 'https://shuk-fresh-demo.co.il',
    contactEmail: 'digital@shuk-fresh-demo.co.il',
    isActive: true,
  },
  {
    name: 'טק ישראל דמו',
    logoUrl: 'https://placehold.co/40x40/FF6600/ffffff?text=TI',
    website: 'https://techisrael-demo.co.il',
    contactEmail: 'ads@techisrael-demo.co.il',
    isActive: false, // inactive advertiser — tests filtering
  },
];

// ── Company ads ─────────────────────────────────────────────────────────────
interface CompanyAdConfig {
  advertiserIndex: number;
  adType: 'feed_native' | 'article_banner' | 'article_pre_roll';
  title: string;
  contentHe: string;
  imageUrl: string | null;
  ctaUrl: string;
  ctaLabelHe: string;
  dailyBudget: number;
  cpm: number;
  impressions: number;
  clicks: number;
  status: AdStatus;
  isApproved: boolean;
  isActive: boolean;
  startDaysOffset: number;
  durationDays: number;
  approvedDaysAgo?: number;
  rejectedDaysAgo?: number;
  pausedDaysAgo?: number;
  endedDaysAgo?: number;
  rejectionReason?: string;
}

const companyAdConfigs: CompanyAdConfig[] = [
  // ── APPROVED ──────────────────────────────────────────────────────────
  {
    advertiserIndex: 0, // בנק הפועלים
    adType: 'feed_native',
    title: 'בנק הפועלים — פתחו חשבון עסקי עכשיו',
    contentHe: 'פתחו חשבון עסקי בבנק הפועלים ותקבלו 3 חודשים ללא עמלות. מיועד לעסקים קטנים ובינוניים.',
    imageUrl: 'https://placehold.co/400x200/003399/ffffff?text=בנק+הפועלים',
    ctaUrl: 'https://hapoalim-demo.co.il/business',
    ctaLabelHe: 'פתחו חשבון',
    dailyBudget: 500, cpm: 20, impressions: 28400, clicks: 1720,
    status: 'approved', isApproved: true, isActive: true,
    startDaysOffset: -15, durationDays: 90, approvedDaysAgo: 14,
  },
  {
    advertiserIndex: 1, // כלל ביטוח
    adType: 'article_banner',
    title: 'כלל ביטוח — ביטוח רכב מקיף במחיר מיוחד',
    contentHe: 'ביטוח רכב מקיף לחברי הליכוד במחיר מיוחד. קבלו הצעת מחיר עכשיו.',
    imageUrl: 'https://placehold.co/728x90/CC0000/ffffff?text=כלל+ביטוח',
    ctaUrl: 'https://clal-demo.co.il/car',
    ctaLabelHe: 'לקבלת הצעה',
    dailyBudget: 300, cpm: 15, impressions: 15600, clicks: 890,
    status: 'approved', isApproved: true, isActive: true,
    startDaysOffset: -10, durationDays: 60, approvedDaysAgo: 9,
  },
  {
    advertiserIndex: 2, // שוק פרש
    adType: 'article_pre_roll',
    title: 'שוק פרש — משלוח פירות וירקות עד הבית',
    contentHe: 'ירקות ופירות טריים מהשוק ישירות אליכם. משלוח חינם להזמנה ראשונה.',
    imageUrl: 'https://placehold.co/400x300/2E8B57/ffffff?text=שוק+פרש',
    ctaUrl: 'https://shuk-fresh-demo.co.il/order',
    ctaLabelHe: 'להזמנה ראשונה',
    dailyBudget: 200, cpm: 12, impressions: 9800, clicks: 620,
    status: 'approved', isApproved: true, isActive: true,
    startDaysOffset: -7, durationDays: 45, approvedDaysAgo: 6,
  },
  {
    advertiserIndex: 0, // בנק הפועלים — second ad
    adType: 'article_pre_roll',
    title: 'בנק הפועלים — משכנתא בריבית נמוכה',
    contentHe: 'בנק הפועלים מציע משכנתא בריבית המיוחדת ביותר לרוכשי דירה ראשונה. ייעוץ חינם.',
    imageUrl: 'https://placehold.co/400x300/003399/ffffff?text=משכנתא',
    ctaUrl: 'https://hapoalim-demo.co.il/mortgage',
    ctaLabelHe: 'לייעוץ חינם',
    dailyBudget: 400, cpm: 18, impressions: 11200, clicks: 540,
    status: 'approved', isApproved: true, isActive: true,
    startDaysOffset: -20, durationDays: 60, approvedDaysAgo: 19,
  },

  // ── PENDING ────────────────────────────────────────────────────────────
  {
    advertiserIndex: 1, // כלל ביטוח
    adType: 'feed_native',
    title: 'כלל ביטוח — ביטוח דירה מקיף',
    contentHe: 'הגנו על הבית שלכם. כלל ביטוח מציע ביטוח דירה מקיף כולל תכולה וצד שלישי.',
    imageUrl: 'https://placehold.co/400x200/CC0000/ffffff?text=ביטוח+דירה',
    ctaUrl: 'https://clal-demo.co.il/home',
    ctaLabelHe: 'לפרטים נוספים',
    dailyBudget: 250, cpm: 14, impressions: 0, clicks: 0,
    status: 'pending', isApproved: false, isActive: true,
    startDaysOffset: 1, durationDays: 30,
  },
  {
    advertiserIndex: 2, // שוק פרש
    adType: 'article_banner',
    title: 'שוק פרש — מינוי שבועי לסל ירקות',
    contentHe: 'סל ירקות שבועי טרי בדלת הבית. מינוי גמיש, ניתן לביטול בכל עת.',
    imageUrl: 'https://placehold.co/728x90/2E8B57/ffffff?text=סל+שבועי',
    ctaUrl: 'https://shuk-fresh-demo.co.il/subscribe',
    ctaLabelHe: 'להרשמה',
    dailyBudget: 180, cpm: 11, impressions: 0, clicks: 0,
    status: 'pending', isApproved: false, isActive: true,
    startDaysOffset: 0, durationDays: 60,
  },

  // ── PAUSED ─────────────────────────────────────────────────────────────
  {
    advertiserIndex: 0, // בנק הפועלים
    adType: 'feed_native',
    title: 'בנק הפועלים — קרן השקעות דמו',
    contentHe: 'השקיעו בקרן הנאמנות של הפועלים וקבלו תשואה שנתית מובטחת.',
    imageUrl: null,
    ctaUrl: 'https://hapoalim-demo.co.il/funds',
    ctaLabelHe: 'לפרטים',
    dailyBudget: 350, cpm: 17, impressions: 8900, clicks: 320,
    status: 'paused', isApproved: true, isActive: false,
    startDaysOffset: -25, durationDays: 45, approvedDaysAgo: 24, pausedDaysAgo: 4,
  },

  // ── REJECTED ───────────────────────────────────────────────────────────
  {
    advertiserIndex: 3, // טק ישראל (inactive advertiser)
    adType: 'feed_native',
    title: 'טק ישראל — אפליקציה לניהול כספים',
    contentHe: 'נהלו את הכספים שלכם בצורה חכמה עם אפליקציית טק ישראל.',
    imageUrl: 'https://placehold.co/400x200/FF6600/ffffff?text=טק+ישראל',
    ctaUrl: 'https://techisrael-demo.co.il/app',
    ctaLabelHe: 'הורידו עכשיו',
    dailyBudget: 150, cpm: 10, impressions: 0, clicks: 0,
    status: 'rejected', isApproved: false, isActive: false,
    startDaysOffset: -30, durationDays: 30,
    rejectionReason: 'המודעה עלולה להיות מטעה לגבי תשואות. יש לוודא שהתוכן עומד בדרישות רגולטוריות.',
    rejectedDaysAgo: 27,
  },

  // ── ENDED ──────────────────────────────────────────────────────────────
  {
    advertiserIndex: 1, // כלל ביטוח — old campaign
    adType: 'feed_native',
    title: 'כלל ביטוח — קמפיין חורף 2025',
    contentHe: 'קמפיין החורף של כלל ביטוח הסתיים. תודה לכל המשתתפים.',
    imageUrl: null,
    ctaUrl: 'https://clal-demo.co.il',
    ctaLabelHe: 'לאתר',
    dailyBudget: 200, cpm: 10, impressions: 52000, clicks: 2800,
    status: 'ended', isApproved: true, isActive: false,
    startDaysOffset: -60, durationDays: 30, approvedDaysAgo: 59, endedDaysAgo: 30,
  },
];

interface SubscriptionConfig {
  userIndex: number;
  tier: 'vip_monthly' | 'vip_annual';
  provider: 'apple' | 'google' | 'direct';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startedDaysAgo: number;
  expiresInDays: number;
  cancelledDaysAgo: number | null;
}

const subscriptionConfigs: SubscriptionConfig[] = [
  { userIndex: 0, tier: 'vip_monthly', provider: 'apple', status: 'active', startedDaysAgo: 15, expiresInDays: 15, cancelledDaysAgo: null },
  { userIndex: 1, tier: 'vip_annual', provider: 'google', status: 'active', startedDaysAgo: 120, expiresInDays: 245, cancelledDaysAgo: null },
  { userIndex: 2, tier: 'vip_monthly', provider: 'direct', status: 'cancelled', startedDaysAgo: 45, expiresInDays: -15, cancelledDaysAgo: 20 },
  { userIndex: 3, tier: 'vip_annual', provider: 'apple', status: 'expired', startedDaysAgo: 400, expiresInDays: -35, cancelledDaysAgo: null },
  { userIndex: 4, tier: 'vip_monthly', provider: 'google', status: 'trial', startedDaysAgo: 3, expiresInDays: 11, cancelledDaysAgo: null },
];

function tsAgo(now: Date, daysAgo: number | undefined): string | null {
  if (daysAgo === undefined) return null;
  return new Date(now.getTime() - daysAgo * 86_400_000).toISOString();
}

function dateOffset(now: Date, daysOffset: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

async function seedAdsSubscriptions() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check which optional columns exist ─────────────────────────────────
    const statusColCheck = (await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'candidate_ad_placements' AND column_name = 'status'
    `)) as { column_name: string }[];
    const hasStatusColumns = statusColCheck.length > 0;

    const linkedColCheck = (await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'candidate_ad_placements' AND column_name = 'linkedContentType'
    `)) as { column_name: string }[];
    const hasLinkedColumns = linkedColCheck.length > 0;

    if (!hasStatusColumns) {
      console.warn('WARNING: status columns not found. Run migration 1711350000000-AdStatusEnhancements first.');
    }
    if (!hasLinkedColumns) {
      console.warn('WARNING: linkedContentType columns not found. Run migration 1711360000000-AdContentLinking first.');
      console.warn('         feed_sponsored ads will be seeded WITHOUT article links.\n');
    }

    // ── Check existing candidate ads ─────────────────────────────────────
    const existingAds = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "candidate_ad_placements"`,
    )) as { count: string }[];

    const existingSubs = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "member_subscriptions"`,
    )) as { count: string }[];

    if ((parseInt(existingAds[0].count, 10) > 0 || parseInt(existingSubs[0].count, 10) > 0) && !forceReseed) {
      console.log(`Already have ${existingAds[0].count} ad placements and ${existingSubs[0].count} subscriptions. Use --force to reseed.`);
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed) {
      await queryRunner.query(`DELETE FROM "member_subscriptions"`);
      await queryRunner.query(`DELETE FROM "candidate_ad_placements"`);
      console.log('Cleared existing ad placements and subscriptions.');
    }

    // ── Fetch candidates ──────────────────────────────────────────────────
    const candidates = (await queryRunner.query(
      `SELECT "id", "fullName" FROM "candidates" ORDER BY "sortOrder" ASC LIMIT 5`,
    )) as { id: string; fullName: string }[];

    if (candidates.length < 5) {
      console.log(`Need at least 5 candidates (found ${candidates.length}). Please seed candidates first.`);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ── Fetch articles for content linking ───────────────────────────────
    const articles = (await queryRunner.query(
      `SELECT "id", "title" FROM "articles" WHERE "deletedAt" IS NULL ORDER BY "publishedAt" DESC LIMIT 5`,
    )) as { id: string; title: string }[];

    if (articles.length === 0) {
      console.warn('WARNING: No articles found. feed_sponsored ads will be seeded WITHOUT article links.');
      console.warn('         Run seed-articles first to enable content linking.\n');
    } else {
      console.log(`Found ${articles.length} articles for content linking:`);
      articles.forEach((a, i) => console.log(`  [${i}] ${a.id} — ${a.title}`));
      console.log();
    }

    // ── Create candidate ad placements ────────────────────────────────────
    console.log(`Creating ${adConfigs.length} candidate ad placements...`);
    const now = new Date();

    for (let i = 0; i < adConfigs.length; i++) {
      const ad = adConfigs[i];
      const candidate = candidates[ad.candidateIndex];
      const startDate = dateOffset(now, ad.daysOffset);
      const endDate = dateOffset(now, ad.daysOffset + ad.durationDays);

      const targetingRules = JSON.stringify({
        districts: ad.districts,
        ageRange: { min: 18, max: 99 },
        membersOnly: ad.membersOnly,
      });

      // Resolve article link
      const linkedContentType = ad.linkedContentType ?? null;
      const linkedContentId =
        hasLinkedColumns && ad.linkedContentType === 'article' && articles.length > 0
          ? articles[ad.linkedContentIndex ?? 0]?.id ?? null
          : null;
      const ctaUrl = ad.ctaUrl ?? null;

      if (hasStatusColumns && hasLinkedColumns) {
        await queryRunner.query(
          `INSERT INTO "candidate_ad_placements"
             ("id", "candidateId", "placementType", "title", "contentHe", "targetingRules",
              "dailyBudgetNis", "cpmNis", "impressions", "clicks", "startDate", "endDate",
              "isApproved", "isActive",
              "status", "rejectionReason", "approvedAt", "rejectedAt", "pausedAt", "endedAt",
              "linkedContentType", "linkedContentId", "ctaUrl")
           VALUES
             (uuid_generate_v4(), $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
          [
            candidate.id, ad.placementType, ad.title, ad.contentHe, targetingRules,
            ad.dailyBudget, ad.cpm, ad.impressions, ad.clicks,
            startDate, endDate, ad.isApproved, ad.isActive,
            ad.status, ad.rejectionReason ?? null,
            tsAgo(now, ad.approvedDaysAgo), tsAgo(now, ad.rejectedDaysAgo),
            tsAgo(now, ad.pausedDaysAgo), tsAgo(now, ad.endedDaysAgo),
            linkedContentType, linkedContentId, ctaUrl,
          ],
        );
      } else if (hasStatusColumns) {
        await queryRunner.query(
          `INSERT INTO "candidate_ad_placements"
             ("id", "candidateId", "placementType", "title", "contentHe", "targetingRules",
              "dailyBudgetNis", "cpmNis", "impressions", "clicks", "startDate", "endDate",
              "isApproved", "isActive",
              "status", "rejectionReason", "approvedAt", "rejectedAt", "pausedAt", "endedAt")
           VALUES
             (uuid_generate_v4(), $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19)`,
          [
            candidate.id, ad.placementType, ad.title, ad.contentHe, targetingRules,
            ad.dailyBudget, ad.cpm, ad.impressions, ad.clicks,
            startDate, endDate, ad.isApproved, ad.isActive,
            ad.status, ad.rejectionReason ?? null,
            tsAgo(now, ad.approvedDaysAgo), tsAgo(now, ad.rejectedDaysAgo),
            tsAgo(now, ad.pausedDaysAgo), tsAgo(now, ad.endedDaysAgo),
          ],
        );
      } else {
        await queryRunner.query(
          `INSERT INTO "candidate_ad_placements"
             ("id", "candidateId", "placementType", "title", "contentHe", "targetingRules",
              "dailyBudgetNis", "cpmNis", "impressions", "clicks", "startDate", "endDate",
              "isApproved", "isActive")
           VALUES
             (uuid_generate_v4(), $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            candidate.id, ad.placementType, ad.title, ad.contentHe, targetingRules,
            ad.dailyBudget, ad.cpm, ad.impressions, ad.clicks,
            startDate, endDate, ad.isApproved, ad.isActive,
          ],
        );
      }

      const linkedNote =
        linkedContentId ? ` → article ${linkedContentId.slice(0, 8)}...` : '';
      const statusLabel = ad.status.toUpperCase().padEnd(8);
      console.log(
        `  ${String(i + 1).padStart(2)}. [${statusLabel}] [${ad.placementType}]${linkedNote} "${ad.title}" — ${candidate.fullName}`,
      );
    }

    // ── Create subscriptions ──────────────────────────────────────────────
    const appUsers = (await queryRunner.query(
      `SELECT "id" FROM "app_users" LIMIT 5`,
    )) as { id: string }[];

    if (appUsers.length < 5) {
      console.log(`\nNeed at least 5 app users (found ${appUsers.length}). Skipping subscriptions.`);
    } else {
      console.log(`\nCreating ${subscriptionConfigs.length} subscriptions...`);
      for (let i = 0; i < subscriptionConfigs.length; i++) {
        const sub = subscriptionConfigs[i];
        const appUser = appUsers[sub.userIndex];
        const startedAt = new Date(now.getTime() - sub.startedDaysAgo * 86_400_000);
        const expiresAt = new Date(now.getTime() + sub.expiresInDays * 86_400_000);
        const cancelledAt = sub.cancelledDaysAgo
          ? new Date(now.getTime() - sub.cancelledDaysAgo * 86_400_000)
          : null;
        const externalId = `${sub.provider}_sub_seed_${String(i + 1).padStart(3, '0')}`;
        const metadata =
          sub.status === 'trial'
            ? JSON.stringify({ trialDays: 14, source: 'onboarding_offer' })
            : sub.status === 'cancelled'
              ? JSON.stringify({ cancelReason: 'user_requested', feedbackSurveyCompleted: true })
              : null;

        await queryRunner.query(
          `INSERT INTO "member_subscriptions"
             ("id", "appUserId", "tier", "provider", "externalSubscriptionId", "status",
              "startedAt", "expiresAt", "cancelledAt", "metadata")
           VALUES
             (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
          [appUser.id, sub.tier, sub.provider, externalId, sub.status, startedAt, expiresAt, cancelledAt, metadata],
        );
        console.log(`  ${i + 1}. [${sub.status.toUpperCase()}] ${sub.tier} via ${sub.provider}`);
      }
    }

    // ── Company advertisers + ads ─────────────────────────────────────────
    const companyAdsTableExists = (await queryRunner.query(`
      SELECT to_regclass('public.company_advertisers') AS exists
    `)) as { exists: string | null }[];
    const hasCompanyAdsTables = companyAdsTableExists[0]?.exists !== null;

    if (!hasCompanyAdsTables) {
      console.warn('\nWARNING: company_advertisers / company_ads tables not found. Run migration 1711370000000-CompanyAdsTables first.');
    } else {
      const existingCompany = (await queryRunner.query(
        `SELECT COUNT(*) as count FROM "company_advertisers"`,
      )) as { count: string }[];

      if (parseInt(existingCompany[0].count, 10) > 0 && !forceReseed) {
        console.log(`\nAlready have ${existingCompany[0].count} company advertisers. Skipping.`);
      } else {
        if (forceReseed) {
          await queryRunner.query(`DELETE FROM "company_ads"`);
          await queryRunner.query(`DELETE FROM "company_advertisers"`);
          console.log('\nCleared existing company ads and advertisers.');
        }

        // Insert advertisers
        console.log(`\nCreating ${advertiserConfigs.length} company advertisers...`);
        const advertiserIds: string[] = [];

        for (let i = 0; i < advertiserConfigs.length; i++) {
          const adv = advertiserConfigs[i];
          const [row] = (await queryRunner.query(
            `INSERT INTO "company_advertisers"
               ("id", "name", "logoUrl", "website", "contactEmail", "isActive")
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
             RETURNING "id"`,
            [adv.name, adv.logoUrl, adv.website, adv.contactEmail, adv.isActive],
          )) as { id: string }[];
          advertiserIds.push(row.id);
          console.log(`  ${i + 1}. ${adv.name} (${adv.isActive ? 'active' : 'inactive'}) → ${row.id.slice(0, 8)}...`);
        }

        // Insert company ads
        console.log(`\nCreating ${companyAdConfigs.length} company ads...`);

        for (let i = 0; i < companyAdConfigs.length; i++) {
          const ad = companyAdConfigs[i];
          const advertiserId = advertiserIds[ad.advertiserIndex];
          const startDate = dateOffset(now, ad.startDaysOffset);
          const endDate = dateOffset(now, ad.startDaysOffset + ad.durationDays);

          const columns = [
            '"id"', '"advertiserId"', '"adType"', '"title"', '"contentHe"', '"imageUrl"',
            '"ctaUrl"', '"ctaLabelHe"', '"dailyBudgetNis"', '"cpmNis"', '"impressions"', '"clicks"',
            '"startDate"', '"endDate"', '"isApproved"', '"isActive"', '"status"',
          ];
          const values: (string | number | boolean | null)[] = [
            advertiserId, ad.adType, ad.title, ad.contentHe, ad.imageUrl,
            ad.ctaUrl, ad.ctaLabelHe, ad.dailyBudget, ad.cpm, ad.impressions, ad.clicks,
            startDate, endDate, ad.isApproved, ad.isActive, ad.status,
          ];
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');

          if (ad.approvedDaysAgo !== undefined) {
            columns.push('"approvedAt"');
            values.push(tsAgo(now, ad.approvedDaysAgo)!);
          }
          if (ad.rejectedDaysAgo !== undefined) {
            columns.push('"rejectedAt"');
            values.push(tsAgo(now, ad.rejectedDaysAgo)!);
          }
          if (ad.rejectionReason !== undefined) {
            columns.push('"rejectionReason"');
            values.push(ad.rejectionReason);
          }
          if (ad.pausedDaysAgo !== undefined) {
            columns.push('"pausedAt"');
            values.push(tsAgo(now, ad.pausedDaysAgo)!);
          }
          if (ad.endedDaysAgo !== undefined) {
            columns.push('"endedAt"');
            values.push(tsAgo(now, ad.endedDaysAgo)!);
          }

          const finalPlaceholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          await queryRunner.query(
            `INSERT INTO "company_ads" (${columns.join(', ')}) VALUES (uuid_generate_v4(), ${finalPlaceholders})`,
            values,
          );

          const statusLabel = ad.status.toUpperCase().padEnd(8);
          const advertiserName = advertiserConfigs[ad.advertiserIndex].name;
          console.log(
            `  ${String(i + 1).padStart(2)}. [${statusLabel}] [${ad.adType}] "${ad.title}" — ${advertiserName}`,
          );
        }
      }
    }

    await queryRunner.commitTransaction();

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Seed complete! Summary:');
    console.log('');
    console.log('Candidate ads:');
    const statusCounts = adConfigs.reduce<Record<string, number>>((acc, ad) => {
      acc[ad.status] = (acc[ad.status] ?? 0) + 1;
      return acc;
    }, {});
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`  ${status.padEnd(10)}: ${count}`);
    }
    const linkedCount = adConfigs.filter(a => a.linkedContentType === 'article').length;
    console.log(`  With article link : ${linkedCount}`);
    console.log('');
    console.log(`Company advertisers: ${advertiserConfigs.length} (${advertiserConfigs.filter(a => a.isActive).length} active)`);
    console.log('Company ads:');
    const companyCounts = companyAdConfigs.reduce<Record<string, number>>((acc, ad) => {
      acc[ad.status] = (acc[ad.status] ?? 0) + 1;
      return acc;
    }, {});
    for (const [status, count] of Object.entries(companyCounts)) {
      console.log(`  ${status.padEnd(10)}: ${count}`);
    }
    console.log('');
    console.log('How feed_sponsored ads work:');
    console.log('  candidate pays → ad links to article UUID → Flutter renders "ממומן" card');
    console.log('  User taps → article_detail_page → POST /ads/click → candidate billed by CPM');
    console.log('  Budget gate: (impressions × cpmNis) / 1000 ≥ dailyBudgetNis → ad paused for day');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedAdsSubscriptions();
