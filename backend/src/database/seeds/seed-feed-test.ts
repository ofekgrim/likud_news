import { AppDataSource } from '../data-source';
import { Article, ArticleStatus } from '../../modules/articles/entities/article.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { CommunityPoll } from '../../modules/community-polls/entities/community-poll.entity';
import { CampaignEvent } from '../../modules/campaign-events/entities/campaign-event.entity';
import { PrimaryElection } from '../../modules/elections/entities/primary-election.entity';
import { QuizQuestion } from '../../modules/quiz/entities/quiz-question.entity';
import { Comment } from '../../modules/comments/entities/comment.entity';
import { Author } from '../../modules/authors/entities/author.entity';

/**
 * Seed data for testing the unified feed endpoint.
 *
 * Creates:
 * - 20 articles (with varying publish dates, view counts, comment counts)
 * - 5 community polls (with different vote counts)
 * - 5 campaign events (upcoming)
 * - 2 elections (one live, one upcoming) with quiz questions
 * - Comments on articles
 */
export async function seedFeedTest(): Promise<void> {
  console.log('🌱 Seeding feed test data...');

  const dataSource = AppDataSource;

  const categoryRepo = dataSource.getRepository(Category);
  const articleRepo = dataSource.getRepository(Article);
  const authorRepo = dataSource.getRepository(Author);
  const pollRepo = dataSource.getRepository(CommunityPoll);
  const eventRepo = dataSource.getRepository(CampaignEvent);
  const electionRepo = dataSource.getRepository(PrimaryElection);
  const quizRepo = dataSource.getRepository(QuizQuestion);
  const commentRepo = dataSource.getRepository(Comment);

  // ─────────────────────────────────────────────────────────────────
  // 1. Create Test Category & Author
  // ─────────────────────────────────────────────────────────────────

  let category = await categoryRepo.findOne({ where: { slug: 'feed-test' } });
  if (!category) {
    category = categoryRepo.create({
      name: 'בדיקת פיד',
      nameEn: 'Feed Test',
      slug: 'feed-test',
      color: '#0099DB',
      isActive: true,
    });
    await categoryRepo.save(category);
  }

  let author = await authorRepo.findOne({ where: { nameHe: 'צוות הבדיקות' } });
  if (!author) {
    author = authorRepo.create({
      nameHe: 'צוות הבדיקות',
      nameEn: 'Test Team',
      roleHe: 'כתב בדיקות',
      roleEn: 'Test Reporter',
      bioHe: 'סופר בדיקות לפיד',
      isActive: true,
    });
    await authorRepo.save(author);
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. Create 20 Articles (varied engagement)
  // ─────────────────────────────────────────────────────────────────

  const now = new Date();
  const articlesData = [
    { title: 'כתבה חמה - פורסמה לפני 10 דקות', hours: 0.16, views: 50, isBreaking: true, isHero: false },
    { title: 'כתבה ויראלית - 5000 צפיות', hours: 2, views: 5000, isBreaking: false, isHero: true },
    { title: 'כתבה טריה - פורסמה לפני שעה', hours: 1, views: 200, isBreaking: false, isHero: false },
    { title: 'כתבה פופולרית - 500 תגובות', hours: 5, views: 3000, isBreaking: false, isHero: false },
    { title: 'כתבה מצוינת - לפני 3 שעות', hours: 3, views: 800, isBreaking: false, isHero: false },
    { title: 'כתבה רגילה - לפני 6 שעות', hours: 6, views: 150, isBreaking: false, isHero: false },
    { title: 'כתבה ישנה - לפני 12 שעות', hours: 12, views: 100, isBreaking: false, isHero: false },
    { title: 'כתבה מאתמול - לפני 24 שעות', hours: 24, views: 80, isBreaking: false, isHero: false },
    { title: 'כתבה ישנה יותר - לפני 36 שעות', hours: 36, views: 50, isBreaking: false, isHero: false },
    { title: 'כתבה בינונית - לפני 8 שעות', hours: 8, views: 250, isBreaking: false, isHero: false },
    { title: 'כתבה נוספת - לפני 4 שעות', hours: 4, views: 400, isBreaking: false, isHero: false },
    { title: 'כתבה עם מעט צפיות - לפני 7 שעות', hours: 7, views: 30, isBreaking: false, isHero: false },
    { title: 'כתבה טובה - לפני 9 שעות', hours: 9, views: 600, isBreaking: false, isHero: false },
    { title: 'כתבה חדשה - לפני 2 שעות', hours: 2, views: 350, isBreaking: false, isHero: false },
    { title: 'כתבה מעניינת - לפני 5 שעות', hours: 5, views: 450, isBreaking: false, isHero: false },
    { title: 'כתבה רגילה 2 - לפני 10 שעות', hours: 10, views: 120, isBreaking: false, isHero: false },
    { title: 'כתבה רגילה 3 - לפני 11 שעות', hours: 11, views: 90, isBreaking: false, isHero: false },
    { title: 'כתבה רגילה 4 - לפני 13 שעות', hours: 13, views: 70, isBreaking: false, isHero: false },
    { title: 'כתבה רגילה 5 - לפני 15 שעות', hours: 15, views: 60, isBreaking: false, isHero: false },
    { title: 'כתבה רגילה 6 - לפני 20 שעות', hours: 20, views: 40, isBreaking: false, isHero: false },
  ];

  const articles: Article[] = [];
  for (const data of articlesData) {
    const publishedAt = new Date(now.getTime() - data.hours * 60 * 60 * 1000);

    const existing = await articleRepo.findOne({ where: { title: data.title } });
    if (!existing) {
      const article = articleRepo.create({
        title: data.title,
        titleEn: `Test Article ${articles.length + 1}`,
        subtitle: 'כתבת בדיקה לפיד',
        slug: `feed-test-article-${articles.length + 1}`,
        content: 'זוהי כתבת בדיקה לבדיקת הפיד המאוחד.',
        bodyBlocks: [
          {
            id: '1',
            type: 'paragraph',
            content: { text: 'זוהי כתבת בדיקה לבדיקת הפיד המאוחד.' },
          },
        ],
        heroImageUrl: 'https://via.placeholder.com/800x400?text=Test+Article',
        categoryId: category.id,
        authorId: author.id,
        status: ArticleStatus.PUBLISHED,
        publishedAt,
        isBreaking: data.isBreaking,
        isHero: data.isHero,
        viewCount: data.views,
        shareCount: Math.floor(data.views * 0.1),
        readingTimeMinutes: 3,
        allowComments: true,
      });
      const saved = await articleRepo.save(article);
      articles.push(saved);
    } else {
      articles.push(existing);
    }
  }

  console.log(`✅ Created ${articles.length} test articles`);

  // ─────────────────────────────────────────────────────────────────
  // 3. Create Comments on Articles
  // ─────────────────────────────────────────────────────────────────

  const articleWithComments = articles[3]; // "כתבה פופולרית - 500 תגובות"
  const existingComments = await commentRepo.count({ where: { articleId: articleWithComments.id } });

  if (existingComments === 0) {
    for (let i = 0; i < 500; i++) {
      const comment = commentRepo.create({
        articleId: articleWithComments.id,
        authorName: `קורא ${i + 1}`,
        body: `תגובה מספר ${i + 1} - זוהי תגובת בדיקה.`,
        isApproved: true,
      });
      await commentRepo.save(comment);
    }
    console.log('✅ Created 500 test comments on one article');
  }

  // Add 10-50 comments to other articles
  for (let i = 0; i < 5; i++) {
    const article = articles[i + 4];
    const count = Math.floor(Math.random() * 40) + 10;
    const existing = await commentRepo.count({ where: { articleId: article.id } });

    if (existing === 0) {
      for (let j = 0; j < count; j++) {
        const comment = commentRepo.create({
          articleId: article.id,
          authorName: `קורא ${j + 1}`,
          body: `תגובה ${j + 1}`,
          isApproved: true,
        });
        await commentRepo.save(comment);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. Create 5 Community Polls
  // ─────────────────────────────────────────────────────────────────

  const pollsData = [
    { question: 'מי צריך להיות ראש הממשלה הבא?', votes: 1500, isPinned: true },
    { question: 'האם אתה תומך ברפורמה המשפטית?', votes: 800, isPinned: false },
    { question: 'מה הנושא החשוב ביותר עבורך?', votes: 1200, isPinned: false },
    { question: 'האם אתה מרוצה מהממשלה?', votes: 600, isPinned: false },
    { question: 'באיזו מפלגה תצביע בבחירות?', votes: 2000, isPinned: false },
  ];

  for (const data of pollsData) {
    const existing = await pollRepo.findOne({ where: { question: data.question } });
    if (!existing) {
      const votesPerOption = Math.floor(data.votes / 3);
      const poll = pollRepo.create({
        question: data.question,
        description: 'סקר בדיקה',
        options: [
          { label: 'כן', voteCount: votesPerOption + Math.floor(Math.random() * 100) },
          { label: 'לא', voteCount: votesPerOption + Math.floor(Math.random() * 100) },
          { label: 'לא בטוח', voteCount: data.votes - 2 * votesPerOption },
        ],
        totalVotes: data.votes,
        isPinned: data.isPinned,
        isActive: true,
      });
      await pollRepo.save(poll);
    }
  }

  console.log('✅ Created 5 test polls');

  // ─────────────────────────────────────────────────────────────────
  // 5. Create 5 Campaign Events
  // ─────────────────────────────────────────────────────────────────

  const eventsData = [
    { title: 'כנס הליכוד השנתי', days: 7, rsvps: 500 },
    { title: 'מפגש עם חברי כנסת', days: 3, rsvps: 150 },
    { title: 'ערב גיוס תרומות', days: 14, rsvps: 200 },
    { title: 'סיור בשטח', days: 21, rsvps: 80 },
    { title: 'הרצאה פוליטית', days: 5, rsvps: 300 },
  ];

  for (const data of eventsData) {
    const existing = await eventRepo.findOne({ where: { title: data.title } });
    if (!existing) {
      const startTime = new Date(now.getTime() + data.days * 24 * 60 * 60 * 1000);
      const event = eventRepo.create({
        title: data.title,
        description: 'אירוע בדיקה לפיד',
        location: 'תל אביב, ישראל',
        city: 'תל אביב',
        startTime,
        endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
        rsvpCount: data.rsvps,
        isActive: true,
        imageUrl: 'https://via.placeholder.com/600x300?text=Event',
      });
      await eventRepo.save(event);
    }
  }

  console.log('✅ Created 5 test events');

  // ─────────────────────────────────────────────────────────────────
  // 6. Create 2 Elections with Quiz Questions
  // ─────────────────────────────────────────────────────────────────

  // Election 1: Live election (happening now)
  let liveElection = await electionRepo.findOne({ where: { title: 'בחירות פריימריז 2026 - חיות!' } });
  if (!liveElection) {
    liveElection = electionRepo.create({
      title: 'בחירות פריימריז 2026 - חיות!',
      subtitle: 'Live Primary Election',
      description: 'בחירות פריימריז לבחירת מועמדי הליכוד',
      electionDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // In 2 hours (live)
      registrationDeadline: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: 'voting' as any,
      coverImageUrl: 'https://via.placeholder.com/1200x400?text=Live+Election',
      isActive: true,
    });
    liveElection = await electionRepo.save(liveElection);

    // Add quiz questions for live election
    const liveQuestions = [
      'האם אתה תומך בריבונות ישראל על כל חלקי הארץ?',
      'האם אתה מאמין בכלכלת שוק חופשי?',
      'האם אתה תומך בחיזוק הביטחון הלאומי?',
    ];

    for (let i = 0; i < liveQuestions.length; i++) {
      const question = quizRepo.create({
        electionId: liveElection.id,
        questionText: liveQuestions[i],
        questionTextEn: `Question ${i + 1}`,
        options: [
          { label: 'מסכים מאוד', labelEn: 'Strongly Agree', value: 5 },
          { label: 'מסכים', labelEn: 'Agree', value: 4 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'לא מסכים', labelEn: 'Disagree', value: 2 },
          { label: 'לא מסכים בכלל', labelEn: 'Strongly Disagree', value: 1 },
        ],
        importanceLevel: 'high',
        sortOrder: i,
        isActive: true,
      });
      await quizRepo.save(question);
    }
  }

  // Election 2: Upcoming election
  let upcomingElection = await electionRepo.findOne({ where: { title: 'בחירות פריימריז 2027' } });
  if (!upcomingElection) {
    upcomingElection = electionRepo.create({
      title: 'בחירות פריימריז 2027',
      subtitle: 'Upcoming Primary Election',
      description: 'בחירות פריימריז הבאות של הליכוד',
      electionDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // In 1 year
      registrationDeadline: new Date(now.getTime() + 335 * 24 * 60 * 60 * 1000),
      status: 'upcoming' as any,
      coverImageUrl: 'https://via.placeholder.com/1200x400?text=Upcoming+Election',
      isActive: true,
    });
    upcomingElection = await electionRepo.save(upcomingElection);

    // Add quiz questions for upcoming election
    const upcomingQuestions = [
      'מה עמדתך כלפי מדינת הרווחה?',
      'האם אתה תומך בחינוך ערכי?',
      'מה עמדתך לגבי יחסי ישראל וארה"ב?',
      'האם אתה תומך בהתיישבות?',
      'מה עמדתך כלפי המערכת המשפטית?',
    ];

    for (let i = 0; i < upcomingQuestions.length; i++) {
      const question = quizRepo.create({
        electionId: upcomingElection.id,
        questionText: upcomingQuestions[i],
        questionTextEn: `Question ${i + 1}`,
        options: [
          { label: 'מסכים מאוד', labelEn: 'Strongly Agree', value: 5 },
          { label: 'מסכים', labelEn: 'Agree', value: 4 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'לא מסכים', labelEn: 'Disagree', value: 2 },
          { label: 'לא מסכים בכלל', labelEn: 'Strongly Disagree', value: 1 },
        ],
        importanceLevel: 'medium',
        sortOrder: i,
        isActive: true,
      });
      await quizRepo.save(question);
    }
  }

  console.log('✅ Created 2 test elections with quiz questions');

  // ─────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────

  console.log('\n📊 Feed Test Data Summary:');
  console.log(`   - Articles: ${articles.length}`);
  console.log(`   - Polls: ${pollsData.length}`);
  console.log(`   - Events: ${eventsData.length}`);
  console.log(`   - Elections: 2 (1 live, 1 upcoming)`);
  console.log(`   - Quiz Questions: 8 total`);
  console.log(`   - Comments: 500+ on articles`);
  console.log('\n✅ Feed test data seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedFeedTest();
      await AppDataSource.destroy();
      console.log('\n✨ Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding data:', error);
      process.exit(1);
    });
}
