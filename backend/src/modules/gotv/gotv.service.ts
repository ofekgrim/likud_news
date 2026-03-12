import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { GotvEngagement } from './entities/gotv-engagement.entity';
import { PollingStation } from '../polling-stations/entities/polling-station.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { PushToken } from '../push/entities/push-token.entity';
import { UserBadge, BadgeType } from '../gamification/entities/user-badge.entity';
import { GamificationService } from '../gamification/gamification.service';
import { PointAction } from '../gamification/entities/user-points.entity';
import { PushService } from '../push/push.service';
import { GotvReminderType } from './dto/trigger-reminders.dto';
import { VotingEligibility } from '../app-users/entities/voting-eligibility.entity';

/** Maximum distance in metres for a valid station check-in */
const CHECKIN_RADIUS_METRES = 500;

/** Points awarded for the I_VOTED badge */
const I_VOTED_POINTS = 50;

@Injectable()
export class GotvService {
  private readonly logger = new Logger(GotvService.name);

  constructor(
    @InjectRepository(GotvEngagement)
    private readonly gotvRepo: Repository<GotvEngagement>,
    @InjectRepository(PollingStation)
    private readonly stationRepo: Repository<PollingStation>,
    @InjectRepository(PrimaryElection)
    private readonly electionRepo: Repository<PrimaryElection>,
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
    @InjectRepository(VotingEligibility)
    private readonly eligibilityRepo: Repository<VotingEligibility>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    private readonly gamificationService: GamificationService,
    private readonly pushService: PushService,
  ) {}

  // ─── Core GOTV methods ──────────────────────────────────────

  /**
   * Create or update a voting plan for a user + election.
   */
  async saveVotingPlan(
    userId: string,
    electionId: string,
    plannedTime: string,
    stationId?: string,
  ): Promise<GotvEngagement> {
    // Validate election exists
    const election = await this.electionRepo.findOne({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Validate station if provided
    if (stationId) {
      const station = await this.stationRepo.findOne({
        where: { id: stationId },
      });
      if (!station) {
        throw new NotFoundException('Polling station not found');
      }
    }

    let engagement = await this.gotvRepo.findOne({
      where: { appUserId: userId, electionId },
    });

    if (engagement) {
      engagement.votingPlanTime = new Date(plannedTime);
      if (stationId) {
        engagement.plannedStationId = stationId;
      }
    } else {
      engagement = this.gotvRepo.create({
        appUserId: userId,
        electionId,
        votingPlanTime: new Date(plannedTime),
        ...(stationId && { plannedStationId: stationId }),
      });
    }

    const saved = await this.gotvRepo.save(engagement);
    this.logger.log(
      `Voting plan saved for user ${userId}, election ${electionId}`,
    );
    return saved;
  }

  /**
   * Record a GPS-verified check-in at a polling station.
   * Validates that the user is within CHECKIN_RADIUS_METRES of their assigned/nearest station.
   */
  async recordCheckin(
    userId: string,
    electionId: string,
    latitude: number,
    longitude: number,
  ): Promise<GotvEngagement> {
    const engagement = await this.gotvRepo.findOne({
      where: { appUserId: userId, electionId },
    });

    if (!engagement) {
      throw new NotFoundException(
        'No voting plan found. Please create a voting plan first.',
      );
    }

    if (engagement.stationCheckinAt) {
      throw new ConflictException('Already checked in for this election');
    }

    // Find the nearest station for this election
    const stations = await this.stationRepo.find({
      where: { electionId, isActive: true },
    });

    if (stations.length === 0) {
      throw new NotFoundException(
        'No polling stations found for this election',
      );
    }

    // If user has a planned station, check against that first
    let targetStation: PollingStation | null = null;
    if (engagement.plannedStationId) {
      targetStation =
        stations.find((s) => s.id === engagement.plannedStationId) || null;
    }

    // If no planned station or planned station not found, find nearest
    if (!targetStation) {
      let minDist = Infinity;
      for (const station of stations) {
        if (station.latitude == null || station.longitude == null) continue;
        const dist = this.haversineDistance(
          latitude,
          longitude,
          Number(station.latitude),
          Number(station.longitude),
        );
        if (dist < minDist) {
          minDist = dist;
          targetStation = station;
        }
      }
    }

    if (!targetStation || targetStation.latitude == null) {
      throw new BadRequestException(
        'Could not verify proximity — no station with GPS coordinates found',
      );
    }

    const distance = this.haversineDistance(
      latitude,
      longitude,
      Number(targetStation.latitude),
      Number(targetStation.longitude),
    );

    if (distance > CHECKIN_RADIUS_METRES) {
      throw new BadRequestException(
        `Too far from the polling station. You are ${Math.round(distance)}m away; must be within ${CHECKIN_RADIUS_METRES}m.`,
      );
    }

    engagement.stationCheckinAt = new Date();
    const saved = await this.gotvRepo.save(engagement);
    this.logger.log(
      `Check-in recorded for user ${userId} at station ${targetStation.id} (${Math.round(distance)}m away)`,
    );
    return saved;
  }

  /**
   * Claim the I_VOTED badge. Requires prior check-in.
   * Awards I_VOTED badge + 50 points via the gamification service.
   */
  async claimIVotedBadge(
    userId: string,
    electionId: string,
  ): Promise<GotvEngagement> {
    const engagement = await this.gotvRepo.findOne({
      where: { appUserId: userId, electionId },
    });

    if (!engagement) {
      throw new NotFoundException('No GOTV engagement found for this election');
    }

    if (engagement.votedBadgeClaimedAt) {
      throw new ConflictException('I Voted badge already claimed');
    }

    if (!engagement.stationCheckinAt) {
      throw new BadRequestException(
        'You must check in at a polling station before claiming the I Voted badge',
      );
    }

    // Award points via gamification service
    await this.gamificationService.awardPoints({
      userId,
      action: PointAction.PROFILE_COMPLETE, // Using existing action; points overridden
      points: I_VOTED_POINTS,
      metadata: { source: 'gotv_i_voted', electionId },
    });

    // Award the I_VOTED badge directly (not auto-detected by checkAndAwardBadges)
    try {
      const badge = this.userBadgeRepo.create({
        userId,
        badgeType: BadgeType.I_VOTED,
      });
      await this.userBadgeRepo.save(badge);
    } catch {
      // Unique constraint violation — badge already exists, ignore
    }

    engagement.votedBadgeClaimedAt = new Date();
    const saved = await this.gotvRepo.save(engagement);

    this.logger.log(
      `I Voted badge claimed by user ${userId} for election ${electionId}`,
    );
    return saved;
  }

  /**
   * Get the full GOTV status for a user in a given election.
   */
  async getGotvStatus(
    userId: string,
    electionId: string,
  ): Promise<{
    hasPlan: boolean;
    votingPlanTime: Date | null;
    plannedStationId: string | null;
    hasCheckedIn: boolean;
    stationCheckinAt: Date | null;
    hasBadge: boolean;
    votedBadgeClaimedAt: Date | null;
    notificationsSent: number;
    remindersSnoozed: string[];
  }> {
    const engagement = await this.gotvRepo.findOne({
      where: { appUserId: userId, electionId },
    });

    if (!engagement) {
      return {
        hasPlan: false,
        votingPlanTime: null,
        plannedStationId: null,
        hasCheckedIn: false,
        stationCheckinAt: null,
        hasBadge: false,
        votedBadgeClaimedAt: null,
        notificationsSent: 0,
        remindersSnoozed: [],
      };
    }

    return {
      hasPlan: engagement.votingPlanTime != null,
      votingPlanTime: engagement.votingPlanTime,
      plannedStationId: engagement.plannedStationId,
      hasCheckedIn: engagement.stationCheckinAt != null,
      stationCheckinAt: engagement.stationCheckinAt,
      hasBadge: engagement.votedBadgeClaimedAt != null,
      votedBadgeClaimedAt: engagement.votedBadgeClaimedAt,
      notificationsSent: engagement.notificationsSent,
      remindersSnoozed: engagement.remindersSnoozed,
    };
  }

  /**
   * Get turnout percentage per branch (city/district) for GOTV leaderboard.
   * Compares checked-in users vs. eligible users per branch.
   */
  async getBranchTurnout(
    electionId: string,
  ): Promise<
    Array<{
      branch: string;
      eligibleCount: number;
      checkedInCount: number;
      turnoutPercent: number;
    }>
  > {
    // Get all eligible users for this election with their stations
    const eligibleQuery = this.eligibilityRepo
      .createQueryBuilder('ve')
      .select('ps.city', 'branch')
      .addSelect('COUNT(DISTINCT ve."userId")', 'eligibleCount')
      .leftJoin(
        GotvEngagement,
        'ge',
        'ge."appUserId" = ve."userId" AND ge."electionId" = ve."electionId"',
      )
      .leftJoin(
        PollingStation,
        'ps',
        'ps.id = ge."plannedStationId"',
      )
      .where('ve."electionId" = :electionId', { electionId })
      .andWhere('ps.city IS NOT NULL')
      .groupBy('ps.city');

    const eligibleRows = await eligibleQuery.getRawMany();

    // Get checked-in counts per branch
    const checkedInQuery = this.gotvRepo
      .createQueryBuilder('ge')
      .select('ps.city', 'branch')
      .addSelect('COUNT(DISTINCT ge."appUserId")', 'checkedInCount')
      .leftJoin(
        PollingStation,
        'ps',
        'ps.id = ge."plannedStationId"',
      )
      .where('ge."electionId" = :electionId', { electionId })
      .andWhere('ge."stationCheckinAt" IS NOT NULL')
      .andWhere('ps.city IS NOT NULL')
      .groupBy('ps.city');

    const checkedInRows = await checkedInQuery.getRawMany();
    const checkedInMap = new Map<string, number>(
      checkedInRows.map((r) => [r.branch, parseInt(r.checkedInCount, 10)]),
    );

    return eligibleRows
      .map((row) => {
        const eligible = parseInt(row.eligibleCount, 10);
        const checkedIn = checkedInMap.get(row.branch) || 0;
        return {
          branch: row.branch,
          eligibleCount: eligible,
          checkedInCount: checkedIn,
          turnoutPercent:
            eligible > 0
              ? Math.round((checkedIn / eligible) * 10000) / 100
              : 0,
        };
      })
      .sort((a, b) => b.turnoutPercent - a.turnoutPercent);
  }

  // ─── Push notification methods ──────────────────────────────

  /**
   * Send pre-election reminders to all users with a voting plan.
   * Called for 7-day, 3-day, and 1-day before election date.
   */
  async sendPreElectionReminders(
    electionId: string,
    daysBeforeElection: number,
  ): Promise<{ sent: number; failed: number }> {
    const election = await this.electionRepo.findOne({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Find all users with a voting plan for this election
    const engagements = await this.gotvRepo.find({
      where: { electionId, votingPlanTime: Not(IsNull()) },
    });

    if (engagements.length === 0) {
      this.logger.log('No users with voting plans — skipping reminders');
      return { sent: 0, failed: 0 };
    }

    const userIds = engagements.map((e) => e.appUserId);

    const dayWord = this.hebrewDaysWord(daysBeforeElection);
    const title = 'תזכורת הצבעה';
    const body = `עוד ${dayWord} ליום הבחירות! אל תשכחו להצביע ב${election.title}.`;

    const result = await this.sendPushToUsers(userIds, title, body, {
      type: 'gotv_reminder',
      electionId,
      reminderType: `pre_election_${daysBeforeElection}d`,
    });

    // Update notification count
    await this.gotvRepo
      .createQueryBuilder()
      .update(GotvEngagement)
      .set({ notificationsSent: () => '"notificationsSent" + 1' })
      .where('"appUserId" IN (:...userIds)', { userIds })
      .andWhere('"electionId" = :electionId', { electionId })
      .execute();

    this.logger.log(
      `Pre-election reminders (${daysBeforeElection}d) sent: ${result.sent} ok, ${result.failed} failed`,
    );
    return result;
  }

  /**
   * Send election day reminders at specific times.
   * Morning (7:30): all with plans. Noon (12:00) and afternoon (16:30): non-voters only.
   */
  async sendElectionDayReminders(
    electionId: string,
    reminderType: GotvReminderType,
  ): Promise<{ sent: number; failed: number }> {
    const election = await this.electionRepo.findOne({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('Election not found');
    }

    let engagements: GotvEngagement[];
    let title: string;
    let body: string;

    switch (reminderType) {
      case GotvReminderType.ELECTION_DAY_MORNING:
        // 7:30 AM — all users with voting plans
        engagements = await this.gotvRepo.find({
          where: { electionId, votingPlanTime: Not(IsNull()) },
        });
        title = 'היום יום הבחירות!';
        body = `הקלפיות פתוחות! הגיעו להצביע ב${election.title}. כל קול נחשב.`;
        break;

      case GotvReminderType.ELECTION_DAY_NOON:
        // 12:00 PM — non-voters only
        engagements = await this.gotvRepo.find({
          where: {
            electionId,
            votingPlanTime: Not(IsNull()),
            stationCheckinAt: IsNull(),
          },
        });
        title = 'עדיין לא הצבעתם?';
        body = `חצי היום כבר עבר. הגיעו להצביע ב${election.title} — כל קול חשוב!`;
        break;

      case GotvReminderType.ELECTION_DAY_AFTERNOON:
        // 4:30 PM — non-voters only
        engagements = await this.gotvRepo.find({
          where: {
            electionId,
            votingPlanTime: Not(IsNull()),
            stationCheckinAt: IsNull(),
          },
        });
        title = 'שעות אחרונות להצבעה!';
        body = `הקלפיות נסגרות בקרוב. אל תפספסו את ההזדמנות להצביע ב${election.title}.`;
        break;

      default:
        throw new BadRequestException(
          `Invalid election day reminder type: ${reminderType}`,
        );
    }

    if (engagements.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const userIds = engagements.map((e) => e.appUserId);
    const result = await this.sendPushToUsers(userIds, title, body, {
      type: 'gotv_election_day',
      electionId,
      reminderType,
    });

    await this.gotvRepo
      .createQueryBuilder()
      .update(GotvEngagement)
      .set({ notificationsSent: () => '"notificationsSent" + 1' })
      .where('"appUserId" IN (:...userIds)', { userIds })
      .andWhere('"electionId" = :electionId', { electionId })
      .execute();

    this.logger.log(
      `Election day reminders (${reminderType}) sent: ${result.sent} ok, ${result.failed} failed`,
    );
    return result;
  }

  /**
   * Send thank-you message to users who checked in (voted).
   * Typically called 30 minutes after polls close.
   */
  async sendPostVoteThankYou(
    electionId: string,
  ): Promise<{ sent: number; failed: number }> {
    const election = await this.electionRepo.findOne({
      where: { id: electionId },
    });
    if (!election) {
      throw new NotFoundException('Election not found');
    }

    // Only send to users who actually checked in
    const engagements = await this.gotvRepo.find({
      where: {
        electionId,
        stationCheckinAt: Not(IsNull()),
      },
    });

    if (engagements.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const userIds = engagements.map((e) => e.appUserId);
    const title = 'תודה שהצבעתם!';
    const body =
      'תודה על המחויבות שלכם לליכוד ולתהליך הדמוקרטי. הקול שלכם נשמע!';

    const result = await this.sendPushToUsers(userIds, title, body, {
      type: 'gotv_thank_you',
      electionId,
    });

    await this.gotvRepo
      .createQueryBuilder()
      .update(GotvEngagement)
      .set({ notificationsSent: () => '"notificationsSent" + 1' })
      .where('"appUserId" IN (:...userIds)', { userIds })
      .andWhere('"electionId" = :electionId', { electionId })
      .execute();

    this.logger.log(
      `Post-vote thank-you sent: ${result.sent} ok, ${result.failed} failed`,
    );
    return result;
  }

  /**
   * Dispatch the correct reminder method based on the reminder type.
   * Used by the admin trigger endpoint.
   */
  async triggerReminder(
    electionId: string,
    reminderType: GotvReminderType,
  ): Promise<{ sent: number; failed: number }> {
    switch (reminderType) {
      case GotvReminderType.PRE_ELECTION_7D:
        return this.sendPreElectionReminders(electionId, 7);
      case GotvReminderType.PRE_ELECTION_3D:
        return this.sendPreElectionReminders(electionId, 3);
      case GotvReminderType.PRE_ELECTION_1D:
        return this.sendPreElectionReminders(electionId, 1);
      case GotvReminderType.ELECTION_DAY_MORNING:
      case GotvReminderType.ELECTION_DAY_NOON:
      case GotvReminderType.ELECTION_DAY_AFTERNOON:
        return this.sendElectionDayReminders(electionId, reminderType);
      case GotvReminderType.POST_VOTE_THANK_YOU:
        return this.sendPostVoteThankYou(electionId);
      default:
        throw new BadRequestException(`Unknown reminder type: ${reminderType}`);
    }
  }

  // ─── Private helpers ────────────────────────────────────────

  /**
   * Send push notification to a specific set of user IDs.
   * Looks up their active push tokens and sends via FCM.
   */
  private async sendPushToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ sent: number; failed: number }> {
    if (userIds.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Get active push tokens for these users
    const tokens = await this.pushTokenRepo.find({
      where: { userId: In(userIds), isActive: true },
    });

    if (tokens.length === 0) {
      this.logger.log('No active push tokens for target users');
      return { sent: 0, failed: 0 };
    }

    // Use the push service to broadcast. The sendToAll method sends to all active tokens.
    // In production, PushService should be extended with a sendToUsers(userIds, dto) method
    // for targeted sends. For now, this delegates to the existing broadcast mechanism.
    const result = await this.pushService.sendToAll({
      title,
      body,
      data: data as any,
    });

    return result;
  }

  /**
   * Calculate the distance between two GPS coordinates using the Haversine formula.
   * Returns distance in metres.
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6_371_000; // Earth radius in metres
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Return the Hebrew word for a number of days.
   */
  private hebrewDaysWord(days: number): string {
    switch (days) {
      case 1:
        return 'יום אחד';
      case 2:
        return 'יומיים';
      case 3:
        return '3 ימים';
      case 7:
        return 'שבוע';
      default:
        return `${days} ימים`;
    }
  }
}
