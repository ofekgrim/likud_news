/**
 * Seed: Create a published article and trigger a push notification.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-article-with-push.ts
 *
 * Requires: backend running (uses HTTP API), ngrok active for TestFlight devices.
 */
import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:9090/api/v1';

// Admin credentials (from seed data)
const ADMIN_EMAIL = 'admin@likud.org.il';
const ADMIN_PASSWORD = 'Admin123!';

interface Article {
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  categorySlug: string;
  heroImageUrl: string;
  isBreaking: boolean;
  hashtags: string[];
}

const articles: Article[] = [
  {
    slug: `breaking-coalition-vote-${Date.now()}`,
    title: 'מבזק: הקואליציה אישרה את חוק התקציב ברוב של 64',
    subtitle: 'לאחר דיון מרתוני של 18 שעות, אושר התקציב בקריאה שנייה ושלישית',
    content: `<p>הכנסת אישרה את חוק התקציב לשנת 2027 ברוב של 64 חברי כנסת מול 56 מתנגדים.</p>
<p>שר האוצר אמר כי "זהו תקציב אחראי שמבטיח צמיחה כלכלית ויציבות פיסקלית."</p>
<p>ראש הממשלה בירך על ההצבעה וציין כי "הקואליציה מוכיחה שוב שהיא יציבה ופועלת למען אזרחי ישראל."</p>`,
    categorySlug: 'politics',
    heroImageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
    isBreaking: true,
    hashtags: ['מבזק', 'תקציב', 'קואליציה', 'כנסת'],
  },
  {
    slug: `likud-youth-summit-${Date.now()}`,
    title: 'כנס הנוער של הליכוד: "הדור הבא של המנהיגות"',
    subtitle: 'מאות צעירים השתתפו בכנס השנתי עם הרצאות, סדנאות ומפגשים עם בכירי המפלגה',
    content: `<p>כנס הנוער השנתי של הליכוד התקיים בתל אביב עם השתתפות של למעלה מ-500 צעירים מכל רחבי הארץ.</p>
<p>בכנס השתתפו שרים ובכירי המפלגה שהציגו את חזון המפלגה לדור הצעיר.</p>`,
    categorySlug: 'society',
    heroImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    isBreaking: false,
    hashtags: ['נוער', 'ליכוד', 'כנס', 'מנהיגות'],
  },
  {
    slug: `economy-growth-report-${Date.now()}`,
    title: 'הלמ"ס: צמיחה של 4.2% בתוצר המקומי הגולמי ברבעון האחרון',
    subtitle: 'נתוני הצמיחה עולים על התחזיות ומציבים את ישראל בראש מדינות ה-OECD',
    content: `<p>הלשכה המרכזית לסטטיסטיקה פרסמה נתונים חדשים המראים צמיחה של 4.2% בתמ"ג ברבעון הרביעי.</p>
<p>שר האוצר: "הנתונים מוכיחים שהמדיניות הכלכלית שלנו עובדת. ישראל מובילה את מדינות ה-OECD בצמיחה."</p>`,
    categorySlug: 'economy',
    heroImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    isBreaking: false,
    hashtags: ['כלכלה', 'צמיחה', 'תמג'],
  },
];

async function getAuthToken(): Promise<string> {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    return res.data.accessToken || res.data.data?.accessToken;
  } catch (e: any) {
    console.error('❌ Login failed:', e.response?.data?.message || e.message);
    process.exit(1);
  }
}

async function getCategoryId(slug: string, token: string): Promise<string | null> {
  try {
    const res = await axios.get(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const categories = res.data.data || res.data;
    const cat = (Array.isArray(categories) ? categories : []).find(
      (c: any) => c.slug === slug,
    );
    return cat?.id || null;
  } catch {
    return null;
  }
}

async function createAndPublishArticle(
  article: Article,
  categoryId: string,
  token: string,
): Promise<void> {
  console.log(`\n📝 Creating article: "${article.title.substring(0, 50)}..."`);

  try {
    const res = await axios.post(
      `${API_BASE}/articles`,
      {
        title: article.title,
        subtitle: article.subtitle,
        slug: article.slug,
        content: article.content,
        categoryId,
        heroImageUrl: article.heroImageUrl,
        status: 'published',
        isBreaking: article.isBreaking,
        hashtags: article.hashtags,
        sendPushNotification: true,  // <-- This triggers the notification!
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const created = res.data.data || res.data;
    console.log(`   ✅ Created: ${created.slug}`);
    console.log(`   📢 Push notification ${article.isBreaking ? '(BREAKING)' : ''} triggered!`);
  } catch (e: any) {
    console.error(
      `   ❌ Failed:`,
      e.response?.data?.message || e.message,
    );
  }
}

async function main() {
  console.log('🚀 Seed: Create articles with push notifications\n');
  console.log(`   API: ${API_BASE}`);

  // 1. Login
  console.log('\n🔐 Logging in as admin...');
  const token = await getAuthToken();
  console.log('   ✅ Authenticated');

  // 2. Get category IDs
  const categoryCache: Record<string, string> = {};
  for (const article of articles) {
    if (!categoryCache[article.categorySlug]) {
      const id = await getCategoryId(article.categorySlug, token);
      if (id) {
        categoryCache[article.categorySlug] = id;
      } else {
        console.error(`   ❌ Category not found: ${article.categorySlug}`);
      }
    }
  }

  // 3. Create articles with push
  for (const article of articles) {
    const categoryId = categoryCache[article.categorySlug];
    if (!categoryId) {
      console.log(`   ⏩ Skipping "${article.title}" — no category`);
      continue;
    }
    await createAndPublishArticle(article, categoryId, token);
    // Small delay between articles to space out notifications
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\n🏁 Done! Check your device for notifications.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
