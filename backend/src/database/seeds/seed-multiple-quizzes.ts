import { AppDataSource } from '../data-source';

/**
 * Multiple Quizzes Seed Script
 *
 * Creates 2 additional elections with candidates, quiz questions,
 * candidate quiz positions, and user quiz responses.
 *
 * Run:
 *   npx ts-node src/database/seeds/seed-multiple-quizzes.ts
 *   npx ts-node src/database/seeds/seed-multiple-quizzes.ts --force
 */

function computeMatch(
  userAnswers: { questionId: string; selectedValue: number; importance: number }[],
  candidatePositions: Record<string, number>,
): number {
  let dotProduct = 0;
  let userMag = 0;
  let candMag = 0;
  for (const answer of userAnswers) {
    const candValue = candidatePositions[answer.questionId] ?? 0;
    const weight = answer.importance;
    const userVal = answer.selectedValue * weight;
    const candVal = candValue * weight;
    dotProduct += userVal * candVal;
    userMag += userVal * userVal;
    candMag += candVal * candVal;
  }
  if (userMag === 0 || candMag === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(userMag) * Math.sqrt(candMag));
  return Math.round(((similarity + 1) / 2) * 100);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomImportance(): number {
  const r = Math.random();
  if (r < 0.3) return 1;
  if (r < 0.75) return 2;
  return 3;
}

function randomDate(daysBack: number): Date {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

// ─── Election definitions ────────────────────────────────────────────────

const ELECTIONS = [
  {
    title: 'סקר עמדות — ביטחון לאומי',
    subtitle: 'סקר עמדות בנושאי ביטחון ומדיניות חוץ',
    description: 'שאלון התאמה בנושאי ביטחון, מדיניות חוץ והגנה — גלה איזה מועמד תואם את עמדותיך',
    status: 'active',
    electionDate: '2026-06-15',
    candidates: [
      { fullName: 'רון בן ישי', slug: 'ron-ben-yishai', district: 'ארצי', position: 'מועמד לראשות', bio: 'מומחה ביטחון לאומי עם ניסיון של 20 שנה' },
      { fullName: 'אורלי לוי', slug: 'orly-levy-sec', district: 'מרכז', position: 'מועמדת', bio: 'שרת ביטחון פנים לשעבר' },
      { fullName: 'יגאל כהן', slug: 'yigal-cohen', district: 'צפון', position: 'מועמד', bio: 'אלוף (מיל.) בצה"ל, מומחה לאסטרטגיה' },
      { fullName: 'דנה פרידמן', slug: 'dana-friedman', district: 'דרום', position: 'מועמדת', bio: 'חוקרת בכירה במכון למחקרי ביטחון לאומי' },
    ],
    questions: [
      { questionText: 'מהי הגישה הנכונה לסכסוך הישראלי-פלסטיני?', questionTextEn: 'What is the right approach to the Israeli-Palestinian conflict?', importance: 'high', category: 'מדיניות חוץ' },
      { questionText: 'האם יש להגדיל את תקציב הביטחון?', questionTextEn: 'Should the defense budget be increased?', importance: 'high', category: 'ביטחון' },
      { questionText: 'מה עמדתך בנושא שירות חובה?', questionTextEn: 'What is your position on mandatory service?', importance: 'medium', category: 'ביטחון' },
      { questionText: 'כיצד יש לטפל באיומי הסייבר?', questionTextEn: 'How should cyber threats be handled?', importance: 'medium', category: 'טכנולוגיה' },
      { questionText: 'האם יש לחזק את הברית עם ארה"ב?', questionTextEn: 'Should the alliance with the US be strengthened?', importance: 'high', category: 'מדיניות חוץ' },
      { questionText: 'מהי עמדתך על הסכמי אברהם?', questionTextEn: 'What is your position on the Abraham Accords?', importance: 'medium', category: 'מדיניות חוץ' },
      { questionText: 'האם יש להרחיב את כיפת הברזל?', questionTextEn: 'Should the Iron Dome be expanded?', importance: 'high', category: 'ביטחון' },
      { questionText: 'כיצד יש לטפל בהברחות בגבולות?', questionTextEn: 'How should border smuggling be handled?', importance: 'medium', category: 'ביטחון' },
    ],
    candidatePositions: [
      [5, 4, 5, 3, 5, 4, 5, 4],
      [3, 2, 3, 4, 4, 5, 3, 2],
      [4, 5, 4, 2, 3, 3, 5, 5],
      [2, 3, 2, 5, 4, 4, 4, 3],
    ],
  },
  {
    title: 'סקר עמדות — כלכלה וחברה',
    subtitle: 'סקר עמדות בנושאי כלכלה, חינוך ורווחה',
    description: 'שאלון התאמה בנושאי כלכלה, חינוך ורווחה חברתית — גלה מי המועמד שמייצג אותך',
    status: 'completed',
    electionDate: '2025-11-20',
    candidates: [
      { fullName: 'תמר זנדברג', slug: 'tamar-zandberg-ec', district: 'מרכז', position: 'מועמדת לראשות', bio: 'כלכלנית בכירה, מומחית למדיניות רווחה' },
      { fullName: 'איתן כבל', slug: 'eitan-cabel-ec', district: 'חיפה', position: 'מועמד', bio: 'יו"ר ועדת הכלכלה לשעבר' },
      { fullName: 'מיכל בירן', slug: 'michal-biran-ec', district: 'תל אביב', position: 'מועמדת', bio: 'מנהלת בכירה בהייטק, תומכת בחדשנות' },
    ],
    questions: [
      { questionText: 'האם יש להעלות את שכר המינימום?', questionTextEn: 'Should the minimum wage be raised?', importance: 'high', category: 'כלכלה' },
      { questionText: 'מהי עמדתך על הפרטת שירותי בריאות?', questionTextEn: 'What is your position on healthcare privatization?', importance: 'high', category: 'בריאות' },
      { questionText: 'כיצד יש לטפל ביוקר המחיה?', questionTextEn: 'How should the cost of living be addressed?', importance: 'high', category: 'כלכלה' },
      { questionText: 'האם יש לחזק את מערכת החינוך הציבורית?', questionTextEn: 'Should the public education system be strengthened?', importance: 'medium', category: 'חינוך' },
      { questionText: 'מהי הגישה הנכונה למשבר הדיור?', questionTextEn: 'What is the right approach to the housing crisis?', importance: 'high', category: 'דיור' },
      { questionText: 'האם יש להגדיל את קצבאות הזקנה?', questionTextEn: 'Should old age pensions be increased?', importance: 'medium', category: 'רווחה' },
    ],
    candidatePositions: [
      [5, 2, 4, 5, 3, 5],
      [3, 4, 3, 3, 4, 3],
      [4, 5, 5, 4, 5, 2],
    ],
  },
];

const STANDARD_OPTIONS = [
  { label: 'מתנגד בתוקף', labelEn: 'Strongly Disagree', value: 1 },
  { label: 'מתנגד', labelEn: 'Disagree', value: 2 },
  { label: 'ניטרלי', labelEn: 'Neutral', value: 3 },
  { label: 'תומך', labelEn: 'Agree', value: 4 },
  { label: 'תומך בחום', labelEn: 'Strongly Agree', value: 5 },
];

async function seedMultipleQuizzes() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const appUsers = (await qr.query(
      `SELECT "id", "displayName" FROM "app_users" WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 15`,
    )) as { id: string; displayName: string | null }[];

    if (appUsers.length === 0) {
      console.log('No app users found. Run seed-app-users.ts first.');
      await qr.rollbackTransaction();
      return;
    }

    for (const elDef of ELECTIONS) {
      console.log(`\n========================================`);
      console.log(`Election: ${elDef.title}`);
      console.log(`========================================`);

      const existing = (await qr.query(
        `SELECT "id" FROM "primary_elections" WHERE "title" = $1`,
        [elDef.title],
      )) as { id: string }[];

      if (existing.length > 0 && !forceReseed) {
        console.log(`  Already exists. Use --force to reseed.`);
        continue;
      }

      if (existing.length > 0 && forceReseed) {
        const eid = existing[0].id;
        console.log(`  Force reseed: cleaning up existing data...`);
        await qr.query(`DELETE FROM "quiz_responses" WHERE "electionId" = $1`, [eid]);
        await qr.query(`DELETE FROM "quiz_questions" WHERE "electionId" = $1`, [eid]);
        await qr.query(`DELETE FROM "candidates" WHERE "electionId" = $1`, [eid]);
        await qr.query(`DELETE FROM "primary_elections" WHERE "id" = $1`, [eid]);
        console.log(`  Cleaned.`);
      }

      // ─── Create election ───────────────────────────────────────────
      const elResult = (await qr.query(
        `INSERT INTO "primary_elections" (
          "id", "title", "subtitle", "description", "status", "electionDate", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, true
        ) RETURNING "id"`,
        [elDef.title, elDef.subtitle, elDef.description, elDef.status, elDef.electionDate],
      )) as { id: string }[];
      const electionId = elResult[0].id;
      console.log(`  Created election: ${electionId}`);

      // ─── Create candidates ─────────────────────────────────────────
      const candidateIds: string[] = [];
      for (let ci = 0; ci < elDef.candidates.length; ci++) {
        const c = elDef.candidates[ci];
        const cResult = (await qr.query(
          `INSERT INTO "candidates" (
            "id", "electionId", "fullName", "slug", "district", "position", "bio", "sortOrder", "isActive"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, true
          ) RETURNING "id"`,
          [electionId, c.fullName, c.slug, c.district, c.position, c.bio, ci + 1],
        )) as { id: string }[];
        candidateIds.push(cResult[0].id);
        console.log(`  Candidate: ${c.fullName} (${cResult[0].id.substring(0, 8)})`);
      }

      // ─── Create quiz questions ─────────────────────────────────────
      const questionIds: string[] = [];
      for (let qi = 0; qi < elDef.questions.length; qi++) {
        const q = elDef.questions[qi];
        const qResult = (await qr.query(
          `INSERT INTO "quiz_questions" (
            "id", "electionId", "questionText", "questionTextEn", "options",
            "importance", "category", "sortOrder", "isActive"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, true
          ) RETURNING "id"`,
          [
            electionId,
            q.questionText,
            q.questionTextEn,
            JSON.stringify(STANDARD_OPTIONS),
            q.importance,
            q.category,
            qi + 1,
          ],
        )) as { id: string }[];
        questionIds.push(qResult[0].id);
        console.log(`  Q${qi + 1}: ${q.questionText.substring(0, 35)}...`);
      }

      // ─── Update candidate quiz positions ───────────────────────────
      for (let ci = 0; ci < candidateIds.length && ci < elDef.candidatePositions.length; ci++) {
        const positions: Record<string, number> = {};
        for (let qi = 0; qi < questionIds.length && qi < elDef.candidatePositions[ci].length; qi++) {
          positions[questionIds[qi]] = elDef.candidatePositions[ci][qi];
        }
        await qr.query(
          `UPDATE "candidates" SET "quizPositions" = $1 WHERE "id" = $2`,
          [JSON.stringify(positions), candidateIds[ci]],
        );
        console.log(`  Updated positions for candidate ${ci + 1}`);
      }

      // ─── Create quiz responses ─────────────────────────────────────
      console.log(`  Generating quiz responses...`);
      const userCount = randomInt(8, Math.min(12, appUsers.length));
      const shuffled = [...appUsers].sort(() => Math.random() - 0.5).slice(0, userCount);

      for (const user of shuffled) {
        const answers = questionIds.map((qId) => ({
          questionId: qId,
          selectedValue: randomInt(1, 5),
          importance: randomImportance(),
        }));

        const matchResults = candidateIds.map((cId, ci) => {
          const positions: Record<string, number> = {};
          for (let qi = 0; qi < questionIds.length && qi < elDef.candidatePositions[ci].length; qi++) {
            positions[questionIds[qi]] = elDef.candidatePositions[ci][qi];
          }
          return {
            candidateId: cId,
            candidateName: elDef.candidates[ci].fullName,
            matchPercentage: computeMatch(answers, positions),
          };
        });
        matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

        await qr.query(
          `INSERT INTO "quiz_responses" (
            "id", "userId", "electionId", "answers", "matchResults", "completedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5
          )
          ON CONFLICT ("userId", "electionId")
          DO UPDATE SET "answers" = $3, "matchResults" = $4, "completedAt" = $5`,
          [
            user.id,
            electionId,
            JSON.stringify(answers),
            JSON.stringify(matchResults),
            randomDate(60).toISOString(),
          ],
        );
      }
      console.log(`  Created ${shuffled.length} quiz responses.`);
    }

    await qr.commitTransaction();
    console.log('\n=== Multiple Quizzes Seed Complete ===');
  } catch (error) {
    await qr.rollbackTransaction();
    console.error('Seed failed, rolling back:', error);
    throw error;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seedMultipleQuizzes().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
