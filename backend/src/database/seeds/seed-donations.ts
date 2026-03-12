import { AppDataSource } from '../data-source';
import { createHash } from 'crypto';

/**
 * Seed script for donation records.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/seed-donations.ts          # skip if exists
 *   npx ts-node src/database/seeds/seed-donations.ts --force  # replace existing
 */

interface DonationConfig {
  userIndex: number;
  recipientType: 'candidate' | 'party';
  candidateIndex: number | null;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  provider: 'stripe' | 'tranzila';
}

const donations: DonationConfig[] = [
  { userIndex: 0, recipientType: 'candidate', candidateIndex: 0, amount: 500, status: 'completed', provider: 'stripe' },
  { userIndex: 1, recipientType: 'party', candidateIndex: null, amount: 1000, status: 'completed', provider: 'stripe' },
  { userIndex: 2, recipientType: 'candidate', candidateIndex: 1, amount: 250, status: 'completed', provider: 'tranzila' },
  { userIndex: 3, recipientType: 'candidate', candidateIndex: 2, amount: 100, status: 'completed', provider: 'stripe' },
  { userIndex: 4, recipientType: 'party', candidateIndex: null, amount: 50, status: 'completed', provider: 'tranzila' },
  { userIndex: 5, recipientType: 'candidate', candidateIndex: 3, amount: 500, status: 'completed', provider: 'stripe' },
  { userIndex: 6, recipientType: 'party', candidateIndex: null, amount: 250, status: 'completed', provider: 'tranzila' },
  { userIndex: 7, recipientType: 'candidate', candidateIndex: 0, amount: 1000, status: 'completed', provider: 'stripe' },
  { userIndex: 8, recipientType: 'candidate', candidateIndex: 4, amount: 100, status: 'completed', provider: 'stripe' },
  { userIndex: 9, recipientType: 'party', candidateIndex: null, amount: 250, status: 'completed', provider: 'tranzila' },
  { userIndex: 0, recipientType: 'candidate', candidateIndex: 1, amount: 50, status: 'completed', provider: 'stripe' },
  { userIndex: 1, recipientType: 'candidate', candidateIndex: 2, amount: 500, status: 'completed', provider: 'tranzila' },
  { userIndex: 2, recipientType: 'party', candidateIndex: null, amount: 100, status: 'completed', provider: 'stripe' },
  { userIndex: 3, recipientType: 'candidate', candidateIndex: 3, amount: 250, status: 'completed', provider: 'stripe' },
  { userIndex: 4, recipientType: 'candidate', candidateIndex: 0, amount: 1000, status: 'completed', provider: 'tranzila' },
  { userIndex: 5, recipientType: 'party', candidateIndex: null, amount: 50, status: 'pending', provider: 'stripe' },
  { userIndex: 6, recipientType: 'candidate', candidateIndex: 1, amount: 250, status: 'pending', provider: 'tranzila' },
  { userIndex: 7, recipientType: 'candidate', candidateIndex: 4, amount: 100, status: 'pending', provider: 'stripe' },
  { userIndex: 8, recipientType: 'party', candidateIndex: null, amount: 500, status: 'failed', provider: 'stripe' },
  { userIndex: 9, recipientType: 'candidate', candidateIndex: 2, amount: 250, status: 'refunded', provider: 'tranzila' },
];

function deterministicHash(seed: string): string {
  return createHash('sha256').update(seed).digest('hex');
}

async function seedDonations() {
  const forceReseed = process.argv.includes('--force');
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ── Check existing data ──────────────────────────────────────────
    const existingCount = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "donations"`,
    )) as { count: string }[];

    if (parseInt(existingCount[0].count, 10) > 0 && !forceReseed) {
      console.log(
        `Already have ${existingCount[0].count} donations. Use --force to reseed.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    if (forceReseed) {
      await queryRunner.query(`DELETE FROM "donations"`);
      console.log('Cleared existing donations.');
    }

    // ── Fetch app users ────────────────────────────────────────────
    const appUsers = (await queryRunner.query(
      `SELECT "id" FROM "app_users" LIMIT 10`,
    )) as { id: string }[];

    if (appUsers.length < 10) {
      console.log(
        `Need at least 10 app users (found ${appUsers.length}). Please seed app users first.`,
      );
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ── Fetch candidates ───────────────────────────────────────────
    const candidates = (await queryRunner.query(
      `SELECT "id", "fullName" FROM "candidates" ORDER BY "sortOrder" ASC LIMIT 5`,
    )) as { id: string; fullName: string }[];

    if (candidates.length < 5) {
      console.log(
        `Need at least 5 candidates (found ${candidates.length}). Please seed candidates first.`,
      );
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // ── Insert donations ───────────────────────────────────────────
    console.log(`Seeding ${donations.length} donations...`);
    let totalAmount = 0;
    const statusCounts: Record<string, number> = {};

    for (let i = 0; i < donations.length; i++) {
      const d = donations[i];
      const appUser = appUsers[d.userIndex];
      const candidate =
        d.candidateIndex !== null ? candidates[d.candidateIndex] : null;
      const fakeIdNumber = `${300000000 + d.userIndex}`;
      const teutatZehutHash = deterministicHash(fakeIdNumber);
      const paymentIntentId =
        d.provider === 'stripe'
          ? `pi_seed_${String(i + 1).padStart(3, '0')}`
          : `trz_seed_${String(i + 1).padStart(3, '0')}`;
      const receiptUrl =
        d.status === 'completed'
          ? `https://receipts.likud.org.il/seed-receipt-${String(i + 1).padStart(3, '0')}.pdf`
          : null;
      const metadata =
        d.status === 'refunded'
          ? JSON.stringify({ refundReason: 'Donor requested refund', refundedAt: new Date().toISOString() })
          : null;

      await queryRunner.query(
        `INSERT INTO "donations"
           ("id", "donorAppUserId", "recipientType", "recipientCandidateId", "amountNis",
            "teutatZehutHash", "paymentProvider", "paymentIntentId", "status", "receiptUrl",
            "metadata")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
        [
          appUser.id,
          d.recipientType,
          candidate?.id ?? null,
          d.amount,
          teutatZehutHash,
          d.provider,
          paymentIntentId,
          d.status,
          receiptUrl,
          metadata,
        ],
      );

      totalAmount += d.amount;
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;

      const recipientLabel =
        d.recipientType === 'party'
          ? 'מפלגת הליכוד'
          : candidate?.fullName ?? '';
      console.log(
        `  ${i + 1}. ₪${d.amount} → ${recipientLabel} [${d.status}] (${d.provider})`,
      );
    }

    await queryRunner.commitTransaction();
    console.log(`\nDone! Seeded ${donations.length} donations.`);
    console.log(`Total amount: ₪${totalAmount.toLocaleString()}`);
    console.log(
      `Status breakdown: ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
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

void seedDonations();
