import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { Branch } from './entities/branch.entity';
import { BranchWeeklyScore } from './entities/branch-weekly-score.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { UserPoints } from '../gamification/entities/user-points.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { QueryBranchLeaderboardDto } from './dto/query-leaderboard.dto';

/** Score multipliers per action type */
const ACTION_WEIGHTS: Record<string, number> = {
  quiz_complete: 1,
  daily_quiz_complete: 1,
  article_read: 0.3,
  poll_vote: 0.5,
  event_rsvp: 2,
  share: 5, // referrals/shares
};

/** Cache TTL for leaderboard (5 minutes in ms) */
const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000;

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(BranchWeeklyScore)
    private readonly weeklyScoreRepository: Repository<BranchWeeklyScore>,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(UserPoints)
    private readonly userPointsRepository: Repository<UserPoints>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────

  /**
   * List all branches, optionally filtered by district.
   */
  async findAll(district?: string): Promise<Branch[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (district) {
      where.district = district;
    }
    return this.branchRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * Get a single branch with its latest weekly score.
   */
  async findOne(id: string): Promise<Branch & { latestScore?: BranchWeeklyScore }> {
    const branch = await this.branchRepository.findOne({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${id} not found`);
    }

    // Get latest weekly score
    const latestScore = await this.weeklyScoreRepository.findOne({
      where: { branchId: id },
      order: { weekStart: 'DESC' },
    });

    return { ...branch, latestScore: latestScore || undefined };
  }

  /**
   * Create a new branch (Admin).
   */
  async create(dto: CreateBranchDto): Promise<Branch> {
    // Check unique name
    const existing = await this.branchRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Branch with name "${dto.name}" already exists`);
    }

    const branch = this.branchRepository.create(dto);
    return this.branchRepository.save(branch);
  }

  /**
   * Update a branch (Admin).
   */
  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch ${id} not found`);
    }

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== branch.name) {
      const existing = await this.branchRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Branch with name "${dto.name}" already exists`);
      }
    }

    Object.assign(branch, dto);
    return this.branchRepository.save(branch);
  }

  // ─── Leaderboard ───────────────────────────────────────────

  /**
   * Get weekly leaderboard sorted by perCapitaScore.
   * Cached in Redis for 5 minutes.
   */
  async getLeaderboard(
    query: QueryBranchLeaderboardDto,
  ): Promise<{
    data: BranchWeeklyScore[];
    weekStart: string;
    total: number;
  }> {
    const weekStart = query.weekStart || this.getCurrentWeekStart();
    const limit = query.limit || 20;
    const district = query.district;

    const cacheKey = `branch_leaderboard:${weekStart}:${district || 'all'}:${limit}`;

    // Try cache first
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const qb = this.weeklyScoreRepository
      .createQueryBuilder('bws')
      .innerJoinAndSelect('bws.branch', 'branch')
      .where('bws.weekStart = :weekStart', { weekStart })
      .andWhere('branch.isActive = true')
      .orderBy('bws.perCapitaScore', 'DESC')
      .take(limit);

    if (district) {
      qb.andWhere('branch.district = :district', { district });
    }

    const [data, total] = await qb.getManyAndCount();

    const result = { data, weekStart, total };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, JSON.stringify(result), LEADERBOARD_CACHE_TTL);

    return result;
  }

  /**
   * National leaderboard — top branches by perCapitaScore, current week.
   */
  async getNationalLeaderboard(limit: number = 10): Promise<{
    data: BranchWeeklyScore[];
    weekStart: string;
    total: number;
  }> {
    return this.getLeaderboard({ limit });
  }

  // ─── Score Computation (Cron) ──────────────────────────────

  /**
   * Saturday night post-Shabbat cron: compute weekly scores.
   * Runs at 20:30 Israel time on Saturday (UTC: 17:30 in winter, 18:30 in summer).
   * Using 18:30 UTC as a compromise.
   */
  @Cron('30 18 * * 6', { name: 'compute-branch-weekly-scores' })
  async computeWeeklyScores(): Promise<{ branchesProcessed: number; weekStart: string }> {
    const weekStart = this.getCurrentWeekStart();
    this.logger.log(`Computing weekly branch scores for week starting ${weekStart}`);

    const branches = await this.branchRepository.find({
      where: { isActive: true },
    });

    // Get previous week's ranks for prevRank tracking
    const prevWeekStart = this.getPreviousWeekStart(weekStart);
    const prevScores = await this.weeklyScoreRepository.find({
      where: { weekStart: prevWeekStart },
    });
    const prevRankMap = new Map<string, number>();
    for (const ps of prevScores) {
      if (ps.rank) {
        prevRankMap.set(ps.branchId, ps.rank);
      }
    }

    // Compute scores for each branch
    const weekEnd = this.getWeekEnd(weekStart);
    const scoredBranches: Array<{
      branchId: string;
      totalScore: number;
      perCapitaScore: number;
      activeMemberCount: number;
      scoreBreakdown: Record<string, number>;
    }> = [];

    for (const branch of branches) {
      // Count active members in this branch
      const activeMemberCount = await this.appUserRepository.count({
        where: { branchId: branch.id, isActive: true },
      });

      if (activeMemberCount === 0) {
        continue;
      }

      // Sum points earned this week by branch members, grouped by action type
      const pointsByAction: Array<{ action: string; totalPoints: string }> =
        await this.userPointsRepository
          .createQueryBuilder('up')
          .select('up.action', 'action')
          .addSelect('SUM(up.points)', 'totalPoints')
          .innerJoin(AppUser, 'au', 'au.id = up.userId')
          .where('au.branchId = :branchId', { branchId: branch.id })
          .andWhere('au.isActive = true')
          .andWhere('up.earnedAt >= :weekStart', { weekStart })
          .andWhere('up.earnedAt < :weekEnd', { weekEnd })
          .groupBy('up.action')
          .getRawMany();

      // Compute weighted score
      let totalScore = 0;
      const scoreBreakdown: Record<string, number> = {};

      for (const row of pointsByAction) {
        const weight = ACTION_WEIGHTS[row.action] || 0;
        const rawPoints = parseInt(row.totalPoints, 10);
        const weighted = Math.round(rawPoints * weight * 100) / 100;
        scoreBreakdown[row.action] = weighted;
        totalScore += weighted;
      }

      totalScore = Math.round(totalScore * 100) / 100;
      const perCapitaScore =
        Math.round((totalScore / activeMemberCount) * 100) / 100;

      scoredBranches.push({
        branchId: branch.id,
        totalScore,
        perCapitaScore,
        activeMemberCount,
        scoreBreakdown,
      });
    }

    // Sort by perCapitaScore to compute ranks
    scoredBranches.sort((a, b) => b.perCapitaScore - a.perCapitaScore);

    // Upsert scores with ranks
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < scoredBranches.length; i++) {
        const s = scoredBranches[i];
        const rank = i + 1;
        const prevRank = prevRankMap.get(s.branchId) || null;

        // Upsert: update if exists, insert if not
        await queryRunner.query(
          `INSERT INTO "branch_weekly_scores"
             ("id", "branchId", "weekStart", "totalScore", "perCapitaScore",
              "activeMemberCount", "rank", "prevRank", "scoreBreakdown", "createdAt")
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
           ON CONFLICT ("branchId", "weekStart")
           DO UPDATE SET
             "totalScore" = $3,
             "perCapitaScore" = $4,
             "activeMemberCount" = $5,
             "rank" = $6,
             "prevRank" = $7,
             "scoreBreakdown" = $8::jsonb`,
          [
            s.branchId,
            weekStart,
            s.totalScore,
            s.perCapitaScore,
            s.activeMemberCount,
            rank,
            prevRank,
            JSON.stringify(s.scoreBreakdown),
          ],
        );

        // Update branch memberCount
        await queryRunner.query(
          `UPDATE "branches" SET "memberCount" = $1 WHERE "id" = $2`,
          [s.activeMemberCount, s.branchId],
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to compute weekly scores: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Invalidate cached leaderboards for this week
    await this.invalidateLeaderboardCache(weekStart);

    this.logger.log(
      `Weekly scores computed for ${scoredBranches.length} branches (week ${weekStart})`,
    );

    return { branchesProcessed: scoredBranches.length, weekStart };
  }

  // ─── Member Assignment ─────────────────────────────────────

  /**
   * Assign a user to a branch. Updates memberCount on both old and new branches.
   */
  async updateMemberBranch(userId: string, branchId: string): Promise<AppUser> {
    const user = await this.appUserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const branch = await this.branchRepository.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }

    const oldBranchId = user.branchId;
    user.branchId = branchId;
    const saved = await this.appUserRepository.save(user);

    // Update memberCount on old branch (decrement)
    if (oldBranchId && oldBranchId !== branchId) {
      await this.branchRepository
        .createQueryBuilder()
        .update(Branch)
        .set({ memberCount: () => 'GREATEST("memberCount" - 1, 0)' })
        .where('id = :id', { id: oldBranchId })
        .execute();
    }

    // Update memberCount on new branch (increment)
    if (oldBranchId !== branchId) {
      await this.branchRepository
        .createQueryBuilder()
        .update(Branch)
        .set({ memberCount: () => '"memberCount" + 1' })
        .where('id = :id', { id: branchId })
        .execute();
    }

    return saved;
  }

  // ─── Real-time Score Update ────────────────────────────────

  /**
   * Increment a branch's score in the Redis sorted set for real-time updates.
   * Key: branch_scores:{weekStart}, Member: branchId, Score: points.
   */
  async incrementScore(
    branchId: string,
    action: string,
    points: number,
  ): Promise<void> {
    const weekStart = this.getCurrentWeekStart();
    const weight = ACTION_WEIGHTS[action] || 0;
    const weightedPoints = Math.round(points * weight * 100) / 100;

    if (weightedPoints === 0) return;

    // Use cache to store running totals per branch per week
    const cacheKey = `branch_rt_score:${weekStart}:${branchId}`;
    const current = await this.cacheManager.get<number>(cacheKey);
    const newScore = (current || 0) + weightedPoints;

    // Store with a week-long TTL (7 days)
    await this.cacheManager.set(cacheKey, newScore, 7 * 24 * 60 * 60 * 1000);

    // Also invalidate leaderboard cache so it refreshes
    await this.invalidateLeaderboardCache(weekStart);
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * Get the Monday (ISO week start) for the current week.
   */
  getCurrentWeekStart(): string {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sunday, 1=Monday, ...
    const diff = day === 0 ? 6 : day - 1; // Days since Monday
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diff);
    return monday.toISOString().split('T')[0];
  }

  /**
   * Get the previous week's Monday.
   */
  private getPreviousWeekStart(weekStart: string): string {
    const date = new Date(weekStart + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get the end-of-week date (next Monday) for range queries.
   */
  private getWeekEnd(weekStart: string): string {
    const date = new Date(weekStart + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Invalidate all cached leaderboard entries for a given week.
   */
  private async invalidateLeaderboardCache(weekStart: string): Promise<void> {
    // Since we can't pattern-delete in cache-manager, delete known keys
    // The main leaderboard cache key pattern
    const commonKeys = [
      `branch_leaderboard:${weekStart}:all:10`,
      `branch_leaderboard:${weekStart}:all:20`,
      `branch_leaderboard:${weekStart}:all:50`,
    ];

    for (const key of commonKeys) {
      await this.cacheManager.del(key).catch(() => {
        /* ignore */
      });
    }
  }
}
