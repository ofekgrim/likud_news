/**
 * Seed script: Create daily quizzes + streaks for testing gamification.
 *
 * Creates:
 *   - 3 daily quizzes (today, yesterday, day-before-yesterday)
 *   - User streaks for existing app users
 *   - A few daily quiz attempts to simulate completions
 *
 * Prerequisites: seed-app-users.ts must have been run first.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-daily-quiz.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-daily-quiz.ts --force  # replace existing
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  database: process.env.DATABASE_NAME || 'likud_news',
  username: process.env.DATABASE_USER || 'likud',
  password: process.env.DATABASE_PASSWORD || 'likud_dev',
  ssl: process.env.DATABASE_SSL === 'true',
  entities: ['src/modules/**/entities/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});

// ── Quiz Data ─────────────────────────────────────────────────────────────

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const QUIZZES = [
  {
    date: getDateStr(0), // Today
    pointsReward: 20,
    questions: [
      {
        questionText: 'מי הוא ראש הממשלה הנוכחי של ישראל?',
        options: [
          { label: 'בנימין נתניהו', isCorrect: true },
          { label: 'יאיר לפיד', isCorrect: false },
          { label: 'נפתלי בנט', isCorrect: false },
          { label: 'בני גנץ', isCorrect: false },
        ],
      },
      {
        questionText: 'באיזו שנה הוקמה מדינת ישראל?',
        options: [
          { label: '1945', isCorrect: false },
          { label: '1948', isCorrect: true },
          { label: '1950', isCorrect: false },
          { label: '1952', isCorrect: false },
        ],
      },
      {
        questionText: 'מהי בירת ישראל?',
        options: [
          { label: 'תל אביב', isCorrect: false },
          { label: 'חיפה', isCorrect: false },
          { label: 'ירושלים', isCorrect: true },
          { label: 'באר שבע', isCorrect: false },
        ],
      },
      {
        questionText: 'כמה חברי כנסת יש בכנסת ישראל?',
        options: [
          { label: '100', isCorrect: false },
          { label: '120', isCorrect: true },
          { label: '150', isCorrect: false },
          { label: '200', isCorrect: false },
        ],
      },
    ],
  },
  {
    date: getDateStr(1), // Yesterday
    pointsReward: 20,
    questions: [
      {
        questionText: 'מי היה ראש הממשלה הראשון של ישראל?',
        options: [
          { label: 'חיים וייצמן', isCorrect: false },
          { label: 'דוד בן גוריון', isCorrect: true },
          { label: 'גולדה מאיר', isCorrect: false },
          { label: 'לוי אשכול', isCorrect: false },
        ],
      },
      {
        questionText: 'באיזה ים ישראל גובלת במערב?',
        options: [
          { label: 'הים האדום', isCorrect: false },
          { label: 'ים המלח', isCorrect: false },
          { label: 'הים התיכון', isCorrect: true },
          { label: 'ים כנרת', isCorrect: false },
        ],
      },
      {
        questionText: 'מהו הנהר הארוך ביותר בישראל?',
        options: [
          { label: 'נהר הירדן', isCorrect: true },
          { label: 'נחל הירקון', isCorrect: false },
          { label: 'נחל שורק', isCorrect: false },
          { label: 'נהר הקישון', isCorrect: false },
        ],
      },
    ],
  },
  {
    date: getDateStr(2), // Day before yesterday
    pointsReward: 15,
    questions: [
      {
        questionText: 'מי כתב את "התקווה"?',
        options: [
          { label: 'חיים נחמן ביאליק', isCorrect: false },
          { label: 'נפתלי הרץ אימבר', isCorrect: true },
          { label: 'שאול טשרניחובסקי', isCorrect: false },
          { label: 'רחל המשוררת', isCorrect: false },
        ],
      },
      {
        questionText: 'כמה אזורי זמן יש בישראל?',
        options: [
          { label: '1', isCorrect: true },
          { label: '2', isCorrect: false },
          { label: '3', isCorrect: false },
          { label: '4', isCorrect: false },
        ],
      },
      {
        questionText: 'מהו ההר הגבוה ביותר בישראל?',
        options: [
          { label: 'הר תבור', isCorrect: false },
          { label: 'הר מירון', isCorrect: true },
          { label: 'הר הכרמל', isCorrect: false },
          { label: 'הר חרמון', isCorrect: false },
        ],
      },
    ],
  },
];

// ── Main seed function ──────────────────────────────────────────────────────

async function seedDailyQuiz() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ───────────────────────────────────────────
    const existingQuizzes = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "daily_quizzes"`,
    )) as { count: string }[];
    const quizCount = parseInt(existingQuizzes[0].count, 10);

    if (quizCount > 0 && !forceReseed) {
      console.log(
        `Table already has ${quizCount} quizzes. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && quizCount > 0) {
      console.log('Deleting existing daily quiz data...');
      await queryRunner.query(`DELETE FROM "daily_quiz_attempts"`);
      await queryRunner.query(`DELETE FROM "daily_quizzes"`);
      console.log('Cleared existing data.\n');
    }

    // ── Insert daily quizzes ──────────────────────────────────────────
    console.log('Creating daily quizzes...');
    const quizIds: string[] = [];

    for (const quiz of QUIZZES) {
      const result = await queryRunner.query(
        `INSERT INTO "daily_quizzes"
           ("id", "date", "questions", "isActive", "pointsReward")
         VALUES
           (uuid_generate_v4(), $1, $2::jsonb, true, $3)
         RETURNING "id"`,
        [quiz.date, JSON.stringify(quiz.questions), quiz.pointsReward],
      );

      const quizId = result[0].id;
      quizIds.push(quizId);
      console.log(
        `  ✅ Quiz for ${quiz.date}: ${quiz.questions.length} questions, ${quiz.pointsReward} pts (id: ${quizId})`,
      );
    }

    // ── Create user streaks ───────────────────────────────────────────
    console.log('\nCreating user streaks...');

    const appUsers = (await queryRunner.query(
      `SELECT "id", "displayName", "role" FROM "app_users" WHERE "isActive" = true ORDER BY "createdAt" LIMIT 20`,
    )) as Array<{ id: string; displayName: string; role: string }>;

    if (appUsers.length === 0) {
      console.log('No active app users found. Skipping streaks.');
    } else {
      let streaksCreated = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = getDateStr(1);

      for (let i = 0; i < appUsers.length; i++) {
        const user = appUsers[i];
        // Vary streak values based on user index
        const currentStreak = i < 3 ? 15 + i * 5 : i < 8 ? 5 + i : Math.max(1, i - 5);
        const longestStreak = Math.max(currentStreak, currentStreak + Math.floor(Math.random() * 10));
        // Some users active today, some yesterday
        const lastActivity = i % 3 === 0 ? today : yesterday;

        // Check if streak already exists
        const existing = await queryRunner.query(
          `SELECT "id" FROM "user_streaks" WHERE "userId" = $1`,
          [user.id],
        );

        if (existing.length > 0) {
          await queryRunner.query(
            `UPDATE "user_streaks" SET "currentStreak" = $1, "longestStreak" = $2, "lastActivityDate" = $3 WHERE "userId" = $4`,
            [currentStreak, longestStreak, lastActivity, user.id],
          );
        } else {
          await queryRunner.query(
            `INSERT INTO "user_streaks"
               ("id", "userId", "currentStreak", "longestStreak", "lastActivityDate")
             VALUES
               (uuid_generate_v4(), $1, $2, $3, $4)`,
            [user.id, currentStreak, longestStreak, lastActivity],
          );
        }

        streaksCreated++;
        console.log(
          `  ${user.displayName.padEnd(20)} streak: ${currentStreak} (best: ${longestStreak}) last: ${lastActivity}`,
        );
      }

      console.log(`\nTotal streaks created/updated: ${streaksCreated}`);
    }

    // ── Create some quiz attempts (for yesterday's quiz) ──────────────
    console.log('\nCreating sample quiz attempts...');

    const yesterdayQuizId = quizIds[1]; // Yesterday's quiz
    const dayBeforeQuizId = quizIds[2]; // Day before yesterday's quiz
    let attemptsCreated = 0;

    // First 5 users completed yesterday's quiz
    for (let i = 0; i < Math.min(5, appUsers.length); i++) {
      const user = appUsers[i];
      const numQuestions = QUIZZES[1].questions.length;
      const score = Math.floor(Math.random() * 2) + numQuestions - 1; // 2 or 3 out of 3
      const answers = QUIZZES[1].questions.map((q) =>
        q.options.findIndex((o) => o.isCorrect),
      );
      // Randomize one answer to be wrong sometimes
      if (score < numQuestions && answers.length > 0) {
        answers[0] = (answers[0] + 1) % 4;
      }

      await queryRunner.query(
        `INSERT INTO "daily_quiz_attempts"
           ("id", "userId", "quizId", "answers", "score", "totalQuestions", "pointsAwarded", "completedAt")
         VALUES
           (uuid_generate_v4(), $1, $2, $3::jsonb, $4, $5, $6, NOW())`,
        [
          user.id,
          yesterdayQuizId,
          JSON.stringify(answers),
          score,
          numQuestions,
          QUIZZES[1].pointsReward,
        ],
      );

      attemptsCreated++;
      console.log(
        `  ${user.displayName.padEnd(20)} → yesterday quiz: ${score}/${numQuestions}`,
      );
    }

    // First 3 users also completed the day-before quiz
    for (let i = 0; i < Math.min(3, appUsers.length); i++) {
      const user = appUsers[i];
      const numQuestions = QUIZZES[2].questions.length;
      const score = Math.floor(Math.random() * 2) + numQuestions - 1;
      const answers = QUIZZES[2].questions.map((q) =>
        q.options.findIndex((o) => o.isCorrect),
      );
      if (score < numQuestions && answers.length > 0) {
        answers[0] = (answers[0] + 1) % 4;
      }

      await queryRunner.query(
        `INSERT INTO "daily_quiz_attempts"
           ("id", "userId", "quizId", "answers", "score", "totalQuestions", "pointsAwarded", "completedAt")
         VALUES
           (uuid_generate_v4(), $1, $2, $3::jsonb, $4, $5, $6, NOW() - INTERVAL '1 day')`,
        [
          user.id,
          dayBeforeQuizId,
          JSON.stringify(answers),
          score,
          numQuestions,
          QUIZZES[2].pointsReward,
        ],
      );

      attemptsCreated++;
      console.log(
        `  ${user.displayName.padEnd(20)} → day-before quiz: ${score}/${numQuestions}`,
      );
    }

    console.log(`\nTotal quiz attempts: ${attemptsCreated}`);

    // ── Commit ────────────────────────────────────────────────────────
    await queryRunner.commitTransaction();

    // ── Summary ───────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════');
    console.log('  ✅ Daily Quiz Seed Complete!');
    console.log(`  - Quizzes created:   ${quizIds.length}`);
    console.log(`  - Streaks created:   ${appUsers.length}`);
    console.log(`  - Attempts created:  ${attemptsCreated}`);
    console.log('════════════════════════════════════════');
    console.log('\n📋 Test plan:');
    console.log('  1. GET /api/v1/gamification/daily-quiz/today → should return today\'s quiz');
    console.log('  2. GET /api/v1/gamification/me/streak → should return streak data');
    console.log('  3. GET /api/v1/feed → should include DAILY_QUIZ item');
    console.log('  4. POST /api/v1/gamification/daily-quiz/submit → submit answers');
    console.log('  5. GET /api/v1/gamification/leaderboard → verify leaderboard');
    console.log('  6. Admin: /daily-quiz page → should show all 3 quizzes with stats');
  } catch (error) {
    console.error('Seed failed, rolling back:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedDailyQuiz();
