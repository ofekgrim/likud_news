import { DataSource } from 'typeorm';
import { PrimaryElection } from '../../modules/elections/entities/primary-election.entity';
import { TurnoutSnapshot } from '../../modules/election-results/entities/turnout-snapshot.entity';

/**
 * Seed turnout snapshots for testing the primaries turnout dashboard.
 * Creates realistic turnout data across different time periods.
 */
async function seedTurnout(dataSource: DataSource) {
  console.log('📊 Seeding turnout snapshots...');

  const electionRepo = dataSource.getRepository(PrimaryElection);
  const turnoutRepo = dataSource.getRepository(TurnoutSnapshot);

  // Get active elections
  const elections = await electionRepo.find({
    where: { status: 'active' as any },
    take: 5,
  });

  if (elections.length === 0) {
    console.log('⚠️  No active elections found. Skipping turnout seeding.');
    return;
  }

  console.log(`📈 Creating turnout snapshots for ${elections.length} election(s)...`);

  const districts = [
    'תל אביב',
    'ירושלים',
    'חיפה',
    'באר שבע',
    'פתח תקווה',
    'נתניה',
    'אשדוד',
    'ראשון לציון',
  ];

  const snapshots: Partial<TurnoutSnapshot>[] = [];
  let snapshotCount = 0;

  for (const election of elections) {
    // Create snapshots at different times throughout the day
    const times = [
      { hour: 8, percentage: 5 },    // 8 AM - 5%
      { hour: 10, percentage: 15 },  // 10 AM - 15%
      { hour: 12, percentage: 28 },  // 12 PM - 28%
      { hour: 14, percentage: 42 },  // 2 PM - 42%
      { hour: 16, percentage: 58 },  // 4 PM - 58%
      { hour: 18, percentage: 71 },  // 6 PM - 71%
      { hour: 20, percentage: 84 },  // 8 PM - 84%
      { hour: 21, percentage: 91 },  // 9 PM - 91%
    ];

    for (const time of times) {
      for (const district of districts) {
        const snapshotAt = new Date();
        snapshotAt.setHours(time.hour, 0, 0, 0);

        // Add some variance per district (+/- 5%)
        const variance = (Math.random() - 0.5) * 10;
        const percentage = Math.max(0, Math.min(100, time.percentage + variance));
        const eligibleVoters = 10000 + Math.floor(Math.random() * 20000);
        const actualVoters = Math.floor((percentage / 100) * eligibleVoters);

        snapshots.push({
          electionId: election.id,
          district,
          eligibleVoters,
          actualVoters,
          percentage,
          snapshotAt,
        });
        snapshotCount++;
      }
    }
  }

  // Batch insert all snapshots
  console.log(`💾 Inserting ${snapshotCount} turnout snapshots...`);
  await turnoutRepo.save(snapshots, { chunk: 100 });

  console.log(`✅ Turnout snapshots seeded successfully!`);
  console.log(`   - ${snapshotCount} total snapshots created`);
  console.log(`   - ${elections.length} elections`);
  console.log(`   - ${districts.length} districts per election`);
  console.log(`   - 8 time snapshots per district`);
}

module.exports = { seedTurnout };
