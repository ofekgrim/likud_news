import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DailyMissionService } from './daily-mission.service';
import { GamificationService } from './gamification.service';
import { DailyMission, MissionType, MissionFrequency } from './entities/daily-mission.entity';
import { UserDailyMission } from './entities/user-daily-mission.entity';
import { UserPoints, PointAction } from './entities/user-points.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn(),
});

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockGamificationService = {
  awardPoints: jest.fn(),
  trackAction: jest.fn(),
};

// ── Test fixtures ──────────────────────────────────────────────

const MISSION_READ: DailyMission = {
  id: 'mission-read',
  type: MissionType.READ_ARTICLE,
  descriptionHe: 'קרא כתבה אחת',
  descriptionEn: 'Read one article',
  points: 10,
  iconName: 'article',
  isActive: true,
  frequency: MissionFrequency.DAILY,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MISSION_QUIZ: DailyMission = {
  id: 'mission-quiz',
  type: MissionType.COMPLETE_QUIZ,
  descriptionHe: 'השלם חידון יומי',
  descriptionEn: 'Complete daily quiz',
  points: 20,
  iconName: 'quiz',
  isActive: true,
  frequency: MissionFrequency.DAILY,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MISSION_POLL: DailyMission = {
  id: 'mission-poll',
  type: MissionType.VOTE_POLL,
  descriptionHe: 'הצבע בסקר',
  descriptionEn: 'Vote in a poll',
  points: 15,
  iconName: 'poll',
  isActive: true,
  frequency: MissionFrequency.DAILY,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MISSION_SHARE: DailyMission = {
  id: 'mission-share',
  type: MissionType.SHARE_CONTENT,
  descriptionHe: 'שתף תוכן',
  descriptionEn: 'Share content',
  points: 15,
  iconName: 'share',
  isActive: true,
  frequency: MissionFrequency.DAILY,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ALL_MISSIONS = [MISSION_READ, MISSION_QUIZ, MISSION_POLL, MISSION_SHARE];

const USER_ID = 'user-123';

describe('DailyMissionService', () => {
  let service: DailyMissionService;
  let dailyMissionRepository: jest.Mocked<Repository<DailyMission>>;
  let userDailyMissionRepository: jest.Mocked<Repository<UserDailyMission>>;
  let userPointsRepository: jest.Mocked<Repository<UserPoints>>;

  beforeEach(async () => {
    mockCacheManager.get.mockReset();
    mockCacheManager.set.mockReset();
    mockCacheManager.del.mockReset();
    mockGamificationService.awardPoints.mockReset();
    mockGamificationService.trackAction.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyMissionService,
        { provide: getRepositoryToken(DailyMission), useFactory: mockRepository },
        { provide: getRepositoryToken(UserDailyMission), useFactory: mockRepository },
        { provide: getRepositoryToken(UserPoints), useFactory: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    service = module.get<DailyMissionService>(DailyMissionService);
    dailyMissionRepository = module.get(getRepositoryToken(DailyMission));
    userDailyMissionRepository = module.get(getRepositoryToken(UserDailyMission));
    userPointsRepository = module.get(getRepositoryToken(UserPoints));

    // Default mocks
    dailyMissionRepository.create.mockImplementation((data) => data as DailyMission);
    dailyMissionRepository.save.mockImplementation(async (data) => data as DailyMission);
    userDailyMissionRepository.create.mockImplementation((data) => data as UserDailyMission);
    userDailyMissionRepository.save.mockImplementation(async (data) => data as UserDailyMission);
    userPointsRepository.create.mockImplementation((data) => data as UserPoints);
    userPointsRepository.save.mockImplementation(async (data) => data as UserPoints);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // generateDailyMissions
  // ---------------------------------------------------------------------------
  describe('generateDailyMissions', () => {
    it('should select 3 random missions on a normal day', async () => {
      dailyMissionRepository.find.mockResolvedValue(ALL_MISSIONS);

      // Mock getTodayIsrael to return a Wednesday (day=3)
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue('2026-03-11');
      // Provide a stable "now" for day-of-week check (Wednesday)
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);

      const result = await service.generateDailyMissions();

      expect(result).toHaveLength(3);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'daily_missions:today',
        expect.any(Array),
        expect.any(Number),
      );

      jest.restoreAllMocks();
    });

    it('should select 2 missions on Friday (Shabbat)', async () => {
      dailyMissionRepository.find.mockResolvedValue(ALL_MISSIONS);

      jest.spyOn(service, 'getTodayIsrael').mockReturnValue('2026-03-13');
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(5); // Friday

      const result = await service.generateDailyMissions();

      expect(result).toHaveLength(2);

      jest.restoreAllMocks();
    });

    it('should select 2 missions on Saturday (Shabbat)', async () => {
      dailyMissionRepository.find.mockResolvedValue(ALL_MISSIONS);

      jest.spyOn(service, 'getTodayIsrael').mockReturnValue('2026-03-14');
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(6); // Saturday

      const result = await service.generateDailyMissions();

      expect(result).toHaveLength(2);

      jest.restoreAllMocks();
    });

    it('should return empty array when no active missions exist', async () => {
      dailyMissionRepository.find.mockResolvedValue([]);

      const result = await service.generateDailyMissions();

      expect(result).toEqual([]);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should handle fewer active missions than target count', async () => {
      dailyMissionRepository.find.mockResolvedValue([MISSION_READ]);

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2); // Tuesday

      const result = await service.generateDailyMissions();

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('mission-read');

      jest.restoreAllMocks();
    });
  });

  // ---------------------------------------------------------------------------
  // getTodayMissions
  // ---------------------------------------------------------------------------
  describe('getTodayMissions', () => {
    it('should return missions with completion status', async () => {
      const todayStr = '2026-03-11';
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue(todayStr);
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([
        'mission-read',
        'mission-quiz',
        'mission-poll',
      ]);

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([MISSION_READ, MISSION_QUIZ, MISSION_POLL]);
      dailyMissionRepository.createQueryBuilder.mockReturnValue(qb as any);

      // No existing user missions
      userDailyMissionRepository.findOne.mockResolvedValue(null);

      // After creation, find returns user_daily_missions with mission relation
      userDailyMissionRepository.find.mockResolvedValue([
        {
          id: 'udm-1',
          appUserId: USER_ID,
          missionId: 'mission-read',
          date: todayStr,
          isCompleted: false,
          completedAt: null,
          mission: MISSION_READ,
        } as any,
        {
          id: 'udm-2',
          appUserId: USER_ID,
          missionId: 'mission-quiz',
          date: todayStr,
          isCompleted: false,
          completedAt: null,
          mission: MISSION_QUIZ,
        } as any,
        {
          id: 'udm-3',
          appUserId: USER_ID,
          missionId: 'mission-poll',
          date: todayStr,
          isCompleted: false,
          completedAt: null,
          mission: MISSION_POLL,
        } as any,
      ]);

      const result = await service.getTodayMissions(USER_ID);

      expect(result.missions).toHaveLength(3);
      expect(result.allCompleted).toBe(false);
      expect(result.bonusAwarded).toBe(false);
      expect(result.missions[0].type).toBe(MissionType.READ_ARTICLE);

      jest.restoreAllMocks();
    });

    it('should return empty when no missions are set for today', async () => {
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue('2026-03-11');
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([]);

      const result = await service.getTodayMissions(USER_ID);

      expect(result.missions).toEqual([]);
      expect(result.allCompleted).toBe(false);

      jest.restoreAllMocks();
    });
  });

  // ---------------------------------------------------------------------------
  // completeMission
  // ---------------------------------------------------------------------------
  describe('completeMission', () => {
    const todayStr = '2026-03-11';

    beforeEach(() => {
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue(todayStr);
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([
        'mission-read',
        'mission-quiz',
        'mission-poll',
      ]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should complete a mission and award points', async () => {
      dailyMissionRepository.findOne.mockResolvedValue(MISSION_READ);

      userDailyMissionRepository.findOne.mockResolvedValue({
        id: 'udm-1',
        appUserId: USER_ID,
        missionId: 'mission-read',
        date: todayStr,
        isCompleted: false,
        completedAt: null,
      } as any);

      // hasUserPerformedAction — user has read an article today
      const qbAction = mockQueryBuilder();
      qbAction.getOne.mockResolvedValue({ id: 'some-point-record' });
      userPointsRepository.createQueryBuilder.mockReturnValue(qbAction as any);

      // checkDailyBonus — not all completed
      userDailyMissionRepository.find.mockResolvedValue([
        { missionId: 'mission-read', isCompleted: true } as any,
        { missionId: 'mission-quiz', isCompleted: false } as any,
        { missionId: 'mission-poll', isCompleted: false } as any,
      ]);

      mockGamificationService.awardPoints.mockResolvedValue({} as UserPoints);

      const result = await service.completeMission(USER_ID, 'mission-read');

      expect(result.completed).toBe(true);
      expect(result.pointsAwarded).toBe(10);
      expect(result.allCompleted).toBe(false);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith({
        userId: USER_ID,
        action: PointAction.DAILY_MISSION_COMPLETE,
        points: 10,
        metadata: {
          missionId: 'mission-read',
          missionType: MissionType.READ_ARTICLE,
          date: todayStr,
        },
      });
    });

    it('should throw NotFoundException when mission is not part of today', async () => {
      await expect(
        service.completeMission(USER_ID, 'mission-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when mission already completed', async () => {
      dailyMissionRepository.findOne.mockResolvedValue(MISSION_READ);

      userDailyMissionRepository.findOne.mockResolvedValue({
        id: 'udm-1',
        appUserId: USER_ID,
        missionId: 'mission-read',
        date: todayStr,
        isCompleted: true,
        completedAt: new Date(),
      } as any);

      await expect(
        service.completeMission(USER_ID, 'mission-read'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when action not performed yet', async () => {
      dailyMissionRepository.findOne.mockResolvedValue(MISSION_READ);

      userDailyMissionRepository.findOne.mockResolvedValue({
        id: 'udm-1',
        appUserId: USER_ID,
        missionId: 'mission-read',
        date: todayStr,
        isCompleted: false,
        completedAt: null,
      } as any);

      // hasUserPerformedAction — no action found
      const qbAction = mockQueryBuilder();
      qbAction.getOne.mockResolvedValue(null);
      userPointsRepository.createQueryBuilder.mockReturnValue(qbAction as any);

      await expect(
        service.completeMission(USER_ID, 'mission-read'),
      ).rejects.toThrow('Mission action has not been performed yet');
    });
  });

  // ---------------------------------------------------------------------------
  // checkDailyBonus
  // ---------------------------------------------------------------------------
  describe('checkDailyBonus', () => {
    const todayStr = '2026-03-11';

    beforeEach(() => {
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue(todayStr);
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([
        'mission-read',
        'mission-quiz',
        'mission-poll',
      ]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should award 50 bonus points when all missions completed', async () => {
      // All missions completed
      userDailyMissionRepository.find.mockResolvedValue([
        { missionId: 'mission-read', isCompleted: true } as any,
        { missionId: 'mission-quiz', isCompleted: true } as any,
        { missionId: 'mission-poll', isCompleted: true } as any,
      ]);

      // No existing bonus
      const qb = mockQueryBuilder();
      qb.getOne.mockResolvedValue(null);
      userPointsRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.checkDailyBonus(USER_ID);

      expect(result.allCompleted).toBe(true);
      expect(result.bonusAwarded).toBe(true);
      expect(result.bonusPoints).toBe(50);
      expect(userPointsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          action: PointAction.DAILY_MISSION_BONUS,
          points: 50,
        }),
      );
    });

    it('should not award bonus when not all missions completed', async () => {
      userDailyMissionRepository.find.mockResolvedValue([
        { missionId: 'mission-read', isCompleted: true } as any,
        { missionId: 'mission-quiz', isCompleted: false } as any,
        { missionId: 'mission-poll', isCompleted: true } as any,
      ]);

      const result = await service.checkDailyBonus(USER_ID);

      expect(result.allCompleted).toBe(false);
      expect(result.bonusAwarded).toBe(false);
      expect(result.bonusPoints).toBe(0);
    });

    it('should not double-award bonus if already awarded today', async () => {
      userDailyMissionRepository.find.mockResolvedValue([
        { missionId: 'mission-read', isCompleted: true } as any,
        { missionId: 'mission-quiz', isCompleted: true } as any,
        { missionId: 'mission-poll', isCompleted: true } as any,
      ]);

      // Bonus already awarded today
      const qb = mockQueryBuilder();
      qb.getOne.mockResolvedValue({ id: 'existing-bonus' });
      userPointsRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.checkDailyBonus(USER_ID);

      expect(result.allCompleted).toBe(true);
      expect(result.bonusAwarded).toBe(true);
      expect(result.bonusPoints).toBe(0); // no new bonus
      // save should NOT be called for a new bonus record
      expect(userPointsRepository.save).not.toHaveBeenCalled();
    });

    it('should return false when no missions exist for today', async () => {
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([]);

      const result = await service.checkDailyBonus(USER_ID);

      expect(result.allCompleted).toBe(false);
      expect(result.bonusAwarded).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // autoTrackMission
  // ---------------------------------------------------------------------------
  describe('autoTrackMission', () => {
    const todayStr = '2026-03-11';

    beforeEach(() => {
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue(todayStr);
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([
        'mission-read',
        'mission-quiz',
        'mission-poll',
      ]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should auto-complete a matching mission when action fires', async () => {
      // Find matching mission
      const qbMission = mockQueryBuilder();
      qbMission.getOne.mockResolvedValue(MISSION_READ);
      dailyMissionRepository.createQueryBuilder.mockReturnValue(qbMission as any);

      // No existing user mission
      userDailyMissionRepository.findOne.mockResolvedValue(null);

      // checkDailyBonus — not all completed
      userDailyMissionRepository.find.mockResolvedValue([
        { missionId: 'mission-read', isCompleted: true } as any,
        { missionId: 'mission-quiz', isCompleted: false } as any,
      ]);

      // checkDailyBonus query builder
      const qbBonus = mockQueryBuilder();
      qbBonus.getOne.mockResolvedValue(null);
      userPointsRepository.createQueryBuilder.mockReturnValue(qbBonus as any);

      await service.autoTrackMission(USER_ID, PointAction.ARTICLE_READ);

      // Should have saved the user mission as completed
      expect(userDailyMissionRepository.save).toHaveBeenCalledTimes(2); // create + mark complete
      expect(userPointsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          action: PointAction.DAILY_MISSION_COMPLETE,
          points: 10,
          metadata: expect.objectContaining({
            missionId: 'mission-read',
            autoTracked: true,
          }),
        }),
      );
    });

    it('should skip when action type has no mission mapping', async () => {
      await service.autoTrackMission(USER_ID, PointAction.DAILY_LOGIN);

      // Should not query repositories
      expect(dailyMissionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should skip when mission is already completed', async () => {
      const qbMission = mockQueryBuilder();
      qbMission.getOne.mockResolvedValue(MISSION_READ);
      dailyMissionRepository.createQueryBuilder.mockReturnValue(qbMission as any);

      // Already completed
      userDailyMissionRepository.findOne.mockResolvedValue({
        id: 'udm-1',
        appUserId: USER_ID,
        missionId: 'mission-read',
        date: todayStr,
        isCompleted: true,
        completedAt: new Date(),
      } as any);

      await service.autoTrackMission(USER_ID, PointAction.ARTICLE_READ);

      // Should not award points
      expect(userPointsRepository.save).not.toHaveBeenCalled();
    });

    it('should skip when no matching mission exists for today', async () => {
      const qbMission = mockQueryBuilder();
      qbMission.getOne.mockResolvedValue(null); // no match
      dailyMissionRepository.createQueryBuilder.mockReturnValue(qbMission as any);

      await service.autoTrackMission(USER_ID, PointAction.ARTICLE_READ);

      expect(userPointsRepository.save).not.toHaveBeenCalled();
    });

    it('should skip when no missions set for today', async () => {
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([]);

      await service.autoTrackMission(USER_ID, PointAction.ARTICLE_READ);

      expect(dailyMissionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // autoTrackMission — extended
  // ---------------------------------------------------------------------------
  describe('autoTrackMission — extended', () => {
    const todayStr = '2026-03-11';

    beforeEach(() => {
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue(todayStr);
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([
        'mission-read',
        'mission-quiz',
        'mission-poll',
      ]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should auto-track quiz_complete action to matching COMPLETE_QUIZ mission', async () => {
      const qbMission = mockQueryBuilder();
      qbMission.getOne.mockResolvedValue(MISSION_QUIZ);
      dailyMissionRepository.createQueryBuilder.mockReturnValue(qbMission as any);

      // No existing user mission
      userDailyMissionRepository.findOne.mockResolvedValue(null);

      // checkDailyBonus — not all completed
      userDailyMissionRepository.find.mockResolvedValue([
        { missionId: 'mission-quiz', isCompleted: true } as any,
        { missionId: 'mission-read', isCompleted: false } as any,
      ]);

      const qbBonus = mockQueryBuilder();
      qbBonus.getOne.mockResolvedValue(null);
      userPointsRepository.createQueryBuilder.mockReturnValue(qbBonus as any);

      await service.autoTrackMission(USER_ID, PointAction.QUIZ_COMPLETE);

      expect(userPointsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          action: PointAction.DAILY_MISSION_COMPLETE,
          points: 20, // MISSION_QUIZ points
          metadata: expect.objectContaining({
            missionId: 'mission-quiz',
            missionType: MissionType.COMPLETE_QUIZ,
            autoTracked: true,
          }),
        }),
      );
    });

    it('should not change anything when action does not match any mission type', async () => {
      const qbMission = mockQueryBuilder();
      qbMission.getOne.mockResolvedValue(null); // no matching mission
      dailyMissionRepository.createQueryBuilder.mockReturnValue(qbMission as any);

      await service.autoTrackMission(USER_ID, PointAction.ARTICLE_READ);

      // Points should NOT be saved since no matching mission found for today
      expect(userPointsRepository.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // completeMission — extended daily bonus
  // ---------------------------------------------------------------------------
  describe('completeMission — bonus when all 3 completed', () => {
    const todayStr = '2026-03-11';

    beforeEach(() => {
      jest.spyOn(service, 'getTodayIsrael').mockReturnValue(todayStr);
      jest.spyOn(service, 'getTodayMissionIds').mockResolvedValue([
        'mission-read',
        'mission-quiz',
        'mission-poll',
      ]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should award bonus when completing the last remaining mission', async () => {
      // Mission being completed
      dailyMissionRepository.findOne.mockResolvedValue(MISSION_POLL);

      userDailyMissionRepository.findOne.mockResolvedValue({
        id: 'udm-3',
        appUserId: USER_ID,
        missionId: 'mission-poll',
        date: todayStr,
        isCompleted: false,
        completedAt: null,
      } as any);

      // hasUserPerformedAction — user has voted today
      const qbAction = mockQueryBuilder();
      qbAction.getOne.mockResolvedValue({ id: 'point-record' });
      userPointsRepository.createQueryBuilder
        .mockReturnValueOnce(qbAction as any);

      mockGamificationService.awardPoints.mockResolvedValue({} as UserPoints);

      // checkDailyBonus — all missions completed after this one
      userDailyMissionRepository.find.mockResolvedValue([
        { missionId: 'mission-read', isCompleted: true } as any,
        { missionId: 'mission-quiz', isCompleted: true } as any,
        { missionId: 'mission-poll', isCompleted: true } as any,
      ]);

      // No existing bonus
      const qbBonus = mockQueryBuilder();
      qbBonus.getOne.mockResolvedValue(null);
      userPointsRepository.createQueryBuilder
        .mockReturnValueOnce(qbBonus as any);

      const result = await service.completeMission(USER_ID, 'mission-poll');

      expect(result.completed).toBe(true);
      expect(result.allCompleted).toBe(true);
      expect(result.bonusAwarded).toBe(true);
      expect(result.bonusPoints).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // generateDailyMissions — extended
  // ---------------------------------------------------------------------------
  describe('generateDailyMissions — pool selection', () => {
    it('should only select from active missions in the pool', async () => {
      const activeMissions = [MISSION_READ, MISSION_QUIZ];
      const inactiveMission = { ...MISSION_SHARE, isActive: false };

      // The find query uses { isActive: true }, so it should return only active ones
      dailyMissionRepository.find.mockResolvedValue(activeMissions);

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2); // Tuesday

      const result = await service.generateDailyMissions();

      // Should select at most 2 (we only have 2 active missions, need 3)
      expect(result).toHaveLength(2);
      expect(result).toContain('mission-read');
      expect(result).toContain('mission-quiz');
      // Should NOT contain the inactive mission
      expect(result).not.toContain('mission-share');

      jest.restoreAllMocks();
    });
  });

  // ---------------------------------------------------------------------------
  // getTodayMissionIds
  // ---------------------------------------------------------------------------
  describe('getTodayMissionIds', () => {
    it('should return cached mission IDs when available', async () => {
      const cachedIds = ['m-1', 'm-2', 'm-3'];
      mockCacheManager.get.mockResolvedValue(cachedIds);

      const result = await service.getTodayMissionIds();

      expect(result).toEqual(cachedIds);
      expect(dailyMissionRepository.find).not.toHaveBeenCalled();
    });

    it('should regenerate missions on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      dailyMissionRepository.find.mockResolvedValue(ALL_MISSIONS);

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(2); // Tuesday

      const result = await service.getTodayMissionIds();

      expect(result).toHaveLength(3);
      expect(mockCacheManager.set).toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });

  // ---------------------------------------------------------------------------
  // getTodayIsrael
  // ---------------------------------------------------------------------------
  describe('getTodayIsrael', () => {
    it('should return a valid YYYY-MM-DD string', () => {
      const result = service.getTodayIsrael();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
