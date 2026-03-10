import { AppDataSource } from '../data-source';

/**
 * Quiz Responses Seed Script
 *
 * Creates realistic quiz responses from existing app users, computing
 * match results using the same cosine similarity algorithm as the service.
 *
 * Prerequisites: Run seed-quiz.ts first (creates questions + candidate positions).
 *
 * Run:
 *   npx ts-node src/database/seeds/seed-quiz-responses.ts
 *   npx ts-node src/database/seeds/seed-quiz-responses.ts --force   (to re-seed)
 */

// ── Match calculation (mirrors QuizService.computeMatch) ─────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomImportance(): number {
  // Weighted: 1 (low) = 30%, 2 (medium) = 45%, 3 (high) = 25%
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

// ── Main ─────────────────────────────────────────────────────────────────

async function seedQuizResponses() {
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
      console.log('No elections found. Run the main seed first.');
      await qr.rollbackTransaction();
      return;
    }

    const electionId = elections[0].id;
    console.log(`Using election: "${elections[0].title}" (${electionId})`);

    // ─── Load quiz questions ──────────────────────────────────────────
    const questions = (await qr.query(
      `SELECT "id", "questionText", "options" FROM "quiz_questions"
       WHERE "electionId" = $1 AND "isActive" = true
       ORDER BY "sortOrder" ASC`,
      [electionId],
    )) as { id: string; questionText: string; options: any }[];

    if (questions.length === 0) {
      console.log('No quiz questions found. Run seed-quiz.ts first.');
      await qr.rollbackTransaction();
      return;
    }
    console.log(`Found ${questions.length} quiz questions.`);

    // Parse options (may already be an object or a JSON string)
    for (const q of questions) {
      if (typeof q.options === 'string') {
        q.options = JSON.parse(q.options);
      }
    }

    // ─── Load candidates ──────────────────────────────────────────────
    const candidates = (await qr.query(
      `SELECT "id", "fullName", "quizPositions" FROM "candidates"
       WHERE "electionId" = $1 AND "isActive" = true`,
      [electionId],
    )) as { id: string; fullName: string; quizPositions: Record<string, number> | string }[];

    if (candidates.length === 0) {
      console.log('No candidates found for this election.');
      await qr.rollbackTransaction();
      return;
    }
    console.log(`Found ${candidates.length} candidates.`);

    // Parse quizPositions if stored as string
    for (const c of candidates) {
      if (typeof c.quizPositions === 'string') {
        c.quizPositions = JSON.parse(c.quizPositions);
      }
    }

    // ─── Load app users ───────────────────────────────────────────────
    const appUsers = (await qr.query(
      `SELECT "id", "displayName" FROM "app_users" WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 20`,
    )) as { id: string; displayName: string | null }[];

    if (appUsers.length === 0) {
      console.log('No app users found. Run seed-app-users.ts first.');
      await qr.rollbackTransaction();
      return;
    }
    console.log(`Found ${appUsers.length} app users.`);

    // ─── Check existing responses ─────────────────────────────────────
    const existingResponses = (await qr.query(
      `SELECT COUNT(*) as count FROM "quiz_responses" WHERE "electionId" = $1`,
      [electionId],
    )) as { count: string }[];

    if (parseInt(existingResponses[0].count, 10) > 0 && !forceReseed) {
      console.log(
        `${existingResponses[0].count} quiz responses already exist. Use --force to reseed.`,
      );
      await qr.rollbackTransaction();
      return;
    }

    if (forceReseed) {
      console.log('Force reseed: clearing existing quiz responses...');
      await qr.query(
        `DELETE FROM "quiz_responses" WHERE "electionId" = $1`,
        [electionId],
      );
      console.log('Cleared.');
    }

    // ─── Generate quiz responses for each user ────────────────────────
    console.log('\n=== Seeding Quiz Responses ===');

    const optionValues = (questions[0].options as { value: number }[]).map(
      (o) => o.value,
    );
    const minVal = Math.min(...optionValues);
    const maxVal = Math.max(...optionValues);

    let seededCount = 0;
    for (const user of appUsers) {
      // Generate random answers for each question
      const answers = questions.map((q) => ({
        questionId: q.id,
        selectedValue: randomInt(minVal, maxVal),
        importance: randomImportance(),
      }));

      // Compute match results against all candidates
      const matchResults = candidates.map((candidate) => {
        const positions =
          typeof candidate.quizPositions === 'object' && candidate.quizPositions
            ? (candidate.quizPositions as Record<string, number>)
            : {};
        const matchPercentage = computeMatch(answers, positions);
        return {
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          matchPercentage,
        };
      });

      // Sort by match percentage descending
      matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

      // Random completion date in the last 30 days
      const completedAt = randomDate(30);

      // Insert quiz response
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
          completedAt.toISOString(),
        ],
      );

      const topMatch = matchResults[0];
      console.log(
        `  -> ${(user.displayName || 'Anonymous').padEnd(20)} | Best match: ${topMatch.candidateName} (${topMatch.matchPercentage}%)`,
      );
      seededCount++;
    }

    // ─── Commit ────────────────────────────────────────────────────────
    await qr.commitTransaction();
    console.log('\n=== Quiz Responses Seed Complete ===');
    console.log(`  Responses created: ${seededCount}`);
    console.log(`  Questions answered: ${questions.length} per user`);
    console.log(`  Candidates matched: ${candidates.length}`);
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

seedQuizResponses().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
