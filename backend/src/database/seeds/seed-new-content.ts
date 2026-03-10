/**
 * Seed script: Add new articles, video articles, and breaking news.
 * Creates content via the API so auto-trigger notifications fire.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-new-content.ts
 */

const BASE = 'http://localhost:9090/api/v1';

// Hebrew content for realism
const ARTICLES = [
  // ── Regular articles (politics, economy, security) ──
  {
    title: 'נתניהו: ״נמשיך לפעול בנחישות להגנת ישראל״',
    subtitle: 'ראש הממשלה נשא נאום בכנסת על מדיניות הביטחון הלאומית',
    slug: `netanyahu-security-speech-${Date.now()}`,
    content:
      '<p>ראש הממשלה בנימין נתניהו נשא היום נאום מרכזי בכנסת בנושא מדיניות הביטחון. "אנחנו נמשיך לפעול בנחישות כדי להגן על אזרחי ישראל," אמר נתניהו. "ישראל היא מדינה חזקה ויציבה."</p><p>בנאומו התייחס ראש הממשלה גם להסכמים האזוריים ולשיתוף הפעולה הגובר עם מדינות שכנות.</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
    categoryId: 'e647c244-a014-43f9-ad5a-7d788e9f272d', // פוליטיקה
    status: 'published',
    isBreaking: false,
    hashtags: ['נתניהו', 'כנסת', 'ביטחון'],
    sendPushNotification: true,
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'ראש הממשלה בנימין נתניהו נשא היום נאום מרכזי בכנסת בנושא מדיניות הביטחון. "אנחנו נמשיך לפעול בנחישות כדי להגן על אזרחי ישראל," אמר נתניהו.',
      },
      {
        type: 'paragraph',
        text: 'בנאומו התייחס ראש הממשלה גם להסכמים האזוריים ולשיתוף הפעולה הגובר עם מדינות שכנות.',
      },
    ],
  },
  {
    title: 'תוכנית כלכלית חדשה: הפחתת מסים למעמד הביניים',
    subtitle: 'שר האוצר הציג תוכנית רפורמה כלכלית מקיפה',
    slug: `economy-reform-plan-${Date.now()}`,
    content:
      '<p>שר האוצר הציג את התוכנית הכלכלית החדשה הכוללת הפחתת מס הכנסה, הרחבת מענקי עבודה ותמיכה בעסקים קטנים.</p><p>לפי התוכנית, משפחות עם הכנסה של עד 15,000 ₪ יזכו להנחה של 15% במס.</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    categoryId: '022c4566-0235-43f7-908c-87336642b872', // כלכלה
    status: 'published',
    isBreaking: false,
    hashtags: ['כלכלה', 'מסים', 'רפורמה'],
    sendPushNotification: true,
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'שר האוצר הציג את התוכנית הכלכלית החדשה הכוללת הפחתת מס הכנסה, הרחבת מענקי עבודה ותמיכה בעסקים קטנים.',
      },
    ],
  },
  {
    title: 'יו"ר הליכוד נפגש עם מנהיגי קהילות ברחבי הארץ',
    subtitle: 'סיבוב ביקורים מקיף לקראת בחירות פנימיות',
    slug: `likud-community-tour-${Date.now()}`,
    content:
      '<p>יו"ר הליכוד יצא לסיבוב ביקורים ברחבי הארץ, במסגרתו נפגש עם מנהיגי קהילות, ראשי ערים ופעילים.</p><p>"הקשר עם השטח הוא הדבר החשוב ביותר," אמר יו"ר המפלגה.</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800',
    categoryId: '290a404c-d2b2-4d99-bba4-ed3e964e9175', // חברה
    status: 'published',
    isBreaking: false,
    hashtags: ['ליכוד', 'קהילה', 'בחירות'],
    sendPushNotification: true,
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'יו"ר הליכוד יצא לסיבוב ביקורים ברחבי הארץ.',
      },
    ],
  },

  // ── Breaking news ──
  {
    title: 'מבזק: הסכם שלום היסטורי נחתם עם מדינה נוספת',
    subtitle: 'ישראל חתמה על הסכם נורמליזציה חדש במעמד נשיא ארה"ב',
    slug: `breaking-peace-deal-${Date.now()}`,
    content:
      '<p>בטקס חגיגי בבית הלבן, חתמו ישראל ומדינה ערבית נוספת על הסכם שלום היסטורי. ראש הממשלה אמר כי "זהו יום גדול למזרח התיכון כולו."</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1569025743873-ea3a9ber?w=800',
    categoryId: '94b90603-adc9-4724-ba74-f302b08a876e', // בינלאומי
    status: 'published',
    isBreaking: true,
    isHero: true,
    hashtags: ['מבזק', 'שלום', 'נורמליזציה'],
    sendPushNotification: true,
    alertBannerEnabled: true,
    alertBannerText: 'מבזק: הסכם שלום היסטורי נחתם',
    alertBannerColor: '#DC2626',
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'בטקס חגיגי בבית הלבן, חתמו ישראל ומדינה ערבית נוספת על הסכם שלום היסטורי.',
      },
    ],
  },
  {
    title: 'מבזק: צה"ל סיכל מתקפת טרור גדולה בצפון',
    subtitle: 'כוחות הביטחון פעלו בהצלחה למניעת פיגוע מתוכנן',
    slug: `breaking-terror-thwarted-${Date.now()}`,
    content:
      '<p>כוחות צה"ל ושב"כ סיכלו בלילה מתקפת טרור משמעותית שתוכננה נגד יישובים בצפון הארץ. בפעולה נעצרו מספר חשודים ונתפסו אמצעי לחימה.</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1580752300992-559f8e0734e0?w=800',
    categoryId: '3aab1e4a-4dbf-4e36-9e2e-815ea63cbe58', // ביטחון
    status: 'published',
    isBreaking: true,
    hashtags: ['מבזק', 'צהל', 'ביטחון', 'טרור'],
    sendPushNotification: true,
    alertBannerEnabled: true,
    alertBannerText: 'מבזק: סוכלה מתקפת טרור בצפון',
    alertBannerColor: '#DC2626',
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'כוחות צה"ל ושב"כ סיכלו בלילה מתקפת טרור משמעותית שתוכננה נגד יישובים בצפון הארץ.',
      },
    ],
  },

  // ── Video articles ──
  {
    title: 'צפו: נאום נתניהו המלא בכנס הליכוד',
    subtitle: 'נאום של 45 דקות בו סקר ראש הממשלה את הישגי הממשלה',
    slug: `video-netanyahu-speech-${Date.now()}`,
    content:
      '<p>צפו בנאום המלא של ראש הממשלה נתניהו בכנס הליכוד השנתי. בנאומו סקר ראש הממשלה את ההישגים הכלכליים, הדיפלומטיים והביטחוניים.</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    categoryId: '96ad5e17-c070-4152-bc04-48f5d62a5ed2', // וידאו
    status: 'published',
    isBreaking: false,
    hashtags: ['וידאו', 'נתניהו', 'כנס'],
    sendPushNotification: true,
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'צפו בנאום המלא של ראש הממשלה נתניהו בכנס הליכוד השנתי.',
      },
      {
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        caption: 'נאום נתניהו בכנס הליכוד',
      },
    ],
  },
  {
    title: 'צפו: סיור בפרויקט הבנייה הגדול בנגב',
    subtitle: 'תיעוד מרהיב של פרויקט הפיתוח הגדול ביותר בדרום',
    slug: `video-negev-project-${Date.now()}`,
    content:
      '<p>סרטון תיעוד מרהיב של פרויקט הפיתוח המשמעותי ביותר בנגב: שכונות מגורים חדשות, מרכזי תעסוקה ותשתיות תחבורה מתקדמות.</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    categoryId: '96ad5e17-c070-4152-bc04-48f5d62a5ed2', // וידאו
    status: 'published',
    isBreaking: false,
    hashtags: ['וידאו', 'נגב', 'פיתוח', 'בנייה'],
    sendPushNotification: true,
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'סרטון תיעוד מרהיב של פרויקט הפיתוח המשמעותי ביותר בנגב.',
      },
      {
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        caption: 'פרויקט הבנייה בנגב',
      },
    ],
  },
  {
    title: 'צפו: ראיון בלעדי עם שר הביטחון',
    subtitle: 'שר הביטחון בראיון מעמיק על האתגרים הביטחוניים',
    slug: `video-defense-minister-interview-${Date.now()}`,
    content:
      '<p>בראיון בלעדי, שר הביטחון דן באתגרים הביטחוניים העומדים בפני ישראל ובתוכניות לחיזוק צה"ל.</p>',
    heroImageUrl:
      'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=800',
    categoryId: '96ad5e17-c070-4152-bc04-48f5d62a5ed2', // וידאו
    status: 'published',
    isBreaking: false,
    hashtags: ['וידאו', 'ביטחון', 'ראיון'],
    sendPushNotification: true,
    bodyBlocks: [
      {
        type: 'paragraph',
        text: 'בראיון בלעדי, שר הביטחון דן באתגרים הביטחוניים העומדים בפני ישראל.',
      },
      {
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        caption: 'ראיון עם שר הביטחון',
      },
    ],
  },
];

async function seed() {
  console.log('🔐 Logging in...');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@likud.org.il',
      password: 'Admin123!',
    }),
  });
  const { accessToken } = await loginRes.json();
  if (!accessToken) {
    console.error('❌ Login failed');
    process.exit(1);
  }
  console.log('✅ Logged in\n');

  const AUTH = { Authorization: `Bearer ${accessToken}` };

  let created = 0;
  let notified = 0;

  for (const article of ARTICLES) {
    const type = article.isBreaking
      ? '🔴 BREAKING'
      : article.categoryId === '96ad5e17-c070-4152-bc04-48f5d62a5ed2'
        ? '🎬 VIDEO'
        : '📰 ARTICLE';

    console.log(`${type}: ${article.title}`);

    const res = await fetch(`${BASE}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...AUTH },
      body: JSON.stringify({
        ...article,
        publishedAt: new Date().toISOString(),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      created++;
      if (article.sendPushNotification) notified++;
      console.log(`  ✅ Created: ${data.slug} (id: ${data.id})`);
    } else {
      console.log(
        `  ❌ Failed: ${data.statusCode} ${data.message || JSON.stringify(data)}`,
      );
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`  📊 Results:`);
  console.log(`     Created: ${created}/${ARTICLES.length}`);
  console.log(`     Notifications triggered: ${notified}`);
  console.log(`════════════════════════════════════════`);

  // Wait a moment for async notification processing
  await new Promise((r) => setTimeout(r, 2000));

  // Check notification logs
  console.log('\n📬 Checking notification logs...');
  const logsRes = await fetch(`${BASE}/notifications/logs?limit=10`, {
    headers: AUTH,
  });
  const logs = await logsRes.json();
  const logItems = logs.data || logs;
  console.log(`  Found ${Array.isArray(logItems) ? logItems.length : '?'} recent notification logs`);
  if (Array.isArray(logItems)) {
    for (const log of logItems.slice(0, 10)) {
      console.log(
        `  [${log.status}] ${log.contentType}: ${log.title}`,
      );
    }
  }

  // Check inbox
  console.log('\n📥 Checking public inbox...');
  const inboxRes = await fetch(
    `${BASE}/notifications/inbox?deviceId=test-device&limit=10`,
  );
  const inbox = await inboxRes.json();
  console.log(
    `  Inbox has ${inbox.data?.length ?? 0} notifications (total: ${inbox.total ?? '?'})`,
  );
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
