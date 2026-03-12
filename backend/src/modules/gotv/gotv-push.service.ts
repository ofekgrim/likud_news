import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, In } from 'typeorm';
import { GotvEngagement } from './entities/gotv-engagement.entity';
import {
  PrimaryElection,
  ElectionStatus,
} from '../elections/entities/primary-election.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { PushToken } from '../push/entities/push-token.entity';
import { PushService } from '../push/push.service';

@Injectable()
export class GotvPushService {
  private readonly logger = new Logger(GotvPushService.name);

  constructor(
    @InjectRepository(GotvEngagement)
    private readonly gotvRepo: Repository<GotvEngagement>,
    @InjectRepository(PrimaryElection)
    private readonly electionRepo: Repository<PrimaryElection>,
    @InjectRepository(AppUser)
    private readonly appUserRepo: Repository<AppUser>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
    private readonly pushService: PushService,
  ) {}

  // ─── Public methods ────────────────────────────────────────

  /**
   * Send pre-election reminder to eligible members who haven't set a votingPlanTime.
   * Respects user notification preferences (notifGotv) and quiet hours / frequency cap.
   */
  async sendPreElectionReminder(
    daysBeforeElection: number,
  ): Promise<{ sent: number; skipped: number }> {
    const election = await this.getActiveElection();
    if (!election) {
      this.logger.log('No active election — skipping pre-election reminder');
      return { sent: 0, skipped: 0 };
    }

    const messages: Record<number, { title: string; body: string }> = {
      7: {
        title: 'הפריימריז בעוד שבוע!',
        body: 'ודא/י שאת/ה זכאי/ת להצביע',
      },
      3: {
        title: 'עוד 3 ימים לפריימריז',
        body: 'בדוק/י את תחנת ההצבעה שלך',
      },
      1: {
        title: 'מחר הפריימריז!',
        body: 'הכנ/י תעודת זהות ובדוק/י שעות פתיחה',
      },
    };

    const msg = messages[daysBeforeElection] || {
      title: `עוד ${daysBeforeElection} ימים לפריימריז`,
      body: 'הכנ/י את עצמך ליום ההצבעה',
    };

    // Get eligible members who haven't set a voting plan
    const eligibleUserIds = await this.getEligibleWithoutPlan(election.id);

    if (eligibleUserIds.length === 0) {
      this.logger.log('No eligible users without voting plans — nothing to send');
      return { sent: 0, skipped: 0 };
    }

    // Filter by notification preferences
    const usersWithGotv = await this.filterByGotvPreference(eligibleUserIds);

    if (usersWithGotv.length === 0) {
      this.logger.log('All eligible users opted out of GOTV notifications');
      return { sent: 0, skipped: eligibleUserIds.length };
    }

    // Filter by quiet hours and frequency cap
    const { eligible, skipped } = await this.filterByQuietHoursAndCap(usersWithGotv);

    if (eligible.length === 0) {
      this.logger.log('All users filtered out by quiet hours or frequency cap');
      return { sent: 0, skipped: skipped.length + (eligibleUserIds.length - usersWithGotv.length) };
    }

    // Send notifications
    const sentCount = await this.sendPushToUserIds(eligible, msg.title, msg.body, {
      type: 'gotv_pre_election',
      electionId: election.id,
      daysBeforeElection: String(daysBeforeElection),
    });

    // Record notification in engagement log
    await this.recordNotificationSent(
      election.id,
      eligible,
      `pre_election_${daysBeforeElection}d`,
    );

    this.logger.log(
      `Pre-election reminder (${daysBeforeElection}d): sent=${sentCount}, skipped=${skipped.length}`,
    );

    return { sent: sentCount, skipped: skipped.length };
  }

  /**
   * Send election day morning notification (7:30 AM).
   * Sent to all eligible members who haven't checked in, with station name.
   */
  async sendElectionDayMorning(
    electionId: string,
  ): Promise<{ sent: number; skipped: number }> {
    const nonVoterIds = await this.getEligibleNonVoters(electionId);

    if (nonVoterIds.length === 0) {
      this.logger.log('No eligible non-voters — skipping morning reminder');
      return { sent: 0, skipped: 0 };
    }

    const usersWithGotv = await this.filterByGotvPreference(nonVoterIds);
    const { eligible, skipped } = await this.filterByQuietHoursAndCap(usersWithGotv);

    if (eligible.length === 0) {
      return { sent: 0, skipped: nonVoterIds.length };
    }

    const title = 'הקלפיות נפתחו!';
    const body = 'צא/י להצביע בתחנה שלך';

    const sentCount = await this.sendPushToUserIds(eligible, title, body, {
      type: 'gotv_election_day',
      electionId,
      reminderType: 'morning',
    });

    await this.recordNotificationSent(electionId, eligible, 'election_day_morning');

    this.logger.log(`Election day morning: sent=${sentCount}, skipped=${skipped.length}`);
    return { sent: sentCount, skipped: skipped.length };
  }

  /**
   * Send election day midday notification (12:00 PM).
   * Includes current turnout percentage.
   */
  async sendElectionDayMidday(
    electionId: string,
  ): Promise<{ sent: number; skipped: number }> {
    const nonVoterIds = await this.getEligibleNonVoters(electionId);

    if (nonVoterIds.length === 0) {
      return { sent: 0, skipped: 0 };
    }

    const usersWithGotv = await this.filterByGotvPreference(nonVoterIds);
    const { eligible, skipped } = await this.filterByQuietHoursAndCap(usersWithGotv);

    if (eligible.length === 0) {
      return { sent: 0, skipped: nonVoterIds.length };
    }

    // Calculate current turnout
    const turnoutPercent = await this.calculateTurnoutPercent(electionId);

    const title = 'כבר הצבעת?';
    const body = `אחוז ההצבעה עומד על ${turnoutPercent}%. כל קול חשוב!`;

    const sentCount = await this.sendPushToUserIds(eligible, title, body, {
      type: 'gotv_election_day',
      electionId,
      reminderType: 'midday',
      turnoutPercent: String(turnoutPercent),
    });

    await this.recordNotificationSent(electionId, eligible, 'election_day_midday');

    this.logger.log(`Election day midday: sent=${sentCount}, skipped=${skipped.length}`);
    return { sent: sentCount, skipped: skipped.length };
  }

  /**
   * Send election day final push notification (4:30 PM).
   * Higher urgency for non-checked-in members.
   */
  async sendElectionDayFinal(
    electionId: string,
  ): Promise<{ sent: number; skipped: number }> {
    const nonVoterIds = await this.getEligibleNonVoters(electionId);

    if (nonVoterIds.length === 0) {
      return { sent: 0, skipped: 0 };
    }

    const usersWithGotv = await this.filterByGotvPreference(nonVoterIds);
    const { eligible, skipped } = await this.filterByQuietHoursAndCap(usersWithGotv);

    if (eligible.length === 0) {
      return { sent: 0, skipped: nonVoterIds.length };
    }

    const title = 'נותרו 2.5 שעות!';
    const body = 'אם טרם הצבעת, עכשיו הזמן';

    const sentCount = await this.sendPushToUserIds(eligible, title, body, {
      type: 'gotv_election_day',
      electionId,
      reminderType: 'final',
      urgency: 'high',
    });

    await this.recordNotificationSent(electionId, eligible, 'election_day_final');

    this.logger.log(`Election day final: sent=${sentCount}, skipped=${skipped.length}`);
    return { sent: sentCount, skipped: skipped.length };
  }

  // ─── Helper methods ────────────────────────────────────────

  /**
   * Find the current active election (status = UPCOMING or VOTING).
   */
  async getActiveElection(): Promise<PrimaryElection | null> {
    // Look for VOTING first (election day), then UPCOMING (pre-election)
    const voting = await this.electionRepo.findOne({
      where: { status: ElectionStatus.VOTING, isActive: true },
      order: { electionDate: 'ASC' },
    });
    if (voting) return voting;

    const upcoming = await this.electionRepo.findOne({
      where: { status: ElectionStatus.UPCOMING, isActive: true },
      order: { electionDate: 'ASC' },
    });
    return upcoming || null;
  }

  /**
   * Get user IDs who are eligible (have an engagement record)
   * but haven't checked in yet for the given election.
   */
  async getEligibleNonVoters(electionId: string): Promise<string[]> {
    const engagements = await this.gotvRepo.find({
      where: {
        electionId,
        stationCheckinAt: IsNull(),
        remindersEnabled: true,
      },
    });

    return engagements.map((e) => e.appUserId);
  }

  // ─── Private helpers ───────────────────────────────────────

  /**
   * Get eligible users who have NOT set a voting plan yet.
   * "Eligible" = have a GOTV engagement record with remindersEnabled.
   */
  private async getEligibleWithoutPlan(electionId: string): Promise<string[]> {
    const engagements = await this.gotvRepo.find({
      where: {
        electionId,
        votingPlanTime: IsNull(),
        remindersEnabled: true,
      },
    });

    return engagements.map((e) => e.appUserId);
  }

  /**
   * Filter user IDs to only those who have notifGotv=true.
   */
  private async filterByGotvPreference(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];

    const users = await this.appUserRepo.find({
      where: { id: In(userIds), notifGotv: true },
      select: ['id'],
    });

    return users.map((u) => u.id);
  }

  /**
   * Filter user IDs by quiet hours and frequency cap.
   * Returns users that passed and users that were skipped.
   */
  private async filterByQuietHoursAndCap(
    userIds: string[],
  ): Promise<{ eligible: string[]; skipped: string[] }> {
    if (userIds.length === 0) return { eligible: [], skipped: [] };

    const users = await this.appUserRepo.find({
      where: { id: In(userIds) },
    });

    const eligible: string[] = [];
    const skipped: string[] = [];

    for (const user of users) {
      // Check quiet hours
      if (this.pushService.isInQuietHours(user)) {
        skipped.push(user.id);
        continue;
      }

      // Check frequency cap
      const canSend = await this.pushService.checkFrequencyCap(user.id);
      if (!canSend) {
        skipped.push(user.id);
        continue;
      }

      eligible.push(user.id);
    }

    return { eligible, skipped };
  }

  /**
   * Send push notifications to a list of user IDs.
   * Returns count of notifications successfully dispatched.
   */
  private async sendPushToUserIds(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    if (userIds.length === 0) return 0;

    // Get active push tokens for these users
    const tokens = await this.pushTokenRepo.find({
      where: { userId: In(userIds), isActive: true },
    });

    if (tokens.length === 0) {
      this.logger.log('No active push tokens for target GOTV users');
      return 0;
    }

    // Increment frequency counters
    for (const userId of userIds) {
      await this.pushService.incrementFrequencyCount(userId);
    }

    const result = await this.pushService.sendToAll({
      title,
      body,
      data: data as any,
    });

    return result.sent;
  }

  /**
   * Record notification sent in gotv_engagement.notificationLog JSONB array.
   */
  private async recordNotificationSent(
    electionId: string,
    userIds: string[],
    reminderType: string,
  ): Promise<void> {
    if (userIds.length === 0) return;

    const logEntry = JSON.stringify({
      type: reminderType,
      sentAt: new Date().toISOString(),
    });

    await this.gotvRepo
      .createQueryBuilder()
      .update(GotvEngagement)
      .set({
        notificationsSent: () => '"notificationsSent" + 1',
        notificationLog: () =>
          `"notificationLog" || '${logEntry}'::jsonb`,
      })
      .where('"appUserId" IN (:...userIds)', { userIds })
      .andWhere('"electionId" = :electionId', { electionId })
      .execute();
  }

  /**
   * Calculate overall turnout percentage for an election.
   */
  private async calculateTurnoutPercent(electionId: string): Promise<number> {
    const totalEngaged = await this.gotvRepo.count({
      where: { electionId },
    });

    if (totalEngaged === 0) return 0;

    const checkedIn = await this.gotvRepo.count({
      where: { electionId, stationCheckinAt: Not(IsNull()) },
    });

    return Math.round((checkedIn / totalEngaged) * 100);
  }
}
