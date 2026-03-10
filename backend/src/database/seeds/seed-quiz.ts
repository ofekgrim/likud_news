import { AppDataSource } from '../data-source';

/**
 * Quiz Seed Script
 *
 * Creates quiz questions for the first active election and links candidate
 * quizPositions to the real question UUIDs (fixes the q1/q2/... placeholder keys).
 *
 * Run:
 *   npx ts-node src/database/seeds/seed-quiz.ts
 *   npx ts-node src/database/seeds/seed-quiz.ts --force   (to re-seed)
 */

async function seedQuiz() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ─── Find the first election ───────────────────────────────────────
    const elections = (await qr.query(
      `SELECT "id", "title" FROM "primary_elections" ORDER BY "createdAt" ASC LIMIT 1`,
    )) as { id: string; title: string }[];

    if (elections.length === 0) {
      console.log('No elections found. Run seed-elections.ts first.');
      await qr.release();
      await AppDataSource.destroy();
      return;
    }

    const electionId = elections[0].id;
    console.log(`Using election: "${elections[0].title}" (${electionId})`);

    // ─── Check existing quiz questions ─────────────────────────────────
    const existingQuestions = (await qr.query(
      `SELECT COUNT(*) as count FROM "quiz_questions" WHERE "electionId" = $1`,
      [electionId],
    )) as { count: string }[];

    if (parseInt(existingQuestions[0].count, 10) > 0 && !forceReseed) {
      console.log('Quiz questions already exist. Use --force to reseed.');
      await qr.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed) {
      console.log('Force reseed: clearing existing quiz questions...');
      await qr.query(
        `DELETE FROM "quiz_questions" WHERE "electionId" = $1`,
        [electionId],
      );
      await qr.query(
        `DELETE FROM "quiz_responses" WHERE "electionId" = $1`,
        [electionId],
      );
      console.log('Cleared.');
    }

    // ─── Define quiz questions ─────────────────────────────────────────
    console.log('\n=== Seeding Quiz Questions ===');

    const questions = [
      {
        questionText: 'מהי העדיפות הגבוהה ביותר לראש העיר הבא?',
        questionTextEn: 'What should be the top priority for the next mayor?',
        importanceLevel: 'high',
        category: 'כללי',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'מה עמדתך בנושא הרחבת מערכת התחבורה הציבורית?',
        questionTextEn: 'What is your position on expanding public transportation?',
        importanceLevel: 'high',
        category: 'תחבורה',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'כיצד יש לטפל בבעיית הדיור?',
        questionTextEn: 'How should the housing crisis be addressed?',
        importanceLevel: 'high',
        category: 'דיור',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'מהי הגישה הנכונה לחינוך בעיר?',
        questionTextEn: 'What is the right approach to education in the city?',
        importanceLevel: 'medium',
        category: 'חינוך',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'מה עמדתך בנושא ביטחון הפנים?',
        questionTextEn: 'What is your position on internal security?',
        importanceLevel: 'high',
        category: 'ביטחון',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'כיצד יש לקדם את הכלכלה המקומית?',
        questionTextEn: 'How should the local economy be promoted?',
        importanceLevel: 'medium',
        category: 'כלכלה',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'מה יש לעשות בנושא איכות הסביבה?',
        questionTextEn: 'What should be done about environmental quality?',
        importanceLevel: 'medium',
        category: 'סביבה',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'מהי עמדתך בנושא שירותי הרווחה?',
        questionTextEn: 'What is your position on welfare services?',
        importanceLevel: 'medium',
        category: 'רווחה',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'כיצד יש לפתח את התיירות בעיר?',
        questionTextEn: 'How should tourism in the city be developed?',
        importanceLevel: 'low',
        category: 'תיירות',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
      {
        questionText: 'מה עמדתך בנושא שקיפות ברשות המקומית?',
        questionTextEn: 'What is your position on local government transparency?',
        importanceLevel: 'high',
        category: 'שלטון',
        options: [
          { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
          { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
          { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
          { label: 'תומך', labelEn: 'Agree', value: 4 },
          { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
        ],
      },
    ];

    // ─── Insert quiz questions ─────────────────────────────────────────
    const questionIds: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const result = (await qr.query(
        `INSERT INTO "quiz_questions" (
          "id", "electionId", "questionText", "questionTextEn", "options",
          "importance", "category", "sortOrder", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4,
          $5, $6, $7, true
        ) RETURNING "id"`,
        [
          electionId,
          q.questionText,
          q.questionTextEn,
          JSON.stringify(q.options),
          q.importanceLevel,
          q.category,
          i + 1,
        ],
      )) as { id: string }[];
      questionIds.push(result[0].id);
      console.log(`  -> Q${i + 1}: ${q.questionText.substring(0, 40)}... (${result[0].id.substring(0, 8)})`);
    }

    // ─── Update candidate quizPositions with real question UUIDs ──────
    console.log('\n=== Updating Candidate Quiz Positions ===');

    const candidates = (await qr.query(
      `SELECT "id", "fullName", "quizPositions" FROM "candidates" WHERE "electionId" = $1 ORDER BY "sortOrder" ASC`,
      [electionId],
    )) as { id: string; fullName: string; quizPositions: Record<string, number> }[];

    // Position values per candidate (indexed by question index 0-9)
    // These match the existing seed data values
    const candidatePositionValues: Record<string, number[]> = {
      'דוד כהן':      [5, 3, 4, 2, 5, 1, 4, 3, 5, 2],
      'שרה לוי':      [3, 5, 2, 4, 3, 5, 2, 4, 3, 5],
      'משה אברהם':    [4, 2, 5, 3, 4, 2, 5, 1, 4, 3],
      'יעל מזרחי':    [2, 4, 3, 5, 2, 4, 3, 5, 2, 4],
      'אבי גולדשטיין': [5, 1, 5, 1, 5, 3, 5, 2, 5, 1],
    };

    for (const candidate of candidates) {
      const positionValues = candidatePositionValues[candidate.fullName];
      if (!positionValues) {
        console.log(`  -> Skipping ${candidate.fullName} (no position data)`);
        continue;
      }

      // Build quizPositions map: { [questionUUID]: positionValue }
      const quizPositions: Record<string, number> = {};
      for (let i = 0; i < questionIds.length && i < positionValues.length; i++) {
        quizPositions[questionIds[i]] = positionValues[i];
      }

      await qr.query(
        `UPDATE "candidates" SET "quizPositions" = $1 WHERE "id" = $2`,
        [JSON.stringify(quizPositions), candidate.id],
      );
      console.log(`  -> Updated ${candidate.fullName}: ${Object.keys(quizPositions).length} positions`);
    }

    // ─── Commit ────────────────────────────────────────────────────────
    await qr.commitTransaction();
    console.log('\n=== Quiz Seed Complete ===');
    console.log(`  Questions: ${questionIds.length}`);
    console.log(`  Candidates updated: ${candidates.length}`);
    console.log(`  Election: ${elections[0].title}`);
  } catch (error) {
    await qr.rollbackTransaction();
    console.error('Seed failed, rolling back:', error);
    throw error;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seedQuiz().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
