import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BranchesService } from './branches.service';
import { Branch } from './entities/branch.entity';
import { BranchWeeklyScore } from './entities/branch-weekly-score.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { UserPoints } from '../gamification/entities/user-points.entity';

// ── Mock factories ────────────────────────────────────────────────────────

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn((entity) => Promise.resolve({ id: 'test-uuid', ...entity })),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
  getManyAndCount: jest.fn(),
});

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({ affected: 1 }),
  getRawMany: jest.fn().mockResolvedValue([]),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getMany: jest.fn().mockResolvedValue([]),
  getOne: jest.fn().mockResolvedValue(null),
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  query: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

// ── Test suite ────────────────────────────────────────────────────────────

describe('BranchesService', () => {
  let service: BranchesService;
  let branchRepo: jest.Mocked<Repository<Branch>>;
  let weeklyScoreRepo: jest.Mocked<Repository<BranchWeeklyScore>>;
  let appUserRepo: jest.Mocked<Repository<AppUser>>;
  let userPointsRepo: jest.Mocked<Repository<UserPoints>>;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: getRepositoryToken(Branch), useFactory: mockRepository },
        { provide: getRepositoryToken(BranchWeeklyScore), useFactory: mockRepository },
        { provide: getRepositoryToken(AppUser), useFactory: mockRepository },
        { provide: getRepositoryToken(UserPoints), useFactory: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    branchRepo = module.get(getRepositoryToken(Branch));
    weeklyScoreRepo = module.get(getRepositoryToken(BranchWeeklyScore));
    appUserRepo = module.get(getRepositoryToken(AppUser));
    userPointsRepo = module.get(getRepositoryToken(UserPoints));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all active branches', async () => {
      const branches = [
        { id: '1', name: 'Branch A', district: 'Tel Aviv', isActive: true },
        { id: '2', name: 'Branch B', district: 'Jerusalem', isActive: true },
      ];
      branchRepo.find.mockResolvedValue(branches as Branch[]);

      const result = await service.findAll();

      expect(result).toEqual(branches);
      expect(branchRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('should filter by district when provided', async () => {
      branchRepo.find.mockResolvedValue([]);

      await service.findAll('Tel Aviv');

      expect(branchRepo.find).toHaveBeenCalledWith({
        where: { isActive: true, district: 'Tel Aviv' },
        order: { name: 'ASC' },
      });
    });
  });

  // ─── findOne ────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a branch with its latest score', async () => {
      const branch = {
        id: 'branch-1',
        name: 'Test Branch',
        district: 'Center',
      } as Branch;
      const score = {
        id: 'score-1',
        branchId: 'branch-1',
        weekStart: '2026-03-09',
        totalScore: 100,
        perCapitaScore: 10.5,
      } as BranchWeeklyScore;

      branchRepo.findOne.mockResolvedValue(branch);
      weeklyScoreRepo.findOne.mockResolvedValue(score);

      const result = await service.findOne('branch-1');

      expect(result).toEqual({ ...branch, latestScore: score });
      expect(branchRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'branch-1' },
      });
      expect(weeklyScoreRepo.findOne).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        order: { weekStart: 'DESC' },
      });
    });

    it('should throw NotFoundException when branch not found', async () => {
      branchRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ─────────────────────────────────────────────────

  describe('create', () => {
    it('should create a new branch', async () => {
      const dto = { name: 'New Branch', district: 'South' };
      branchRepo.findOne.mockResolvedValue(null); // No existing branch with this name

      await service.create(dto);

      expect(branchRepo.create).toHaveBeenCalledWith(dto);
      expect(branchRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if name already exists', async () => {
      const dto = { name: 'Existing Branch', district: 'South' };
      branchRepo.findOne.mockResolvedValue({ id: '1', name: dto.name } as Branch);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── update ─────────────────────────────────────────────────

  describe('update', () => {
    it('should update an existing branch', async () => {
      const branch = {
        id: 'branch-1',
        name: 'Old Name',
        district: 'Center',
      } as Branch;
      branchRepo.findOne
        .mockResolvedValueOnce(branch) // First call: find the branch
        .mockResolvedValueOnce(null); // Second call: check name uniqueness

      await service.update('branch-1', { name: 'New Name' });

      expect(branchRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if branch not found', async () => {
      branchRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already taken', async () => {
      const branch = {
        id: 'branch-1',
        name: 'Old Name',
        district: 'Center',
      } as Branch;
      const existing = {
        id: 'branch-2',
        name: 'Taken Name',
      } as Branch;

      branchRepo.findOne
        .mockResolvedValueOnce(branch)
        .mockResolvedValueOnce(existing);

      await expect(
        service.update('branch-1', { name: 'Taken Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── getLeaderboard ─────────────────────────────────────────

  describe('getLeaderboard', () => {
    it('should return cached result if available', async () => {
      const cachedData = {
        data: [{ branchId: '1', perCapitaScore: 20 }],
        weekStart: '2026-03-09',
        total: 1,
      };
      mockCacheManager.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getLeaderboard({});

      expect(result).toEqual(cachedData);
      // Should not query the database
      expect(weeklyScoreRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should query DB and cache result when cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const scores = [
        { id: '1', branchId: 'b1', perCapitaScore: 20, branch: { name: 'A' } },
      ];

      // Reset the mock to return fresh query builder
      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([scores, 1]),
      };
      weeklyScoreRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getLeaderboard({});

      expect(result.total).toBe(1);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  // ─── updateMemberBranch ─────────────────────────────────────

  describe('updateMemberBranch', () => {
    it('should assign user to a new branch', async () => {
      const user = { id: 'user-1', branchId: null } as unknown as AppUser;
      const branch = { id: 'branch-1', name: 'Test' } as Branch;

      appUserRepo.findOne.mockResolvedValue(user);
      branchRepo.findOne.mockResolvedValue(branch);
      appUserRepo.save.mockResolvedValue({ ...user, branchId: 'branch-1' } as AppUser);

      const result = await service.updateMemberBranch('user-1', 'branch-1');

      expect(result.branchId).toBe('branch-1');
      expect(appUserRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      appUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMemberBranch('nonexistent', 'branch-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if branch not found', async () => {
      appUserRepo.findOne.mockResolvedValue({ id: 'user-1' } as AppUser);
      branchRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMemberBranch('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getCurrentWeekStart ────────────────────────────────────

  describe('getCurrentWeekStart', () => {
    it('should return the Monday of the current week', () => {
      // The method is public so we can test it directly
      const result = service.getCurrentWeekStart();

      // Verify it is a valid date string
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it is a Monday
      const date = new Date(result + 'T12:00:00Z');
      expect(date.getUTCDay()).toBe(1); // 1 = Monday
    });
  });

  // ─── computeWeeklyScores ───────────────────────────────────

  describe('computeWeeklyScores', () => {
    it('should compute scores for active branches', async () => {
      const branches = [
        { id: 'b1', name: 'Branch 1', isActive: true },
        { id: 'b2', name: 'Branch 2', isActive: true },
      ] as Branch[];

      branchRepo.find.mockResolvedValue(branches);
      weeklyScoreRepo.find.mockResolvedValue([]); // No previous scores

      // b1 has 5 active members, b2 has 0 (skip)
      appUserRepo.count
        .mockResolvedValueOnce(5) // b1 members
        .mockResolvedValueOnce(0); // b2 members

      // b1 points by action
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { action: 'quiz_complete', totalPoints: '100' },
          { action: 'article_read', totalPoints: '200' },
        ]),
      };
      userPointsRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.computeWeeklyScores();

      expect(result.branchesProcessed).toBe(1); // Only b1 had members
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.query).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      branchRepo.find.mockResolvedValue([
        { id: 'b1', name: 'Branch 1', isActive: true },
      ] as Branch[]);
      weeklyScoreRepo.find.mockResolvedValue([]);
      appUserRepo.count.mockResolvedValue(5);

      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      userPointsRepo.createQueryBuilder.mockReturnValue(qb as any);

      mockQueryRunner.query.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.computeWeeklyScores()).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // ─── getNationalLeaderboard ────────────────────────────────

  describe('getNationalLeaderboard', () => {
    it('should delegate to getLeaderboard with default limit of 10', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const scores = [
        { id: '1', branchId: 'b1', perCapitaScore: 30, branch: { name: 'Top Branch' } },
      ];

      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([scores, 1]),
      };
      weeklyScoreRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getNationalLeaderboard();

      expect(result.total).toBe(1);
      expect(result.data).toEqual(scores);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('should respect custom limit parameter', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      weeklyScoreRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.getNationalLeaderboard(5);

      expect(qb.take).toHaveBeenCalledWith(5);
    });
  });

  // ─── computeWeeklyScores — extended ──────────────────────────

  describe('computeWeeklyScores — normalization and edge cases', () => {
    it('should normalize scores by active member count (per capita)', async () => {
      const branches = [
        { id: 'b1', name: 'Small Branch', isActive: true },
        { id: 'b2', name: 'Large Branch', isActive: true },
      ] as Branch[];

      branchRepo.find.mockResolvedValue(branches);
      weeklyScoreRepo.find.mockResolvedValue([]); // No previous scores

      // b1 has 2 active members, b2 has 10 active members
      appUserRepo.count
        .mockResolvedValueOnce(2)  // b1 members
        .mockResolvedValueOnce(10); // b2 members

      // b1: 100 points from quizzes
      const qbB1 = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { action: 'quiz_complete', totalPoints: '100' },
        ]),
      };
      // b2: 200 points from quizzes (more total, but per capita should be lower)
      const qbB2 = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { action: 'quiz_complete', totalPoints: '200' },
        ]),
      };

      userPointsRepo.createQueryBuilder
        .mockReturnValueOnce(qbB1 as any)
        .mockReturnValueOnce(qbB2 as any);

      const result = await service.computeWeeklyScores();

      expect(result.branchesProcessed).toBe(2);
      // Verify upsert queries were called with per-capita scores
      // b1: totalScore=100, perCapita=100/2=50
      // b2: totalScore=200, perCapita=200/10=20
      // b1 should be ranked first (rank=1) since 50 > 20
      const queryCallArgs = mockQueryRunner.query.mock.calls;
      // First upsert is b1 (rank 1), second is b2 (rank 2)
      expect(queryCallArgs[0][1]).toEqual(expect.arrayContaining(['b1']));
      expect(queryCallArgs[0][1][3]).toBe(50); // perCapitaScore for b1
      expect(queryCallArgs[2][1]).toEqual(expect.arrayContaining(['b2']));
      expect(queryCallArgs[2][1][3]).toBe(20); // perCapitaScore for b2
    });

    it('should skip branches with zero active members gracefully', async () => {
      const branches = [
        { id: 'b-empty', name: 'Empty Branch', isActive: true },
        { id: 'b-active', name: 'Active Branch', isActive: true },
      ] as Branch[];

      branchRepo.find.mockResolvedValue(branches);
      weeklyScoreRepo.find.mockResolvedValue([]);

      // b-empty has 0 members, b-active has 3
      appUserRepo.count
        .mockResolvedValueOnce(0)  // b-empty: zero members
        .mockResolvedValueOnce(3); // b-active: some members

      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { action: 'article_read', totalPoints: '30' },
        ]),
      };
      userPointsRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.computeWeeklyScores();

      // Only b-active should be processed (b-empty skipped)
      expect(result.branchesProcessed).toBe(1);
    });

    it('should apply action weights correctly in score breakdown', async () => {
      const branches = [
        { id: 'b1', name: 'Branch 1', isActive: true },
      ] as Branch[];

      branchRepo.find.mockResolvedValue(branches);
      weeklyScoreRepo.find.mockResolvedValue([]);
      appUserRepo.count.mockResolvedValue(4);

      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { action: 'quiz_complete', totalPoints: '100' },   // weight 1.0 => 100
          { action: 'article_read', totalPoints: '200' },    // weight 0.3 => 60
          { action: 'share', totalPoints: '10' },            // weight 5.0 => 50
        ]),
      };
      userPointsRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.computeWeeklyScores();

      expect(result.branchesProcessed).toBe(1);
      // Total weighted: 100 + 60 + 50 = 210
      // Per capita: 210 / 4 = 52.5
      const upsertArgs = mockQueryRunner.query.mock.calls[0][1];
      expect(upsertArgs[2]).toBe(210);    // totalScore
      expect(upsertArgs[3]).toBe(52.5);   // perCapitaScore
    });

    it('should track previous week ranks for prevRank field', async () => {
      const branches = [
        { id: 'b1', name: 'Branch 1', isActive: true },
      ] as Branch[];

      branchRepo.find.mockResolvedValue(branches);

      // Previous week had b1 ranked 3rd
      weeklyScoreRepo.find.mockResolvedValue([
        { branchId: 'b1', rank: 3 } as BranchWeeklyScore,
      ]);

      appUserRepo.count.mockResolvedValue(5);

      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { action: 'quiz_complete', totalPoints: '50' },
        ]),
      };
      userPointsRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.computeWeeklyScores();

      // prevRank should be 3 (from previous week)
      const upsertArgs = mockQueryRunner.query.mock.calls[0][1];
      expect(upsertArgs[6]).toBe(3); // prevRank
    });

    it('should invalidate leaderboard cache after computing scores', async () => {
      branchRepo.find.mockResolvedValue([]);
      weeklyScoreRepo.find.mockResolvedValue([]);

      await service.computeWeeklyScores();

      // Cache del should have been called for leaderboard keys
      expect(mockCacheManager.del).toHaveBeenCalled();
    });
  });

  // ─── getLeaderboard — extended ───────────────────────────────

  describe('getLeaderboard — district filter and period', () => {
    it('should apply district filter when provided', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      weeklyScoreRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.getLeaderboard({ district: 'Tel Aviv' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'branch.district = :district',
        { district: 'Tel Aviv' },
      );
    });

    it('should use provided weekStart for historical leaderboard', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      weeklyScoreRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getLeaderboard({ weekStart: '2026-03-02' });

      expect(qb.where).toHaveBeenCalledWith(
        'bws.weekStart = :weekStart',
        { weekStart: '2026-03-02' },
      );
      expect(result.weekStart).toBe('2026-03-02');
    });
  });

  // ─── updateMemberBranch — extended ──────────────────────────

  describe('updateMemberBranch — member count updates', () => {
    it('should decrement old branch and increment new branch member counts', async () => {
      const user = { id: 'user-1', branchId: 'old-branch' } as unknown as AppUser;
      const newBranch = { id: 'new-branch', name: 'New' } as Branch;

      appUserRepo.findOne.mockResolvedValue(user);
      branchRepo.findOne.mockResolvedValue(newBranch);
      appUserRepo.save.mockResolvedValue({ ...user, branchId: 'new-branch' } as AppUser);

      await service.updateMemberBranch('user-1', 'new-branch');

      // createQueryBuilder should be called twice: once for decrement, once for increment
      expect(branchRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('should not decrement when user has no previous branch', async () => {
      const user = { id: 'user-1', branchId: null } as unknown as AppUser;
      const branch = { id: 'branch-1', name: 'Test' } as Branch;

      appUserRepo.findOne.mockResolvedValue(user);
      branchRepo.findOne.mockResolvedValue(branch);
      appUserRepo.save.mockResolvedValue({ ...user, branchId: 'branch-1' } as AppUser);

      await service.updateMemberBranch('user-1', 'branch-1');

      // createQueryBuilder should be called once: only for increment
      expect(branchRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('should not update member counts when reassigned to same branch', async () => {
      const user = { id: 'user-1', branchId: 'branch-1' } as unknown as AppUser;
      const branch = { id: 'branch-1', name: 'Same' } as Branch;

      appUserRepo.findOne.mockResolvedValue(user);
      branchRepo.findOne.mockResolvedValue(branch);
      appUserRepo.save.mockResolvedValue(user as AppUser);

      await service.updateMemberBranch('user-1', 'branch-1');

      // No member count updates when same branch
      expect(branchRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  // ─── incrementScore ─────────────────────────────────────────

  describe('incrementScore', () => {
    it('should increment cached score for a known action', async () => {
      mockCacheManager.get.mockResolvedValue(10);

      await service.incrementScore('branch-1', 'quiz_complete', 20);

      // quiz_complete weight = 1, so weightedPoints = 20
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('branch_rt_score'),
        30, // 10 existing + 20 new
        expect.any(Number),
      );
    });

    it('should not increment for unknown actions (weight = 0)', async () => {
      await service.incrementScore('branch-1', 'unknown_action', 50);

      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });
});
