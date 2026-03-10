import { DataSource } from 'typeorm';
import { Article, ArticleStatus } from '../../modules/articles/entities/article.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Author } from '../../modules/authors/entities/author.entity';
import { Tag } from '../../modules/tags/entities/tag.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

/**
 * Seed script for articles with real uploaded images.
 *
 * This script:
 * 1. Downloads sample images from a reliable source
 * 2. Saves them to the uploads directory
 * 3. Creates articles referencing those local images
 * 4. Sets one article as the main/featured article
 */

async function downloadImage(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

export async function seedArticlesWithImages(dataSource: DataSource): Promise<void> {
  console.log('🖼️  Seeding articles with real images...');

  const articleRepository = dataSource.getRepository(Article);
  const categoryRepository = dataSource.getRepository(Category);
  const authorRepository = dataSource.getRepository(Author);
  const tagRepository = dataSource.getRepository(Tag);

  // Get categories
  const categories = await categoryRepository.find();
  if (categories.length === 0) {
    console.log('⚠️  No categories found. Please seed categories first.');
    return;
  }

  // Get authors
  const authors = await authorRepository.find();
  const defaultAuthor = authors.length > 0 ? authors[0] : null;

  // Get tags
  const tags = await tagRepository.find();

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads', 'articles');
  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }

  // Sample Likud-themed images (using Unsplash for demo - replace with real Likud images)
  const imageUrls = [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop', // Politics/Government
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop', // Israeli flag
    'https://images.unsplash.com/photo-1555880192-48ad3a8f6e5d?w=800&h=500&fit=crop', // Jerusalem
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=500&fit=crop', // Conference/Meeting
    'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=500&fit=crop', // News/Media
  ];

  // Download images
  console.log('📥 Downloading sample images...');
  const downloadedImages: string[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const fileName = `sample-${i + 1}.jpg`;
    const filePath = path.join(uploadsDir, fileName);

    try {
      if (!fs.existsSync(filePath)) {
        await downloadImage(imageUrls[i], filePath);
        console.log(`  ✓ Downloaded ${fileName}`);
      } else {
        console.log(`  ℹ Already exists: ${fileName}`);
      }
      downloadedImages.push(`/uploads/articles/${fileName}`);
    } catch (error) {
      console.error(`  ✗ Failed to download image ${i + 1}:`, error.message);
      // Use placeholder as fallback
      downloadedImages.push(`https://placehold.co/800x500/0099DB/FFFFFF?text=Article+${i + 1}`);
    }
  }

  // Sample articles with Hebrew content
  const articles = [
    {
      title: 'נתניהו: "זה הזמן לאחדות לאומית"',
      subtitle: 'ראש הממשלה קורא לכלל הציבור להתאחד למען מדינת ישראל',
      content: '<p>ראש הממשלה בנימין נתניהו קרא היום לאחדות לאומית בעת משבר. "זהו הזמן להתאחד, להניח בצד מחלוקות ולעבוד יחד למען עתיד מדינת ישראל", אמר נתניהו בנאום שנשא בכנסת.</p><p>הנאום התקבל בתשואות סוערות מצד חברי הקואליציה, ובמחיאות כפיים מרבית חברי האופוזיציה.</p>',
      slug: 'netanyahu-national-unity-call',
      heroImageUrl: downloadedImages[0],
      isMain: true, // This will be the main article
      isHero: true,
      isBreaking: true,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      readingTimeMinutes: 3,
      viewCount: 15234,
      categoryId: categories[0].id,
      authorId: defaultAuthor?.id,
    },
    {
      title: 'הליכוד מציג: תכנית חדשה לחיזוק הכלכלה',
      subtitle: 'המפלגה מפרסמת תכנית מקיפה להגדלת תעסוקה והורדת יוקר המחיה',
      content: '<p>מפלגת הליכוד הציגה היום תכנית כלכלית מקיפה שמטרתה להגדיל את התעסוקה ולהוריד את יוקר המחיה. התכנית כוללת הקלות מס למעסיקים, תמיכה בעסקים קטנים ובינוניים, ופיתוח תשתיות במרכז ובפריפריה.</p><p>"אנחנו מחויבים לשפר את רמת החיים של כל אזרחי ישראל", אמר שר האוצר בהצגת התכנית.</p>',
      slug: 'likud-economic-plan-2026',
      heroImageUrl: downloadedImages[1],
      isHero: false,
      isBreaking: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
      readingTimeMinutes: 5,
      viewCount: 8921,
      categoryId: categories[1]?.id || categories[0].id,
      authorId: defaultAuthor?.id,
    },
    {
      title: 'ירושלים: אירועי יובל למדינת ישראל',
      subtitle: 'עיר הבירה מתכוננת לחגיגות היובל עם אירועים מיוחדים',
      content: '<p>ירושלים עיר הבירה מתכוננת לאירועי חגיגה מיוחדים לרגל יובל שנות המדינה. האירועים יכללו תערוכות היסטוריות, הופעות מוזיקה ישראלית, והדלקת משואות בכל רחבי העיר.</p><p>ראש העיר הזמין את כל תושבי ישראל להצטרף לחגיגה המרכזית בכיכר ספרא.</p>',
      slug: 'jerusalem-jubilee-celebrations',
      heroImageUrl: downloadedImages[2],
      isHero: false,
      isBreaking: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
      readingTimeMinutes: 4,
      viewCount: 5643,
      categoryId: categories[2]?.id || categories[0].id,
      authorId: defaultAuthor?.id,
    },
    {
      title: 'ועידת הליכוד השנתית: היערכות לבחירות',
      subtitle: 'אלפי חברים מגיעים לועידה המרכזית של המפלגה',
      content: '<p>ועידת הליכוד השנתית נפתחה היום בתל אביב עם השתתפות אלפי חברי המפלגה מכל הארץ. הועידה תעסוק בהיערכות לבחירות הקרובות, בבחירת מועמדים לרשימה, ובגיבוש המצע הבחירות.</p><p>"אנו מתכוננים לניצחון גדול", אמר יו"ר הליכוד בנאום הפתיחה.</p>',
      slug: 'likud-annual-conference-2026',
      heroImageUrl: downloadedImages[3],
      isHero: false,
      isBreaking: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      readingTimeMinutes: 6,
      viewCount: 12456,
      categoryId: categories[0].id,
      authorId: defaultAuthor?.id,
    },
    {
      title: 'חדשות האחרונות: עדכונים מהזירה הפוליטית',
      subtitle: 'סיכום השבוע הפוליטי בישראל',
      content: '<p>סיכום השבוע הפוליטי: ממשלת ישראל הציגה תקציב חדש, הכנסת אישרה חוק חשוב, וראש הממשלה קיים פגישות דיפלומטיות עם מנהיגי העולם.</p><p>בנוסף, התקיימו מספר ישיבות ועדה חשובות בנושאי חוץ וביטחון.</p>',
      slug: 'political-news-weekly-roundup',
      heroImageUrl: downloadedImages[4],
      isHero: false,
      isBreaking: false,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      readingTimeMinutes: 7,
      viewCount: 9234,
      categoryId: categories[0].id,
      authorId: defaultAuthor?.id,
    },
  ];

  // Clear existing articles (optional - comment out if you want to keep them)
  console.log('🗑️  Clearing existing articles...');
  await articleRepository.delete({});

  // Insert articles
  console.log('📝 Creating articles with real images...');
  let mainArticleCreated = false;

  for (const articleData of articles) {
    const article = articleRepository.create({
      ...articleData,
      bodyBlocks: [
        {
          type: 'paragraph',
          text: articleData.content,
        },
      ],
      heroImageCaption: 'תמונת המחשה',
      heroImageCredit: 'צילום: ארכיון',
      allowComments: true,
    });

    // Add tags to some articles
    if (tags.length > 0 && Math.random() > 0.5) {
      article.tags = [tags[Math.floor(Math.random() * tags.length)]];
    }

    await articleRepository.save(article);

    if (article.isMain) {
      console.log(`  ⭐ Main article: ${article.title}`);
      mainArticleCreated = true;
    } else {
      console.log(`  ✓ Created: ${article.title}`);
    }
  }

  console.log(`✅ Successfully seeded ${articles.length} articles with real images`);
  if (mainArticleCreated) {
    console.log('⭐ Main article has been set');
  }
}

// Run if executed directly
if (require.main === module) {
  import('../data-source.js')
    .then(({ AppDataSource }) => AppDataSource.initialize())
    .then((dataSource) => seedArticlesWithImages(dataSource))
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
