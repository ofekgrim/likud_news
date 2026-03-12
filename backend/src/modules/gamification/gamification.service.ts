import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, PointAction, POINT_VALUES } from './entities/user-points.entity';
import { UserBadge, BadgeType } from './entities/user-badge.entity';
import { UserStreak } from './entities/user-streak.entity';
import { StreakMilestone, MilestoneType } from './entities/streak-milestone.entity';
import { DailyQuizAttempt } from './entities/daily-quiz-attempt.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { AwardPointsDto } from './dto/award-points.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';
import { TierResponseDto } from './dto/tier-response.dto';
import {
  StreakActivityType,
  STREAK_ACTIVITY_XP,
} from './dto/record-streak-activity.dto';
import { DailyMissionService } from './daily-mission.service';

/** Max freeze tokens a user can hold at any time */
const MAX_FREEZE_TOKENS = 3;

/** Tier thresholds — maps total XP to tier number and Hebrew name */
const TIER_THRESHOLDS: Array<{
  tier: number;
  name: string;
  nameEn: string;
  minXp: number;
}> = [
  { tier: 1, name: 'פעיל', nameEn: 'Active', minXp: 0 },
  { tier: 2, name: 'מוביל', nameEn: 'Leader', minXp: 500 },
  { tier: 3, name: 'שגריר', nameEn: 'Ambassador', minXp: 2000 },
  { tier: 4, name: 'גנרל', nameEn: 'General', minXp: 7500 },
  { tier: 5, name: 'אריה', nameEn: 'Lion', minXp: 25000 },
];

/** Feature gates per tier */
const TIER_FEATURES: Array<{
  feature: string;
  requiredTier: number;
}> = [
  { feature: 'ama_early_access', requiredTier: 2 },
  { feature: 'vip_events', requiredTier: 3 },
  { feature: 'mk_qa', requiredTier: 4 },
  { feature: 'merchandise', requiredTier: 5 },
];

/** Milestone definitions: days → bonus points */
const MILESTONE_DEFS: Array<{
  days: number;
  milestone: MilestoneType;
  bonus: number;
  awardFreezeToken: boolean;
}> = [
  { days: 7, milestone: MilestoneType.DAYS_7, bonus: 50, awardFreezeToken: true },
  { days: 14, milestone: MilestoneType.DAYS_14, bonus: 100, awardFreezeToken: false },
  { days: 30, milestone: MilestoneType.DAYS_30, bonus: 200, awardFreezeToken: false },
  { days: 100, milestone: MilestoneType.DAYS_100, bonus: 500, awardFreezeToken: false },
  { days: 365, milestone: MilestoneType.DAYS_365, bonus: 1000, awardFreezeToken: false },
];

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(UserPoints)
    private readonly userPointsRepository: Repository<UserPoints>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    @InjectRepository(StreakMilestone)
    private readonly streakMilestoneRepository: Repository<StreakMilestone>,
    @InjectRepository(DailyQuizAttempt)
    private readonly dailyQuizAttemptRepository: Repository<DailyQuizAttempt>,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @Inject(forwardRef(() => DailyMissionService))
    private readonly dailyMissionService: DailyMissionService,
  ) {}

  // ─── Points ───────────────────────────────────────────────

  /**
   * Award points to a user. Updates streak and checks badge eligibility.
   */
  async awardPoints(dto: AwardPointsDto): Promise<UserPoints> {
    const points = dto.points || POINT_VALUES[dto.action] || 0;

    const record = this.userPointsRepository.create({
      userId: dto.userId,
      action: dto.action,
      points,
      metadata: dto.metadata || {},
    });

    const saved = await this.userPointsRepository.save(record);

    // Update streak on any qualifying action
    await this.updateStreak(dto.userId).catch((e) =>
      this.logger.error(`Streak update failed: ${e.message}`),
    );

    // Check and award badges after points are recorded
    await this.checkAndAwardBadges(dto.userId).catch((e) =>
      this.logger.error(`Badge check failed: ${e.message}`),
    );

    return saved;
  }

  /**
   * Convenience: award points by action type using default point values.
   */
  async trackAction(
    userId: string,
    action: PointAction,
    metadata?: Record<string, unknown>,
  ): Promise<UserPoints> {
    const result = await this.awardPoints({
      userId,
      action,
      points: POINT_VALUES[action] || 0,
      metadata,
    });

    // Auto-complete matching daily mission if one exists for today
    await this.dailyMissionService.autoTrackMission(userId, action).catch((e) =>
      this.logger.error(`Daily mission auto-track failed: ${e.message}`),
    );

    // Check tier promotion after points are awarded
    const { totalPoints } = await this.getUserPoints(userId);
    await this.checkTierPromotion(userId, totalPoints).catch((e) =>
      this.logger.error(`Tier promotion check failed: ${e.message}`),
    );

    return result;
  }

  /**
   * Get total points for a user.
   */
  async getUserPoints(userId: string): Promise<{ userId: string; totalPoints: number }> {
    const result = await this.userPointsRepository
      .createQueryBuilder('up')
      .select('SUM(up.points)', 'totalPoints')
      .where('up.userId = :userId', { userId })
      .getRawOne();

    return {
      userId,
      totalPoints: parseInt(result?.totalPoints || '0', 10),
    };
  }

  /**
   * Get paginated points history for a user.
   */
  async getUserPointsHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: UserPoints[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.userPointsRepository.findAndCount({
      where: { userId },
      order: { earnedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Streaks ──────────────────────────────────────────────

  /**
   * Get or create user streak record.
   */
  async getStreak(userId: string): Promise<UserStreak> {
    let streak = await this.userStreakRepository.findOne({ where: { userId } });
    if (!streak) {
      streak = this.userStreakRepository.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        freezeTokens: 0,
        freezeTokensUsed: 0,
        lastFreezeUsedDate: null,
        tier: 1,
      });
      streak = await this.userStreakRepository.save(streak);
    }
    return streak;
  }

  /**
   * Get full streak state including milestones and at-risk status.
   */
  async getFullStreakState(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    freezeTokens: number;
    freezeTokensUsed: number;
    tier: number;
    tierName: string;
    milestones: StreakMilestone[];
    atRisk: boolean;
  }> {
    const streak = await this.getStreak(userId);
    const milestones = await this.streakMilestoneRepository.find({
      where: { userId },
      order: { earnedAt: 'ASC' },
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Streak is at risk if last activity was yesterday (they haven't done anything today)
    // and they have no freeze tokens
    let atRisk = false;
    if (streak.lastActivityDate && streak.lastActivityDate !== todayStr && streak.currentStreak > 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (streak.lastActivityDate === yesterdayStr && streak.freezeTokens === 0) {
        atRisk = true;
      }
    }

    const { totalPoints } = await this.getUserPoints(userId);
    const tierInfo = this.getTierForXp(totalPoints);

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      freezeTokens: streak.freezeTokens,
      freezeTokensUsed: streak.freezeTokensUsed,
      tier: tierInfo.tier,
      tierName: tierInfo.name,
      milestones,
      atRisk,
    };
  }

  /**
   * Record a qualifying streak activity. Awards XP and updates streak.
   */
  async recordStreakActivity(
    userId: string,
    activityType: StreakActivityType,
  ): Promise<{
    streak: UserStreak;
    xpAwarded: number;
    milestoneReached: MilestoneType | null;
    freezeTokenAwarded: boolean;
    tierChanged: boolean;
    newTier: number;
    newTierName: string;
  }> {
    const xp = STREAK_ACTIVITY_XP[activityType];

    // Map streak activity to point action
    const actionMap: Record<StreakActivityType, PointAction> = {
      [StreakActivityType.QUIZ_COMPLETE]: PointAction.QUIZ_COMPLETE,
      [StreakActivityType.ARTICLE_READ]: PointAction.ARTICLE_READ,
      [StreakActivityType.POLL_VOTE]: PointAction.POLL_VOTE,
      [StreakActivityType.SHARE_CONTENT]: PointAction.SHARE,
      [StreakActivityType.EVENT_RSVP]: PointAction.EVENT_RSVP,
    };

    // Award XP points
    await this.userPointsRepository.save(
      this.userPointsRepository.create({
        userId,
        action: actionMap[activityType],
        points: xp,
        metadata: { source: 'streak_activity', activityType },
      }),
    );

    // Update streak
    const streak = await this.updateStreak(userId);

    // Check milestones
    const milestoneReached = await this.checkAndAwardMilestones(userId, streak);

    // Check freeze token earning (every 7-day multiple)
    let freezeTokenAwarded = false;
    if (streak.currentStreak > 0 && streak.currentStreak % 7 === 0) {
      freezeTokenAwarded = await this.maybeAwardFreezeToken(userId, streak);
    }

    // Check tier promotion
    const { totalPoints } = await this.getUserPoints(userId);
    const oldTier = streak.tier;
    const newTierInfo = this.getTierForXp(totalPoints);
    let tierChanged = false;

    if (newTierInfo.tier !== oldTier) {
      streak.tier = newTierInfo.tier;
      await this.userStreakRepository.save(streak);
      tierChanged = true;
      this.logger.log(
        `User ${userId} promoted to tier ${newTierInfo.tier} (${newTierInfo.name})`,
      );
    }

    // Check badges
    await this.checkAndAwardBadges(userId).catch((e) =>
      this.logger.error(`Badge check failed: ${e.message}`),
    );

    return {
      streak,
      xpAwarded: xp,
      milestoneReached,
      freezeTokenAwarded,
      tierChanged,
      newTier: newTierInfo.tier,
      newTierName: newTierInfo.name,
    };
  }

  /**
   * Manually use a freeze token to protect the streak.
   */
  async useFreeze(userId: string): Promise<UserStreak> {
    const streak = await this.getStreak(userId);

    if (streak.freezeTokens <= 0) {
      throw new BadRequestException('No freeze tokens available');
    }

    if (streak.currentStreak === 0) {
      throw new BadRequestException('No active streak to freeze');
    }

    const today = new Date().toISOString().split('T')[0];

    streak.freezeTokens -= 1;
    streak.freezeTokensUsed += 1;
    streak.lastFreezeUsedDate = today;
    // Extend lastActivityDate to today so tomorrow counts as consecutive
    streak.lastActivityDate = today;

    const saved = await this.userStreakRepository.save(streak);
    this.logger.log(
      `User ${userId} used freeze token. Remaining: ${saved.freezeTokens}`,
    );

    return saved;
  }

  /**
   * Update streak for a user. Called on every qualifying action.
   * - Same day: no-op
   * - Yesterday (or Shabbat grace): increment streak
   * - Missed day with freeze token: auto-use freeze, keep streak
   * - Older or null: reset to 1
   * Awards streak bonus at milestones.
   */
  async updateStreak(userId: string): Promise<UserStreak> {
    const streak = await this.getStreak(userId);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (streak.lastActivityDate === todayStr) {
      // Already active today — no change
      return streak;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastActivityDate === yesterdayStr) {
      // Consecutive day — increment
      streak.currentStreak += 1;
    } else if (
      streak.lastActivityDate &&
      this.isShabbatGracePeriod(streak.lastActivityDate, todayStr)
    ) {
      // Shabbat grace — treat as consecutive
      streak.currentStreak += 1;
      this.logger.log(`Shabbat grace applied for user ${userId}`);
    } else if (
      streak.lastActivityDate &&
      streak.currentStreak > 0 &&
      streak.freezeTokens > 0 &&
      this.isOneDayGap(streak.lastActivityDate, todayStr)
    ) {
      // One-day gap with freeze token available — auto-use freeze
      streak.freezeTokens -= 1;
      streak.freezeTokensUsed += 1;
      streak.lastFreezeUsedDate = yesterdayStr;
      streak.currentStreak += 1;
      this.logger.log(
        `Auto-freeze used for user ${userId}. Remaining tokens: ${streak.freezeTokens}`,
      );
    } else {
      // Gap in activity — reset to 1
      streak.currentStreak = 1;
    }

    streak.lastActivityDate = todayStr;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    const saved = await this.userStreakRepository.save(streak);
    return saved;
  }

  /**
   * Check if the gap between lastDate and today qualifies for Shabbat grace.
   * Grace applies when:
   * - Last activity was Friday and today is Saturday (after Shabbat ends ~19:30 Israel time)
   * - Last activity was Friday and today is Sunday (missed Saturday entirely)
   */
  isShabbatGracePeriod(lastDateStr: string, todayStr: string): boolean {
    const lastDate = new Date(lastDateStr + 'T12:00:00Z');
    const today = new Date(todayStr + 'T12:00:00Z');

    const lastDayOfWeek = lastDate.getUTCDay(); // 0=Sunday, 5=Friday, 6=Saturday
    const todayDayOfWeek = today.getUTCDay();

    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Case 1: Last activity Friday, today Saturday (1-day gap — already handled by normal consecutive check)
    // Case 2: Last activity Friday, today Sunday (2-day gap — Shabbat grace)
    if (lastDayOfWeek === 5 && todayDayOfWeek === 0 && diffDays === 2) {
      return true;
    }

    // Case 3: Last activity Thursday, today Saturday (2-day gap where Friday was missed, no grace)
    // Only grant grace for Friday→Sunday pattern
    return false;
  }

  /**
   * Check if there is exactly a one-day gap (i.e., missed exactly one day).
   * Used for auto-freeze logic.
   */
  private isOneDayGap(lastDateStr: string, todayStr: string): boolean {
    const lastDate = new Date(lastDateStr + 'T12:00:00Z');
    const today = new Date(todayStr + 'T12:00:00Z');
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays === 2; // last was 2 days ago = missed 1 day
  }

  /**
   * Check and award milestone for current streak.
   */
  private async checkAndAwardMilestones(
    userId: string,
    streak: UserStreak,
  ): Promise<MilestoneType | null> {
    let reached: MilestoneType | null = null;

    for (const def of MILESTONE_DEFS) {
      if (streak.currentStreak === def.days) {
        // Check if milestone already earned
        const existing = await this.streakMilestoneRepository.findOne({
          where: { userId, milestone: def.milestone },
        });

        if (!existing) {
          await this.streakMilestoneRepository.save(
            this.streakMilestoneRepository.create({
              userId,
              milestone: def.milestone,
              bonusPoints: def.bonus,
            }),
          );

          // Award bonus points
          await this.userPointsRepository.save(
            this.userPointsRepository.create({
              userId,
              action: PointAction.STREAK_BONUS,
              points: def.bonus,
              metadata: { milestone: def.milestone, days: def.days },
            }),
          );

          // Award freeze token at 7-day milestone
          if (def.awardFreezeToken) {
            await this.maybeAwardFreezeToken(userId, streak);
          }

          reached = def.milestone;
          this.logger.log(
            `Streak milestone ${def.milestone} for user ${userId}: +${def.bonus} points`,
          );
        }
      }
    }

    return reached;
  }

  /**
   * Award a freeze token if under the max limit.
   */
  private async maybeAwardFreezeToken(
    userId: string,
    streak: UserStreak,
  ): Promise<boolean> {
    if (streak.freezeTokens < MAX_FREEZE_TOKENS) {
      streak.freezeTokens += 1;
      await this.userStreakRepository.save(streak);
      this.logger.log(
        `Freeze token awarded to user ${userId}. Total: ${streak.freezeTokens}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Determine tier based on total XP.
   */
  getTierForXp(totalXp: number): { tier: number; name: string; nameEn: string; minXp: number } {
    let result = TIER_THRESHOLDS[0];
    for (const threshold of TIER_THRESHOLDS) {
      if (totalXp >= threshold.minXp) {
        result = threshold;
      }
    }
    return result;
  }

  /**
   * Get full tier info for a user, including progress and feature gates.
   */
  async getTierInfo(userId: string): Promise<TierResponseDto> {
    const { totalPoints } = await this.getUserPoints(userId);
    const tierInfo = this.getTierForXp(totalPoints);

    // Find next tier
    const nextTier = TIER_THRESHOLDS.find((t) => t.tier === tierInfo.tier + 1);

    // Calculate progress to next tier
    let progressToNextTier = 1.0;
    if (nextTier) {
      const xpInCurrentTier = totalPoints - tierInfo.minXp;
      const xpNeededForNextTier = nextTier.minXp - tierInfo.minXp;
      progressToNextTier =
        xpNeededForNextTier > 0
          ? Math.round((xpInCurrentTier / xpNeededForNextTier) * 1000) / 1000
          : 1.0;
    }

    // Compute unlocked/locked features
    const unlockedFeatures = TIER_FEATURES
      .filter((f) => tierInfo.tier >= f.requiredTier)
      .map((f) => f.feature);

    const lockedFeatures = TIER_FEATURES
      .filter((f) => tierInfo.tier < f.requiredTier)
      .map((f) => {
        const requiredTierDef = TIER_THRESHOLDS.find((t) => t.tier === f.requiredTier);
        return {
          feature: f.feature,
          requiredTier: f.requiredTier,
          requiredTierName: requiredTierDef?.name ?? '',
        };
      });

    return {
      currentTier: tierInfo.tier,
      tierName: tierInfo.name,
      tierNameEn: tierInfo.nameEn,
      totalXp: totalPoints,
      nextTierXp: nextTier?.minXp ?? null,
      progressToNextTier,
      unlockedFeatures,
      lockedFeatures,
    };
  }

  /**
   * Check if user has been promoted to a new tier after XP change.
   * Logs the promotion and updates the streak entity tier.
   * Returns true if tier changed.
   */
  async checkTierPromotion(userId: string, newTotalXp: number): Promise<boolean> {
    const streak = await this.getStreak(userId);
    const newTierInfo = this.getTierForXp(newTotalXp);

    if (newTierInfo.tier !== streak.tier) {
      const oldTier = streak.tier;
      streak.tier = newTierInfo.tier;
      await this.userStreakRepository.save(streak);

      if (newTierInfo.tier > oldTier) {
        this.logger.log(
          `User ${userId} promoted from tier ${oldTier} to ${newTierInfo.tier} (${newTierInfo.name})`,
        );
        // TODO: Send push notification on tier-up when push service is available
      } else {
        this.logger.log(
          `User ${userId} tier changed from ${oldTier} to ${newTierInfo.tier} (${newTierInfo.name})`,
        );
      }

      return true;
    }

    return false;
  }

  /**
   * Auto-promote tier based on total XP. Called after points are awarded.
   */
  private async autoPromoteTier(userId: string): Promise<void> {
    const streak = await this.getStreak(userId);
    const { totalPoints } = await this.getUserPoints(userId);
    const newTier = this.getTierForXp(totalPoints);

    if (newTier.tier !== streak.tier) {
      streak.tier = newTier.tier;
      await this.userStreakRepository.save(streak);
      this.logger.log(
        `User ${userId} tier auto-promoted to ${newTier.tier} (${newTier.name})`,
      );
    }
  }

  // ─── Badges ───────────────────────────────────────────────

  /**
   * Get all badges for a user.
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
    });
  }

  /**
   * Get all badges with progress info for a user.
   */
  async getUserBadgesWithProgress(userId: string): Promise<
    Array<{
      badgeType: BadgeType;
      earned: boolean;
      earnedAt: Date | null;
      progress: number;
      target: number;
    }>
  > {
    const earnedBadges = await this.getUserBadges(userId);
    const earnedMap = new Map(earnedBadges.map((b) => [b.badgeType, b.earnedAt]));

    const countAction = async (action: PointAction): Promise<number> => {
      return this.userPointsRepository.count({ where: { userId, action } });
    };

    const streak = await this.getStreak(userId);
    const quizCount = await countAction(PointAction.QUIZ_COMPLETE);
    const pollVoteCount = await countAction(PointAction.POLL_VOTE);
    const endorsementCount = await countAction(PointAction.ENDORSEMENT);
    const eventRsvpCount = await countAction(PointAction.EVENT_RSVP);
    const shareCount = await countAction(PointAction.SHARE);
    const articleReadCount = await countAction(PointAction.ARTICLE_READ);
    const dailyQuizCount = await this.dailyQuizAttemptRepository.count({
      where: { userId },
    });
    const { totalPoints } = await this.getUserPoints(userId);

    const badgeDefs: Array<{
      badgeType: BadgeType;
      progress: number;
      target: number;
    }> = [
      { badgeType: BadgeType.QUIZ_TAKER, progress: quizCount, target: 1 },
      { badgeType: BadgeType.FIRST_VOTE, progress: pollVoteCount, target: 1 },
      { badgeType: BadgeType.ENDORSER, progress: endorsementCount, target: 1 },
      { badgeType: BadgeType.POLL_VOTER, progress: pollVoteCount, target: 3 },
      { badgeType: BadgeType.EVENT_GOER, progress: eventRsvpCount, target: 3 },
      { badgeType: BadgeType.TOP_CONTRIBUTOR, progress: totalPoints, target: 500 },
      { badgeType: BadgeType.SOCIAL_SHARER, progress: shareCount, target: 5 },
      { badgeType: BadgeType.EARLY_BIRD, progress: streak.currentStreak, target: 7 },
      { badgeType: BadgeType.STREAK_7, progress: streak.longestStreak, target: 7 },
      { badgeType: BadgeType.STREAK_30, progress: streak.longestStreak, target: 30 },
      { badgeType: BadgeType.STREAK_100, progress: streak.longestStreak, target: 100 },
      { badgeType: BadgeType.QUIZ_MASTER, progress: dailyQuizCount, target: 10 },
      { badgeType: BadgeType.NEWS_JUNKIE, progress: articleReadCount, target: 50 },
      { badgeType: BadgeType.COMMUNITY_VOICE, progress: pollVoteCount, target: 50 },
    ];

    return badgeDefs.map((def) => ({
      badgeType: def.badgeType,
      earned: earnedMap.has(def.badgeType),
      earnedAt: earnedMap.get(def.badgeType) || null,
      progress: Math.min(def.progress, def.target),
      target: def.target,
    }));
  }

  /**
   * Check if user qualifies for any new badges based on their activity.
   */
  async checkAndAwardBadges(userId: string): Promise<void> {
    const existingBadges = await this.userBadgeRepository.find({
      where: { userId },
    });
    const earnedTypes = new Set(existingBadges.map((b) => b.badgeType));

    const countAction = async (action: PointAction): Promise<number> => {
      return this.userPointsRepository.count({ where: { userId, action } });
    };

    const maybeAwardBadge = async (
      badgeType: BadgeType,
      condition: boolean,
    ): Promise<void> => {
      if (condition && !earnedTypes.has(badgeType)) {
        try {
          const badge = this.userBadgeRepository.create({ userId, badgeType });
          await this.userBadgeRepository.save(badge);
          this.logger.log(`Badge awarded: ${badgeType} to user ${userId}`);
        } catch {
          // Unique constraint violation — badge already exists
        }
      }
    };

    const quizCount = await countAction(PointAction.QUIZ_COMPLETE);
    await maybeAwardBadge(BadgeType.QUIZ_TAKER, quizCount >= 1);

    const pollVoteCount = await countAction(PointAction.POLL_VOTE);
    await maybeAwardBadge(BadgeType.FIRST_VOTE, pollVoteCount >= 1);

    const endorsementCount = await countAction(PointAction.ENDORSEMENT);
    await maybeAwardBadge(BadgeType.ENDORSER, endorsementCount >= 1);

    await maybeAwardBadge(BadgeType.POLL_VOTER, pollVoteCount >= 3);

    const eventRsvpCount = await countAction(PointAction.EVENT_RSVP);
    await maybeAwardBadge(BadgeType.EVENT_GOER, eventRsvpCount >= 3);

    const { totalPoints } = await this.getUserPoints(userId);
    await maybeAwardBadge(BadgeType.TOP_CONTRIBUTOR, totalPoints >= 500);

    const shareCount = await countAction(PointAction.SHARE);
    await maybeAwardBadge(BadgeType.SOCIAL_SHARER, shareCount >= 5);

    // Streak-based badges
    const streak = await this.getStreak(userId);
    await maybeAwardBadge(BadgeType.EARLY_BIRD, streak.currentStreak >= 7);
    await maybeAwardBadge(BadgeType.STREAK_7, streak.longestStreak >= 7);
    await maybeAwardBadge(BadgeType.STREAK_30, streak.longestStreak >= 30);
    await maybeAwardBadge(BadgeType.STREAK_100, streak.longestStreak >= 100);

    // Daily quiz master
    const dailyQuizCount = await this.dailyQuizAttemptRepository.count({
      where: { userId },
    });
    await maybeAwardBadge(BadgeType.QUIZ_MASTER, dailyQuizCount >= 10);

    // Article reader
    const articleReadCount = await countAction(PointAction.ARTICLE_READ);
    await maybeAwardBadge(BadgeType.NEWS_JUNKIE, articleReadCount >= 50);

    // Community voice
    await maybeAwardBadge(BadgeType.COMMUNITY_VOICE, pollVoteCount >= 50);
  }

  // ─── Leaderboard ──────────────────────────────────────────

  /**
   * Get leaderboard — top users by total points.
   */
  async getLeaderboard(query: QueryLeaderboardDto): Promise<{
    data: Array<{
      userId: string;
      displayName: string;
      avatarUrl: string;
      totalPoints: number;
      rank: number;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, period = 'all_time' } = query;
    const skip = (page - 1) * limit;

    const qb = this.userPointsRepository
      .createQueryBuilder('up')
      .select('up.userId', 'userId')
      .addSelect('au.displayName', 'displayName')
      .addSelect('au.avatarUrl', 'avatarUrl')
      .addSelect('SUM(up.points)', 'totalPoints')
      .innerJoin(AppUser, 'au', 'au.id = up.userId')
      .groupBy('up.userId')
      .addGroupBy('au.displayName')
      .addGroupBy('au.avatarUrl')
      .orderBy('"totalPoints"', 'DESC');

    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      qb.where('up.earnedAt >= :since', { since: weekAgo });
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      qb.where('up.earnedAt >= :since', { since: monthAgo });
    }

    const countQb = qb.clone();
    const totalResult = await countQb.getRawMany();
    const total = totalResult.length;

    const rawData = await qb.offset(skip).limit(limit).getRawMany();

    const data = rawData.map((row, index) => ({
      userId: row.userId,
      displayName: row.displayName || '',
      avatarUrl: row.avatarUrl || '',
      totalPoints: parseInt(row.totalPoints, 10),
      rank: skip + index + 1,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a user's rank position in the leaderboard.
   */
  async getUserRank(
    userId: string,
    period: string = 'all_time',
  ): Promise<{ userId: string; rank: number; totalPoints: number }> {
    const qb = this.userPointsRepository
      .createQueryBuilder('up')
      .select('up.userId', 'userId')
      .addSelect('SUM(up.points)', 'totalPoints')
      .groupBy('up.userId')
      .orderBy('"totalPoints"', 'DESC');

    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      qb.where('up.earnedAt >= :since', { since: weekAgo });
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      qb.where('up.earnedAt >= :since', { since: monthAgo });
    }

    const allRanks = await qb.getRawMany();
    const userIndex = allRanks.findIndex((row) => row.userId === userId);

    if (userIndex === -1) {
      return { userId, rank: 0, totalPoints: 0 };
    }

    return {
      userId,
      rank: userIndex + 1,
      totalPoints: parseInt(allRanks[userIndex].totalPoints, 10),
    };
  }

  /**
   * Get combined profile data for a user (points, streak, badges, rank).
   */
  async getMyProfile(userId: string): Promise<{
    totalPoints: number;
    streak: {
      currentStreak: number;
      longestStreak: number;
      lastActivityDate: string | null;
      freezeTokens: number;
      tier: number;
      tierName: string;
    };
    badges: Array<{
      badgeType: BadgeType;
      earned: boolean;
      earnedAt: Date | null;
      progress: number;
      target: number;
    }>;
    rank: number;
  }> {
    const [{ totalPoints }, streak, badges, { rank }] = await Promise.all([
      this.getUserPoints(userId),
      this.getStreak(userId),
      this.getUserBadgesWithProgress(userId),
      this.getUserRank(userId),
    ]);

    const tierInfo = this.getTierForXp(totalPoints);

    return {
      totalPoints,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate,
        freezeTokens: streak.freezeTokens,
        tier: tierInfo.tier,
        tierName: tierInfo.name,
      },
      badges,
      rank,
    };
  }
}
