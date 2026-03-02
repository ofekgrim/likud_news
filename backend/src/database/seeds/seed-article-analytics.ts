import { DataSource } from 'typeorm';
import { Article } from '../../modules/articles/entities/article.entity';
import { ArticleAnalytics, AnalyticsEventType } from '../../modules/article-analytics/entities/article-analytics.entity';

/**
 * Seed article analytics events for testing.
 * Creates realistic analytics data across different event types, referrers, and time periods.
 */
async function seedArticleAnalytics(dataSource: DataSource) {
  console.log('🔢 Seeding article analytics...');

  const articleRepo = dataSource.getRepository(Article);
  const analyticsRepo = dataSource.getRepository(ArticleAnalytics);

  // Get all published articles
  const articles = await articleRepo.find({
    where: { status: 'published' as any },
    take: 20,
  });

  if (articles.length === 0) {
    console.log('⚠️  No published articles found. Skipping analytics seeding.');
    return;
  }

  console.log(`📊 Creating analytics events for ${articles.length} articles...`);

  const referrers = ['home_feed', 'category', 'search', 'push', 'deeplink', 'direct'];
  const platforms = ['facebook', 'twitter', 'whatsapp', 'telegram', 'copy_link'];
  const deviceIds = [
    '1d6b6f44-048a-49f1-860b-1e930ba6042e',
    '2e7c7f55-159b-5ab2-971f-2fa491603a1f',
    '3f8d8g66-26ac-6bc3-a82g-3gb5a2714b2g',
    '4g9e9h77-37bd-7cd4-b93h-4hc6b3825c3h',
    '5ha0ai88-48ce-8de5-ca4i-5id7c4936d4i',
  ];

  const analytics: Partial<ArticleAnalytics>[] = [];
  let eventCount = 0;

  // Generate events for each article
  for (const article of articles) {
    const articleIndex = articles.indexOf(article);

    // More popular articles get more events
    const popularity = 1 - (articleIndex / articles.length) * 0.7; // 30-100% of max events
    const baseViews = Math.floor(50 + Math.random() * 150); // 50-200 base views
    const viewCount = Math.floor(baseViews * popularity);

    // 1. VIEW events (70% from different referrers)
    for (let i = 0; i < viewCount; i++) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];
      const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      analytics.push({
        articleId: article.id,
        eventType: AnalyticsEventType.VIEW,
        deviceId,
        referrer,
        createdAt,
      });
      eventCount++;
    }

    // 2. READ_COMPLETE events (30-50% of views)
    const readCompleteCount = Math.floor(viewCount * (0.3 + Math.random() * 0.2));
    for (let i = 0; i < readCompleteCount; i++) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const readTimeSeconds = Math.floor(60 + Math.random() * 240); // 1-5 minutes
      const scrollDepthPercent = Math.floor(80 + Math.random() * 20); // 80-100%
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      analytics.push({
        articleId: article.id,
        eventType: AnalyticsEventType.READ_COMPLETE,
        deviceId,
        readTimeSeconds,
        scrollDepthPercent,
        createdAt,
      });
      eventCount++;
    }

    // 3. SHARE events (5-15% of views)
    const shareCount = Math.floor(viewCount * (0.05 + Math.random() * 0.1));
    for (let i = 0; i < shareCount; i++) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      analytics.push({
        articleId: article.id,
        eventType: AnalyticsEventType.SHARE,
        deviceId,
        platform,
        createdAt,
      });
      eventCount++;
    }

    // 4. FAVORITE events (10-20% of views)
    const favoriteCount = Math.floor(viewCount * (0.1 + Math.random() * 0.1));
    for (let i = 0; i < favoriteCount; i++) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      analytics.push({
        articleId: article.id,
        eventType: AnalyticsEventType.FAVORITE,
        deviceId,
        createdAt,
      });
      eventCount++;
    }

    // 5. COMMENT events (3-8% of views)
    const commentEventCount = Math.floor(viewCount * (0.03 + Math.random() * 0.05));
    for (let i = 0; i < commentEventCount; i++) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      analytics.push({
        articleId: article.id,
        eventType: AnalyticsEventType.COMMENT,
        deviceId,
        createdAt,
      });
      eventCount++;
    }

    // 6. CLICK events (20-30% of views - from feed/search to article)
    const clickCount = Math.floor(viewCount * (0.2 + Math.random() * 0.1));
    for (let i = 0; i < clickCount; i++) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      analytics.push({
        articleId: article.id,
        eventType: AnalyticsEventType.CLICK,
        deviceId,
        referrer,
        createdAt,
      });
      eventCount++;
    }
  }

  // Batch insert all analytics events
  console.log(`💾 Inserting ${eventCount} analytics events...`);
  await analyticsRepo.save(analytics, { chunk: 500 });

  console.log(`✅ Article analytics seeded successfully!`);
  console.log(`   - ${eventCount} total events created`);
  console.log(`   - ${articles.length} articles tracked`);
  console.log(`   - Event types: VIEW, READ_COMPLETE, SHARE, FAVORITE, COMMENT, CLICK`);
}

module.exports = { seedArticleAnalytics };
