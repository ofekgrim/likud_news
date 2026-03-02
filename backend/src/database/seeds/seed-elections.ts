import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';

/**
 * Election Seed Script
 *
 * Creates:
 *   1. App user (verified member) with phone-based OTP login
 *   2. Primary Election with 'active' status
 *   3. 5 Candidates with bios, photos, social links, quiz positions
 *   4. 10 Quiz Questions (political topics)
 *   5. 5 Polling Stations across Israel
 *   6. Election Results for each candidate
 *   7. 3 Turnout Snapshots (morning, noon, afternoon)
 *   8. 3 Community Polls
 *   9. 3 Campaign Events
 *  10. Gamification data (points, badges) for the test user
 *  11. Endorsement + Quiz response + Poll vote + Event RSVP for the test user
 *
 * Run:
 *   npx ts-node src/database/seeds/seed-elections.ts
 *   npx ts-node src/database/seeds/seed-elections.ts --force   (to re-seed)
 */

async function seedElections() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ─── Check if already seeded ──────────────────────────────────────
    const existing = (await qr.query(
      `SELECT COUNT(*) as count FROM "primary_elections"`,
    )) as { count: string }[];

    if (parseInt(existing[0].count, 10) > 0 && !forceReseed) {
      console.log('Election data already seeded. Use --force to reseed.');
      await qr.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed && parseInt(existing[0].count, 10) > 0) {
      console.log('Force reseed: clearing election data...');
      // Delete in reverse dependency order
      await qr.query('DELETE FROM "user_points"');
      await qr.query('DELETE FROM "user_badges"');
      await qr.query('DELETE FROM "event_rsvps"');
      await qr.query('DELETE FROM "poll_votes"');
      await qr.query('DELETE FROM "station_reports"');
      await qr.query('DELETE FROM "quiz_responses"');
      await qr.query('DELETE FROM "candidate_endorsements"');
      await qr.query('DELETE FROM "turnout_snapshots"');
      await qr.query('DELETE FROM "election_results"');
      await qr.query('DELETE FROM "campaign_events"');
      await qr.query('DELETE FROM "community_polls"');
      await qr.query('DELETE FROM "quiz_questions"');
      await qr.query('DELETE FROM "polling_stations"');
      await qr.query('DELETE FROM "candidates"');
      await qr.query('DELETE FROM "primary_elections"');
      // Don't delete app_users — they may have other data
      console.log('Election data cleared.');
    }

    const now = new Date();

    // ═══════════════════════════════════════════════════════════════════
    // 1. APP USER (Test User — Verified Member)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding App User ===');

    const passwordHash = await bcrypt.hash('Test1234!', 12);
    const deviceId = 'seed-device-001';

    // Check if test user already exists
    const existingUser = (await qr.query(
      `SELECT "id" FROM "app_users" WHERE "deviceId" = $1`,
      [deviceId],
    )) as { id: string }[];

    let userId: string;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log(`  -> Test user already exists: ${userId}`);
    } else {
      const userResult = (await qr.query(
        `INSERT INTO "app_users" (
          "id", "deviceId", "phone", "email", "passwordHash",
          "displayName", "avatarUrl", "bio",
          "role", "membershipId", "membershipStatus", "membershipVerifiedAt",
          "preferredCategories", "notificationPrefs", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4,
          $5, $6, $7,
          'verified_member', $8, 'verified', NOW(),
          '{}', '{}', true
        ) RETURNING "id"`,
        [
          deviceId,
          '0501234567',
          'test@likud.org.il',
          passwordHash,
          'ישראל ישראלי',
          null,
          'חבר ליכוד פעיל ומעורב',
          'LK-2024-00001',
        ],
      )) as { id: string }[];
      userId = userResult[0].id;
      console.log(`  -> Created test user: ${userId} (phone: 0501234567)`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. PRIMARY ELECTION
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Primary Election ===');

    const electionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const registrationDeadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

    const electionResult = (await qr.query(
      `INSERT INTO "primary_elections" (
        "id", "title", "subtitle", "description",
        "electionDate", "registrationDeadline",
        "status", "isActive"
      ) VALUES (
        uuid_generate_v4(),
        $1, $2, $3,
        $4, $5,
        'active', true
      ) RETURNING "id"`,
      [
        'בחירות מקדימות לליכוד 2026',
        'הכרעה על מועמד הליכוד לראשות העיר',
        'בחירות מקדימות לבחירת מועמד הליכוד לראשות העירייה. כל חבר מפלגה רשום זכאי להצביע.',
        electionDate.toISOString(),
        registrationDeadline.toISOString(),
      ],
    )) as { id: string }[];
    const electionId = electionResult[0].id;
    console.log(`  -> Created election: ${electionId}`);

    // ═══════════════════════════════════════════════════════════════════
    // 3. CANDIDATES (5)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Candidates ===');

    const candidatesData = [
      {
        fullName: 'דוד כהן',
        slug: 'david-cohen',
        district: 'מרכז',
        position: 'סגן ראש העיר',
        bio: 'בעל ניסיון של 15 שנה בניהול מוניציפלי. שימש כסגן ראש העיר בקדנציה האחרונה וקידם פרויקטים משמעותיים בתחום התחבורה והחינוך.',
        phone: '0521111111',
        email: 'david@likud-candidate.co.il',
        website: 'https://david-cohen.co.il',
        socialLinks: { twitter: 'https://twitter.com/davidcohen', facebook: 'https://facebook.com/davidcohen' },
        quizPositions: { q1: 5, q2: 3, q3: 4, q4: 2, q5: 5, q6: 1, q7: 4, q8: 3, q9: 5, q10: 2 },
        sortOrder: 1,
      },
      {
        fullName: 'שרה לוי',
        slug: 'sarah-levi',
        district: 'צפון',
        position: 'חברת מועצת העיר',
        bio: 'חברת מועצת העיר מזה שתי קדנציות. מתמחה בנושאי חינוך ורווחה חברתית. יזמה את תוכנית הזנה חינמית בבתי הספר.',
        phone: '0522222222',
        email: 'sarah@likud-candidate.co.il',
        website: 'https://sarah-levi.co.il',
        socialLinks: { twitter: 'https://twitter.com/sarahlevi', instagram: 'https://instagram.com/sarahlevi' },
        quizPositions: { q1: 3, q2: 5, q3: 2, q4: 4, q5: 3, q6: 5, q7: 2, q8: 4, q9: 3, q10: 5 },
        sortOrder: 2,
      },
      {
        fullName: 'משה אברהם',
        slug: 'moshe-avraham',
        district: 'דרום',
        position: 'עורך דין ואיש עסקים',
        bio: 'עורך דין בכיר עם התמחות במשפט מוניציפלי. הקים ומנהל משרד עורכי דין מוביל. פעיל בקהילה ומתנדב בעמותות חברתיות.',
        phone: '0523333333',
        email: 'moshe@likud-candidate.co.il',
        website: 'https://moshe-avraham.co.il',
        socialLinks: { facebook: 'https://facebook.com/mosheavraham' },
        quizPositions: { q1: 4, q2: 2, q3: 5, q4: 3, q5: 4, q6: 2, q7: 5, q8: 1, q9: 4, q10: 3 },
        sortOrder: 3,
      },
      {
        fullName: 'יעל מזרחי',
        slug: 'yael-mizrachi',
        district: 'מערב',
        position: 'ראש אגף החינוך',
        bio: 'מנהלת אגף החינוך בעירייה בעשור האחרון. הובילה מהפכה דיגיטלית בבתי הספר ושדרגה את תשתיות החינוך ברחבי העיר.',
        phone: '0524444444',
        email: 'yael@likud-candidate.co.il',
        website: null,
        socialLinks: { instagram: 'https://instagram.com/yaelmizrachi', twitter: 'https://twitter.com/yaelm' },
        quizPositions: { q1: 2, q2: 4, q3: 3, q4: 5, q5: 2, q6: 4, q7: 3, q8: 5, q9: 2, q10: 4 },
        sortOrder: 4,
      },
      {
        fullName: 'אבי גולדשטיין',
        slug: 'avi-goldstein',
        district: 'מזרח',
        position: 'קצין בכיר בדימוס',
        bio: 'קצין בכיר בדימוס בצה"ל, שירת 25 שנה בצבא ועסק בתכנון אסטרטגי. לאחר שחרורו הקדיש את זמנו לפעילות ציבורית ולקידום ביטחון הפנים.',
        phone: '0525555555',
        email: 'avi@likud-candidate.co.il',
        website: 'https://avi-goldstein.co.il',
        socialLinks: { twitter: 'https://twitter.com/avigold', facebook: 'https://facebook.com/avigoldstein' },
        quizPositions: { q1: 5, q2: 1, q3: 5, q4: 1, q5: 5, q6: 3, q7: 5, q8: 2, q9: 5, q10: 1 },
        sortOrder: 5,
      },
    ];

    const candidateIds: string[] = [];
    for (const c of candidatesData) {
      const result = (await qr.query(
        `INSERT INTO "candidates" (
          "id", "electionId", "fullName", "slug", "district", "position",
          "bio", "bioBlocks", "quizPositions", "socialLinks",
          "phone", "email", "website",
          "endorsementCount", "sortOrder", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12,
          0, $13, true
        ) RETURNING "id"`,
        [
          electionId,
          c.fullName,
          c.slug,
          c.district,
          c.position,
          c.bio,
          JSON.stringify([{ type: 'paragraph', text: c.bio }]),
          JSON.stringify(c.quizPositions),
          JSON.stringify(c.socialLinks),
          c.phone,
          c.email,
          c.website,
          c.sortOrder,
        ],
      )) as { id: string }[];
      candidateIds.push(result[0].id);
      console.log(`  -> Created candidate: ${c.fullName} (${c.district})`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. QUIZ QUESTIONS (10)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Quiz Questions ===');

    const questions = [
      { text: 'מהי העדיפות הגבוהה ביותר לראש העיר הבא?', category: 'כללי', importance: 'high' },
      { text: 'מה עמדתך בנושא הרחבת מערכת התחבורה הציבורית?', category: 'תחבורה', importance: 'high' },
      { text: 'כיצד יש לטפל בבעיית הדיור?', category: 'דיור', importance: 'high' },
      { text: 'מהי הגישה הנכונה לחינוך בעיר?', category: 'חינוך', importance: 'medium' },
      { text: 'מה עמדתך בנושא ביטחון הפנים?', category: 'ביטחון', importance: 'high' },
      { text: 'כיצד יש לקדם את הכלכלה המקומית?', category: 'כלכלה', importance: 'medium' },
      { text: 'מה יש לעשות בנושא איכות הסביבה?', category: 'סביבה', importance: 'medium' },
      { text: 'מהי עמדתך בנושא שירותי הרווחה?', category: 'רווחה', importance: 'medium' },
      { text: 'כיצד יש לפתח את התיירות בעיר?', category: 'תיירות', importance: 'low' },
      { text: 'מה עמדתך בנושא שקיפות ברשות המקומית?', category: 'שלטון', importance: 'high' },
    ];

    const scaleOptions = JSON.stringify([
      { label: 'מתנגד בתוקף', value: 1 },
      { label: 'מתנגד', value: 2 },
      { label: 'ניטרלי', value: 3 },
      { label: 'תומך', value: 4 },
      { label: 'תומך בחום', value: 5 },
    ]);

    const questionIds: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const result = (await qr.query(
        `INSERT INTO "quiz_questions" (
          "id", "electionId", "questionText", "options",
          "importance", "category", "sortOrder", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3,
          $4, $5, $6, true
        ) RETURNING "id"`,
        [electionId, q.text, scaleOptions, q.importance, q.category, i + 1],
      )) as { id: string }[];
      questionIds.push(result[0].id);
      console.log(`  -> Created quiz question ${i + 1}: ${q.text.substring(0, 40)}...`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. POLLING STATIONS (5)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Polling Stations ===');

    const stations = [
      {
        name: 'בית ספר הרצל - תל אביב',
        address: 'רחוב הרצל 45, תל אביב-יפו',
        city: 'תל אביב-יפו',
        district: 'מרכז',
        lat: 32.0853,
        lng: 34.7818,
        capacity: 200,
        isAccessible: true,
        open: '07:00',
        close: '22:00',
      },
      {
        name: 'מרכז קהילתי הגליל - חיפה',
        address: 'שדרות הנשיא 120, חיפה',
        city: 'חיפה',
        district: 'צפון',
        lat: 32.7940,
        lng: 34.9896,
        capacity: 150,
        isAccessible: true,
        open: '07:00',
        close: '22:00',
      },
      {
        name: 'מתנ"ס הנגב - באר שבע',
        address: 'רחוב רגר 15, באר שבע',
        city: 'באר שבע',
        district: 'דרום',
        lat: 31.2530,
        lng: 34.7915,
        capacity: 180,
        isAccessible: true,
        open: '07:00',
        close: '22:00',
      },
      {
        name: 'בית ספר בגין - ירושלים',
        address: 'רחוב יפו 78, ירושלים',
        city: 'ירושלים',
        district: 'מזרח',
        lat: 31.7767,
        lng: 35.2345,
        capacity: 250,
        isAccessible: false,
        open: '07:00',
        close: '22:00',
      },
      {
        name: 'אולם ספורט שרון - נתניה',
        address: 'שדרות בנימין 22, נתניה',
        city: 'נתניה',
        district: 'מערב',
        lat: 32.3215,
        lng: 34.8532,
        capacity: 300,
        isAccessible: true,
        open: '07:00',
        close: '22:00',
      },
    ];

    const stationIds: string[] = [];
    for (const s of stations) {
      const result = (await qr.query(
        `INSERT INTO "polling_stations" (
          "id", "name", "address", "city", "district",
          "latitude", "longitude", "capacity",
          "isAccessible", "openingTime", "closingTime",
          "electionId", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, true
        ) RETURNING "id"`,
        [
          s.name, s.address, s.city, s.district,
          s.lat, s.lng, s.capacity,
          s.isAccessible, s.open, s.close,
          electionId,
        ],
      )) as { id: string }[];
      stationIds.push(result[0].id);
      console.log(`  -> Created station: ${s.name}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. ELECTION RESULTS (per candidate, with station-level breakdown)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Election Results ===');

    const votesByCandidate = [
      { votes: [180, 120, 160, 220, 250], percentage: 28.5 },  // David
      { votes: [150, 140, 100, 180, 200], percentage: 23.6 },  // Sarah
      { votes: [90, 80, 130, 100, 120], percentage: 15.9 },    // Moshe
      { votes: [120, 100, 110, 150, 180], percentage: 20.2 },  // Yael
      { votes: [60, 50, 80, 70, 50], percentage: 9.5 },        // Avi
    ];

    // Total results per candidate (aggregated)
    for (let ci = 0; ci < candidateIds.length; ci++) {
      const totalVotes = votesByCandidate[ci].votes.reduce((a, b) => a + b, 0);
      await qr.query(
        `INSERT INTO "election_results" (
          "id", "electionId", "candidateId", "stationId",
          "voteCount", "percentage", "isOfficial", "publishedAt"
        ) VALUES (
          uuid_generate_v4(), $1, $2, NULL,
          $3, $4, false, NULL
        )`,
        [electionId, candidateIds[ci], totalVotes, votesByCandidate[ci].percentage],
      );

      // Station-level breakdown
      for (let si = 0; si < stationIds.length; si++) {
        await qr.query(
          `INSERT INTO "election_results" (
            "id", "electionId", "candidateId", "stationId",
            "voteCount", "percentage", "isOfficial", "publishedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3,
            $4, $5, false, NULL
          )`,
          [
            electionId,
            candidateIds[ci],
            stationIds[si],
            votesByCandidate[ci].votes[si],
            0, // Station-level percentage calculated on-the-fly
          ],
        );
      }
      console.log(`  -> Created results for ${candidatesData[ci].fullName}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. TURNOUT SNAPSHOTS (3 time-points)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Turnout Snapshots ===');

    const turnoutData = [
      { label: 'בוקר (10:00)', eligible: 50000, actual: 8500, pct: 17.0, hoursAgo: 6 },
      { label: 'צהריים (14:00)', eligible: 50000, actual: 22000, pct: 44.0, hoursAgo: 3 },
      { label: 'אחה"צ (18:00)', eligible: 50000, actual: 35000, pct: 70.0, hoursAgo: 0 },
    ];

    for (const t of turnoutData) {
      const snapshotTime = new Date(now.getTime() - t.hoursAgo * 60 * 60 * 1000);
      await qr.query(
        `INSERT INTO "turnout_snapshots" (
          "id", "electionId", "district", "eligibleVoters",
          "actualVoters", "percentage", "snapshotAt"
        ) VALUES (
          uuid_generate_v4(), $1, NULL, $2,
          $3, $4, $5
        )`,
        [electionId, t.eligible, t.actual, t.pct, snapshotTime.toISOString()],
      );
      console.log(`  -> Created turnout snapshot: ${t.label} — ${t.pct}%`);
    }

    // District-level snapshots (latest only)
    const districts = ['מרכז', 'צפון', 'דרום', 'מזרח', 'מערב'];
    const districtTurnout = [72.5, 65.3, 58.1, 71.8, 68.9];
    for (let i = 0; i < districts.length; i++) {
      await qr.query(
        `INSERT INTO "turnout_snapshots" (
          "id", "electionId", "district", "eligibleVoters",
          "actualVoters", "percentage", "snapshotAt"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3,
          $4, $5, $6
        )`,
        [
          electionId,
          districts[i],
          10000,
          Math.round(10000 * districtTurnout[i] / 100),
          districtTurnout[i],
          now.toISOString(),
        ],
      );
    }
    console.log(`  -> Created 5 district-level turnout snapshots`);

    // ═══════════════════════════════════════════════════════════════════
    // 8. COMMUNITY POLLS (3)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Community Polls ===');

    const polls = [
      {
        question: 'מהו הנושא החשוב ביותר בבחירות הקרובות?',
        description: 'סקר דעת קהל לחברי הליכוד',
        options: [
          { label: 'ביטחון', voteCount: 342 },
          { label: 'כלכלה', voteCount: 287 },
          { label: 'חינוך', voteCount: 198 },
          { label: 'דיור', voteCount: 156 },
        ],
        totalVotes: 983,
        isPinned: true,
      },
      {
        question: 'האם אתם מתכוונים להצביע בבחירות המקדימות?',
        description: 'בדיקת מוכנות ההצבעה',
        options: [
          { label: 'בהחלט כן', voteCount: 567 },
          { label: 'כנראה כן', voteCount: 234 },
          { label: 'עדיין לא החלטתי', voteCount: 89 },
          { label: 'כנראה לא', voteCount: 34 },
        ],
        totalVotes: 924,
        isPinned: false,
      },
      {
        question: 'כיצד הייתם מדרגים את ביצועי הנהגת הליכוד?',
        description: null,
        options: [
          { label: 'מצוין', voteCount: 412 },
          { label: 'טוב', voteCount: 356 },
          { label: 'סביר', voteCount: 178 },
          { label: 'טעון שיפור', voteCount: 94 },
        ],
        totalVotes: 1040,
        isPinned: false,
      },
    ];

    const pollIds: string[] = [];
    for (const p of polls) {
      const result = (await qr.query(
        `INSERT INTO "community_polls" (
          "id", "question", "description", "options",
          "totalVotes", "isPinned", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3,
          $4, $5, true
        ) RETURNING "id"`,
        [p.question, p.description, JSON.stringify(p.options), p.totalVotes, p.isPinned],
      )) as { id: string }[];
      pollIds.push(result[0].id);
      console.log(`  -> Created poll: ${p.question.substring(0, 40)}...`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. CAMPAIGN EVENTS (3)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Campaign Events ===');

    const events = [
      {
        title: 'כנס תומכים מרכזי - תל אביב',
        description: 'כנס מרכזי של תומכי הליכוד עם נאומים של כל המועמדים. מתוכנן ערב של דיונים, מוזיקה וכיבוד קל.',
        location: 'אולם ומנורה, תל אביב',
        city: 'תל אביב-יפו',
        district: 'מרכז',
        lat: 32.0731,
        lng: 34.7810,
        candidateIdx: 0, // David
        daysFromNow: 7,
        durationHours: 3,
        rsvpCount: 342,
      },
      {
        title: 'מפגש שכונתי - חיפה הקריות',
        description: 'מפגש שכונתי אינטימי עם שרה לוי. הזדמנות לשאול שאלות ולהכיר את המועמדת מקרוב.',
        location: 'מתנ"ס קרית חיים, חיפה',
        city: 'חיפה',
        district: 'צפון',
        lat: 32.8140,
        lng: 35.0280,
        candidateIdx: 1, // Sarah
        daysFromNow: 10,
        durationHours: 2,
        rsvpCount: 87,
      },
      {
        title: 'ועידת ביטחון - ירושלים',
        description: 'ועידת ביטחון מיוחדת בהנחיית אבי גולדשטיין. דיון בנושאי ביטחון פנים ומדיניות ביטחונית.',
        location: 'מלון דוד, ירושלים',
        city: 'ירושלים',
        district: 'מזרח',
        lat: 31.7712,
        lng: 35.2286,
        candidateIdx: 4, // Avi
        daysFromNow: 14,
        durationHours: 4,
        rsvpCount: 215,
      },
    ];

    const eventIds: string[] = [];
    for (const e of events) {
      const startTime = new Date(now.getTime() + e.daysFromNow * 24 * 60 * 60 * 1000);
      startTime.setHours(19, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + e.durationHours * 60 * 60 * 1000);

      const result = (await qr.query(
        `INSERT INTO "campaign_events" (
          "id", "title", "description", "location",
          "city", "district", "latitude", "longitude",
          "startTime", "endTime",
          "candidateId", "electionId", "rsvpCount", "isActive"
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3,
          $4, $5, $6, $7,
          $8, $9,
          $10, $11, $12, true
        ) RETURNING "id"`,
        [
          e.title, e.description, e.location,
          e.city, e.district, e.lat, e.lng,
          startTime.toISOString(), endTime.toISOString(),
          candidateIds[e.candidateIdx], electionId, e.rsvpCount,
        ],
      )) as { id: string }[];
      eventIds.push(result[0].id);
      console.log(`  -> Created event: ${e.title}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 10. USER INTERACTIONS (endorsement, quiz response, poll vote, RSVP)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding User Interactions ===');

    // Endorsement — user endorses first candidate
    await qr.query(
      `INSERT INTO "candidate_endorsements" (
        "id", "userId", "candidateId", "electionId"
      ) VALUES (uuid_generate_v4(), $1, $2, $3)`,
      [userId, candidateIds[0], electionId],
    );
    // Update endorsement count
    await qr.query(
      `UPDATE "candidates" SET "endorsementCount" = "endorsementCount" + 1 WHERE "id" = $1`,
      [candidateIds[0]],
    );
    console.log(`  -> Created endorsement for ${candidatesData[0].fullName}`);

    // Quiz response
    const answers = questionIds.map((qId, idx) => ({
      questionId: qId,
      selectedValue: [4, 5, 3, 4, 5, 3, 4, 3, 2, 5][idx],
      importance: [3, 3, 2, 2, 3, 1, 2, 2, 1, 3][idx],
    }));
    const matchResults = candidateIds.map((cId, idx) => ({
      candidateId: cId,
      matchPercentage: [87.5, 72.3, 65.1, 78.9, 55.2][idx],
    }));
    await qr.query(
      `INSERT INTO "quiz_responses" (
        "id", "userId", "electionId", "answers", "matchResults", "completedAt"
      ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())`,
      [userId, electionId, JSON.stringify(answers), JSON.stringify(matchResults)],
    );
    console.log(`  -> Created quiz response (best match: ${candidatesData[0].fullName} at 87.5%)`);

    // Poll vote — user voted on first poll, option index 0
    await qr.query(
      `INSERT INTO "poll_votes" (
        "id", "pollId", "userId", "optionIndex"
      ) VALUES (uuid_generate_v4(), $1, $2, 0)`,
      [pollIds[0], userId],
    );
    console.log(`  -> Created poll vote on first poll`);

    // Event RSVP — user going to first event
    await qr.query(
      `INSERT INTO "event_rsvps" (
        "id", "eventId", "userId", "status"
      ) VALUES (uuid_generate_v4(), $1, $2, 'going')`,
      [eventIds[0], userId],
    );
    console.log(`  -> Created RSVP (going) for ${events[0].title}`);

    // ═══════════════════════════════════════════════════════════════════
    // 11. GAMIFICATION (points + badges)
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n=== Seeding Gamification ===');

    // Points entries
    const pointEntries = [
      { action: 'quiz_complete', points: 50, metadata: { electionId } },
      { action: 'endorsement', points: 20, metadata: { candidateId: candidateIds[0] } },
      { action: 'poll_vote', points: 10, metadata: { pollId: pollIds[0] } },
      { action: 'event_rsvp', points: 15, metadata: { eventId: eventIds[0] } },
      { action: 'profile_complete', points: 25, metadata: {} },
      { action: 'login_streak', points: 30, metadata: { days: 7 } },
    ];

    for (const p of pointEntries) {
      await qr.query(
        `INSERT INTO "user_points" (
          "id", "userId", "action", "points", "metadata"
        ) VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
        [userId, p.action, p.points, JSON.stringify(p.metadata)],
      );
    }
    const totalPoints = pointEntries.reduce((sum, p) => sum + p.points, 0);
    console.log(`  -> Created ${pointEntries.length} point entries (total: ${totalPoints} pts)`);

    // Badges
    const badges = ['quiz_taker', 'endorser', 'poll_voter', 'event_goer', 'early_bird'];
    for (const badge of badges) {
      await qr.query(
        `INSERT INTO "user_badges" (
          "id", "userId", "badgeType"
        ) VALUES (uuid_generate_v4(), $1, $2)`,
        [userId, badge],
      );
    }
    console.log(`  -> Created ${badges.length} badges: ${badges.join(', ')}`);

    // ═══════════════════════════════════════════════════════════════════
    // COMMIT
    // ═══════════════════════════════════════════════════════════════════
    await qr.commitTransaction();

    console.log('\n' + '═'.repeat(60));
    console.log('Election seed completed successfully!');
    console.log('═'.repeat(60));
    console.log(`\nSummary:`);
    console.log(`  App User:         1 (phone: 0501234567, password: Test1234!)`);
    console.log(`  Election:         1 (${candidatesData.length} candidates)`);
    console.log(`  Quiz Questions:   ${questions.length}`);
    console.log(`  Polling Stations: ${stations.length}`);
    console.log(`  Results:          ${candidateIds.length * (stationIds.length + 1)} entries`);
    console.log(`  Turnout:          ${turnoutData.length + districts.length} snapshots`);
    console.log(`  Polls:            ${polls.length}`);
    console.log(`  Events:           ${events.length}`);
    console.log(`  Points:           ${totalPoints} pts across ${pointEntries.length} actions`);
    console.log(`  Badges:           ${badges.length}`);
    console.log(`  User interactions: endorsement, quiz, poll vote, RSVP`);
  } catch (error) {
    console.error('Seed failed, rolling back...', error);
    await qr.rollbackTransaction();
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

void seedElections();
