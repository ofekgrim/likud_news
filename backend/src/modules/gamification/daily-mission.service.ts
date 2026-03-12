import { Injectable, Logger, Inject, forwardRef, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DailyMission, MissionType } from './entities/daily-mission.entity';
import { UserDailyMission } from './entities/user-daily-mission.entity';
import { UserPoints, PointAction } from './entities/user-points.entity';
import { GamificationService } from './gamification.service';

/** How many missions to pick on a normal day vs Shabbat */
const NORMAL_DAY_MISSION_COUNT = 3;
const SHABBAT_MISSION_COUNT = 2;

/** Bonus points for completing all daily missions */
const ALL_MISSIONS_BONUS = 50;

/** Redis cache key for today's mission IDs */
const TODAY_MISSIONS_CACHE_KEY = 'daily_missions:today';
/** Cache TTL: 25 hours (in ms) — ensures it survives the whole day */
const CACHE_TTL_MS = 25 * 60 * 60 * 1000;

/**
 * Maps MissionType to the PointAction that satisfies it,
 * used for auto-tracking when gamification.trackAction fires.
 */
const MISSION_TYPE_TO_ACTION: Partial<Record<MissionType, PointAction>> = {
  [MissionType.READ_ARTICLE]: PointAction.ARTICLE_READ,
  [MissionType.COMPLETE_QUIZ]: PointAction.QUIZ_COMPLETE,
  [MissionType.VOTE_POLL]: PointAction.POLL_VOTE,
  [MissionType.SHARE_CONTENT]: PointAction.SHARE,
  [MissionType.RSVP_EVENT]: PointAction.EVENT_RSVP,
};

/**
 * Reverse map: PointAction → MissionType.
 * Built at class load time from MISSION_TYPE_TO_ACTION.
 */
const ACTION_TO_MISSION_TYPE: Partial<Record<PointAction, MissionType>> = {};
for (const [missionType, pointAction] of Object.entries(MISSION_TYPE_TO_ACTION)) {
  ACTION_TO_MISSION_TYPE[pointAction] = missionType as MissionType;
}

@Injectable()
export class DailyMissionService {
  private readonly logger = new Logger(DailyMissionService.name);

  constructor(
    @InjectRepository(DailyMission)
    private readonly dailyMissionRepository: Repository<DailyMission>,
    @InjectRepository(UserDailyMission)
    private readonly userDailyMissionRepository: Repository<UserDailyMission>,
    @InjectRepository(UserPoints)
    private readonly userPointsRepository: Repository<UserPoints>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject(forwardRef(() => GamificationService))
    private readonly gamificationService: GamificationService,
  ) {}

  // ─── Cron: Generate daily missions at midnight Israel time ──────

  /**
   * Selects random active missions from the pool at midnight Israel time.
   * On Shabbat (Friday sunset → Saturday night): only 2 missions.
   */
  @Cron('0 0 * * *', { timeZone: 'Asia/Jerusalem' })
  async generateDailyMissions(): Promise<string[]> {
    this.logger.log('Generating daily missions...');

    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }),
    );
    const dayOfWeek = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday

    // Shabbat: Friday (6) and Saturday (0 in Israel midnight = already Saturday)
    const isShabbat = dayOfWeek === 5 || dayOfWeek === 6;
    const missionCount = isShabbat ? SHABBAT_MISSION_COUNT : NORMAL_DAY_MISSION_COUNT;

    // Get all active missions
    const activeMissions = await this.dailyMissionRepository.find({
      where: { isActive: true },
    });

    if (activeMissions.length === 0) {
      this.logger.warn('No active missions found in the pool');
      return [];
    }

    // Shuffle and pick
    const shuffled = this.shuffleArray([...activeMissions]);
    const selected = shuffled.slice(0, Math.min(missionCount, shuffled.length));
    const missionIds = selected.map((m) => m.id);

    // Store in Redis
    await this.cacheManager.set(TODAY_MISSIONS_CACHE_KEY, missionIds, CACHE_TTL_MS);

    this.logger.log(
      `Generated ${missionIds.length} daily missions (Shabbat: ${isShabbat}): ${missionIds.join(', ')}`,
    );

    return missionIds;
  }

  // ─── Get today's missions for a user ────────────────────────────

  /**
   * Returns today's missions with the user's completion status.
   * Creates user_daily_missions records if they don't exist yet.
   */
  async getTodayMissions(userId: string): Promise<{
    missions: Array<{
      id: string;
      missionId: string;
      type: MissionType;
      descriptionHe: string;
      descriptionEn: string;
      points: number;
      iconName: string | null;
      isCompleted: boolean;
      completedAt: Date | null;
    }>;
    allCompleted: boolean;
    bonusAwarded: boolean;
  }> {
    const todayStr = this.getTodayIsrael();
    const missionIds = await this.getTodayMissionIds();

    if (missionIds.length === 0) {
      return { missions: [], allCompleted: false, bonusAwarded: false };
    }

    // Load the missions
    const missions = await this.dailyMissionRepository
      .createQueryBuilder('m')
      .where('m.id IN (:...ids)', { ids: missionIds })
      .getMany();

    // Ensure user_daily_missions records exist for today
    for (const mission of missions) {
      const existing = await this.userDailyMissionRepository.findOne({
        where: { appUserId: userId, missionId: mission.id, date: todayStr },
      });

      if (!existing) {
        await this.userDailyMissionRepository.save(
          this.userDailyMissionRepository.create({
            appUserId: userId,
            missionId: mission.id,
            date: todayStr,
            isCompleted: false,
            completedAt: null,
          }),
        );
      }
    }

    // Load user_daily_missions with completion status
    const userMissions = await this.userDailyMissionRepository.find({
      where: { appUserId: userId, date: todayStr },
      relations: ['mission'],
    });

    // Filter to only today's selected missions
    const missionIdSet = new Set(missionIds);
    const todayUserMissions = userMissions.filter(
      (um) => missionIdSet.has(um.missionId),
    );

    const result = todayUserMissions.map((um) => ({
      id: um.id,
      missionId: um.missionId,
      type: um.mission.type,
      descriptionHe: um.mission.descriptionHe,
      descriptionEn: um.mission.descriptionEn,
      points: um.mission.points,
      iconName: um.mission.iconName,
      isCompleted: um.isCompleted,
      completedAt: um.completedAt,
    }));

    const allCompleted =
      result.length > 0 && result.every((m) => m.isCompleted);

    // Check if bonus already awarded
    let bonusAwarded = false;
    if (allCompleted) {
      const bonusRecord = await this.userPointsRepository.findOne({
        where: {
          userId,
          action: PointAction.DAILY_MISSION_BONUS,
        },
      });
      // Check if the bonus was awarded today
      if (bonusRecord) {
        const bonusDate = bonusRecord.earnedAt.toISOString().split('T')[0];
        bonusAwarded = bonusDate === todayStr;
      }
    }

    return { missions: result, allCompleted, bonusAwarded };
  }

  // ─── Complete a mission ─────────────────────────────────────────

  /**
   * Mark a mission as completed for a user and award points.
   * Validates that the action actually occurred via gamification action logs.
   */
  async completeMission(
    userId: string,
    missionId: string,
  ): Promise<{
    completed: boolean;
    pointsAwarded: number;
    allCompleted: boolean;
    bonusAwarded: boolean;
    bonusPoints: number;
  }> {
    const todayStr = this.getTodayIsrael();

    // Verify mission is one of today's missions
    const todayMissionIds = await this.getTodayMissionIds();
    if (!todayMissionIds.includes(missionId)) {
      throw new NotFoundException('Mission is not part of today\'s missions');
    }

    // Get the mission definition
    const mission = await this.dailyMissionRepository.findOne({
      where: { id: missionId },
    });
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    // Get or create user_daily_mission record
    let userMission = await this.userDailyMissionRepository.findOne({
      where: { appUserId: userId, missionId, date: todayStr },
    });

    if (!userMission) {
      userMission = await this.userDailyMissionRepository.save(
        this.userDailyMissionRepository.create({
          appUserId: userId,
          missionId,
          date: todayStr,
          isCompleted: false,
          completedAt: null,
        }),
      );
    }

    if (userMission.isCompleted) {
      throw new BadRequestException('Mission already completed');
    }

    // Server-side validation: check if the user actually performed the action
    const actionType = MISSION_TYPE_TO_ACTION[mission.type];
    if (actionType) {
      const hasPerformedAction = await this.hasUserPerformedAction(
        userId,
        actionType,
        todayStr,
      );
      if (!hasPerformedAction) {
        throw new BadRequestException(
          'Mission action has not been performed yet',
        );
      }
    }

    // Mark completed
    userMission.isCompleted = true;
    userMission.completedAt = new Date();
    await this.userDailyMissionRepository.save(userMission);

    // Award mission points
    await this.gamificationService.awardPoints({
      userId,
      action: PointAction.DAILY_MISSION_COMPLETE,
      points: mission.points,
      metadata: { missionId, missionType: mission.type, date: todayStr },
    });

    // Check if all missions completed → award bonus
    const { allCompleted, bonusAwarded, bonusPoints } =
      await this.checkDailyBonus(userId);

    return {
      completed: true,
      pointsAwarded: mission.points,
      allCompleted,
      bonusAwarded,
      bonusPoints,
    };
  }

  // ─── Daily bonus check ──────────────────────────────────────────

  /**
   * If all missions for today are completed, award 50 bonus points (2x multiplier).
   */
  async checkDailyBonus(userId: string): Promise<{
    allCompleted: boolean;
    bonusAwarded: boolean;
    bonusPoints: number;
  }> {
    const todayStr = this.getTodayIsrael();
    const todayMissionIds = await this.getTodayMissionIds();

    if (todayMissionIds.length === 0) {
      return { allCompleted: false, bonusAwarded: false, bonusPoints: 0 };
    }

    // Check completion status for all today's missions
    const userMissions = await this.userDailyMissionRepository.find({
      where: { appUserId: userId, date: todayStr },
    });

    const todayMissionIdSet = new Set(todayMissionIds);
    const todayUserMissions = userMissions.filter((um) =>
      todayMissionIdSet.has(um.missionId),
    );

    const allCompleted =
      todayUserMissions.length === todayMissionIds.length &&
      todayUserMissions.every((um) => um.isCompleted);

    if (!allCompleted) {
      return { allCompleted: false, bonusAwarded: false, bonusPoints: 0 };
    }

    // Check if bonus already awarded today
    const existingBonus = await this.userPointsRepository
      .createQueryBuilder('up')
      .where('up.userId = :userId', { userId })
      .andWhere('up.action = :action', {
        action: PointAction.DAILY_MISSION_BONUS,
      })
      .andWhere('DATE(up.earnedAt) = :date', { date: todayStr })
      .getOne();

    if (existingBonus) {
      return { allCompleted: true, bonusAwarded: true, bonusPoints: 0 };
    }

    // Award bonus
    await this.userPointsRepository.save(
      this.userPointsRepository.create({
        userId,
        action: PointAction.DAILY_MISSION_BONUS,
        points: ALL_MISSIONS_BONUS,
        metadata: {
          date: todayStr,
          missionIds: todayMissionIds,
          reason: 'all_daily_missions_completed',
        },
      }),
    );

    this.logger.log(
      `Daily mission bonus awarded to user ${userId}: +${ALL_MISSIONS_BONUS} points`,
    );

    return {
      allCompleted: true,
      bonusAwarded: true,
      bonusPoints: ALL_MISSIONS_BONUS,
    };
  }

  // ─── Auto-track from gamification actions ───────────────────────

  /**
   * Called from gamification.service.ts when trackAction fires.
   * Auto-completes matching mission if one exists for today.
   */
  async autoTrackMission(
    userId: string,
    actionType: PointAction,
  ): Promise<void> {
    const missionType = ACTION_TO_MISSION_TYPE[actionType];
    if (!missionType) {
      // This action type doesn't map to any mission
      return;
    }

    const todayStr = this.getTodayIsrael();
    const todayMissionIds = await this.getTodayMissionIds();

    if (todayMissionIds.length === 0) {
      return;
    }

    // Find today's mission that matches this action type
    const matchingMission = await this.dailyMissionRepository
      .createQueryBuilder('m')
      .where('m.id IN (:...ids)', { ids: todayMissionIds })
      .andWhere('m.type = :type', { type: missionType })
      .getOne();

    if (!matchingMission) {
      return;
    }

    // Check if already completed
    let userMission = await this.userDailyMissionRepository.findOne({
      where: {
        appUserId: userId,
        missionId: matchingMission.id,
        date: todayStr,
      },
    });

    if (userMission?.isCompleted) {
      return; // Already completed
    }

    // Create user_daily_mission record if not exists
    if (!userMission) {
      userMission = await this.userDailyMissionRepository.save(
        this.userDailyMissionRepository.create({
          appUserId: userId,
          missionId: matchingMission.id,
          date: todayStr,
          isCompleted: false,
          completedAt: null,
        }),
      );
    }

    // Mark completed
    userMission.isCompleted = true;
    userMission.completedAt = new Date();
    await this.userDailyMissionRepository.save(userMission);

    // Award mission points
    await this.userPointsRepository.save(
      this.userPointsRepository.create({
        userId,
        action: PointAction.DAILY_MISSION_COMPLETE,
        points: matchingMission.points,
        metadata: {
          missionId: matchingMission.id,
          missionType: matchingMission.type,
          date: todayStr,
          autoTracked: true,
        },
      }),
    );

    this.logger.log(
      `Auto-tracked mission ${matchingMission.type} for user ${userId}: +${matchingMission.points} points`,
    );

    // Check for daily bonus
    await this.checkDailyBonus(userId).catch((e) =>
      this.logger.error(`Daily bonus check failed: ${e.message}`),
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────

  /**
   * Get today's date string in Israel timezone (YYYY-MM-DD).
   */
  getTodayIsrael(): string {
    const now = new Date();
    const israelDate = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }),
    );
    const year = israelDate.getFullYear();
    const month = String(israelDate.getMonth() + 1).padStart(2, '0');
    const day = String(israelDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get today's mission IDs from Redis cache.
   * If cache miss, tries to regenerate.
   */
  async getTodayMissionIds(): Promise<string[]> {
    const cached = await this.cacheManager.get<string[]>(
      TODAY_MISSIONS_CACHE_KEY,
    );
    if (cached && cached.length > 0) {
      return cached;
    }

    // Cache miss — regenerate
    this.logger.warn(
      'Daily missions cache miss — regenerating missions for today',
    );
    return this.generateDailyMissions();
  }

  /**
   * Check if a user has performed a specific action today.
   */
  private async hasUserPerformedAction(
    userId: string,
    action: PointAction,
    dateStr: string,
  ): Promise<boolean> {
    const record = await this.userPointsRepository
      .createQueryBuilder('up')
      .where('up.userId = :userId', { userId })
      .andWhere('up.action = :action', { action })
      .andWhere('DATE(up.earnedAt) = :date', { date: dateStr })
      .getOne();

    return !!record;
  }

  /**
   * Fisher-Yates shuffle.
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
