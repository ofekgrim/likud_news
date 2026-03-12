import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationService } from './gamification.service';
import { DailyMissionService } from './daily-mission.service';
import { UserPoints, PointAction } from './entities/user-points.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserStreak } from './entities/user-streak.entity';
import { StreakMilestone } from './entities/streak-milestone.entity';
import { DailyQuizAttempt } from './entities/daily-quiz-attempt.entity';
import { AppUser } from '../app-users/entities/app-user.entity';

const mockDailyMissionService = {
  autoTrackMission: jest.fn().mockResolvedValue(undefined),
};

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

describe('GamificationService - Tier System (extended)', () => {
  let service: GamificationService;
  let userPointsRepository: jest.Mocked<Repository<UserPoints>>;
  let userStreakRepository: jest.Mocked<Repository<UserStreak>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(UserPoints), useFactory: mockRepository },
        { provide: getRepositoryToken(UserBadge), useFactory: mockRepository },
        { provide: getRepositoryToken(UserStreak), useFactory: mockRepository },
        { provide: getRepositoryToken(StreakMilestone), useFactory: mockRepository },
        { provide: getRepositoryToken(DailyQuizAttempt), useFactory: mockRepository },
        { provide: getRepositoryToken(AppUser), useFactory: mockRepository },
        { provide: DailyMissionService, useValue: mockDailyMissionService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    userPointsRepository = module.get(getRepositoryToken(UserPoints));
    userStreakRepository = module.get(getRepositoryToken(UserStreak));

    // Default streak mock
    userStreakRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      freezeTokens: 0,
      freezeTokensUsed: 0,
      lastFreezeUsedDate: null,
      tier: 1,
    } as any);
    userStreakRepository.save.mockImplementation(async (s) => s as UserStreak);
  });

  // ===========================================================================
  // getTierForXp — exhaustive boundary tests
  // ===========================================================================
  describe('getTierForXp', () => {
    it('should return tier 1 (פעיל) for 0 XP', () => {
      const tier = service.getTierForXp(0);
      expect(tier.tier).toBe(1);
      expect(tier.name).toBe('פעיל');
      expect(tier.nameEn).toBe('Active');
      expect(tier.minXp).toBe(0);
    });

    it('should return tier 1 for 499 XP (just below tier 2 threshold)', () => {
      const tier = service.getTierForXp(499);
      expect(tier.tier).toBe(1);
      expect(tier.name).toBe('פעיל');
    });

    it('should return tier 2 (מוביל) for exactly 500 XP', () => {
      const tier = service.getTierForXp(500);
      expect(tier.tier).toBe(2);
      expect(tier.name).toBe('מוביל');
      expect(tier.nameEn).toBe('Leader');
      expect(tier.minXp).toBe(500);
    });

    it('should return tier 2 for 1999 XP (just below tier 3 threshold)', () => {
      const tier = service.getTierForXp(1999);
      expect(tier.tier).toBe(2);
      expect(tier.name).toBe('מוביל');
    });

    it('should return tier 3 (שגריר) for exactly 2000 XP', () => {
      const tier = service.getTierForXp(2000);
      expect(tier.tier).toBe(3);
      expect(tier.name).toBe('שגריר');
      expect(tier.nameEn).toBe('Ambassador');
      expect(tier.minXp).toBe(2000);
    });

    it('should return tier 3 for 7499 XP (just below tier 4 threshold)', () => {
      const tier = service.getTierForXp(7499);
      expect(tier.tier).toBe(3);
      expect(tier.name).toBe('שגריר');
    });

    it('should return tier 4 (גנרל) for exactly 7500 XP', () => {
      const tier = service.getTierForXp(7500);
      expect(tier.tier).toBe(4);
      expect(tier.name).toBe('גנרל');
      expect(tier.nameEn).toBe('General');
      expect(tier.minXp).toBe(7500);
    });

    it('should return tier 4 for 24999 XP (just below tier 5 threshold)', () => {
      const tier = service.getTierForXp(24999);
      expect(tier.tier).toBe(4);
      expect(tier.name).toBe('גנרל');
    });

    it('should return tier 5 (אריה) for exactly 25000 XP', () => {
      const tier = service.getTierForXp(25000);
      expect(tier.tier).toBe(5);
      expect(tier.name).toBe('אריה');
      expect(tier.nameEn).toBe('Lion');
      expect(tier.minXp).toBe(25000);
    });

    it('should return tier 5 for 100000 XP (well above max threshold)', () => {
      const tier = service.getTierForXp(100000);
      expect(tier.tier).toBe(5);
      expect(tier.name).toBe('אריה');
      expect(tier.nameEn).toBe('Lion');
    });
  });

  // ===========================================================================
  // getTierInfo — feature gates
  // ===========================================================================
  describe('getTierInfo', () => {
    it('should return correct unlocked/locked features for tier 1 user', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '100' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getTierInfo('user-1');

      expect(result.currentTier).toBe(1);
      expect(result.unlockedFeatures).toHaveLength(0);
      expect(result.lockedFeatures).toHaveLength(4);
      expect(result.lockedFeatures.map((f) => f.feature)).toEqual(
        expect.arrayContaining([
          'ama_early_access',
          'vip_events',
          'mk_qa',
          'merchandise',
        ]),
      );
    });

    it('should return correct unlocked/locked features for tier 3 user', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '3000' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getTierInfo('user-1');

      expect(result.currentTier).toBe(3);
      expect(result.unlockedFeatures).toContain('ama_early_access');
      expect(result.unlockedFeatures).toContain('vip_events');
      expect(result.unlockedFeatures).not.toContain('mk_qa');
      expect(result.unlockedFeatures).not.toContain('merchandise');
      expect(result.lockedFeatures).toHaveLength(2);
    });

    it('should return all features unlocked for tier 5 user', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({ totalPoints: '50000' });
      userPointsRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getTierInfo('user-1');

      expect(result.currentTier).toBe(5);
      expect(result.unlockedFeatures).toHaveLength(4);
      expect(result.lockedFeatures).toHaveLength(0);
      expect(result.nextTierXp).toBeNull();
      expect(result.progressToNextTier).toBe(1.0);
    });
  });

  // ===========================================================================
  // checkTierPromotion
  // ===========================================================================
  describe('checkTierPromotion', () => {
    it('should trigger tier update on tier-up from 2 to 3', async () => {
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 10,
        longestStreak: 10,
        lastActivityDate: '2026-03-10',
        freezeTokens: 1,
        freezeTokensUsed: 0,
        lastFreezeUsedDate: null,
        tier: 2,
      } as any);

      const result = await service.checkTierPromotion('user-1', 2000);

      expect(result).toBe(true);
      expect(userStreakRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 3 }),
      );
    });

    it('should return false (no push) when tier is unchanged', async () => {
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: '2026-03-10',
        freezeTokens: 0,
        freezeTokensUsed: 0,
        lastFreezeUsedDate: null,
        tier: 2,
      } as any);

      const result = await service.checkTierPromotion('user-1', 800);

      expect(result).toBe(false);
      // save should NOT have been called for tier update
      expect(userStreakRepository.save).not.toHaveBeenCalled();
    });

    it('should handle tier 5 correctly (no next tier)', async () => {
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 200,
        longestStreak: 200,
        lastActivityDate: '2026-03-10',
        freezeTokens: 3,
        freezeTokensUsed: 5,
        lastFreezeUsedDate: null,
        tier: 4,
      } as any);

      const result = await service.checkTierPromotion('user-1', 25000);

      expect(result).toBe(true);
      expect(userStreakRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 5 }),
      );
    });

    it('should return false when user is already at tier 5 and gets more XP', async () => {
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 300,
        longestStreak: 300,
        lastActivityDate: '2026-03-10',
        freezeTokens: 3,
        freezeTokensUsed: 10,
        lastFreezeUsedDate: null,
        tier: 5,
      } as any);

      const result = await service.checkTierPromotion('user-1', 50000);

      expect(result).toBe(false);
      expect(userStreakRepository.save).not.toHaveBeenCalled();
    });

    it('should handle tier promotion from 1 to 2', async () => {
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 3,
        longestStreak: 3,
        lastActivityDate: '2026-03-10',
        freezeTokens: 0,
        freezeTokensUsed: 0,
        lastFreezeUsedDate: null,
        tier: 1,
      } as any);

      const result = await service.checkTierPromotion('user-1', 500);

      expect(result).toBe(true);
      expect(userStreakRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 2 }),
      );
    });

    it('should handle multi-tier skip (tier 1 to tier 4 in one jump)', async () => {
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        freezeTokens: 0,
        freezeTokensUsed: 0,
        lastFreezeUsedDate: null,
        tier: 1,
      } as any);

      const result = await service.checkTierPromotion('user-1', 10000);

      expect(result).toBe(true);
      expect(userStreakRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 4 }),
      );
    });

    it('should handle tier demotion edge case', async () => {
      userStreakRepository.findOne.mockResolvedValue({
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 50,
        lastActivityDate: '2026-03-10',
        freezeTokens: 0,
        freezeTokensUsed: 0,
        lastFreezeUsedDate: null,
        tier: 3,
      } as any);

      // XP decreased (admin adjustment) below tier 2 threshold
      const result = await service.checkTierPromotion('user-1', 300);

      expect(result).toBe(true);
      expect(userStreakRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 1 }),
      );
    });
  });
});
