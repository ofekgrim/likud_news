import { DataSource } from 'typeorm';
import { Article, ArticleStatus } from '../../modules/articles/entities/article.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Comment } from '../../modules/comments/entities/comment.entity';
import { Tag } from '../../modules/tags/entities/tag.entity';

/**
 * Seed script to create test articles with varying comment counts.
 * Used for testing comment counter integration and engagement filters.
 *
 * Usage:
 *   npx ts-node src/database/seeds/seed-comments-test.ts
 *
 * Creates:
 *   - 10 articles with different comment counts (0, 5, 12, 25, 50, 100, etc.)
 *   - Includes approved and unapproved comments
 *   - Tests high_comments filter (10+)
 *   - Tests sorting by commentCount
 */
export async function seedCommentsTest(dataSource: DataSource) {
  const articleRepository = dataSource.getRepository(Article);
  const categoryRepository = dataSource.getRepository(Category);
  const commentRepository = dataSource.getRepository(Comment);
  const tagRepository = dataSource.getRepository(Tag);

  console.log('🌱 Starting comments test seed...');

  // Get or create test category
  let category = await categoryRepository.findOne({
    where: { slug: 'test-comments' },
  });

  if (!category) {
    category = categoryRepository.create({
      name: 'בדיקת תגובות',
      slug: 'test-comments',
      color: '#0099DB',
      iconUrl: 'https://api.iconify.design/mdi/chat.svg',
    });
    category = await categoryRepository.save(category);
    console.log('✅ Created test category');
  }

  // Get or create test tags
  let tag = await tagRepository.findOne({ where: { nameHe: 'בדיקה' } });
  if (!tag) {
    tag = tagRepository.create({
      nameHe: 'בדיקה',
      nameEn: 'Testing',
      slug: 'testing',
    });
    tag = await tagRepository.save(tag);
    console.log('✅ Created test tag');
  }

  // Test scenarios with different comment counts
  const scenarios = [
    { title: 'כתבה ללא תגובות', slug: 'article-0-comments', comments: 0, unapproved: 0 },
    { title: 'כתבה עם 3 תגובות', slug: 'article-3-comments', comments: 3, unapproved: 0 },
    { title: 'כתבה עם 8 תגובות', slug: 'article-8-comments', comments: 8, unapproved: 2 },
    { title: 'כתבה עם 12 תגובות (גבול high_comments)', slug: 'article-12-comments', comments: 12, unapproved: 0 },
    { title: 'כתבה עם 25 תגובות', slug: 'article-25-comments', comments: 25, unapproved: 5 },
    { title: 'כתבה עם 50 תגובות', slug: 'article-50-comments', comments: 50, unapproved: 10 },
    { title: 'כתבה עם 100 תגובות', slug: 'article-100-comments', comments: 100, unapproved: 0 },
    { title: 'כתבה פופולרית - 150 תגובות', slug: 'article-150-comments', comments: 150, unapproved: 20 },
    { title: 'כתבה ויראלית - 500 תגובות', slug: 'article-500-comments', comments: 500, unapproved: 50 },
    { title: 'כתבה עם תגובות לא מאושרות בלבד', slug: 'article-unapproved-only', comments: 0, unapproved: 10 },
  ];

  for (const scenario of scenarios) {
    // Check if article exists
    let article = await articleRepository.findOne({
      where: { slug: scenario.slug },
      withDeleted: true,
    });

    if (article) {
      console.log(`⏭️  Skipping ${scenario.slug} (already exists)`);
      continue;
    }

    // Create article
    article = articleRepository.create({
      title: scenario.title,
      titleEn: `Test Article - ${scenario.comments} Comments`,
      slug: scenario.slug,
      subtitle: `כתבת בדיקה עם ${scenario.comments + scenario.unapproved} תגובות (${scenario.comments} מאושרות)`,
      content: 'תוכן כתבה לבדיקת מערכת התגובות.',
      bodyBlocks: [
        {
          type: 'paragraph',
          text: `<p>כתבה זו נוצרה לצורך בדיקת מערכת התגובות.</p><p>מספר תגובות מאושרות: ${scenario.comments}</p><p>מספר תגובות ממתינות: ${scenario.unapproved}</p>`,
        },
      ],
      heroImageUrl: 'https://picsum.photos/800/600?random=' + Date.now(),
      categoryId: category.id,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      isBreaking: scenario.comments > 100,
      allowComments: true,
      readingTimeMinutes: 3,
      viewCount: Math.floor(Math.random() * 5000) + 500,
      tags: [tag],
    });

    article = await articleRepository.save(article);

    // Create approved comments
    for (let i = 1; i <= scenario.comments; i++) {
      const comment = commentRepository.create({
        articleId: article.id,
        authorName: `קורא ${i}`,
        body: `תגובה מספר ${i} על ${scenario.title}`,
        isApproved: true,
      });
      await commentRepository.save(comment);

      // Add some replies (10% of comments get a reply)
      if (Math.random() < 0.1) {
        const reply = commentRepository.create({
          articleId: article.id,
          parentId: comment.id,
          authorName: 'עורך',
          authorRole: 'editor',
          body: `תשובה לתגובה ${i}`,
          isApproved: true,
        });
        await commentRepository.save(reply);
      }
    }

    // Create unapproved comments
    for (let i = 1; i <= scenario.unapproved; i++) {
      const comment = commentRepository.create({
        articleId: article.id,
        authorName: `קורא ממתין ${i}`,
        body: `תגובה ממתינה לאישור מספר ${i}`,
        isApproved: false,
      });
      await commentRepository.save(comment);
    }

    console.log(`✅ Created ${scenario.slug}: ${scenario.comments} approved, ${scenario.unapproved} unapproved`);
  }

  console.log('✅ Comments test seed completed successfully!');
  console.log('\n📊 Test scenarios created:');
  console.log('   - Articles with 0-500 comments');
  console.log('   - Mix of approved and unapproved comments');
  console.log('   - Some comments have replies');
  console.log('\n🧪 Test the following:');
  console.log('   1. GET /api/v1/articles/article-12-comments (should have commentCount: 12)');
  console.log('   2. GET /api/v1/articles?sortBy=commentCount&sortOrder=DESC');
  console.log('   3. GET /api/v1/articles?engagementFilter=high_comments');
  console.log('   4. GET /api/v1/articles/{id}/related (should include commentCount)');
}

// Run if executed directly
if (require.main === module) {
  const { AppDataSource } = require('../data-source');

  AppDataSource.initialize()
    .then(async (dataSource: DataSource) => {
      await seedCommentsTest(dataSource);
      await dataSource.destroy();
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
