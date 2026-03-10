import { AppDataSource } from '../data-source';
import { Article, ArticleStatus } from '../../modules/articles/entities/article.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { CommunityPoll } from '../../modules/community-polls/entities/community-poll.entity';
import { CampaignEvent } from '../../modules/campaign-events/entities/campaign-event.entity';
import { PrimaryElection } from '../../modules/elections/entities/primary-election.entity';
import { QuizQuestion } from '../../modules/quiz/entities/quiz-question.entity';
import { Author } from '../../modules/authors/entities/author.entity';

/**
 * Comprehensive seed data for testing the unified feed with rich content.
 *
 * Creates:
 * - 50 articles (with varied publish times, engagement metrics)
 * - 30 community polls (political, social, economic topics)
 * - 20 campaign events (rallies, fundraisers, meetings)
 * - 5 elections (past, live, upcoming) with quiz questions
 * - All content optimized for realistic feed testing
 */
export async function seedComprehensiveFeed(): Promise<void> {
  console.log('🌱 Seeding comprehensive feed data...\n');

  const dataSource = AppDataSource;

  const categoryRepo = dataSource.getRepository(Category);
  const articleRepo = dataSource.getRepository(Article);
  const authorRepo = dataSource.getRepository(Author);
  const pollRepo = dataSource.getRepository(CommunityPoll);
  const eventRepo = dataSource.getRepository(CampaignEvent);
  const electionRepo = dataSource.getRepository(PrimaryElection);
  const quizRepo = dataSource.getRepository(QuizQuestion);

  // ═══════════════════════════════════════════════════════════════════
  // 1. Create Test Categories & Authors
  // ═══════════════════════════════════════════════════════════════════

  const categories = [
    { name: 'פוליטיקה', nameEn: 'Politics', slug: 'politics', color: '#0099DB' },
    { name: 'ביטחון', nameEn: 'Security', slug: 'security', color: '#DC2626' },
    { name: 'כלכלה', nameEn: 'Economy', slug: 'economy', color: '#059669' },
    { name: 'חברה', nameEn: 'Society', slug: 'society', color: '#7C3AED' },
    { name: 'בינלאומי', nameEn: 'International', slug: 'international', color: '#EA580C' },
  ];

  const savedCategories: Category[] = [];
  for (const catData of categories) {
    let cat = await categoryRepo.findOne({ where: { slug: catData.slug } });
    if (!cat) {
      cat = categoryRepo.create({ ...catData, isActive: true });
      await categoryRepo.save(cat);
    }
    savedCategories.push(cat);
  }

  const authors = [
    { nameHe: 'יוסי כהן', nameEn: 'Yossi Cohen', roleHe: 'עורך מדיני', roleEn: 'Political Editor' },
    { nameHe: 'רחל לוי', nameEn: 'Rachel Levi', roleHe: 'כתבת כלכלה', roleEn: 'Economy Reporter' },
    { nameHe: 'דוד מזרחי', nameEn: 'David Mizrahi', roleHe: 'כתב ביטחון', roleEn: 'Security Correspondent' },
    { nameHe: 'שרה אברהם', nameEn: 'Sarah Avraham', roleHe: 'כתבת חברה', roleEn: 'Social Affairs Reporter' },
  ];

  const savedAuthors: Author[] = [];
  for (const authorData of authors) {
    let author = await authorRepo.findOne({ where: { nameHe: authorData.nameHe } });
    if (!author) {
      author = authorRepo.create({ ...authorData, bioHe: 'כתב ותיק', isActive: true });
      await authorRepo.save(author);
    }
    savedAuthors.push(author);
  }

  console.log(`✅ Created ${savedCategories.length} categories and ${savedAuthors.length} authors`);

  // ═══════════════════════════════════════════════════════════════════
  // 2. Create 50 Articles (realistic engagement distribution)
  // ═══════════════════════════════════════════════════════════════════

  const now = new Date();
  const articlesData = [
    // Breaking news (last 2 hours)
    { title: 'נתניהו: "זה הזמן לאחדות לאומית"', hours: 0.5, views: 5000, isBreaking: true, catIdx: 0 },
    { title: 'הפגנה המונית בכיכר רבין - אלפים מפגינים', hours: 1, views: 3500, isBreaking: true, catIdx: 3 },

    // Fresh content (2-6 hours)
    { title: 'שר האוצר מציג תוכנית כלכלית חדשה', hours: 2, views: 2800, isBreaking: false, catIdx: 2 },
    { title: 'צה"ל: סוכלה חדירה במעבר עזה', hours: 3, views: 4200, isBreaking: false, catIdx: 1 },
    { title: 'סקר חדש: הליכוד מוביל ב-32 מנדטים', hours: 4, views: 3100, isBreaking: false, catIdx: 0 },
    { title: 'ביביסטי חדש: "הצטרפתי למאבק"', hours: 5, views: 1900, isBreaking: false, catIdx: 0 },

    // Recent content (6-12 hours)
    { title: 'משרד החינוך: שינויים בתכנית הלימודים', hours: 7, views: 1500, isBreaking: false, catIdx: 3 },
    { title: 'טראמפ מברך את נתניהו ביום הולדתו', hours: 8, views: 2200, isBreaking: false, catIdx: 4 },
    { title: 'עליית מחירי הדיור: 15% בשנה האחרונה', hours: 9, views: 1800, isBreaking: false, catIdx: 2 },
    { title: 'ח"כ אמיר אוחנה: "נמשיך לחזק את היישובים"', hours: 10, views: 1200, isBreaking: false, catIdx: 0 },
    { title: 'המל"ל: שיחות עם מדינות ערב', hours: 11, views: 1600, isBreaking: false, catIdx: 4 },

    // Yesterday (12-24 hours)
    { title: 'ישיבת ממשלה דרמטית: ההחלטות', hours: 14, views: 2500, isBreaking: false, catIdx: 0 },
    { title: 'משטרת ישראל: ירידה בפשיעה', hours: 16, views: 900, isBreaking: false, catIdx: 3 },
    { title: 'בורסה: הליכוד מדד עלה ב-3%', hours: 18, views: 1100, isBreaking: false, catIdx: 2 },
    { title: 'כנס תנועת הליכוד ביהודה והשומרון', hours: 20, views: 1400, isBreaking: false, catIdx: 0 },
    { title: 'אלון לוי: "נקים עוד 10,000 יחידות דיור"', hours: 22, views: 800, isBreaking: false, catIdx: 2 },

    // 2 days ago
    { title: 'סמוטריץ\': "נמשיך להתיישב"', hours: 30, views: 1300, isBreaking: false, catIdx: 0 },
    { title: 'גלנט מבקר בבסיס צבאי בדרום', hours: 32, views: 950, isBreaking: false, catIdx: 1 },
    { title: 'משרד התחבורה: פרויקטים חדשים', hours: 36, views: 700, isBreaking: false, catIdx: 2 },
    { title: 'פגישת ראשי הליכוד עם נציגי הקהילה החרדית', hours: 38, views: 850, isBreaking: false, catIdx: 3 },

    // 3 days ago
    { title: 'ביבי באו"ם: "ישראל לא תתפשר על ביטחונה"', hours: 50, views: 3800, isBreaking: false, catIdx: 4 },
    { title: 'חוק ההתיישבות עובר בקריאה ראשונה', hours: 55, views: 1700, isBreaking: false, catIdx: 0 },
    { title: 'משרד הבריאות: תוכנית בריאות לאומית', hours: 60, views: 1100, isBreaking: false, catIdx: 3 },

    // 4 days ago
    { title: 'רגב: "נשמור על זכויות המתיישבים"', hours: 80, views: 1000, isBreaking: false, catIdx: 0 },
    { title: 'שר האנרגיה: "עצמאות אנרגטית תוך 5 שנים"', hours: 85, views: 900, isBreaking: false, catIdx: 2 },

    // 5 days ago
    { title: 'ליכוד בגליל: כנס מעוררי ציבור', hours: 100, views: 600, isBreaking: false, catIdx: 0 },
    { title: 'שר המשפטים: "הרפורמה תמשיך"', hours: 105, views: 2100, isBreaking: false, catIdx: 0 },

    // Week old content
    { title: 'דיון בכנסת על הסכם אברהם', hours: 140, views: 1500, isBreaking: false, catIdx: 4 },
    { title: 'משרד הפנים: תוכנית קליטה חדשה', hours: 150, views: 800, isBreaking: false, catIdx: 3 },
    { title: 'ערד: "נחזק את הפריפריה"', hours: 160, views: 650, isBreaking: false, catIdx: 0 },

    // Filler content for pagination testing
    ...Array.from({ length: 20 }, (_, i) => ({
      title: `כתבה ${i + 31} - ${['פוליטיקה', 'ביטחון', 'כלכלה', 'חברה'][i % 4]}`,
      hours: 170 + i * 10,
      views: Math.floor(Math.random() * 1000) + 200,
      isBreaking: false,
      catIdx: i % 4,
    })),
  ];

  let articlesCreated = 0;
  for (const [idx, data] of articlesData.entries()) {
    const publishedAt = new Date(now.getTime() - data.hours * 60 * 60 * 1000);
    const slug = `article-${Date.now()}-${idx}`;

    const existing = await articleRepo.findOne({ where: { slug } });
    if (!existing) {
      const article = articleRepo.create({
        title: data.title,
        titleEn: `Article ${idx + 1}`,
        subtitle: 'כתבה מקיפה',
        slug,
        content: `תוכן מלא של ${data.title}`,
        bodyBlocks: [
          { id: '1', type: 'paragraph', content: { text: `תוכן ${data.title}` } },
        ],
        heroImageUrl: `https://picsum.photos/800/400?random=${idx}`,
        categoryId: savedCategories[data.catIdx].id,
        authorId: savedAuthors[idx % savedAuthors.length].id,
        status: ArticleStatus.PUBLISHED,
        publishedAt,
        isBreaking: data.isBreaking,
        isHero: idx === 1,
        viewCount: data.views,
        shareCount: Math.floor(data.views * 0.08),
        readingTimeMinutes: Math.floor(Math.random() * 5) + 2,
        allowComments: true,
      });
      await articleRepo.save(article);
      articlesCreated++;
    }
  }

  console.log(`✅ Created ${articlesCreated} articles`);

  // ═══════════════════════════════════════════════════════════════════
  // 3. Create 30 Community Polls (diverse topics)
  // ═══════════════════════════════════════════════════════════════════

  const pollsData = [
    // Political polls
    { question: 'האם אתה תומך בממשלת נתניהו?', votes: 5200, isPinned: true, opts: ['כן', 'לא', 'לא בטוח'] },
    { question: 'מי צריך להיות שר הביטחון הבא?', votes: 3800, isPinned: false, opts: ['גלנט', 'סמוטריץ\'', 'בן גביר', 'אחר'] },
    { question: 'האם הליכוד צריך להרחיב את הקואליציה?', votes: 2900, isPinned: false, opts: ['כן', 'לא', 'רק עם מפלגות ימין'] },
    { question: 'באיזו מפלגה תצביע בבחירות הבאות?', votes: 6500, isPinned: true, opts: ['ליכוד', 'הבית היהודי', 'עוצמה יהודית', 'אחר'] },
    { question: 'האם אתה תומך בהרחבת ההתנחלויות?', votes: 4100, isPinned: false, opts: ['כן מאוד', 'כן', 'לא', 'לא בכלל'] },

    // Economic polls
    { question: 'האם המצב הכלכלי משתפר?', votes: 3200, isPinned: false, opts: ['כן', 'לא', 'נשאר זהה'] },
    { question: 'מה הבעיה הכלכלית הדחופה ביותר?', votes: 4500, isPinned: false, opts: ['יוקר המחיה', 'דיור', 'שכר מינימום', 'מיסים'] },
    { question: 'האם אתה תומך בהפחתת מיסים?', votes: 5800, isPinned: false, opts: ['כן', 'לא', 'תלוי במקור התקציבי'] },
    { question: 'האם תעריפי החשמל גבוהים מדי?', votes: 2700, isPinned: false, opts: ['כן', 'לא', 'סבירים'] },
    { question: 'האם אתה תומך בעצמאות אנרגטית?', votes: 4900, isPinned: false, opts: ['כן', 'לא', 'לא יודע'] },

    // Security polls
    { question: 'האם צה"ל צריך תקציב גדול יותר?', votes: 5100, isPinned: false, opts: ['כן', 'לא', 'תלוי באיומים'] },
    { question: 'מהו האיום הביטחוני הגדול ביותר?', votes: 4300, isPinned: false, opts: ['איראן', 'חמאס', 'חיזבאללה', 'טרור פנימי'] },
    { question: 'האם אתה תומך במדיניות הצבאית הנוכחית?', votes: 3600, isPinned: false, opts: ['כן', 'לא', 'חלקית'] },
    { question: 'האם יש להחזיר שירות חובה לדתיים?', votes: 6200, isPinned: false, opts: ['כן', 'לא', 'עם התאמות'] },

    // Social polls
    { question: 'האם מערכת החינוך זקוקה לרפורמה?', votes: 4700, isPinned: false, opts: ['כן', 'לא', 'שיפורים קלים'] },
    { question: 'האם אתה תומך בחינוך ערכי?', votes: 5400, isPinned: false, opts: ['כן מאוד', 'כן', 'לא', 'לא בכלל'] },
    { question: 'מה החשוב ביותר לחברה הישראלית?', votes: 3900, isPinned: false, opts: ['ביטחון', 'כלכלה', 'חינוך', 'בריאות'] },
    { question: 'האם יש להפחית ביורוקרטיה?', votes: 6800, isPinned: false, opts: ['כן', 'לא', 'במקומות מסוימים'] },
    { question: 'האם אתה מרוצה ממערכת הבריאות?', votes: 2400, isPinned: false, opts: ['כן', 'לא', 'חלקית'] },
    { question: 'האם יש להגדיל את השכר המינימום?', votes: 5300, isPinned: false, opts: ['כן', 'לא', 'בהדרגה'] },

    // International polls
    { question: 'האם יחסי ישראל-ארה"ב חזקים?', votes: 4100, isPinned: false, opts: ['כן', 'לא', 'תלוי בממשל'] },
    { question: 'האם להרחיב את הסכמי אברהם?', votes: 5700, isPinned: false, opts: ['כן', 'לא', 'בתנאים'] },
    { question: 'מהי מדינת המפתח לישראל?', votes: 3500, isPinned: false, opts: ['ארה"ב', 'סעודיה', 'הודו', 'אחר'] },

    // Party-specific polls
    { question: 'האם ביבי צריך להמשיך כיו"ר הליכוד?', votes: 7200, isPinned: true, opts: ['כן', 'לא', 'זמן לעבור דור'] },
    { question: 'מי צריך להיות יו"ר הליכוד הבא?', votes: 4800, isPinned: false, opts: ['סער', 'כ"ץ', 'רגב', 'אחר'] },
    { question: 'האם הליכוד מייצג את ערכיך?', votes: 6100, isPinned: false, opts: ['כן מאוד', 'כן', 'חלקית', 'לא'] },
    { question: 'האם אתה חבר בליכוד?', votes: 2900, isPinned: false, opts: ['כן', 'לא אבל תומך', 'לא'] },
    { question: 'האם תצביע לליכוד בבחירות הבאות?', votes: 5600, isPinned: false, opts: ['בטוח', 'כנראה', 'לא בטוח', 'לא'] },
    { question: 'האם תשתתף בפריימריז הבאים?', votes: 3300, isPinned: false, opts: ['כן', 'לא', 'אולי'] },
    { question: 'איזה נושא הכי חשוב לך?', votes: 4400, isPinned: false, opts: ['ביטחון', 'כלכלה', 'חינוך', 'משפט'] },
  ];

  let pollsCreated = 0;
  for (const data of pollsData) {
    const existing = await pollRepo.findOne({ where: { question: data.question } });
    if (!existing) {
      const totalVotes = data.votes;
      const optCount = data.opts.length;
      const baseVotes = Math.floor(totalVotes / optCount);

      const options = data.opts.map((label, i) => ({
        label,
        voteCount: baseVotes + Math.floor(Math.random() * (totalVotes * 0.2)),
      }));

      const poll = pollRepo.create({
        question: data.question,
        description: 'סקר דעת קהל',
        options,
        totalVotes,
        isPinned: data.isPinned,
        isActive: true,
        closedAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      await pollRepo.save(poll);
      pollsCreated++;
    }
  }

  console.log(`✅ Created ${pollsCreated} polls`);

  // ═══════════════════════════════════════════════════════════════════
  // 4. Create 20 Campaign Events
  // ═══════════════════════════════════════════════════════════════════

  const eventsData = [
    // Upcoming week
    { title: 'כנס ליכוד מחוז תל אביב', days: 2, rsvps: 850, city: 'תל אביב', type: 'conference' },
    { title: 'מפגש עם בנימין נתניהו', days: 3, rsvps: 1200, city: 'ירושלים', type: 'meet' },
    { title: 'סיור בהתנחלויות עם סמוטריץ\'', days: 5, rsvps: 320, city: 'אריאל', type: 'tour' },
    { title: 'ערב גיוס תרומות - חיפה', days: 7, rsvps: 450, city: 'חיפה', type: 'fundraiser' },

    // Next 2 weeks
    { title: 'הרצאה של גלעד ארדן על ביטחון', days: 10, rsvps: 580, city: 'באר שבע', type: 'lecture' },
    { title: 'כנס נוער ליכוד', days: 12, rsvps: 920, city: 'תל אביב', type: 'youth' },
    { title: 'פגישת פעילים - מחוז מרכז', days: 14, rsvps: 640, city: 'פתח תקווה', type: 'activists' },

    // Next month
    { title: 'כנס הליכוד השנתי 2026', days: 21, rsvps: 3500, city: 'תל אביב', type: 'conference' },
    { title: 'מפגש עם שרי הממשלה', days: 25, rsvps: 780, city: 'ירושלים', type: 'meet' },
    { title: 'ערב הוקרה למתנדבים', days: 28, rsvps: 420, city: 'נתניה', type: 'appreciation' },
    { title: 'סדנת הסברה ותקשורת', days: 30, rsvps: 290, city: 'רחובות', type: 'workshop' },

    // Further out
    { title: 'כנס ליכוד אילת 2026', days: 45, rsvps: 1500, city: 'אילת', type: 'conference' },
    { title: 'מצעד יום ירושלים עם הליכוד', days: 50, rsvps: 2800, city: 'ירושלים', type: 'parade' },
    { title: 'פגישה עם קהילות יהודיות מחו"ל', days: 60, rsvps: 650, city: 'תל אביב', type: 'meet' },
    { title: 'סיור במרכז חדשנות טכנולוגית', days: 65, rsvps: 380, city: 'הרצליה', type: 'tour' },
    { title: 'ערב תרבות ליכודי', days: 70, rsvps: 520, city: 'תל אביב', type: 'culture' },
    { title: 'כנס נשים בליכוד', days: 75, rsvps: 890, city: 'רמת גן', type: 'conference' },
    { title: 'מפגש עם חברי כנסת ליכודיים', days: 80, rsvps: 460, city: 'ירושלים', type: 'meet' },
    { title: 'אירוע השקת מחוז דרום חדש', days: 90, rsvps: 720, city: 'באר שבע', type: 'launch' },
    { title: 'כנס התיישבות 2026', days: 100, rsvps: 950, city: 'אריאל', type: 'conference' },
  ];

  let eventsCreated = 0;
  for (const data of eventsData) {
    const existing = await eventRepo.findOne({ where: { title: data.title } });
    if (!existing) {
      const startTime = new Date(now.getTime() + data.days * 24 * 60 * 60 * 1000);
      const event = eventRepo.create({
        title: data.title,
        description: `אירוע ${data.type} חשוב של הליכוד`,
        location: `${data.city}, ישראל`,
        city: data.city,
        startTime,
        endTime: new Date(startTime.getTime() + 3 * 60 * 60 * 1000),
        rsvpCount: data.rsvps,
        isActive: true,
        imageUrl: `https://picsum.photos/600/300?random=event-${eventsCreated}`,
      });
      await eventRepo.save(event);
      eventsCreated++;
    }
  }

  console.log(`✅ Created ${eventsCreated} events`);

  // ═══════════════════════════════════════════════════════════════════
  // 5. Create 5 Elections with Quiz Questions
  // ═══════════════════════════════════════════════════════════════════

  const electionsData = [
    {
      title: 'בחירות פריימריז 2026 - מתרחש כעת!',
      subtitle: 'Live Primary Election 2026',
      description: 'בחירות פריימריז לבחירת מועמדי הליכוד לכנסת ה-26',
      hoursOffset: -2, // Started 2 hours ago
      status: 'voting',
      quizCount: 15,
    },
    {
      title: 'בחירות פריימריז לראשות מחוז מרכז',
      subtitle: 'Central District Primary',
      description: 'בחירות לבחירת יו"ר מחוז מרכז',
      daysOffset: 7,
      status: 'upcoming',
      quizCount: 8,
    },
    {
      title: 'בחירות פריימריז לראשות מחוז ירושלים',
      subtitle: 'Jerusalem District Primary',
      description: 'בחירות לבחירת יו"ר מחוז ירושלים',
      daysOffset: 14,
      status: 'upcoming',
      quizCount: 10,
    },
    {
      title: 'בחירות פריימריז 2027',
      subtitle: 'Primary Election 2027',
      description: 'בחירות פריימריז לכנסת ה-27',
      daysOffset: 365,
      status: 'upcoming',
      quizCount: 20,
    },
    {
      title: 'בחירות פריימריז 2025 - ארכיון',
      subtitle: 'Primary Election 2025 Archive',
      description: 'בחירות פריימריז קודמות',
      daysOffset: -180,
      status: 'completed',
      quizCount: 12,
    },
  ];

  const quizQuestionsPool = [
    'האם אתה תומך בריבונות ישראל על כל חלקי הארץ?',
    'האם אתה מאמין בכלכלת שוק חופשי?',
    'האם אתה תומך בחיזוק הביטחון הלאומי?',
    'מה עמדתך כלפי מדינת הרווחה?',
    'האם אתה תומך בחינוך ערכי?',
    'מה עמדתך לגבי יחסי ישראל וארה"ב?',
    'האם אתה תומך בהתיישבות?',
    'מה עמדתך כלפי המערכת המשפטית?',
    'האם אתה תומך ברפורמה המשפטית?',
    'מה עמדתך כלפי הפרטת שירותים ממשלתיים?',
    'האם אתה תומך בהפחתת מיסים?',
    'מה עמדתך כלפי הגירה לישראל?',
    'האם אתה תומך בחיזוק הזהות היהודית?',
    'מה עמדתך כלפי דת ומדינה?',
    'האם אתה תומך בשירות צבאי חובה לכולם?',
    'מה עמדתך כלפי פתרון הסכסוך הישראלי-פלסטיני?',
    'האם אתה תומך בהרחבת הסכמי אברהם?',
    'מה עמדתך כלפי הביטחון הסייברנטי הלאומי?',
    'האם אתה תומך בפיתוח הנגב והגליל?',
    'מה עמדתך כלפי האקלים והסביבה?',
  ];

  let electionsCreated = 0;
  for (const electionData of electionsData) {
    const existing = await electionRepo.findOne({ where: { title: electionData.title } });
    if (!existing) {
      let electionDate: Date;
      if ('hoursOffset' in electionData) {
        electionDate = new Date(now.getTime() + (electionData.hoursOffset as number) * 60 * 60 * 1000);
      } else {
        electionDate = new Date(now.getTime() + (electionData.daysOffset as number) * 24 * 60 * 60 * 1000);
      }

      const election = electionRepo.create({
        title: electionData.title,
        subtitle: electionData.subtitle,
        description: electionData.description,
        electionDate,
        registrationDeadline: new Date(electionDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: electionData.status as any,
        coverImageUrl: `https://picsum.photos/1200/400?random=election-${electionsCreated}`,
        isActive: true,
      });
      const savedElection = await electionRepo.save(election);

      // Add quiz questions
      const questionsForThisElection = quizQuestionsPool.slice(0, electionData.quizCount);
      for (let i = 0; i < questionsForThisElection.length; i++) {
        const question = quizRepo.create({
          electionId: savedElection.id,
          questionText: questionsForThisElection[i],
          questionTextEn: `Question ${i + 1}`,
          options: [
            { label: 'מסכים מאוד', labelEn: 'Strongly Agree', value: 5 },
            { label: 'מסכים', labelEn: 'Agree', value: 4 },
            { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
            { label: 'לא מסכים', labelEn: 'Disagree', value: 2 },
            { label: 'לא מסכים בכלל', labelEn: 'Strongly Disagree', value: 1 },
          ],
          importanceLevel: i < 5 ? 'high' : i < 10 ? 'medium' : 'low',
          sortOrder: i,
          isActive: true,
        });
        await quizRepo.save(question);
      }

      electionsCreated++;
    }
  }

  console.log(`✅ Created ${electionsCreated} elections with quiz questions`);

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════

  console.log('\n📊 Comprehensive Feed Data Summary:');
  console.log(`   - Categories: ${savedCategories.length}`);
  console.log(`   - Authors: ${savedAuthors.length}`);
  console.log(`   - Articles: ${articlesCreated}`);
  console.log(`   - Polls: ${pollsCreated}`);
  console.log(`   - Events: ${eventsCreated}`);
  console.log(`   - Elections: ${electionsCreated}`);
  console.log(`   - Total Content Items: ${articlesCreated + pollsCreated + eventsCreated + electionsCreated}`);
  console.log('\n✅ Comprehensive feed data seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedComprehensiveFeed();
      await AppDataSource.destroy();
      console.log('\n✨ Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding data:', error);
      process.exit(1);
    });
}
