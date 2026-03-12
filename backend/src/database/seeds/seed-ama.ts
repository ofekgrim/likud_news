import { AppDataSource } from '../data-source';

/**
 * Seed script for AMA sessions and questions.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-ama.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-ama.ts --force  # replace existing
 */

const sessionConfigs = [
  {
    title: 'שאלו את המועמד — שאלות ותשובות בשידור חי',
    description: 'הזדמנות לשאול שאלות ישירות על מדיניות ביטחון ומדינות חוץ.',
    status: 'live',
    scheduledOffset: -1, // 1 hour ago
    startedOffset: -1,
    endedOffset: null,
  },
  {
    title: 'מפגש שאלות ותשובות — חינוך ורווחה',
    description: 'שיחה פתוחה על תוכניות החינוך והרווחה החדשות של הליכוד.',
    status: 'scheduled',
    scheduledOffset: 72, // 3 days from now
    startedOffset: null,
    endedOffset: null,
  },
  {
    title: 'סיכום מפגש — כלכלה ותעסוקה',
    description: 'שיחה שהתקיימה בנושא מדיניות כלכלית, תעסוקה ויוקר המחיה.',
    status: 'ended',
    scheduledOffset: -48, // 2 days ago
    startedOffset: -47,
    endedOffset: -46,
  },
  {
    title: 'ארכיון — מפגש בנושא דיפלומטיה',
    description: 'מפגש שהועבר לארכיון בנושא הסכמים דיפלומטיים ויחסי חוץ.',
    status: 'archived',
    scheduledOffset: -168, // 7 days ago
    startedOffset: -167,
    endedOffset: -165,
  },
];

const questionTexts = [
  'מה התוכנית שלך לפתרון משבר הדיור?',
  'איך אתה מתכנן לחזק את הביטחון בגבול הצפון?',
  'מה עמדתך בנושא רפורמה במערכת המשפט?',
  'איך תשפר את מערכת החינוך?',
  'מה התוכנית להפחתת יוקר המחיה?',
  'מה דעתך על הסכמי השלום עם מדינות ערב?',
  'איך תתמודד עם אתגר התחבורה?',
  'מה עמדתך בנושא אנרגיה מתחדשת?',
  'איך תקדם את פריפריית הנגב והגליל?',
  'מה התוכנית לחיזוק מערכת הבריאות?',
  'איך תשפר את מצב הפנסיונרים?',
  'מה דעתך על מדיניות ההגירה?',
  'איך תטפל בבעיית הפשיעה?',
  'מה עמדתך בנושא הקשר עם ארה"ב?',
  'מה התוכנית לפיתוח ההייטק הישראלי?',
  'איך תחזק את הקהילה הדרוזית?',
  'מה התוכנית לשיפור תשתיות המים?',
  'איך תתמודד עם האתגרים הסביבתיים?',
  'מה עמדתך בנושא חופש העיתונות?',
  'מה תעשה כדי לחזק את השלטון המקומי?',
];

const answerTexts = [
  'אנחנו מקדמים תוכנית מקיפה שכוללת בנייה מסיבית, הסרת חסמים בירוקרטיים והגדלת היצע הקרקעות. המטרה: 100,000 יחידות דיור חדשות בשנה.',
  'הביטחון בגבול הצפון הוא בראש סדר העדיפויות. אנחנו משקיעים בטכנולוגיות הגנה מתקדמות ומחזקים את נוכחות צה"ל באזור.',
  'אנחנו מאמינים ברפורמה מאוזנת שתייעל את מערכת המשפט תוך שמירה על עצמאות הרשות השופטת וזכויות האדם.',
  'תוכנית החינוך שלנו מתמקדת בהכשרת מורים, הטמעת טכנולוגיה חינוכית ושיפור תשתיות בתי הספר. נשקיע 5 מיליארד שקלים נוספים.',
  'אנחנו עובדים על הפחתת מסים, הגברת התחרות וצמצום הבירוקרטיה. כבר רואים ירידה ביוקר המחיה בחודשים האחרונים.',
  'הסכמי אברהם הם הישג היסטורי. אנחנו ממשיכים להרחיב את מעגל השלום עם עוד מדינות באזור.',
  'משקיעים בפרויקטי תחבורה ציבורית: רכבת קלה, מטרו ונתיבי תחבורה מהירה. התקציב כבר אושר.',
  'מחויבים ליעד 30% אנרגיה מתחדשת עד 2030. כבר אישרנו פרויקטים סולאריים בנגב בהיקף חסר תקדים.',
  'תוכנית הנגב-גליל כוללת הטבות מס, פיתוח תעסוקה מקומית והקמת קמפוסים אקדמיים חדשים.',
  'משקיעים במערכת הבריאות: הכשרת רופאים, בניית בתי חולים חדשים והפחתת זמני המתנה. כבר גייסנו 3,000 אנשי צוות רפואי.',
];

async function seedAma() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ──────────────────────────────────────────
    const existingSessions = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "ama_sessions"`,
    )) as { count: string }[];

    if (parseInt(existingSessions[0].count, 10) > 0 && !forceReseed) {
      console.log(
        `Already have ${existingSessions[0].count} AMA sessions. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed) {
      await queryRunner.query(`DELETE FROM "ama_questions"`);
      await queryRunner.query(`DELETE FROM "ama_sessions"`);
      console.log('Cleared existing AMA sessions and questions.');
    }

    // ── Fetch candidates ───────────────────────────────────────────
    const candidates = (await queryRunner.query(
      `SELECT "id", "fullName" FROM "candidates" ORDER BY "sortOrder" ASC LIMIT 5`,
    )) as { id: string; fullName: string }[];

    if (candidates.length < 4) {
      console.log(
        'Need at least 4 candidates. Please seed candidates first.',
      );
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ── Fetch app users ────────────────────────────────────────────
    const appUsers = (await queryRunner.query(
      `SELECT "id" FROM "app_users" LIMIT 10`,
    )) as { id: string }[];

    if (appUsers.length < 3) {
      console.log('Need at least 3 app users. Please seed app users first.');
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ── Create AMA sessions ───────────────────────────────────────
    console.log('Creating 4 AMA sessions...');
    const now = Date.now();
    const sessionIds: string[] = [];

    for (let i = 0; i < 4; i++) {
      const config = sessionConfigs[i];
      const candidate = candidates[i];
      const scheduledAt = new Date(
        now + config.scheduledOffset * 3600 * 1000,
      );
      const startedAt = config.startedOffset
        ? new Date(now + config.startedOffset * 3600 * 1000)
        : null;
      const endedAt = config.endedOffset
        ? new Date(now + config.endedOffset * 3600 * 1000)
        : null;

      const result = await queryRunner.query(
        `INSERT INTO "ama_sessions"
           ("id", "candidateId", "title", "description", "scheduledAt", "startedAt", "endedAt", "status", "maxQuestions", "isActive")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, 100, $8)
         RETURNING "id"`,
        [
          candidate.id,
          config.title,
          config.description,
          scheduledAt,
          startedAt,
          endedAt,
          config.status,
          config.status !== 'archived',
        ],
      );
      sessionIds.push(result[0].id);
      console.log(
        `  ${i + 1}. [${config.status.toUpperCase()}] "${config.title}" — ${candidate.fullName}`,
      );
    }

    // ── Create questions for live session (index 0) ───────────────
    const liveSessionId = sessionIds[0];
    const endedSessionId = sessionIds[2];

    const questionsPerSession = [
      { sessionId: liveSessionId, label: 'live', count: 18 },
      { sessionId: endedSessionId, label: 'ended', count: 16 },
    ];

    let totalQuestions = 0;

    for (const qs of questionsPerSession) {
      console.log(
        `\nCreating ${qs.count} questions for ${qs.label} session...`,
      );

      for (let i = 0; i < qs.count; i++) {
        const appUser = appUsers[i % appUsers.length];
        const questionText = questionTexts[i % questionTexts.length];
        const upvoteCount = Math.floor(Math.random() * 51); // 0-50
        const isPinned = i < 2; // first 2 are pinned

        // Status distribution: ~30% approved, ~30% answered, ~25% pending, ~15% rejected
        let status: string;
        let answerText: string | null = null;
        let answeredAt: Date | null = null;
        if (i % 4 === 0) {
          status = 'approved';
        } else if (i % 4 === 1) {
          status = 'answered';
          answerText = answerTexts[i % answerTexts.length];
          answeredAt = new Date(now - Math.floor(Math.random() * 3600000));
        } else if (i % 4 === 2) {
          status = 'pending';
        } else {
          status = i % 7 === 0 ? 'rejected' : 'answered';
          if (status === 'answered') {
            answerText = answerTexts[(i + 3) % answerTexts.length];
            answeredAt = new Date(now - Math.floor(Math.random() * 3600000));
          }
        }

        const isModerated = status !== 'pending';

        await queryRunner.query(
          `INSERT INTO "ama_questions"
             ("id", "sessionId", "appUserId", "questionText", "answerText", "answeredAt", "upvoteCount", "status", "isModerated", "isPinned")
           VALUES
             (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            qs.sessionId,
            appUser.id,
            questionText,
            answerText,
            answeredAt,
            upvoteCount,
            status,
            isModerated,
            isPinned,
          ],
        );
        console.log(
          `  ${i + 1}. [${status.toUpperCase()}] upvotes: ${upvoteCount}${isPinned ? ' [PINNED]' : ''}`,
        );
        totalQuestions++;
      }
    }

    await queryRunner.commitTransaction();
    console.log(
      `\nDone! Seeded 4 AMA sessions and ${totalQuestions} questions.`,
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

void seedAma();
