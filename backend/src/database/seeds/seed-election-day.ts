/**
 * Seed script: Election Day data — polling stations, results, turnout snapshots.
 *
 * Seeds data for the main active election ("בחירות מקדימות לליכוד 2026").
 *
 * Usage:
 *   cd backend && npx ts-node src/database/seeds/seed-election-day.ts
 */

import { AppDataSource } from '../data-source';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ELECTION_ID = '166d63f1-dd4e-4712-8192-1d2c36ca37ae';

const CANDIDATES = [
  { id: '0a6ea399-bb4c-4268-a93a-dbe21b0bd2a2', name: 'משה אברהם' },
  { id: '6a1c1d09-3dbe-4a3f-99d7-13f34ad7acc6', name: 'שרה לוי' },
  { id: '776cac10-ef9d-4705-abf1-ff8caff4a661', name: 'יעל מזרחי' },
  { id: '8c440f38-a32f-42ab-8e5f-049d049e6510', name: 'דוד כהן' },
  { id: '22b66582-452e-4b13-9ac2-b6f6bb9f299c', name: 'אבי גולדשטיין' },
];

// Real Israeli cities with coordinates, grouped by district
const DISTRICTS: Record<
  string,
  { city: string; lat: number; lng: number; streets: string[] }[]
> = {
  'מחוז תל אביב': [
    { city: 'תל אביב-יפו', lat: 32.0853, lng: 34.7818, streets: ['רחוב דיזנגוף 50', 'רחוב אבן גבירול 71', 'רחוב אלנבי 30', 'רחוב הירקון 120'] },
    { city: 'רמת גן', lat: 32.0686, lng: 34.8248, streets: ['רחוב ביאליק 12', 'רחוב ז\'בוטינסקי 85'] },
    { city: 'בת ים', lat: 32.0167, lng: 34.7500, streets: ['רחוב העצמאות 42', 'רחוב בלפור 15'] },
    { city: 'חולון', lat: 32.0166, lng: 34.7797, streets: ['רחוב סוקולוב 62', 'רחוב ויצמן 33'] },
  ],
  'מחוז ירושלים': [
    { city: 'ירושלים', lat: 31.7683, lng: 35.2137, streets: ['רחוב יפו 120', 'רחוב בן יהודה 28', 'רחוב אגריפס 55', 'רחוב קינג ג\'ורג\' 17'] },
    { city: 'מבשרת ציון', lat: 31.8003, lng: 35.1500, streets: ['רחוב הר הצופים 6'] },
    { city: 'בית שמש', lat: 31.7489, lng: 34.9872, streets: ['רחוב נחל שורק 14', 'רחוב האלון 22'] },
  ],
  'מחוז חיפה': [
    { city: 'חיפה', lat: 32.7940, lng: 34.9896, streets: ['רחוב הרצל 15', 'שדרות הנשיא 90', 'רחוב יפה נוף 42'] },
    { city: 'קריית אתא', lat: 32.8000, lng: 35.0600, streets: ['רחוב הגליל 8'] },
    { city: 'חדרה', lat: 32.4340, lng: 34.9196, streets: ['רחוב הנשיא 56', 'רחוב רוטשילד 11'] },
  ],
  'מחוז המרכז': [
    { city: 'פתח תקווה', lat: 32.0841, lng: 34.8878, streets: ['רחוב רוטשילד 60', 'רחוב הרצל 45'] },
    { city: 'ראשון לציון', lat: 31.9500, lng: 34.8000, streets: ['רחוב הרצל 100', 'רחוב רוטשילד 24'] },
    { city: 'נתניה', lat: 32.3215, lng: 34.8532, streets: ['רחוב הרצל 32', 'כיכר העצמאות 1'] },
    { city: 'רעננה', lat: 32.1847, lng: 34.8714, streets: ['רחוב אחוזה 55'] },
    { city: 'הרצליה', lat: 32.1629, lng: 34.7925, streets: ['רחוב סוקולוב 20'] },
    { city: 'כפר סבא', lat: 32.1751, lng: 34.9069, streets: ['רחוב ויצמן 72'] },
  ],
  'מחוז הדרום': [
    { city: 'באר שבע', lat: 31.2518, lng: 34.7913, streets: ['רחוב שד\' רגר 40', 'רחוב הנשיא 28', 'רחוב קרן קיימת 15'] },
    { city: 'אשדוד', lat: 31.8014, lng: 34.6431, streets: ['רחוב הנשיא 12', 'שדרות ירושלים 44'] },
    { city: 'אשקלון', lat: 31.6688, lng: 34.5743, streets: ['רחוב הרצל 23'] },
  ],
  'מחוז הצפון': [
    { city: 'נצרת עילית (נוף הגליל)', lat: 32.7063, lng: 35.3100, streets: ['רחוב הגליל 5'] },
    { city: 'טבריה', lat: 32.7922, lng: 35.5312, streets: ['רחוב הירדן 18'] },
    { city: 'עפולה', lat: 32.6064, lng: 35.2880, streets: ['רחוב יהושע חנקין 12'] },
    { city: 'כרמיאל', lat: 32.9144, lng: 35.3006, streets: ['רחוב המייסדים 30'] },
  ],
  'מחוז השרון': [
    { city: 'רמת השרון', lat: 32.1453, lng: 34.8386, streets: ['רחוב סוקולוב 10'] },
    { city: 'הוד השרון', lat: 32.1564, lng: 34.8875, streets: ['רחוב שד\' ירושלים 8'] },
    { city: 'כפר יונה', lat: 32.3167, lng: 34.9333, streets: ['רחוב הראשונים 3'] },
  ],
};

const STATION_NAMES = [
  'בית ספר יסודי',
  'מרכז קהילתי',
  'בית תרבות',
  'מתנ"ס',
  'אולם ספורט',
  'בית כנסת',
  'מועדון נוער',
  'בית ספר תיכון',
  'גן ילדים',
  'ספרייה עירונית',
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // -----------------------------------------------------------------------
    // 1. Clear existing election-day data for this election
    // -----------------------------------------------------------------------
    console.log('Clearing existing election day data...');
    await qr.query(`DELETE FROM turnout_snapshots WHERE "electionId" = $1`, [ELECTION_ID]);
    await qr.query(`DELETE FROM election_results WHERE "electionId" = $1`, [ELECTION_ID]);
    // Station reports depend on stations, delete reports first
    await qr.query(`
      DELETE FROM station_reports
      WHERE "stationId" IN (SELECT id FROM polling_stations WHERE "electionId" = $1)
    `, [ELECTION_ID]);
    await qr.query(`DELETE FROM polling_stations WHERE "electionId" = $1`, [ELECTION_ID]);

    // -----------------------------------------------------------------------
    // 2. Create polling stations (~45 stations across 7 districts)
    // -----------------------------------------------------------------------
    console.log('Creating polling stations...');
    const stationIds: { id: string; district: string; city: string }[] = [];

    for (const [district, cities] of Object.entries(DISTRICTS)) {
      for (const cityData of cities) {
        // 1-2 stations per city
        const stationCount = cityData.streets.length > 2 ? rand(2, 3) : 1;
        for (let i = 0; i < stationCount; i++) {
          const stationId = uuid();
          const street = cityData.streets[i % cityData.streets.length];
          const stationName = `${pick(STATION_NAMES)} — ${cityData.city}`;
          const lat = cityData.lat + (Math.random() - 0.5) * 0.02;
          const lng = cityData.lng + (Math.random() - 0.5) * 0.02;
          const capacity = rand(200, 800);
          const isAccessible = Math.random() > 0.2;
          const openingTime = '07:00';
          const closingTime = '22:00';

          await qr.query(
            `INSERT INTO polling_stations
              (id, name, address, city, district, latitude, longitude, capacity,
               "isAccessible", "openingTime", "closingTime", "electionId", "isActive", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())`,
            [
              stationId,
              stationName,
              `${street}, ${cityData.city}`,
              cityData.city,
              district,
              lat.toFixed(7),
              lng.toFixed(7),
              capacity,
              isAccessible,
              openingTime,
              closingTime,
              ELECTION_ID,
            ],
          );

          stationIds.push({ id: stationId, district, city: cityData.city });
        }
      }
    }

    console.log(`  → Created ${stationIds.length} polling stations`);

    // -----------------------------------------------------------------------
    // 3. Create election results (per candidate, per station + aggregate)
    // -----------------------------------------------------------------------
    console.log('Creating election results...');
    let resultCount = 0;

    // Weight distribution for candidates (simulates a realistic election)
    const candidateWeights = [0.32, 0.25, 0.20, 0.14, 0.09];

    // Per-station results
    for (const station of stationIds) {
      const totalStationVotes = rand(120, 600);
      let remaining = totalStationVotes;

      for (let ci = 0; ci < CANDIDATES.length; ci++) {
        const isLast = ci === CANDIDATES.length - 1;
        const weight = candidateWeights[ci] + (Math.random() - 0.5) * 0.08;
        const votes = isLast ? remaining : Math.min(remaining, Math.round(totalStationVotes * weight));
        remaining -= votes;
        const pct = totalStationVotes > 0 ? ((votes / totalStationVotes) * 100) : 0;

        await qr.query(
          `INSERT INTO election_results
            (id, "electionId", "candidateId", "stationId", "voteCount", percentage, "isOfficial", "publishedAt", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW(), NOW())`,
          [
            uuid(),
            ELECTION_ID,
            CANDIDATES[ci].id,
            station.id,
            Math.max(0, votes),
            pct.toFixed(2),
          ],
        );
        resultCount++;
      }
    }

    // Aggregate results (no stationId — overall totals)
    const totals = new Map<string, number>();
    const stationResultsRows: { candidateId: string; voteCount: number }[] = await qr.query(
      `SELECT "candidateId", SUM("voteCount")::int AS "voteCount"
       FROM election_results
       WHERE "electionId" = $1 AND "stationId" IS NOT NULL
       GROUP BY "candidateId"`,
      [ELECTION_ID],
    );
    for (const row of stationResultsRows) {
      totals.set(row.candidateId, row.voteCount);
    }
    const grandTotal = Array.from(totals.values()).reduce((s, v) => s + v, 0);

    for (const candidate of CANDIDATES) {
      const votes = totals.get(candidate.id) || 0;
      const pct = grandTotal > 0 ? ((votes / grandTotal) * 100) : 0;
      await qr.query(
        `INSERT INTO election_results
          (id, "electionId", "candidateId", "stationId", "voteCount", percentage, "isOfficial", "publishedAt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NULL, $4, $5, true, NOW(), NOW(), NOW())`,
        [uuid(), ELECTION_ID, candidate.id, votes, pct.toFixed(2)],
      );
      resultCount++;
    }

    console.log(`  → Created ${resultCount} election results`);

    // -----------------------------------------------------------------------
    // 4. Create turnout snapshots (timeline + per-district)
    // -----------------------------------------------------------------------
    console.log('Creating turnout snapshots...');
    let snapshotCount = 0;

    // Get district list and assign eligible voters
    const districtNames = Object.keys(DISTRICTS);
    const districtEligible: Record<string, number> = {};
    for (const d of districtNames) {
      districtEligible[d] = rand(3000, 15000);
    }

    // Timeline snapshots: every 2 hours from 07:00 to 22:00 (8 snapshots)
    const snapshotHours = [7, 9, 11, 13, 15, 17, 19, 21];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cumulative turnout curve (realistic — slow start, peak midday, tails off)
    const cumulativeTurnoutPct = [0.05, 0.15, 0.30, 0.48, 0.60, 0.72, 0.82, 0.88];

    for (let hi = 0; hi < snapshotHours.length; hi++) {
      const hour = snapshotHours[hi];
      const cumPct = cumulativeTurnoutPct[hi];
      const snapshotTime = new Date(today);
      snapshotTime.setHours(hour, 0, 0, 0);

      // Per-district snapshot
      for (const district of districtNames) {
        const eligible = districtEligible[district];
        // Add some randomness per district
        const districtPct = cumPct + (Math.random() - 0.5) * 0.08;
        const actual = Math.round(eligible * Math.max(0.02, Math.min(0.99, districtPct)));
        const pct = eligible > 0 ? ((actual / eligible) * 100) : 0;

        await qr.query(
          `INSERT INTO turnout_snapshots
            (id, "electionId", district, "eligibleVoters", "actualVoters", percentage, "snapshotAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            uuid(),
            ELECTION_ID,
            district,
            eligible,
            actual,
            pct.toFixed(2),
            snapshotTime.toISOString(),
          ],
        );
        snapshotCount++;
      }

      // Overall (no district) snapshot
      const totalEligible = Object.values(districtEligible).reduce((s, v) => s + v, 0);
      const totalActual = Math.round(totalEligible * cumPct);
      const totalPct = totalEligible > 0 ? ((totalActual / totalEligible) * 100) : 0;

      await qr.query(
        `INSERT INTO turnout_snapshots
          (id, "electionId", district, "eligibleVoters", "actualVoters", percentage, "snapshotAt")
        VALUES ($1, $2, NULL, $3, $4, $5, $6)`,
        [
          uuid(),
          ELECTION_ID,
          totalEligible,
          totalActual,
          totalPct.toFixed(2),
          snapshotTime.toISOString(),
        ],
      );
      snapshotCount++;
    }

    console.log(`  → Created ${snapshotCount} turnout snapshots`);

    // -----------------------------------------------------------------------
    // Done
    // -----------------------------------------------------------------------
    await qr.commitTransaction();
    console.log('\n✅ Election Day seed complete!');
    console.log(`   ${stationIds.length} polling stations`);
    console.log(`   ${resultCount} election results`);
    console.log(`   ${snapshotCount} turnout snapshots`);
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seed();
