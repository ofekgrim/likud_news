import { AppDataSource } from '../data-source';

/**
 * Seed script for the Candidate Matcher module.
 *
 * Seeds: policy_statements, candidate_positions,
 *        member_quiz_responses, quiz_match_results
 *
 * Prerequisites: seed-candidates.ts must have been run first (needs election + candidates).
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-candidate-matcher.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-candidate-matcher.ts --force  # replace existing
 */

// ── Policy Statement data ────────────────────────────────────────────────────

type PolicyCategory =
  | 'security'
  | 'economy'
  | 'judiciary'
  | 'housing'
  | 'social'
  | 'foreign';

type PositionValue = 'agree' | 'neutral' | 'disagree';
type QuizAnswer = 'agree' | 'disagree' | 'skip';

interface PolicyStatementSeed {
  textHe: string;
  textEn: string;
  category: PolicyCategory;
  defaultWeight: number;
  sortOrder: number;
}

const policyStatements: PolicyStatementSeed[] = [
  // ── security (4) ─────────────────────────────────────────────────────
  {
    textHe: 'יש להגדיל את תקציב הביטחון ולחזק את צה"ל כצבא ההגנה המוביל באזור',
    textEn: 'The defense budget should be increased to strengthen the IDF as the leading military in the region',
    category: 'security',
    defaultWeight: 1.0,
    sortOrder: 0,
  },
  {
    textHe: 'יש לפעול באופן צבאי נגד תוכנית הגרעין של איראן אם הדיפלומטיה נכשלת',
    textEn: 'Military action should be taken against Iran\'s nuclear program if diplomacy fails',
    category: 'security',
    defaultWeight: 1.0,
    sortOrder: 1,
  },
  {
    textHe: 'יש להרחיב את ההתיישבות ביהודה ושומרון כחלק מהריבונות הישראלית',
    textEn: 'Settlements in Judea and Samaria should be expanded as part of Israeli sovereignty',
    category: 'security',
    defaultWeight: 1.0,
    sortOrder: 2,
  },
  {
    textHe: 'יש לחייב שירות צבאי או לאומי לכלל האוכלוסייה ללא חריגים',
    textEn: 'Mandatory military or national service should apply to all citizens without exceptions',
    category: 'security',
    defaultWeight: 1.0,
    sortOrder: 3,
  },

  // ── economy (4) ──────────────────────────────────────────────────────
  {
    textHe: 'יש להוריד את נטל המס על מעמד הביניים ולעודד צמיחה כלכלית',
    textEn: 'The tax burden on the middle class should be reduced to encourage economic growth',
    category: 'economy',
    defaultWeight: 1.0,
    sortOrder: 4,
  },
  {
    textHe: 'יש לפעול להורדת מחירי הדיור באמצעות הגדלת היצע הקרקעות',
    textEn: 'Housing prices should be reduced by increasing land supply',
    category: 'economy',
    defaultWeight: 1.0,
    sortOrder: 5,
  },
  {
    textHe: 'יש לטפל ביוקר המחיה באמצעות הסרת חסמים רגולטוריים וייבוא מקביל',
    textEn: 'The cost of living should be addressed by removing regulatory barriers and allowing parallel imports',
    category: 'economy',
    defaultWeight: 1.0,
    sortOrder: 6,
  },
  {
    textHe: 'יש להשקיע בתעשיית ההייטק ולתמוך בסטארטאפים ישראליים כמנוע צמיחה מרכזי',
    textEn: 'Investment in the tech sector and support for Israeli startups should be a key growth engine',
    category: 'economy',
    defaultWeight: 1.0,
    sortOrder: 7,
  },

  // ── judiciary (3) ────────────────────────────────────────────────────
  {
    textHe: 'יש לקדם רפורמה משפטית שתחזק את הרשות המחוקקת מול בית המשפט העליון',
    textEn: 'Judicial reform should be advanced to strengthen the legislature relative to the Supreme Court',
    category: 'judiciary',
    defaultWeight: 1.0,
    sortOrder: 8,
  },
  {
    textHe: 'יש לשנות את שיטת בחירת שופטי בית המשפט העליון ולהגביר פיקוח ציבורי',
    textEn: 'The method of selecting Supreme Court justices should be changed to increase public oversight',
    category: 'judiciary',
    defaultWeight: 1.0,
    sortOrder: 9,
  },
  {
    textHe: 'יש לצמצם את סמכויות היועץ המשפטי לממשלה ולהפוך את חוות דעתו למייעצת',
    textEn: 'The Attorney General\'s powers should be reduced, making opinions advisory rather than binding',
    category: 'judiciary',
    defaultWeight: 1.0,
    sortOrder: 10,
  },

  // ── housing (3) ──────────────────────────────────────────────────────
  {
    textHe: 'יש להקים מסגרת ממשלתית לבנייה מואצת כדי לפתור את משבר הדיור',
    textEn: 'A government framework for accelerated construction should be established to solve the housing crisis',
    category: 'housing',
    defaultWeight: 1.0,
    sortOrder: 11,
  },
  {
    textHe: 'יש להרחיב את היצע הדיור הציבורי ולהבטיח דירות בשכר דירה נמוך',
    textEn: 'Public housing supply should be expanded to ensure affordable rental apartments',
    category: 'housing',
    defaultWeight: 1.0,
    sortOrder: 12,
  },
  {
    textHe: 'יש להפעיל פיקוח על שכר דירה באזורי ביקוש כדי להגן על שוכרים',
    textEn: 'Rent control should be implemented in high-demand areas to protect tenants',
    category: 'housing',
    defaultWeight: 1.0,
    sortOrder: 13,
  },

  // ── social (3) ───────────────────────────────────────────────────────
  {
    textHe: 'יש להגדיל את ההשקעה במערכת החינוך ולשפר את תנאי העסקת המורים',
    textEn: 'Investment in the education system should be increased and teacher employment conditions improved',
    category: 'social',
    defaultWeight: 1.0,
    sortOrder: 14,
  },
  {
    textHe: 'יש לחזק את מערכת הבריאות הציבורית ולקצר תורים לטיפולים רפואיים',
    textEn: 'The public healthcare system should be strengthened and waiting times for medical treatments reduced',
    category: 'social',
    defaultWeight: 1.0,
    sortOrder: 15,
  },
  {
    textHe: 'יש להרחיב את רשת הביטחון הסוציאלי ולהעלות את קצבאות הרווחה',
    textEn: 'The social safety net should be expanded and welfare benefits increased',
    category: 'social',
    defaultWeight: 1.0,
    sortOrder: 16,
  },

  // ── foreign (3) ──────────────────────────────────────────────────────
  {
    textHe: 'יש להמשיך ולהרחיב את הסכמי אברהם ולקדם נורמליזציה עם מדינות ערב נוספות',
    textEn: 'The Abraham Accords should be expanded to promote normalization with additional Arab states',
    category: 'foreign',
    defaultWeight: 1.0,
    sortOrder: 17,
  },
  {
    textHe: 'יש לצמצם את מעורבות ישראל בארגונים בינלאומיים שמפגינים משוא פנים נגדה',
    textEn: 'Israel should reduce involvement in international organizations that show bias against it',
    category: 'foreign',
    defaultWeight: 1.0,
    sortOrder: 18,
  },
  {
    textHe: 'יש לחזק את הברית האסטרטגית עם ארה"ב תוך שמירה על עצמאות מדינית מלאה',
    textEn: 'The strategic alliance with the US should be strengthened while maintaining full political independence',
    category: 'foreign',
    defaultWeight: 1.0,
    sortOrder: 19,
  },
];

// ── Candidate position profiles ──────────────────────────────────────────────
// Maps candidate fullName to a "lean" per category, used to generate positions.
// 'hawk' = mostly agree on that category, 'dove' = mostly disagree, 'mixed' = neutral/varied

type Lean = 'hawk' | 'dove' | 'mixed';

interface CandidateProfile {
  fullName: string;
  categoryLeans: Record<PolicyCategory, Lean>;
}

const candidateProfiles: CandidateProfile[] = [
  {
    fullName: 'בנימין נתניהו',
    categoryLeans: { security: 'hawk', economy: 'hawk', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'ישראל כ"ץ',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'יולי אדלשטיין',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'mixed', housing: 'hawk', social: 'hawk', foreign: 'mixed' },
  },
  {
    fullName: 'ניר ברקת',
    categoryLeans: { security: 'mixed', economy: 'hawk', judiciary: 'mixed', housing: 'hawk', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'יואב גלנט',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'dove', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'מירי רגב',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'mixed', social: 'hawk', foreign: 'mixed' },
  },
  {
    fullName: 'גדעון סער',
    categoryLeans: { security: 'hawk', economy: 'hawk', judiciary: 'dove', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'אבי דיכטר',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'דוד ביטן',
    categoryLeans: { security: 'mixed', economy: 'mixed', judiciary: 'hawk', housing: 'hawk', social: 'mixed', foreign: 'mixed' },
  },
  {
    fullName: 'שלמה קרעי',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'mixed' },
  },
  {
    fullName: 'אופיר אקוניס',
    categoryLeans: { security: 'hawk', economy: 'hawk', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'חיים כץ',
    categoryLeans: { security: 'mixed', economy: 'mixed', judiciary: 'mixed', housing: 'hawk', social: 'hawk', foreign: 'mixed' },
  },
  {
    fullName: 'צחי הנגבי',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'mixed', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'עמיר אוחנה',
    categoryLeans: { security: 'hawk', economy: 'hawk', judiciary: 'hawk', housing: 'mixed', social: 'hawk', foreign: 'mixed' },
  },
  {
    fullName: 'מאי גולן',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'hawk', social: 'hawk', foreign: 'mixed' },
  },
  {
    fullName: 'דני דנון',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'בועז ביסמוט',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'mixed' },
  },
  {
    fullName: 'אריאל קלנר',
    categoryLeans: { security: 'hawk', economy: 'hawk', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    fullName: 'תלי גוטליב',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'hawk', social: 'hawk', foreign: 'mixed' },
  },
  {
    fullName: 'פאטין מולא',
    categoryLeans: { security: 'mixed', economy: 'mixed', judiciary: 'mixed', housing: 'hawk', social: 'hawk', foreign: 'hawk' },
  },
];

// ── Sample quiz-taker profiles ───────────────────────────────────────────────
// Each simulates a citizen with a consistent political lean per category.

interface QuizTakerProfile {
  deviceId: string;
  label: string;
  categoryLeans: Record<PolicyCategory, Lean>;
}

const quizTakerProfiles: QuizTakerProfile[] = [
  {
    deviceId: 'device-seed-aaa111',
    label: 'ביטחוניסט',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
  {
    deviceId: 'device-seed-bbb222',
    label: 'כלכלן חופשי',
    categoryLeans: { security: 'mixed', economy: 'hawk', judiciary: 'mixed', housing: 'dove', social: 'dove', foreign: 'hawk' },
  },
  {
    deviceId: 'device-seed-ccc333',
    label: 'חברתי',
    categoryLeans: { security: 'mixed', economy: 'dove', judiciary: 'dove', housing: 'hawk', social: 'hawk', foreign: 'mixed' },
  },
  {
    deviceId: 'device-seed-ddd444',
    label: 'ליכודניק קלאסי',
    categoryLeans: { security: 'hawk', economy: 'hawk', judiciary: 'hawk', housing: 'hawk', social: 'mixed', foreign: 'hawk' },
  },
  {
    deviceId: 'device-seed-eee555',
    label: 'מתון',
    categoryLeans: { security: 'dove', economy: 'mixed', judiciary: 'dove', housing: 'mixed', social: 'hawk', foreign: 'mixed' },
  },
  {
    deviceId: 'device-seed-fff666',
    label: 'צעיר עירוני',
    categoryLeans: { security: 'mixed', economy: 'hawk', judiciary: 'mixed', housing: 'hawk', social: 'hawk', foreign: 'mixed' },
  },
  {
    deviceId: 'device-seed-ggg777',
    label: 'פריפריה',
    categoryLeans: { security: 'hawk', economy: 'mixed', judiciary: 'hawk', housing: 'hawk', social: 'hawk', foreign: 'mixed' },
  },
  {
    deviceId: 'device-seed-hhh888',
    label: 'דיפלומט',
    categoryLeans: { security: 'mixed', economy: 'mixed', judiciary: 'dove', housing: 'mixed', social: 'mixed', foreign: 'hawk' },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Deterministic-ish position from a lean + a per-statement variance index. */
function positionFromLean(lean: Lean, idx: number): PositionValue {
  if (lean === 'hawk') {
    // Mostly agree, occasionally neutral
    return idx % 5 === 0 ? 'neutral' : 'agree';
  }
  if (lean === 'dove') {
    // Mostly disagree, occasionally neutral
    return idx % 5 === 0 ? 'neutral' : 'disagree';
  }
  // mixed: cycle through all three
  const cycle: PositionValue[] = ['agree', 'neutral', 'disagree', 'agree', 'neutral'];
  return cycle[idx % cycle.length];
}

/** Quiz answer derived from a lean, with occasional skips. */
function quizAnswerFromLean(lean: Lean, idx: number): QuizAnswer {
  // 15% skip rate on mixed topics
  if (lean === 'mixed' && idx % 7 === 0) return 'skip';
  if (lean === 'hawk') return 'agree';
  if (lean === 'dove') return 'disagree';
  // mixed: alternate
  return idx % 2 === 0 ? 'agree' : 'disagree';
}

/** Importance weight: hawk/dove categories get higher weight, mixed get lower. */
function importanceFromLean(lean: Lean): number {
  if (lean === 'hawk') return 1.0;
  if (lean === 'dove') return 0.9;
  return 0.6;
}

// ── Main seed function ───────────────────────────────────────────────────────

async function seedCandidateMatcher() {
  const forceReseed = process.argv.includes('--force');
  console.log('מתחבר למסד הנתונים...');
  await AppDataSource.initialize();
  console.log('מחובר.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Resolve election ───────────────────────────────────────────────
    const existingElections = (await queryRunner.query(
      `SELECT "id" FROM "primary_elections" ORDER BY "createdAt" DESC LIMIT 1`,
    )) as { id: string }[];

    if (existingElections.length === 0) {
      console.error('לא נמצאו בחירות! יש להריץ קודם את seed-candidates.ts');
      await queryRunner.rollbackTransaction();
      process.exit(1);
    }

    const electionId = existingElections[0].id;
    console.log(`משתמש בבחירות: ${electionId}`);

    // ── Resolve candidates ─────────────────────────────────────────────
    const candidates = (await queryRunner.query(
      `SELECT "id", "fullName" FROM "candidates" WHERE "electionId" = $1 AND "isActive" = true ORDER BY "sortOrder"`,
      [electionId],
    )) as { id: string; fullName: string }[];

    if (candidates.length === 0) {
      console.error('לא נמצאו מועמדים! יש להריץ קודם את seed-candidates.ts');
      await queryRunner.rollbackTransaction();
      process.exit(1);
    }

    console.log(`נמצאו ${candidates.length} מועמדים.`);

    // ── Check existing data ────────────────────────────────────────────
    const existingStatements = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "policy_statements" WHERE "electionId" = $1`,
      [electionId],
    )) as { count: string }[];
    const statementsCount = parseInt(existingStatements[0].count, 10);

    if (statementsCount > 0 && !forceReseed) {
      console.log(
        `כבר קיימים ${statementsCount} היגדי מדיניות. השתמש ב--force כדי לזרוע מחדש.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && statementsCount > 0) {
      console.log('מוחק נתוני candidate matcher קיימים...');
      // Delete in FK order: results -> responses -> positions -> statements
      await queryRunner.query(
        `DELETE FROM "quiz_match_results" WHERE "electionId" = $1`,
        [electionId],
      );
      await queryRunner.query(
        `DELETE FROM "member_quiz_responses" WHERE "electionId" = $1`,
        [electionId],
      );
      await queryRunner.query(
        `DELETE FROM "candidate_positions" WHERE "statementId" IN (SELECT "id" FROM "policy_statements" WHERE "electionId" = $1)`,
        [electionId],
      );
      await queryRunner.query(
        `DELETE FROM "policy_statements" WHERE "electionId" = $1`,
        [electionId],
      );
      console.log('נוקה בהצלחה.');
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. POLICY STATEMENTS
    // ══════════════════════════════════════════════════════════════════════
    console.log(`\nזורע ${policyStatements.length} היגדי מדיניות...`);

    const insertedStatementIds: string[] = [];

    for (const stmt of policyStatements) {
      const result = await queryRunner.query(
        `INSERT INTO "policy_statements"
           ("id", "textHe", "textEn", "category", "defaultWeight", "isActive", "sortOrder", "electionId")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, true, $5, $6)
         RETURNING "id"`,
        [stmt.textHe, stmt.textEn, stmt.category, stmt.defaultWeight, stmt.sortOrder, electionId],
      );
      insertedStatementIds.push(result[0].id);
      console.log(`  ${stmt.sortOrder + 1}. [${stmt.category}] ${stmt.textHe.substring(0, 50)}...`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. CANDIDATE POSITIONS
    // ══════════════════════════════════════════════════════════════════════
    console.log(`\nזורע עמדות מועמדים...`);

    let positionsInserted = 0;

    for (const candidate of candidates) {
      // Find the matching profile or use a default mixed profile
      const profile = candidateProfiles.find((p) => p.fullName === candidate.fullName);
      const leans = profile?.categoryLeans ?? {
        security: 'mixed' as Lean,
        economy: 'mixed' as Lean,
        judiciary: 'mixed' as Lean,
        housing: 'mixed' as Lean,
        social: 'mixed' as Lean,
        foreign: 'mixed' as Lean,
      };

      for (let sIdx = 0; sIdx < policyStatements.length; sIdx++) {
        const stmt = policyStatements[sIdx];
        const statementId = insertedStatementIds[sIdx];
        const lean = leans[stmt.category];
        const position = positionFromLean(lean, sIdx);

        await queryRunner.query(
          `INSERT INTO "candidate_positions"
             ("id", "candidateId", "statementId", "position", "justificationHe")
           VALUES
             (uuid_generate_v4(), $1, $2, $3, $4)`,
          [candidate.id, statementId, position, null],
        );

        positionsInserted++;
      }

      const profileLabel = profile ? 'matched' : 'default';
      console.log(`  ${candidate.fullName} — ${policyStatements.length} עמדות (${profileLabel})`);
    }

    console.log(`סה"כ עמדות מועמדים: ${positionsInserted}`);

    // ══════════════════════════════════════════════════════════════════════
    // 3. SAMPLE QUIZ RESPONSES
    // ══════════════════════════════════════════════════════════════════════
    console.log(`\nזורע ${quizTakerProfiles.length} תשובות שאלון לדוגמה...`);

    // Store answers per device for match computation
    const deviceAnswers: Map<
      string,
      Array<{ statementId: string; answer: QuizAnswer; weight: number; category: PolicyCategory }>
    > = new Map();

    for (const taker of quizTakerProfiles) {
      const answers: Array<{
        statementId: string;
        answer: QuizAnswer;
        weight: number;
        category: PolicyCategory;
      }> = [];

      for (let sIdx = 0; sIdx < policyStatements.length; sIdx++) {
        const stmt = policyStatements[sIdx];
        const statementId = insertedStatementIds[sIdx];
        const lean = taker.categoryLeans[stmt.category];
        const answer = quizAnswerFromLean(lean, sIdx);
        const weight = importanceFromLean(lean);

        await queryRunner.query(
          `INSERT INTO "member_quiz_responses"
             ("id", "appUserId", "deviceId", "statementId", "electionId", "answer", "importanceWeight")
           VALUES
             (uuid_generate_v4(), NULL, $1, $2, $3, $4, $5)`,
          [taker.deviceId, statementId, electionId, answer, weight],
        );

        answers.push({ statementId, answer, weight, category: stmt.category });
      }

      deviceAnswers.set(taker.deviceId, answers);
      console.log(`  ${taker.label} (${taker.deviceId}) — ${policyStatements.length} תשובות`);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. MATCH RESULTS
    // ══════════════════════════════════════════════════════════════════════
    console.log(`\nמחשב ומזרע תוצאות התאמה...`);

    let matchesInserted = 0;

    // Preload candidate positions into memory for computation
    const candidatePositionsMap: Map<string, Map<string, PositionValue>> = new Map();

    for (const candidate of candidates) {
      const profile = candidateProfiles.find((p) => p.fullName === candidate.fullName);
      const leans = profile?.categoryLeans ?? {
        security: 'mixed' as Lean,
        economy: 'mixed' as Lean,
        judiciary: 'mixed' as Lean,
        housing: 'mixed' as Lean,
        social: 'mixed' as Lean,
        foreign: 'mixed' as Lean,
      };

      const posMap = new Map<string, PositionValue>();
      for (let sIdx = 0; sIdx < policyStatements.length; sIdx++) {
        const stmt = policyStatements[sIdx];
        const statementId = insertedStatementIds[sIdx];
        const lean = leans[stmt.category];
        posMap.set(statementId, positionFromLean(lean, sIdx));
      }
      candidatePositionsMap.set(candidate.id, posMap);
    }

    for (const taker of quizTakerProfiles) {
      const answers = deviceAnswers.get(taker.deviceId)!;
      const candidateScores: Array<{
        candidateId: string;
        fullName: string;
        matchPct: number;
        categoryBreakdown: Record<string, number>;
      }> = [];

      for (const candidate of candidates) {
        const posMap = candidatePositionsMap.get(candidate.id)!;

        // Per-category weighted scores
        const categoryScores: Record<string, { totalWeight: number; matchWeight: number }> = {};

        for (const ans of answers) {
          if (ans.answer === 'skip') continue;

          const candidatePos = posMap.get(ans.statementId)!;

          if (!categoryScores[ans.category]) {
            categoryScores[ans.category] = { totalWeight: 0, matchWeight: 0 };
          }
          categoryScores[ans.category].totalWeight += ans.weight;

          // Scoring: agree+agree=1.0, disagree+disagree=1.0, agree+neutral=0.5, disagree+neutral=0.5, agree+disagree=0.0
          let score = 0;
          if (
            (ans.answer === 'agree' && candidatePos === 'agree') ||
            (ans.answer === 'disagree' && candidatePos === 'disagree')
          ) {
            score = 1.0;
          } else if (candidatePos === 'neutral') {
            score = 0.5;
          } else if (
            (ans.answer === 'agree' && candidatePos === 'disagree') ||
            (ans.answer === 'disagree' && candidatePos === 'agree')
          ) {
            score = 0.0;
          }

          categoryScores[ans.category].matchWeight += score * ans.weight;
        }

        // Compute breakdown and overall
        const categoryBreakdown: Record<string, number> = {};
        let overallMatchWeight = 0;
        let overallTotalWeight = 0;

        for (const [cat, scores] of Object.entries(categoryScores)) {
          const catPct =
            scores.totalWeight > 0
              ? Math.round((scores.matchWeight / scores.totalWeight) * 100)
              : 0;
          categoryBreakdown[cat] = catPct;
          overallMatchWeight += scores.matchWeight;
          overallTotalWeight += scores.totalWeight;
        }

        const matchPct =
          overallTotalWeight > 0
            ? Math.round((overallMatchWeight / overallTotalWeight) * 100)
            : 0;

        candidateScores.push({
          candidateId: candidate.id,
          fullName: candidate.fullName,
          matchPct,
          categoryBreakdown,
        });
      }

      // Insert match results for all candidates
      for (const cs of candidateScores) {
        await queryRunner.query(
          `INSERT INTO "quiz_match_results"
             ("id", "appUserId", "deviceId", "candidateId", "electionId", "matchPct", "categoryBreakdown")
           VALUES
             (uuid_generate_v4(), NULL, $1, $2, $3, $4, $5::jsonb)`,
          [
            taker.deviceId,
            cs.candidateId,
            electionId,
            cs.matchPct,
            JSON.stringify(cs.categoryBreakdown),
          ],
        );
        matchesInserted++;
      }

      // Print top 3 matches for this quiz taker
      const sorted = [...candidateScores].sort((a, b) => b.matchPct - a.matchPct);
      const top3 = sorted.slice(0, 3).map((s) => `${s.fullName} (${s.matchPct}%)`);
      console.log(`  ${taker.label}: ${top3.join(', ')}`);
    }

    console.log(`סה"כ תוצאות התאמה: ${matchesInserted}`);

    // ── Commit ──────────────────────────────────────────────────────────
    await queryRunner.commitTransaction();

    // ── Summary ─────────────────────────────────────────────────────────
    console.log('\n=== סיכום זריעת Candidate Matcher ===');
    console.log(`  היגדי מדיניות:     ${policyStatements.length}`);
    console.log(`  עמדות מועמדים:     ${positionsInserted}`);
    console.log(`  תשובות שאלון:      ${quizTakerProfiles.length * policyStatements.length}`);
    console.log(`  תוצאות התאמה:      ${matchesInserted}`);
    console.log(`  מועמדים:           ${candidates.length}`);
    console.log(`  נבדקים לדוגמה:     ${quizTakerProfiles.length}`);

    // Category breakdown
    console.log('\n  היגדים לפי קטגוריה:');
    const catCounts: Record<string, number> = {};
    for (const s of policyStatements) {
      catCounts[s.category] = (catCounts[s.category] || 0) + 1;
    }
    for (const [cat, cnt] of Object.entries(catCounts)) {
      console.log(`    ${cat.padEnd(12)} ${cnt}`);
    }

    console.log('\nהזריעה הושלמה בהצלחה!');
  } catch (error) {
    console.error('הזריעה נכשלה, מבצע rollback:', error);
    await queryRunner.rollbackTransaction();
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

void seedCandidateMatcher();
