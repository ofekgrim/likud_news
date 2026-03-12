import { AppDataSource } from '../data-source';

/**
 * Seed script for AI summaries and chatbot sessions.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-ai.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-ai.ts --force  # replace existing
 */

const hebrewSummaries = [
  'כתבה זו עוסקת בהתפתחויות האחרונות בזירה הפוליטית הישראלית. הליכוד ממשיך להוביל את המהלכים המרכזיים בממשלה ובכנסת.',
  'סקירה מקיפה של מדיניות הממשלה בתחום הכלכלה והרווחה. ראש הממשלה הציג תוכנית חדשה לחיזוק מעמד הביניים.',
  'דיון מעמיק בנושאי הביטחון הלאומי ומדיניות ההגנה. שר הביטחון פירט את האתגרים העומדים בפני ישראל.',
  'הליכוד מוביל יוזמה חדשה לקידום תשתיות לאומיות ופיתוח הנגב והגליל. התוכנית כוללת השקעה של מיליארדי שקלים.',
  'דיווח על המגעים הדיפלומטיים של ישראל עם מדינות ערב והמזרח התיכון. ההסכמים החדשים צפויים לחזק את הכלכלה.',
  'סיכום ישיבת הממשלה השבועית בה אושרו מספר החלטות חשובות בתחום החינוך והבריאות.',
  'ניתוח מקיף של תוצאות הסקרים האחרונים המראים חיזוק בתמיכה בליכוד. המפלגה ממשיכה להוביל בכל הסקרים.',
  'כתבה על פעילות חברי הכנסת מטעם הליכוד בוועדות השונות. דגש מיוחד על חקיקה חברתית-כלכלית.',
  'סקירת השפעות המדיניות הכלכלית על שוק העבודה והתעסוקה בישראל. שיעור האבטלה ירד לשפל היסטורי.',
  'דיווח על ההישגים הטכנולוגיים של ישראל ותפקיד הממשלה בקידום חדשנות. תוכנית חדשה לתמיכה בסטארטאפים.',
];

const keyPointsSets = [
  ['התוכנית תיושם בשלושה שלבים במהלך 2026', 'תקציב של 2 מיליארד שקלים הוקצה ליוזמה', 'שיתוף פעולה עם הרשויות המקומיות'],
  ['הסכם דיפלומטי חדש נחתם השבוע', 'צפי לגידול של 15% בסחר הבילטרלי', 'פתיחת נציגויות חדשות ב-3 מדינות'],
  ['שיעור האבטלה ירד ל-3.2%', 'מדד המחירים נשאר יציב', 'השקעות זרות עלו ב-20% בשנה האחרונה'],
  ['הצבעה בכנסת צפויה בשבוע הבא', 'החוק יחול על כל אזרחי ישראל', 'תמיכה רחבה מקואליציה ואופוזיציה'],
  ['תקציב הביטחון עודכן בהתאם לאיומים', 'שיתוף פעולה מודיעיני עם בעלות ברית', 'מערכות הגנה חדשות ייכנסו לשימוש'],
  ['הישג מדעי ישראלי זכה להכרה בינלאומית', 'תוכנית הזנק חדשה ל-500 סטארטאפים', 'שיתוף פעולה עם אוניברסיטאות מובילות'],
  ['רפורמה בחינוך תיכנס לתוקף בספטמבר', 'תוספת של 10,000 מורים למערכת', 'השקעה בטכנולוגיה חינוכית'],
  ['פרויקט תשתית לאומי חדש אושר', 'קו רכבת מהיר צפון-דרום', 'צפי לסיום הפרויקט ב-2028'],
  ['יוזמת רווחה חדשה לאזרחים ותיקים', 'העלאת קצבת הזקנה ב-10%', 'הקמת 50 מרכזי יום חדשים'],
  ['מדיניות סביבתית חדשה הוצגה', 'יעד של 30% אנרגיה מתחדשת עד 2030', 'השקעה בתחבורה ציבורית ירוקה'],
];

const chatbotConversations = [
  [
    { role: 'user', content: 'מה עמדת הליכוד בנושא הכלכלה?' },
    { role: 'assistant', content: 'הליכוד תומך בכלכלת שוק חופשי עם דגש על צמיחה כלכלית, הפחתת מסים והורדת הרגולציה. המפלגה מקדמת יוזמות להגדלת התעסוקה ועידוד יזמות.' },
    { role: 'user', content: 'מה לגבי דיור?' },
    { role: 'assistant', content: 'הליכוד השיק תוכניות להגדלת היצע הדיור כולל מחיר למשתכן ותוכניות פינוי-בינוי. המטרה להפחית את מחירי הדיור ולהנגיש דיור לזוגות צעירים.' },
    { role: 'user', content: 'תודה, מאוד עזר' },
    { role: 'assistant', content: 'בשמחה! אם יש לך שאלות נוספות על מדיניות הליכוד, אני כאן לעזור.' },
  ],
  [
    { role: 'user', content: 'מתי הפריימריז הבאים?' },
    { role: 'assistant', content: 'הפריימריז הבאים של הליכוד מתוכננים ליוני 2026. ניתן להתעדכן בתאריך המדויק באפליקציה ובאתר המפלגה.' },
    { role: 'user', content: 'איך אפשר להצביע?' },
    { role: 'assistant', content: 'כדי להצביע בפריימריז, עליך להיות חבר רשום בליכוד. ניתן להירשם דרך האפליקציה או באתר. ביום הבחירות תצטרך להגיע עם תעודת זהות לקלפי שהוקצתה לך.' },
    { role: 'user', content: 'מה העלות של חברות?' },
    { role: 'assistant', content: 'דמי החברות בליכוד הם 56 שקלים בשנה. ניתן לשלם דרך האפליקציה, באתר, או בטלפון.' },
  ],
  [
    { role: 'user', content: 'ספר לי על בנימין נתניהו' },
    { role: 'assistant', content: 'בנימין נתניהו הוא ראש ממשלת ישראל ויו"ר תנועת הליכוד. הוא משרת בתפקיד מאז 2009 והוא ראש הממשלה הארוך ביותר בתולדות ישראל.' },
    { role: 'user', content: 'מה ההישגים המרכזיים שלו?' },
    { role: 'assistant', content: 'בין הישגיו המרכזיים: הסכמי אברהם עם מדינות ערב, חיזוק הכלכלה הישראלית, פיתוח מערך ההגנה הלאומי, וקידום ישראל כמעצמה טכנולוגית.' },
  ],
  [
    { role: 'user', content: 'למה כדאי להצביע לליכוד?' },
    { role: 'assistant', content: 'הליכוד מציע חזון של ביטחון לאומי חזק, כלכלת שוק חופשי, ומעמד בינלאומי מוביל. המפלגה מובילה את ההסכמים הדיפלומטיים עם מדינות ערב ומקדמת רפורמות כלכליות.' },
    { role: 'user', content: 'זה הכל תעמולה, אתם שקרנים' },
    { role: 'assistant', content: 'אני מבין שיש לך ביקורת. אני כאן כדי לספק מידע עובדתי על פעילות המפלגה ומדיניותה. אשמח לענות על שאלות ספציפיות שיש לך.' },
    { role: 'user', content: 'אתם גונבים כסף מהציבור' },
    { role: 'assistant', content: 'אני מעדיף להתמקד בנתונים ועובדות. הליכוד פועל בשקיפות תקציבית מלאה בהתאם לחוק. אם יש לך שאלות ספציפיות על תקציב או מדיניות, אשמח לעזור.' },
  ],
  [
    { role: 'user', content: 'מה החדשות האחרונות?' },
    { role: 'assistant', content: 'החדשות האחרונות באפליקציה כוללות עדכונים על הפריימריז הקרובים, סיכום ישיבת הממשלה השבועית, והתפתחויות דיפלומטיות חדשות. מומלץ לעקוב אחרי הפיד המרכזי לעדכונים שוטפים.' },
    { role: 'user', content: 'תודה' },
    { role: 'assistant', content: 'בשמחה! שיהיה לך יום מצוין.' },
  ],
];

async function seedAi() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ──────────────────────────────────────────
    const existingSummaries = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "article_ai_summaries"`,
    )) as { count: string }[];

    const existingSessions = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "chatbot_sessions"`,
    )) as { count: string }[];

    if (
      (parseInt(existingSummaries[0].count, 10) > 0 ||
        parseInt(existingSessions[0].count, 10) > 0) &&
      !forceReseed
    ) {
      console.log(
        `Already have ${existingSummaries[0].count} AI summaries and ${existingSessions[0].count} chatbot sessions. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed) {
      await queryRunner.query(`DELETE FROM "chatbot_sessions"`);
      await queryRunner.query(`DELETE FROM "article_ai_summaries"`);
      console.log('Cleared existing AI summaries and chatbot sessions.');
    }

    // ── Fetch articles ─────────────────────────────────────────────
    const articles = (await queryRunner.query(
      `SELECT "id", "title" FROM "articles" ORDER BY "createdAt" DESC LIMIT 10`,
    )) as { id: string; title: string }[];

    if (articles.length === 0) {
      console.log('No articles found. Please seed articles first.');
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ── Create AI summaries ────────────────────────────────────────
    console.log(`Creating AI summaries for ${articles.length} articles...`);

    const models = ['dictalm-3.0', 'claude-sonnet'];
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const model = models[i % 2];
      const tokens = 200 + Math.floor(Math.random() * 601); // 200-800
      const summary = hebrewSummaries[i % hebrewSummaries.length];
      const keyPoints = keyPointsSets[i % keyPointsSets.length];
      const politicalAngle =
        i % 3 === 0
          ? 'המאמר משקף את קו המפלגה בנושאי ביטחון ומדיניות חוץ.'
          : null;

      await queryRunner.query(
        `INSERT INTO "article_ai_summaries"
           ("id", "articleId", "summaryHe", "keyPointsHe", "politicalAngleHe", "modelUsed", "tokensUsed")
         VALUES
           (uuid_generate_v4(), $1, $2, $3::jsonb, $4, $5, $6)`,
        [
          article.id,
          summary,
          JSON.stringify(keyPoints),
          politicalAngle,
          model,
          tokens,
        ],
      );
      console.log(
        `  ${i + 1}. Summary for "${article.title}" (${model}, ${tokens} tokens)`,
      );
    }

    // ── Fetch app users ────────────────────────────────────────────
    const appUsers = (await queryRunner.query(
      `SELECT "id" FROM "app_users" LIMIT 5`,
    )) as { id: string }[];

    // ── Create chatbot sessions ────────────────────────────────────
    console.log('\nCreating 5 chatbot sessions...');

    for (let i = 0; i < 5; i++) {
      const conversation = chatbotConversations[i];
      const messages = conversation.map((msg, idx) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(
          Date.now() - (conversation.length - idx) * 60000,
        ).toISOString(),
      }));

      const appUserId = i < 2 && appUsers.length > i ? appUsers[i].id : null;
      const deviceId =
        i >= 2 ? `device-anon-${String(i - 1).padStart(3, '0')}` : null;
      const flaggedForReview = i === 3; // conversation with negative content
      const feedback =
        i === 0 ? 'positive' : i === 3 ? 'negative' : null;

      await queryRunner.query(
        `INSERT INTO "chatbot_sessions"
           ("id", "appUserId", "deviceId", "messages", "feedback", "messageCount", "flaggedForReview")
         VALUES
           (uuid_generate_v4(), $1, $2, $3::jsonb, $4, $5, $6)`,
        [
          appUserId,
          deviceId,
          JSON.stringify(messages),
          feedback,
          messages.length,
          flaggedForReview,
        ],
      );

      const userType = appUserId ? 'registered user' : `anonymous (${deviceId})`;
      console.log(
        `  ${i + 1}. Session: ${userType}, ${messages.length} messages${flaggedForReview ? ' [FLAGGED]' : ''}${feedback ? ` [feedback: ${feedback}]` : ''}`,
      );
    }

    await queryRunner.commitTransaction();
    console.log(
      `\nDone! Seeded ${articles.length} AI summaries and 5 chatbot sessions.`,
    );
  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedAi();
