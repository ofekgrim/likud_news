import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, PointAction } from './entities/user-points.entity';
import { UserBadge, BadgeType } from './entities/user-badge.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { AwardPointsDto } from './dto/award-points.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(UserPoints)
    private readonly userPointsRepository: Repository<UserPoints>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
  ) {}

  /**
   * Award points to a user. Check badge eligibility afterwards.
   */
  async awardPoints(dto: AwardPointsDto): Promise<UserPoints> {
    const record = this.userPointsRepository.create({
      userId: dto.userId,
      action: dto.action,
      points: dto.points,
      metadata: dto.metadata || {},
    });

    const saved = await this.userPointsRepository.save(record);

    // Check and award badges after points are recorded
    await this.checkAndAwardBadges(dto.userId);

    return saved;
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
   * Check if user qualifies for any new badges based on their activity.
   * Award each badge if not already earned.
   */
  async checkAndAwardBadges(userId: string): Promise<void> {
    const existingBadges = await this.userBadgeRepository.find({
      where: { userId },
    });
    const earnedTypes = new Set(existingBadges.map((b) => b.badgeType));

    // Helper to count actions of a specific type
    const countAction = async (action: PointAction): Promise<number> => {
      return this.userPointsRepository.count({
        where: { userId, action },
      });
    };

    // Helper to award a badge if not already earned
    const maybeAwardBadge = async (
      badgeType: BadgeType,
      condition: boolean,
    ): Promise<void> => {
      if (condition && !earnedTypes.has(badgeType)) {
        try {
          const badge = this.userBadgeRepository.create({ userId, badgeType });
          await this.userBadgeRepository.save(badge);
        } catch {
          // Unique constraint violation — badge already exists, ignore
        }
      }
    };

    // QUIZ_TAKER: Has completed at least 1 quiz
    const quizCount = await countAction(PointAction.QUIZ_COMPLETE);
    await maybeAwardBadge(BadgeType.QUIZ_TAKER, quizCount >= 1);

    // FIRST_VOTE: Has voted in at least 1 poll
    const pollVoteCount = await countAction(PointAction.POLL_VOTE);
    await maybeAwardBadge(BadgeType.FIRST_VOTE, pollVoteCount >= 1);

    // ENDORSER: Has made at least 1 endorsement
    const endorsementCount = await countAction(PointAction.ENDORSEMENT);
    await maybeAwardBadge(BadgeType.ENDORSER, endorsementCount >= 1);

    // POLL_VOTER: Has voted in 3+ polls
    await maybeAwardBadge(BadgeType.POLL_VOTER, pollVoteCount >= 3);

    // EVENT_GOER: Has RSVP'd to 3+ events
    const eventRsvpCount = await countAction(PointAction.EVENT_RSVP);
    await maybeAwardBadge(BadgeType.EVENT_GOER, eventRsvpCount >= 3);

    // TOP_CONTRIBUTOR: Has 500+ total points
    const { totalPoints } = await this.getUserPoints(userId);
    await maybeAwardBadge(BadgeType.TOP_CONTRIBUTOR, totalPoints >= 500);

    // SOCIAL_SHARER: Has shared 5+ times
    const shareCount = await countAction(PointAction.SHARE);
    await maybeAwardBadge(BadgeType.SOCIAL_SHARER, shareCount >= 5);

    // EARLY_BIRD: Has a login streak of 7+ days
    const loginStreakCount = await countAction(PointAction.LOGIN_STREAK);
    await maybeAwardBadge(BadgeType.EARLY_BIRD, loginStreakCount >= 7);
  }

  /**
   * Get leaderboard — top users by total points.
   * Supports period filtering (weekly, monthly, all_time) and district.
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
    const { page = 1, limit = 20, period = 'all_time', district } = query;
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

    // Count total distinct users before pagination
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
    // Build the same leaderboard query but without pagination
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
}
