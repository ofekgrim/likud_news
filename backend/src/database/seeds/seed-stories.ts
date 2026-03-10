import { DataSource } from 'typeorm';
import { Story } from '../../modules/stories/entities/story.entity';

/**
 * Seed stories for testing the SSE stories feature.
 * Creates active stories with various types (image, video, article).
 */
async function seedStories(dataSource: DataSource) {
  console.log('📖 Seeding stories...');

  const storyRepo = dataSource.getRepository(Story);

  // Check if stories already exist
  const existingCount = await storyRepo.count();
  if (existingCount > 0) {
    console.log(`⚠️  ${existingCount} stories already exist. Skipping.`);
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stories: Partial<Story>[] = [
    {
      title: 'נתניהו בנאום חשוב היום בכנסת',
      imageUrl: 'https://picsum.photos/1080/1920?random=1',
      thumbnailUrl: 'https://picsum.photos/400/711?random=1',
      durationSeconds: 5,
      mediaType: 'image',
      sortOrder: 1,
      isActive: true,
      expiresAt: tomorrow,
    },
    {
      title: 'סיור בליכוד - מאחורי הקלעים',
      imageUrl: 'https://picsum.photos/1080/1920?random=2',
      thumbnailUrl: 'https://picsum.photos/400/711?random=2',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      durationSeconds: 15,
      mediaType: 'video',
      sortOrder: 2,
      isActive: true,
      expiresAt: tomorrow,
    },
    {
      title: 'חברי כנסת הליכוד במפגש עם תושבים',
      imageUrl: 'https://picsum.photos/1080/1920?random=3',
      thumbnailUrl: 'https://picsum.photos/400/711?random=3',
      durationSeconds: 7,
      mediaType: 'image',
      sortOrder: 3,
      isActive: true,
      expiresAt: tomorrow,
    },
    {
      title: 'כתבה חדשה: הישגי הממשלה ברבעון האחרון',
      imageUrl: 'https://picsum.photos/1080/1920?random=4',
      thumbnailUrl: 'https://picsum.photos/400/711?random=4',
      durationSeconds: 10,
      mediaType: 'article',
      linkUrl: '/articles/government-achievements-q4',
      sortOrder: 4,
      isActive: true,
      expiresAt: tomorrow,
    },
    {
      title: 'הוועידה השנתית של הליכוד - עדכונים',
      imageUrl: 'https://picsum.photos/1080/1920?random=5',
      thumbnailUrl: 'https://picsum.photos/400/711?random=5',
      durationSeconds: 6,
      mediaType: 'image',
      sortOrder: 5,
      isActive: true,
      expiresAt: tomorrow,
    },
    {
      title: 'ראיון בלעדי עם שר האוצר',
      imageUrl: 'https://picsum.photos/1080/1920?random=6',
      thumbnailUrl: 'https://picsum.photos/400/711?random=6',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4',
      durationSeconds: 12,
      mediaType: 'video',
      sortOrder: 6,
      isActive: true,
      expiresAt: tomorrow,
    },
    {
      title: 'תמונות מהמאורע הפוליטי הגדול של השבוע',
      imageUrl: 'https://picsum.photos/1080/1920?random=7',
      thumbnailUrl: 'https://picsum.photos/400/711?random=7',
      durationSeconds: 5,
      mediaType: 'image',
      sortOrder: 7,
      isActive: true,
      expiresAt: tomorrow,
    },
    {
      title: 'מאמר: חזון הליכוד ל-2026',
      imageUrl: 'https://picsum.photos/1080/1920?random=8',
      thumbnailUrl: 'https://picsum.photos/400/711?random=8',
      durationSeconds: 8,
      mediaType: 'article',
      linkUrl: '/articles/likud-vision-2026',
      sortOrder: 8,
      isActive: true,
      expiresAt: tomorrow,
    },
  ];

  await storyRepo.save(stories);

  console.log(`✅ Stories seeded successfully!`);
  console.log(`   - ${stories.length} stories created`);
  console.log(`   - Types: image (${stories.filter(s => s.mediaType === 'image').length}), video (${stories.filter(s => s.mediaType === 'video').length}), article (${stories.filter(s => s.mediaType === 'article').length})`);
  console.log(`   - All stories expire tomorrow`);
}

module.exports = { seedStories };
