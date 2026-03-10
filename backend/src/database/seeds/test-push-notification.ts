/**
 * Test Push Notification Script
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/database/seeds/test-push-notification.ts [fcm-token]
 *
 * If no FCM token is provided, it will:
 *   1. List all registered push tokens
 *   2. Send a test notification to all active tokens
 *
 * If an FCM token is provided, it will:
 *   1. Register the token as a test device
 *   2. Send a test notification to it
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
  const fcmToken = process.argv[2];

  await dataSource.initialize();
  console.log('✅ Database connected');

  // Check push tokens
  const tokens = await dataSource.query(
    'SELECT id, "deviceId", platform, token, "isActive", "createdAt" FROM push_tokens WHERE "isActive" = true ORDER BY "createdAt" DESC',
  );
  console.log(`\n📱 Active push tokens: ${tokens.length}`);
  tokens.forEach((t: any) => {
    console.log(`   - ${t.deviceId} (${t.platform}) token: ${t.token.substring(0, 20)}...`);
  });

  // If FCM token provided, register it
  if (fcmToken) {
    console.log(`\n📝 Registering test token: ${fcmToken.substring(0, 20)}...`);
    await dataSource.query(
      `INSERT INTO push_tokens ("deviceId", token, platform, "isActive")
       VALUES ($1, $2, $3, true)
       ON CONFLICT ("deviceId") DO UPDATE SET token = $2, "isActive" = true`,
      ['test-device-seed', fcmToken, 'ios'],
    );
    console.log('✅ Token registered');
  }

  // Initialize Firebase Admin
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error('❌ Firebase credentials not set in .env');
    console.log('   Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    await dataSource.destroy();
    process.exit(1);
  }

  console.log(`\n🔥 Firebase project: ${projectId}`);
  console.log(`   Client email: ${clientEmail}`);

  let app: admin.app.App;
  try {
    app = admin.apps.length > 0
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
        });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (err: any) {
    console.error(`❌ Firebase init failed: ${err.message}`);
    await dataSource.destroy();
    process.exit(1);
  }

  // Get all active tokens to send to
  const activeTokens = await dataSource.query(
    'SELECT token FROM push_tokens WHERE "isActive" = true',
  );

  if (activeTokens.length === 0) {
    console.log('\n⚠️  No active push tokens to send to.');
    console.log('   The app needs to register its FCM token first.');
    console.log('   Run the app on a real device (TestFlight) and it will auto-register.');
    console.log('\n   To manually register a token, run:');
    console.log('   npx ts-node -r tsconfig-paths/register src/database/seeds/test-push-notification.ts <FCM_TOKEN>');
    await dataSource.destroy();
    process.exit(0);
  }

  // Send test notification
  const messaging = app.messaging();
  const tokenList = activeTokens.map((t: any) => t.token);

  console.log(`\n📤 Sending test notification to ${tokenList.length} device(s)...`);

  try {
    const result = await messaging.sendEachForMulticast({
      notification: {
        title: '🔔 בדיקת התראות - מצודת הליכוד',
        body: 'אם אתה רואה את ההודעה הזו, ההתראות עובדות!',
      },
      data: {
        contentType: 'inbox',
        test: 'true',
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'breaking_news',
        },
      },
      tokens: tokenList,
    });

    console.log(`✅ Sent: ${result.successCount}, Failed: ${result.failureCount}`);
    result.responses.forEach((resp, idx) => {
      if (resp.error) {
        console.log(`   ❌ Token ${idx}: ${resp.error.code} — ${resp.error.message}`);
      } else {
        console.log(`   ✅ Token ${idx}: Message ID ${resp.messageId}`);
      }
    });
  } catch (err: any) {
    console.error(`❌ Send failed: ${err.message}`);
  }

  await dataSource.destroy();
  console.log('\n🏁 Done');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
