import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, PointAction, POINT_VALUES } from './entities/user-points.entity';
import { UserBadge, BadgeType } from './entities/user-badge.entity';
import { UserStreak } from './entities/user-streak.entity';
import { DailyQuizAttempt } from './entities/daily-quiz-attempt.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { AwardPointsDto } from './dto/award-points.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';

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
    @InjectRepository(DailyQuizAttempt)
    private readonly dailyQuizAttemptRepository: Repository<DailyQuizAttempt>,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
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
    return this.awardPoints({
      userId,
      action,
      points: POINT_VALUES[action] || 0,
      metadata,
    });
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
      });
      streak = await this.userStreakRepository.save(streak);
    }
    return streak;
  }

  /**
   * Update streak for a user. Called on every qualifying action.
   * - Same day: no-op
   * - Yesterday: increment streak
   * - Older or null: reset to 1
   * Awards streak bonus at milestones (7, 30, 100 days).
   */
  async updateStreak(userId: string): Promise<UserStreak> {
    const streak = await this.getStreak(userId);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (streak.lastActivityDate === today) {
      // Already active today — no change
      return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastActivityDate === yesterdayStr) {
      // Consecutive day — increment
      streak.currentStreak += 1;
    } else {
      // Gap in activity — reset to 1
      streak.currentStreak = 1;
    }

    streak.lastActivityDate = today;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    const saved = await this.userStreakRepository.save(streak);

    // Award streak bonuses at milestones
    const milestones: Array<{ days: number; bonus: number }> = [
      { days: 7, bonus: 50 },
      { days: 30, bonus: 200 },
      { days: 100, bonus: 500 },
    ];

    for (const { days, bonus } of milestones) {
      if (saved.currentStreak === days) {
        await this.userPointsRepository.save(
          this.userPointsRepository.create({
            userId,
            action: PointAction.STREAK_BONUS,
            points: bonus,
            metadata: { milestone: days },
          }),
        );
        this.logger.log(`Streak milestone ${days} days for user ${userId}: +${bonus} points`);
      }
    }

    return saved;
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

    return {
      totalPoints,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate,
      },
      badges,
      rank,
    };
  }
}
