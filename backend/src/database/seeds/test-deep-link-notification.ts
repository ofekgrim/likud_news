/**
 * Test Deep Link Push Notification
 *
 * Sends a push notification with article deep link data to verify that
 * tapping the notification opens the correct article (not just the feed).
 *
 * Usage:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/test-deep-link-notification.ts
 */
import { DataSource } from 'typeorm';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'likud',
  password: process.env.DB_PASSWORD || 'likud_dev',
  database: process.env.DB_DATABASE || 'likud_news',
});

async function main() {
  await dataSource.initialize();
  console.log('✅ Database connected');

  // Get a real article slug to deep link to
  const articles = await dataSource.query(
    `SELECT id, title, slug, "heroImageUrl" FROM articles WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 3`,
  );

  if (articles.length === 0) {
    console.log('❌ No articles found in DB. Seed articles first.');
    await dataSource.destroy();
    process.exit(1);
  }

  const article = articles[0];
  console.log(`\n📰 Using article: "${article.title}"`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`   ID: ${article.id}`);

  // Get active push tokens
  const tokens = await dataSource.query(
    'SELECT token, "deviceId", platform FROM push_tokens WHERE "isActive" = true',
  );

  if (tokens.length === 0) {
    console.log('\n⚠️  No active push tokens. Run the app on a real device first.');
    await dataSource.destroy();
    process.exit(0);
  }

  console.log(`\n📱 Active tokens: ${tokens.length}`);
  tokens.forEach((t: any) => {
    console.log(`   - ${t.deviceId} (${t.platform})`);
  });

  // Initialize Firebase Admin
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error('❌ Firebase credentials not set in .env');
    await dataSource.destroy();
    process.exit(1);
  }

  const app = admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
      });

  const messaging = app.messaging();
  const tokenList = tokens.map((t: any) => t.token);

  // Test 1: Article deep link notification
  console.log('\n📤 Test 1: Sending ARTICLE deep link notification...');
  try {
    const result = await messaging.sendEachForMulticast({
      notification: {
        title: 'בדיקת ניווט לכתבה',
        body: article.title,
        ...(article.heroImageUrl && { imageUrl: article.heroImageUrl }),
      },
      data: {
        contentType: 'article',
        contentId: article.id,
        articleSlug: article.slug,
        notificationLogId: 'test-deep-link-article',
        ...(article.heroImageUrl && { imageUrl: article.heroImageUrl }),
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1, 'mutable-content': 1 } },
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'breaking_news' },
      },
      tokens: tokenList,
    });

    console.log(`   ✅ Sent: ${result.successCount}, Failed: ${result.failureCount}`);
    result.responses.forEach((resp, idx) => {
      if (resp.error) {
        console.log(`   ❌ Token ${idx}: ${resp.error.code}`);
      } else {
        console.log(`   ✅ Token ${idx}: ${resp.messageId}`);
      }
    });
  } catch (err: any) {
    console.error(`   ❌ Failed: ${err.message}`);
  }

  // Wait 3 seconds then send a polls deep link notification
  await new Promise((r) => setTimeout(r, 3000));

  console.log('\n📤 Test 2: Sending POLL deep link notification...');
  try {
    const result = await messaging.sendEachForMulticast({
      notification: {
        title: 'בדיקת ניווט לסקר',
        body: 'לחץ כאן כדי לפתוח את דף הסקרים',
      },
      data: {
        contentType: 'poll',
        notificationLogId: 'test-deep-link-poll',
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1, 'mutable-content': 1 } },
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'breaking_news' },
      },
      tokens: tokenList,
    });

    console.log(`   ✅ Sent: ${result.successCount}, Failed: ${result.failureCount}`);
  } catch (err: any) {
    console.error(`   ❌ Failed: ${err.message}`);
  }

  await dataSource.destroy();
  console.log('\n🏁 Done — Test steps:');
  console.log('   1. KILL the app completely (swipe away from app switcher)');
  console.log('   2. Tap the ARTICLE notification from lock screen / notification center');
  console.log('   3. App should open directly to the article page (not feed)');
  console.log('   4. Go back, then tap the POLL notification');
  console.log('   5. App should open the polls page');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
