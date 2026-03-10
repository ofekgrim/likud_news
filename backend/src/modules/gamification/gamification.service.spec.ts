import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationService } from './gamification.service';
import { UserPoints, PointAction } from './entities/user-points.entity';
import { UserBadge, BadgeType } from './entities/user-badge.entity';
import { UserStreak } from './entities/user-streak.entity';
import { DailyQuizAttempt } from './entities/daily-quiz-attempt.entity';
import { AppUser } from '../app-users/entities/app-user.entity';

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
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  clone: jest.fn(),
});

describe('GamificationService', () => {
  let service: GamificationService;
  let userPointsRepository: jest.Mocked<Repository<UserPoints>>;
  let userBadgeRepository: jest.Mocked<Repository<UserBadge>>;
  let userStreakRepository: jest.Mocked<Repository<UserStreak>>;
  let dailyQuizAttemptRepository: jest.Mocked<Repository<DailyQuizAttempt>>;
  let appUserRepository: jest.Mocked<Repository<AppUser>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(UserPoints), useFactory: mockRepository },
        { provide: getRepositoryToken(UserBadge), useFactory: mockRepository },
        { provide: getRepositoryToken(UserStreak), useFactory: mockRepository },
        { provide: getRepositoryToken(DailyQuizAttempt), useFactory: mockRepository },
        { provide: getRepositoryToken(AppUser), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    userPointsRepository = module.get(getRepositoryToken(UserPoints));
    userBadgeRepository = module.get(getRepositoryToken(UserBadge));
    userStreakRepository = module.get(getRepositoryToken(UserStreak));
    dailyQuizAttemptRepository = module.get(getRepositoryToken(DailyQuizAttempt));
    appUserRepository = module.get(getRepositoryToken(AppUser));

    // Default streak mock — individual tests can override
    userStreakRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    } as any);
    userStreakRepository.save.mockImplementation(async (s) => s as UserStreak);

    // Default dailyQuizAttempt count mock
    dailyQuizAttemptRepository.count.mockResolvedValue(0);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Helper: set up the mocks needed by checkAndAwardBadges so that it runs
   * without throwing. The caller can override individual mock behaviors before
   * invoking the method under test.
   */
  function stubCheckAndAwardBadgesDefaults(): void {
    // getUserBadges — no existing badges by default
    userBadgeRepository.find.mockResolvedValue([]);

    // countAction calls — all return 0 by default
    userPointsRepository.count.mockResolvedValue(0);

    // getUserPoints — total 0 by default
    const mockQb = mockQueryBuilder();
    mockQb.getRawOne.mockResolvedValue({ totalPoints: '0' });
    userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

    // getStreak — return a default streak object
    userStreakRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    } as any);

    // dailyQuizAttempt count — 0 by default
    dailyQuizAttemptRepository.count.mockResolvedValue(0);

    // maybeAwardBadge save — no-op
    userBadgeRepository.create.mockReturnValue({} as UserBadge);
    userBadgeRepository.save.mockResolvedValue({} as UserBadge);
  }

  // ---------------------------------------------------------------------------
  // awardPoints
  // ---------------------------------------------------------------------------
  describe('awardPoints', () => {
    it('should create a points record and call checkAndAwardBadges', async () => {
      const dto = {
        userId: 'user-1',
        action: PointAction.QUIZ_COMPLETE,
        points: 10,
        metadata: { quizId: 'quiz-123' },
      };

      const savedRecord = { id: 'up-1', ...dto, earnedAt: new Date() } as UserPoints;

      userPointsRepository.create.mockReturnValue(savedRecord);
      userPointsRepository.save.mockResolvedValue(savedRecord);

      // Stub checkAndAwardBadges internals
      stubCheckAndAwardBadgesDefaults();

      const result = await service.awardPoints(dto);

      expect(result).toEqual(savedRecord);
      expect(userPointsRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        action: PointAction.QUIZ_COMPLETE,
        points: 10,
        metadata: { quizId: 'quiz-123' },
      });
      expect(userPointsRepository.save).toHaveBeenCalledWith(savedRecord);
    });

    it('should default metadata to empty object when not provided', async () => {
      const dto = {
        userId: 'user-1',
        action: PointAction.SHARE,
        points: 5,
      };

      const savedRecord = {
        id: 'up-2',
        userId: 'user-1',
        action: PointAction.SHARE,
        points: 5,
        metadata: {},
        earnedAt: new Date(),
      } as UserPoints;

      userPointsRepository.create.mockReturnValue(savedRecord);
      userPointsRepository.save.mockResolvedValue(savedRecord);
      stubCheckAndAwardBadgesDefaults();

      await service.awardPoints(dto as any);

      expect(userPointsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: {} }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getUserPoints
  // ---------------------------------------------------------------------------
  describe('getUserPoints', () => {
    it('should return total sum of points for a user', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '150' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getUserPoints('user-1');

      expect(result).toEqual({ userId: 'user-1', totalPoints: 150 });
      expect(mockQb.select).toHaveBeenCalledWith('SUM(up.points)', 'totalPoints');
      expect(mockQb.where).toHaveBeenCalledWith('up.userId = :userId', {
        userId: 'user-1',
      });
    });

    it('should return 0 when user has no points', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: null });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getUserPoints('user-no-points');

      expect(result).toEqual({ userId: 'user-no-points', totalPoints: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // getUserPointsHistory
  // ---------------------------------------------------------------------------
  describe('getUserPointsHistory', () => {
    it('should return paginated points history ordered by earnedAt DESC', async () => {
      const records = [
        { id: 'up-1', action: PointAction.QUIZ_COMPLETE, points: 10 },
        { id: 'up-2', action: PointAction.SHARE, points: 5 },
      ] as UserPoints[];

      userPointsRepository.findAndCount.mockResolvedValue([records, 2]);

      const result = await service.getUserPointsHistory('user-1', 1, 20);

      expect(result).toEqual({
        data: records,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(userPointsRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { earnedAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should calculate correct offset for page 3', async () => {
      userPointsRepository.findAndCount.mockResolvedValue([[], 50]);

      const result = await service.getUserPointsHistory('user-1', 3, 10);

      expect(result.totalPages).toBe(5);
      expect(userPointsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should use default page=1 and limit=20', async () => {
      userPointsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getUserPointsHistory('user-1');

      expect(userPointsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getUserBadges
  // ---------------------------------------------------------------------------
  describe('getUserBadges', () => {
    it('should return badges ordered by earnedAt DESC', async () => {
      const badges = [
        { id: 'badge-1', badgeType: BadgeType.QUIZ_TAKER, earnedAt: new Date('2026-02-20') },
        { id: 'badge-2', badgeType: BadgeType.FIRST_VOTE, earnedAt: new Date('2026-02-15') },
      ] as UserBadge[];

      userBadgeRepository.find.mockResolvedValue(badges);

      const result = await service.getUserBadges('user-1');

      expect(result).toEqual(badges);
      expect(userBadgeRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { earnedAt: 'DESC' },
      });
    });

    it('should return empty array when user has no badges', async () => {
      userBadgeRepository.find.mockResolvedValue([]);

      const result = await service.getUserBadges('user-new');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // checkAndAwardBadges
  // ---------------------------------------------------------------------------
  describe('checkAndAwardBadges', () => {
    it('should award QUIZ_TAKER when quiz count >= 1', async () => {
      // No existing badges
      userBadgeRepository.find.mockResolvedValue([]);

      // countAction mock: QUIZ_COMPLETE returns 1, everything else returns 0
      userPointsRepository.count.mockImplementation(async (opts: any) => {
        const where = opts.where;
        if (where.action === PointAction.QUIZ_COMPLETE) return 1;
        return 0;
      });

      // getUserPoints returns 10 (below TOP_CONTRIBUTOR threshold)
      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '10' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const createdBadge = { id: 'b-1', badgeType: BadgeType.QUIZ_TAKER } as UserBadge;
      userBadgeRepository.create.mockReturnValue(createdBadge);
      userBadgeRepository.save.mockResolvedValue(createdBadge);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        badgeType: BadgeType.QUIZ_TAKER,
      });
      expect(userBadgeRepository.save).toHaveBeenCalled();
    });

    it('should award FIRST_VOTE when poll vote count >= 1', async () => {
      userBadgeRepository.find.mockResolvedValue([]);

      userPointsRepository.count.mockImplementation(async (opts: any) => {
        const where = opts.where;
        if (where.action === PointAction.POLL_VOTE) return 1;
        return 0;
      });

      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '5' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ badgeType: BadgeType.FIRST_VOTE }),
      );
    });

    it('should NOT award a badge the user already has', async () => {
      // User already has QUIZ_TAKER
      userBadgeRepository.find.mockResolvedValue([
        { id: 'b-existing', userId: 'user-1', badgeType: BadgeType.QUIZ_TAKER } as UserBadge,
      ]);

      // Quiz count is still >= 1
      userPointsRepository.count.mockImplementation(async (opts: any) => {
        const where = opts.where;
        if (where.action === PointAction.QUIZ_COMPLETE) return 5;
        return 0;
      });

      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '50' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);

      await service.checkAndAwardBadges('user-1');

      // QUIZ_TAKER should NOT be re-awarded
      const createCalls = userBadgeRepository.create.mock.calls;
      const quizTakerCalls = createCalls.filter(
        (call) => call[0]?.badgeType === BadgeType.QUIZ_TAKER,
      );
      expect(quizTakerCalls.length).toBe(0);
    });

    it('should award TOP_CONTRIBUTOR when total points >= 500', async () => {
      userBadgeRepository.find.mockResolvedValue([]);

      // No individual action counts meet thresholds
      userPointsRepository.count.mockResolvedValue(0);

      // But total points is 500
      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '500' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ badgeType: BadgeType.TOP_CONTRIBUTOR }),
      );
    });

    it('should award POLL_VOTER when poll vote count >= 3', async () => {
      userBadgeRepository.find.mockResolvedValue([]);

      userPointsRepository.count.mockImplementation(async (opts: any) => {
        const where = opts.where;
        if (where.action === PointAction.POLL_VOTE) return 3;
        return 0;
      });

      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '30' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);

      await service.checkAndAwardBadges('user-1');

      const createCalls = userBadgeRepository.create.mock.calls;
      const pollVoterCalls = createCalls.filter(
        (call) => call[0]?.badgeType === BadgeType.POLL_VOTER,
      );
      expect(pollVoterCalls.length).toBe(1);
    });

    it('should award EVENT_GOER when event RSVP count >= 3', async () => {
      userBadgeRepository.find.mockResolvedValue([]);

      userPointsRepository.count.mockImplementation(async (opts: any) => {
        const where = opts.where;
        if (where.action === PointAction.EVENT_RSVP) return 3;
        return 0;
      });

      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '30' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ badgeType: BadgeType.EVENT_GOER }),
      );
    });

    it('should award SOCIAL_SHARER when share count >= 5', async () => {
      userBadgeRepository.find.mockResolvedValue([]);

      userPointsRepository.count.mockImplementation(async (opts: any) => {
        const where = opts.where;
        if (where.action === PointAction.SHARE) return 5;
        return 0;
      });

      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '25' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ badgeType: BadgeType.SOCIAL_SHARER }),
      );
    });

    it('should award EARLY_BIRD when login streak count >= 7', async () => {
      userBadgeRepository.find.mockResolvedValue([]);

      userPointsRepository.count.mockResolvedValue(0);

      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '70' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      // getStreak returns a streak with currentStreak >= 7
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: '2026-03-09',
      } as any);

      dailyQuizAttemptRepository.count.mockResolvedValue(0);

      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);

      await service.checkAndAwardBadges('user-1');

      expect(userBadgeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ badgeType: BadgeType.EARLY_BIRD }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getLeaderboard
  // ---------------------------------------------------------------------------
  describe('getLeaderboard', () => {
    it('should return paginated leaderboard with ranking', async () => {
      const rawData = [
        { userId: 'user-1', displayName: 'Alice', avatarUrl: 'https://img/a.jpg', totalPoints: '300' },
        { userId: 'user-2', displayName: 'Bob', avatarUrl: 'https://img/b.jpg', totalPoints: '200' },
      ];

      const mockQb = mockQueryBuilder();
      // clone for count
      const clonedQb = mockQueryBuilder();
      clonedQb.getRawMany.mockResolvedValue(rawData);
      mockQb.clone.mockReturnValue(clonedQb);

      // paginated results
      mockQb.getRawMany.mockResolvedValue(rawData);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getLeaderboard({ page: 1, limit: 20, period: 'all_time' });

      expect(result).toEqual({
        data: [
          { userId: 'user-1', displayName: 'Alice', avatarUrl: 'https://img/a.jpg', totalPoints: 300, rank: 1 },
          { userId: 'user-2', displayName: 'Bob', avatarUrl: 'https://img/b.jpg', totalPoints: 200, rank: 2 },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockQb.select).toHaveBeenCalledWith('up.userId', 'userId');
      expect(mockQb.addSelect).toHaveBeenCalledWith('au.displayName', 'displayName');
      expect(mockQb.addSelect).toHaveBeenCalledWith('au.avatarUrl', 'avatarUrl');
      expect(mockQb.addSelect).toHaveBeenCalledWith('SUM(up.points)', 'totalPoints');
      expect(mockQb.innerJoin).toHaveBeenCalledWith(AppUser, 'au', 'au.id = up.userId');
      expect(mockQb.groupBy).toHaveBeenCalledWith('up.userId');
      expect(mockQb.orderBy).toHaveBeenCalledWith('"totalPoints"', 'DESC');
      expect(mockQb.offset).toHaveBeenCalledWith(0);
      expect(mockQb.limit).toHaveBeenCalledWith(20);
    });

    it('should apply weekly period filter', async () => {
      const mockQb = mockQueryBuilder();
      const clonedQb = mockQueryBuilder();
      clonedQb.getRawMany.mockResolvedValue([]);
      mockQb.clone.mockReturnValue(clonedQb);
      mockQb.getRawMany.mockResolvedValue([]);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.getLeaderboard({ page: 1, limit: 20, period: 'weekly' });

      expect(mockQb.where).toHaveBeenCalledWith(
        'up.earnedAt >= :since',
        expect.objectContaining({ since: expect.any(Date) }),
      );
    });

    it('should apply monthly period filter', async () => {
      const mockQb = mockQueryBuilder();
      const clonedQb = mockQueryBuilder();
      clonedQb.getRawMany.mockResolvedValue([]);
      mockQb.clone.mockReturnValue(clonedQb);
      mockQb.getRawMany.mockResolvedValue([]);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.getLeaderboard({ page: 1, limit: 20, period: 'monthly' });

      expect(mockQb.where).toHaveBeenCalledWith(
        'up.earnedAt >= :since',
        expect.objectContaining({ since: expect.any(Date) }),
      );
    });

    it('should calculate correct rank for page 2', async () => {
      const rawData = [
        { userId: 'user-21', displayName: 'User21', avatarUrl: '', totalPoints: '50' },
      ];

      const mockQb = mockQueryBuilder();
      const clonedQb = mockQueryBuilder();
      clonedQb.getRawMany.mockResolvedValue(new Array(25).fill(null)); // 25 total users
      mockQb.clone.mockReturnValue(clonedQb);
      mockQb.getRawMany.mockResolvedValue(rawData);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getLeaderboard({ page: 2, limit: 20 });

      expect(mockQb.offset).toHaveBeenCalledWith(20);
      expect(result.data[0].rank).toBe(21); // skip=20, index=0 => rank 21
      expect(result.totalPages).toBe(2);
    });

    it('should handle empty displayName and avatarUrl gracefully', async () => {
      const rawData = [
        { userId: 'user-anon', displayName: null, avatarUrl: null, totalPoints: '10' },
      ];

      const mockQb = mockQueryBuilder();
      const clonedQb = mockQueryBuilder();
      clonedQb.getRawMany.mockResolvedValue(rawData);
      mockQb.clone.mockReturnValue(clonedQb);
      mockQb.getRawMany.mockResolvedValue(rawData);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getLeaderboard({ page: 1, limit: 20 });

      expect(result.data[0].displayName).toBe('');
      expect(result.data[0].avatarUrl).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // getUserRank
  // ---------------------------------------------------------------------------
  describe('getUserRank', () => {
    it('should return the correct rank and totalPoints for a user', async () => {
      const allRanks = [
        { userId: 'user-top', totalPoints: '500' },
        { userId: 'user-mid', totalPoints: '300' },
        { userId: 'user-low', totalPoints: '100' },
      ];

      const mockQb = mockQueryBuilder();
      mockQb.getRawMany.mockResolvedValue(allRanks);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getUserRank('user-mid');

      expect(result).toEqual({
        userId: 'user-mid',
        rank: 2,
        totalPoints: 300,
      });
    });

    it('should return rank=0 and totalPoints=0 when user not found', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([
        { userId: 'user-top', totalPoints: '500' },
      ]);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getUserRank('user-nonexistent');

      expect(result).toEqual({
        userId: 'user-nonexistent',
        rank: 0,
        totalPoints: 0,
      });
    });

    it('should apply weekly period filter', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([]);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.getUserRank('user-1', 'weekly');

      expect(mockQb.where).toHaveBeenCalledWith(
        'up.earnedAt >= :since',
        expect.objectContaining({ since: expect.any(Date) }),
      );
    });

    it('should apply monthly period filter', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([]);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.getUserRank('user-1', 'monthly');

      expect(mockQb.where).toHaveBeenCalledWith(
        'up.earnedAt >= :since',
        expect.objectContaining({ since: expect.any(Date) }),
      );
    });

    it('should not apply time filter for all_time period', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([]);
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.getUserRank('user-1', 'all_time');

      expect(mockQb.where).not.toHaveBeenCalled();
    });
  });
});
