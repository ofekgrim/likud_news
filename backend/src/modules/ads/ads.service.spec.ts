import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdsService } from './ads.service';
import {
  CandidateAdPlacement,
  AdPlacementType,
  AdPlacementStatus,
} from './entities/candidate-ad-placement.entity';
import { CompanyAdvertiser } from './entities/company-advertiser.entity';
import { CompanyAd, CompanyAdType } from './entities/company-ad.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
  getMany: jest.fn(),
});

describe('AdsService', () => {
  let service: AdsService;
  let adRepository: jest.Mocked<Repository<CandidateAdPlacement>>;
  let companyAdRepository: jest.Mocked<Repository<CompanyAd>>;
  let companyAdvertiserRepository: jest.Mocked<Repository<CompanyAdvertiser>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        {
          provide: getRepositoryToken(CandidateAdPlacement),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(CompanyAdvertiser),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(CompanyAd),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdsService>(AdsService);
    adRepository = module.get(getRepositoryToken(CandidateAdPlacement));
    companyAdRepository = module.get(getRepositoryToken(CompanyAd));
    companyAdvertiserRepository = module.get(getRepositoryToken(CompanyAdvertiser));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────
  // createPlacement
  // ─────────────────────────────────────────────────────────────────
  describe('createPlacement', () => {
    it('should create an ad placement with default values', async () => {
      const dto = {
        placementType: AdPlacementType.FEED_SPONSORED,
        title: 'Test Ad',
        contentHe: 'תוכן מודעה',
        dailyBudgetNis: 100,
        cpmNis: 5,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      };

      const savedPlacement = {
        id: 'ad-1',
        candidateId: 'candidate-1',
        ...dto,
        imageUrl: null,
        targetingRules: null,
        isApproved: false,
        isActive: true,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      adRepository.create.mockReturnValue(savedPlacement);
      adRepository.save.mockResolvedValue(savedPlacement);

      const result = await service.createPlacement(dto, 'candidate-1');

      expect(result.id).toBe('ad-1');
      expect(result.isApproved).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.impressions).toBe(0);
      expect(result.clicks).toBe(0);
      expect(adRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateId: 'candidate-1',
          placementType: AdPlacementType.FEED_SPONSORED,
          isApproved: false,
          isActive: true,
        }),
      );
    });

    it('should set imageUrl and targetingRules when provided', async () => {
      const dto = {
        placementType: AdPlacementType.PROFILE_FEATURED,
        title: 'Featured Ad',
        contentHe: 'תוכן',
        imageUrl: 'https://cdn.example.com/img.jpg',
        targetingRules: { districts: ['north'] },
        dailyBudgetNis: 200,
        cpmNis: 10,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      };

      const savedPlacement = {
        id: 'ad-2',
        candidateId: 'candidate-1',
        ...dto,
        isApproved: false,
        isActive: true,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      adRepository.create.mockReturnValue(savedPlacement);
      adRepository.save.mockResolvedValue(savedPlacement);

      const result = await service.createPlacement(dto, 'candidate-1');

      expect(result.imageUrl).toBe('https://cdn.example.com/img.jpg');
      expect(adRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://cdn.example.com/img.jpg',
          targetingRules: { districts: ['north'] },
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // approvePlacement
  // ─────────────────────────────────────────────────────────────────
  describe('approvePlacement', () => {
    it('should set isApproved to true', async () => {
      const placement = {
        id: 'ad-1',
        isApproved: false,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.approvePlacement('ad-1', 'admin-1');

      expect(result.isApproved).toBe(true);
    });

    it('should throw NotFoundException when placement not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.approvePlacement('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getActivePlacements
  // ─────────────────────────────────────────────────────────────────
  describe('getActivePlacements', () => {
    it('should filter by type, approved, active, and date range', async () => {
      const qb = mockQueryBuilder();
      const placements = [
        {
          id: 'ad-1',
          placementType: AdPlacementType.FEED_SPONSORED,
          isApproved: true,
          isActive: true,
        },
      ] as CandidateAdPlacement[];

      qb.getMany.mockResolvedValue(placements);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getActivePlacements(
        AdPlacementType.FEED_SPONSORED,
      );

      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith('ad.placementType = :type', {
        type: AdPlacementType.FEED_SPONSORED,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ad.isApproved = :isApproved',
        { isApproved: true },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ad.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should respect daily budget cap', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getActivePlacements(AdPlacementType.FEED_SPONSORED);

      // Verify budget check query is applied
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(ad.impressions * ad.cpmNis / 1000) < ad.dailyBudgetNis',
      );
    });

    it('should check startDate and endDate', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getActivePlacements(AdPlacementType.PUSH_NOTIFICATION);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'ad.startDate <= :today',
        expect.objectContaining({ today: expect.any(String) }),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ad.endDate >= :today',
        expect.objectContaining({ today: expect.any(String) }),
      );
    });

    it('should return empty array when no active placements', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getActivePlacements(
        AdPlacementType.QUIZ_END,
      );

      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // recordImpression
  // ─────────────────────────────────────────────────────────────────
  describe('recordImpression', () => {
    it('should increment impressions by 1', async () => {
      const placement = {
        id: 'ad-1',
        impressions: 5,
        clicks: 2,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.recordImpression('ad-1');

      expect(result.impressions).toBe(6);
    });

    it('should throw NotFoundException when placement not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordImpression('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // recordClick
  // ─────────────────────────────────────────────────────────────────
  describe('recordClick', () => {
    it('should increment clicks by 1', async () => {
      const placement = {
        id: 'ad-1',
        impressions: 10,
        clicks: 3,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.recordClick('ad-1');

      expect(result.clicks).toBe(4);
    });

    it('should throw NotFoundException when placement not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordClick('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getPlacementStats
  // ─────────────────────────────────────────────────────────────────
  describe('getPlacementStats', () => {
    it('should return aggregated stats with CTR', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalImpressions: '10000',
        totalClicks: '250',
        totalSpendNis: '500.00',
        activePlacements: '3',
      });
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getPlacementStats();

      expect(result.totalImpressions).toBe(10000);
      expect(result.totalClicks).toBe(250);
      expect(result.ctr).toBe(2.5);
      expect(result.totalSpendNis).toBe(500);
      expect(result.activePlacements).toBe(3);
    });

    it('should return zeros when no placements exist', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalImpressions: '0',
        totalClicks: '0',
        totalSpendNis: '0',
        activePlacements: '0',
      });
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getPlacementStats();

      expect(result.totalImpressions).toBe(0);
      expect(result.totalClicks).toBe(0);
      expect(result.ctr).toBe(0);
      expect(result.totalSpendNis).toBe(0);
      expect(result.activePlacements).toBe(0);
    });

    it('should filter by candidateId when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalImpressions: '500',
        totalClicks: '10',
        totalSpendNis: '25.00',
        activePlacements: '1',
      });
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getPlacementStats('candidate-1');

      expect(result.totalImpressions).toBe(500);
      expect(qb.where).toHaveBeenCalledWith(
        'ad.candidateId = :candidateId',
        { candidateId: 'candidate-1' },
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // deactivatePlacement
  // ─────────────────────────────────────────────────────────────────
  describe('deactivatePlacement', () => {
    it('should set isActive to false', async () => {
      const placement = {
        id: 'ad-1',
        isActive: true,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.deactivatePlacement('ad-1');

      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when placement not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deactivatePlacement('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // updatePlacement
  // ─────────────────────────────────────────────────────────────────
  describe('updatePlacement', () => {
    it('should update placement fields', async () => {
      const placement = {
        id: 'ad-1',
        title: 'Old Title',
        dailyBudgetNis: 100,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.updatePlacement('ad-1', {
        title: 'New Title',
        dailyBudgetNis: 200,
      });

      expect(result.title).toBe('New Title');
      expect(result.dailyBudgetNis).toBe(200);
    });

    it('should throw NotFoundException when placement not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePlacement('nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getAllPlacements
  // ─────────────────────────────────────────────────────────────────
  describe('getAllPlacements', () => {
    it('should return all placements ordered by createdAt DESC', async () => {
      const qb = mockQueryBuilder();
      const placements = [
        { id: 'ad-2', createdAt: new Date('2026-03-10') },
        { id: 'ad-1', createdAt: new Date('2026-03-01') },
      ] as CandidateAdPlacement[];

      qb.getMany.mockResolvedValue(placements);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getAllPlacements();

      expect(result).toHaveLength(2);
      expect(qb.orderBy).toHaveBeenCalledWith('ad.createdAt', 'DESC');
    });

    it('should apply type filter when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllPlacements({ type: AdPlacementType.FEED_SPONSORED });

      expect(qb.andWhere).toHaveBeenCalledWith('ad.placementType = :type', {
        type: AdPlacementType.FEED_SPONSORED,
      });
    });

    it('should apply candidateId filter when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllPlacements({ candidateId: 'candidate-1' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'ad.candidateId = :candidateId',
        { candidateId: 'candidate-1' },
      );
    });

    it('should apply isApproved filter when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllPlacements({ isApproved: true });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'ad.isApproved = :isApproved',
        { isApproved: true },
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // rejectPlacement
  // ─────────────────────────────────────────────────────────────────
  describe('rejectPlacement', () => {
    it('should set status to rejected and store reason', async () => {
      const placement = {
        id: 'ad-1',
        isApproved: true,
        isActive: true,
        status: AdPlacementStatus.APPROVED,
        rejectionReason: null,
        rejectedAt: null,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.rejectPlacement('ad-1', 'Policy violation', 'admin-1');

      expect(result.status).toBe(AdPlacementStatus.REJECTED);
      expect(result.isApproved).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.rejectionReason).toBe('Policy violation');
      expect(result.rejectedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rejectPlacement('nonexistent', 'reason', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // pausePlacement
  // ─────────────────────────────────────────────────────────────────
  describe('pausePlacement', () => {
    it('should set status to paused and isActive to false', async () => {
      const placement = {
        id: 'ad-1',
        isActive: true,
        status: AdPlacementStatus.APPROVED,
        pausedAt: null,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.pausePlacement('ad-1', 'admin-1');

      expect(result.status).toBe(AdPlacementStatus.PAUSED);
      expect(result.isActive).toBe(false);
      expect(result.pausedAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when not in approved status', async () => {
      const placement = {
        id: 'ad-1',
        isActive: false,
        status: AdPlacementStatus.PENDING,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);

      await expect(
        service.pausePlacement('ad-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.pausePlacement('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // resumePlacement
  // ─────────────────────────────────────────────────────────────────
  describe('resumePlacement', () => {
    it('should set status back to approved and isActive to true', async () => {
      const placement = {
        id: 'ad-1',
        isActive: false,
        status: AdPlacementStatus.PAUSED,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.resumePlacement('ad-1', 'admin-1');

      expect(result.status).toBe(AdPlacementStatus.APPROVED);
      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestException when not in paused status', async () => {
      const placement = {
        id: 'ad-1',
        isActive: true,
        status: AdPlacementStatus.APPROVED,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);

      await expect(
        service.resumePlacement('ad-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resumePlacement('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // endPlacement
  // ─────────────────────────────────────────────────────────────────
  describe('endPlacement', () => {
    it('should set status to ended and isActive to false', async () => {
      const placement = {
        id: 'ad-1',
        isActive: true,
        status: AdPlacementStatus.APPROVED,
        endedAt: null,
      } as CandidateAdPlacement;

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.endPlacement('ad-1', 'admin-1');

      expect(result.status).toBe(AdPlacementStatus.ENDED);
      expect(result.isActive).toBe(false);
      expect(result.endedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when not found', async () => {
      adRepository.findOne.mockResolvedValue(null);

      await expect(
        service.endPlacement('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getBreakdownStats
  // ─────────────────────────────────────────────────────────────────
  describe('getBreakdownStats', () => {
    it('should return byType, byCandidate, and budgetPacing arrays', async () => {
      const qb = mockQueryBuilder();
      // First call: byType query
      qb.getRawMany
        .mockResolvedValueOnce([
          {
            type: AdPlacementType.FEED_SPONSORED,
            count: '5',
            impressions: '10000',
            clicks: '200',
            totalSpendNis: '500.00',
            activePlacements: '3',
          },
        ])
        // Second call: byCandidate query
        .mockResolvedValueOnce([
          {
            candidateId: 'candidate-1',
            candidateName: 'ישראל ישראלי',
            count: '5',
            impressions: '10000',
            clicks: '200',
            totalSpendNis: '500.00',
          },
        ]);

      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const pacingPlacement = {
        id: 'ad-1',
        title: 'Test Ad',
        status: AdPlacementStatus.APPROVED,
        impressions: 5000,
        cpmNis: 10,
        dailyBudgetNis: 200,
        candidate: { fullName: 'ישראל ישראלי' },
      } as any;

      adRepository.find.mockResolvedValue([pacingPlacement]);

      const result = await service.getBreakdownStats();

      expect(result.byType).toHaveLength(1);
      expect(result.byType[0].type).toBe(AdPlacementType.FEED_SPONSORED);
      expect(result.byType[0].ctr).toBe(2);
      expect(result.byCandidate).toHaveLength(1);
      expect(result.byCandidate[0].candidateName).toBe('ישראל ישראלי');
      expect(result.budgetPacing).toHaveLength(1);
      expect(result.budgetPacing[0].currentSpendNis).toBe(50);
      expect(result.budgetPacing[0].pacingPct).toBe(25);
    });

    it('should handle empty data gracefully', async () => {
      const qb = mockQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);
      adRepository.find.mockResolvedValue([]);

      const result = await service.getBreakdownStats();

      expect(result.byType).toEqual([]);
      expect(result.byCandidate).toEqual([]);
      expect(result.budgetPacing).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // createCompanyAd
  // ─────────────────────────────────────────────────────────────────
  describe('createCompanyAd', () => {
    it('should create and save a company ad with default values', async () => {
      const dto = {
        adType: CompanyAdType.FEED_NATIVE,
        title: 'הפועל בנק - פתחו חשבון עכשיו',
        contentHe: 'פתחו חשבון עסקי בהפועל בנק ותקבלו 3 חודשים ללא עמלות',
        ctaUrl: 'https://hapoalim-demo.co.il/business',
        ctaLabelHe: 'פתחו חשבון',
        dailyBudgetNis: 500,
        cpmNis: 20,
        startDate: '2026-03-11',
        endDate: '2026-06-09',
      };

      const savedAd = {
        id: 'company-ad-1',
        advertiserId: 'advertiser-1',
        ...dto,
        isApproved: false,
        isActive: true,
        status: 'pending',
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      companyAdRepository.create.mockReturnValue(savedAd);
      companyAdRepository.save.mockResolvedValue(savedAd);

      const result = await service.createCompanyAd(dto, 'advertiser-1');

      expect(result.id).toBe('company-ad-1');
      expect(result.isApproved).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.impressions).toBe(0);
      expect(result.clicks).toBe(0);
      expect(companyAdRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          advertiserId: 'advertiser-1',
          isApproved: false,
          isActive: true,
          status: 'pending',
          impressions: 0,
          clicks: 0,
        }),
      );
      expect(companyAdRepository.save).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // approveCompanyAd
  // ─────────────────────────────────────────────────────────────────
  describe('approveCompanyAd', () => {
    it('should set status to approved, isApproved to true, and set approvedAt', async () => {
      const ad = {
        id: 'company-ad-1',
        isApproved: false,
        isActive: false,
        status: 'pending',
        approvedAt: null,
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.approveCompanyAd('company-ad-1', 'admin-1');

      expect(result.status).toBe('approved');
      expect(result.isApproved).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.approvedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when company ad is not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(
        service.approveCompanyAd('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // rejectCompanyAd
  // ─────────────────────────────────────────────────────────────────
  describe('rejectCompanyAd', () => {
    it('should set status to rejected, store reason, and deactivate the ad', async () => {
      const ad = {
        id: 'company-ad-1',
        isApproved: true,
        isActive: true,
        status: 'approved',
        rejectionReason: null,
        rejectedAt: null,
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.rejectCompanyAd(
        'company-ad-1',
        'תוכן לא עומד בהנחיות',
        'admin-1',
      );

      expect(result.status).toBe('rejected');
      expect(result.isApproved).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.rejectionReason).toBe('תוכן לא עומד בהנחיות');
      expect(result.rejectedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when company ad is not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rejectCompanyAd('nonexistent', 'reason', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // pauseCompanyAd
  // ─────────────────────────────────────────────────────────────────
  describe('pauseCompanyAd', () => {
    it('should set status to paused and isActive to false when ad is approved', async () => {
      const ad = {
        id: 'company-ad-1',
        isActive: true,
        status: 'approved',
        pausedAt: null,
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.pauseCompanyAd('company-ad-1', 'admin-1');

      expect(result.status).toBe('paused');
      expect(result.isActive).toBe(false);
      expect(result.pausedAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when ad is not in approved status', async () => {
      const ad = {
        id: 'company-ad-1',
        isActive: false,
        status: 'pending',
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);

      await expect(
        service.pauseCompanyAd('company-ad-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when company ad is not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(
        service.pauseCompanyAd('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // resumeCompanyAd
  // ─────────────────────────────────────────────────────────────────
  describe('resumeCompanyAd', () => {
    it('should set status back to approved and isActive to true when ad is paused', async () => {
      const ad = {
        id: 'company-ad-1',
        isActive: false,
        status: 'paused',
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.resumeCompanyAd('company-ad-1', 'admin-1');

      expect(result.status).toBe('approved');
      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestException when ad is not in paused status', async () => {
      const ad = {
        id: 'company-ad-1',
        isActive: true,
        status: 'approved',
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);

      await expect(
        service.resumeCompanyAd('company-ad-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when company ad is not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resumeCompanyAd('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getActiveCompanyAds
  // ─────────────────────────────────────────────────────────────────
  describe('getActiveCompanyAds', () => {
    it('should return only approved and active ads within date range', async () => {
      const qb = mockQueryBuilder();
      const activeAds = [
        {
          id: 'company-ad-1',
          adType: CompanyAdType.FEED_NATIVE,
          isApproved: true,
          isActive: true,
          status: 'approved',
        },
      ] as CompanyAd[];

      qb.getMany.mockResolvedValue(activeAds);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getActiveCompanyAds(CompanyAdType.FEED_NATIVE);

      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith('ad.adType = :adType', {
        adType: CompanyAdType.FEED_NATIVE,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('ad.isApproved = true');
      expect(qb.andWhere).toHaveBeenCalledWith('ad.isActive = true');
      expect(qb.andWhere).toHaveBeenCalledWith('ad.status = :status', {
        status: 'approved',
      });
    });

    it('should apply date range filters', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getActiveCompanyAds(CompanyAdType.ARTICLE_BANNER);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(ad.startDate IS NULL OR ad.startDate <= :today)',
        expect.objectContaining({ today: expect.any(String) }),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(ad.endDate IS NULL OR ad.endDate >= :today)',
        expect.objectContaining({ today: expect.any(String) }),
      );
    });

    it('should return empty array when no active company ads exist', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getActiveCompanyAds(CompanyAdType.ARTICLE_PRE_ROLL);

      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // createPlacement with linkedContentType and linkedContentId
  // ─────────────────────────────────────────────────────────────────
  describe('createPlacement with linked content', () => {
    it('should save linkedContentType and linkedContentId when provided', async () => {
      const dto = {
        placementType: AdPlacementType.FEED_SPONSORED,
        title: 'מודעה מקושרת למאמר',
        contentHe: 'תוכן מודעה',
        dailyBudgetNis: 150,
        cpmNis: 8,
        startDate: '2026-03-11',
        endDate: '2026-04-11',
        linkedContentType: 'article',
        linkedContentId: 'article-uuid-123',
        ctaUrl: 'https://example.com/read-more',
      };

      const savedPlacement = {
        id: 'ad-linked-1',
        candidateId: 'candidate-1',
        ...dto,
        imageUrl: null,
        targetingRules: null,
        isApproved: false,
        isActive: true,
        impressions: 0,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      adRepository.create.mockReturnValue(savedPlacement);
      adRepository.save.mockResolvedValue(savedPlacement);

      const result = await service.createPlacement(dto, 'candidate-1');

      expect(result.id).toBe('ad-linked-1');
      expect(adRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          linkedContentType: 'article',
          linkedContentId: 'article-uuid-123',
          ctaUrl: 'https://example.com/read-more',
        }),
      );
    });

    it.each([
      ['article', 'article-id-1'],
      ['poll', 'poll-id-1'],
      ['event', 'event-id-1'],
      ['candidate', 'candidate-id-1'],
      ['external', null],
    ])('should accept linkedContentType "%s"', async (contentType, contentId) => {
      const dto = {
        placementType: AdPlacementType.FEED_SPONSORED,
        title: 'מודעה',
        contentHe: 'תוכן',
        dailyBudgetNis: 100,
        cpmNis: 5,
        startDate: '2026-03-11',
        endDate: '2026-04-11',
        linkedContentType: contentType,
        linkedContentId: contentId,
        ctaUrl: contentType === 'external' ? 'https://example.com' : undefined,
      };

      const saved = { id: 'ad-1', candidateId: 'candidate-1', ...dto } as any;
      adRepository.create.mockReturnValue(saved);
      adRepository.save.mockResolvedValue(saved);

      const result = await service.createPlacement(dto as any, 'candidate-1');

      expect(result).toBeDefined();
      expect(adRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ linkedContentType: contentType }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // System A — Full Lifecycle Flows
  // ─────────────────────────────────────────────────────────────────
  describe('System A — candidate ad lifecycle flows', () => {
    const makePlacement = (overrides: Partial<CandidateAdPlacement> = {}): CandidateAdPlacement =>
      ({
        id: 'ad-flow-1',
        candidateId: 'candidate-1',
        placementType: AdPlacementType.FEED_SPONSORED,
        title: 'מודעה לבדיקת זרימה',
        contentHe: 'תוכן',
        dailyBudgetNis: 300,
        cpmNis: 20,
        impressions: 0,
        clicks: 0,
        isApproved: false,
        isActive: true,
        status: AdPlacementStatus.PENDING,
        startDate: '2026-03-01',
        endDate: '2026-04-30',
        rejectionReason: null,
        approvedAt: null,
        rejectedAt: null,
        pausedAt: null,
        endedAt: null,
        linkedContentType: null,
        linkedContentId: null,
        ctaUrl: null,
        ...overrides,
      } as any);

    it('PENDING → APPROVED: should unlock serving after approval', async () => {
      const placement = makePlacement();

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.approvePlacement('ad-flow-1', 'admin-1');

      expect(result.isApproved).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.status).toBe(AdPlacementStatus.APPROVED);
      expect(result.approvedAt).toBeInstanceOf(Date);
    });

    it('PENDING → REJECTED: should deactivate and store reason', async () => {
      const placement = makePlacement();

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.rejectPlacement(
        'ad-flow-1',
        'תוכן לא עומד בהנחיות הבחירות',
        'admin-1',
      );

      expect(result.status).toBe(AdPlacementStatus.REJECTED);
      expect(result.isApproved).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.rejectionReason).toBe('תוכן לא עומד בהנחיות הבחירות');
      expect(result.rejectedAt).toBeInstanceOf(Date);
    });

    it('APPROVED → PAUSED → APPROVED: resume restores active state', async () => {
      const approved = makePlacement({
        isApproved: true,
        isActive: true,
        status: AdPlacementStatus.APPROVED,
      });

      // Pause
      adRepository.findOne.mockResolvedValueOnce(approved);
      adRepository.save.mockImplementationOnce(async (p) => p as CandidateAdPlacement);

      const paused = await service.pausePlacement('ad-flow-1', 'admin-1');
      expect(paused.status).toBe(AdPlacementStatus.PAUSED);
      expect(paused.isActive).toBe(false);
      expect(paused.pausedAt).toBeInstanceOf(Date);

      // Resume
      adRepository.findOne.mockResolvedValueOnce(paused);
      adRepository.save.mockImplementationOnce(async (p) => p as CandidateAdPlacement);

      const resumed = await service.resumePlacement('ad-flow-1', 'admin-1');
      expect(resumed.status).toBe(AdPlacementStatus.APPROVED);
      expect(resumed.isActive).toBe(true);
    });

    it('APPROVED → ENDED: endPlacement permanently closes the ad', async () => {
      const approved = makePlacement({
        isApproved: true,
        isActive: true,
        status: AdPlacementStatus.APPROVED,
      });

      adRepository.findOne.mockResolvedValue(approved);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.endPlacement('ad-flow-1', 'admin-1');

      expect(result.status).toBe(AdPlacementStatus.ENDED);
      expect(result.isActive).toBe(false);
      expect(result.endedAt).toBeInstanceOf(Date);
    });

    it('budget gate: ad exceeding daily spend is excluded from getActivePlacements', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]); // budget exhausted — returns nothing
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getActivePlacements(AdPlacementType.FEED_SPONSORED);

      // Budget check SQL must be applied
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(ad.impressions * ad.cpmNis / 1000) < ad.dailyBudgetNis',
      );
      expect(result).toEqual([]);
    });

    it('impression tracking: each call increments counter by exactly 1', async () => {
      const placement = makePlacement({ impressions: 999, clicks: 50 });

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.recordImpression('ad-flow-1');
      expect(result.impressions).toBe(1000);
      expect(result.clicks).toBe(50); // unchanged
    });

    it('click tracking: each call increments counter by exactly 1', async () => {
      const placement = makePlacement({ impressions: 1000, clicks: 49 });

      adRepository.findOne.mockResolvedValue(placement);
      adRepository.save.mockImplementation(async (p) => p as CandidateAdPlacement);

      const result = await service.recordClick('ad-flow-1');
      expect(result.clicks).toBe(50);
      expect(result.impressions).toBe(1000); // unchanged
    });

    it('state guard: cannot pause a PENDING ad', async () => {
      const pending = makePlacement({ status: AdPlacementStatus.PENDING });
      adRepository.findOne.mockResolvedValue(pending);

      await expect(service.pausePlacement('ad-flow-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('state guard: cannot resume an APPROVED ad', async () => {
      const approved = makePlacement({
        status: AdPlacementStatus.APPROVED,
        isActive: true,
      });
      adRepository.findOne.mockResolvedValue(approved);

      await expect(service.resumePlacement('ad-flow-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('state guard: cannot resume a REJECTED ad', async () => {
      const rejected = makePlacement({
        status: AdPlacementStatus.REJECTED,
        isActive: false,
        isApproved: false,
      });
      adRepository.findOne.mockResolvedValue(rejected);

      await expect(service.resumePlacement('ad-flow-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it.each([
      AdPlacementType.PROFILE_FEATURED,
      AdPlacementType.FEED_SPONSORED,
      AdPlacementType.PUSH_NOTIFICATION,
      AdPlacementType.QUIZ_END,
    ])('getActivePlacements filters by type "%s"', async (placementType) => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      adRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getActivePlacements(placementType);

      expect(qb.where).toHaveBeenCalledWith('ad.placementType = :type', { type: placementType });
    });

    it('content-linked ad: all three link fields persist through create + approve', async () => {
      const dto = {
        placementType: AdPlacementType.FEED_SPONSORED,
        title: 'מודעה עם קישור',
        contentHe: 'תוכן',
        dailyBudgetNis: 200,
        cpmNis: 15,
        startDate: '2026-03-11',
        endDate: '2026-04-11',
        linkedContentType: 'poll',
        linkedContentId: 'poll-uuid-456',
        ctaUrl: null,
      };

      const createdPlacement = {
        id: 'ad-linked-2',
        candidateId: 'candidate-1',
        ...dto,
        isApproved: false,
        isActive: true,
        status: AdPlacementStatus.PENDING,
        impressions: 0,
        clicks: 0,
      } as any;

      adRepository.create.mockReturnValue(createdPlacement);
      adRepository.save.mockResolvedValueOnce(createdPlacement);

      const created = await service.createPlacement(dto as any, 'candidate-1');
      expect(created.linkedContentType).toBe('poll');
      expect(created.linkedContentId).toBe('poll-uuid-456');

      // Approve
      adRepository.findOne.mockResolvedValueOnce(created);
      adRepository.save.mockImplementationOnce(async (p) => p as CandidateAdPlacement);

      const approved = await service.approvePlacement('ad-linked-2', 'admin-1');
      expect(approved.isApproved).toBe(true);
      // Content link fields remain unchanged after approval
      expect(approved.linkedContentType).toBe('poll');
      expect(approved.linkedContentId).toBe('poll-uuid-456');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // createCompanyAdvertiser + getAllCompanyAdvertisers
  // ─────────────────────────────────────────────────────────────────
  describe('createCompanyAdvertiser', () => {
    it('should create advertiser with isActive defaulting to true', async () => {
      const dto = {
        name: 'הפועל בנק ישראל דמו',
        logoUrl: 'https://cdn.example.com/hapoalim.png',
        website: 'https://hapoalim-demo.co.il',
        contactEmail: 'ads@hapoalim-demo.co.il',
      };

      const saved = { id: 'adv-1', ...dto, isActive: true, createdAt: new Date() } as any;
      companyAdvertiserRepository.create.mockReturnValue(saved);
      companyAdvertiserRepository.save.mockResolvedValue(saved);

      const result = await service.createCompanyAdvertiser(dto as any);

      expect(result.id).toBe('adv-1');
      expect(result.isActive).toBe(true);
      expect(companyAdvertiserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'הפועל בנק ישראל דמו', isActive: true }),
      );
    });

    it('should respect explicit isActive: false', async () => {
      const dto = { name: 'מפרסם מושהה', isActive: false };
      const saved = { id: 'adv-2', ...dto, createdAt: new Date() } as any;

      companyAdvertiserRepository.create.mockReturnValue(saved);
      companyAdvertiserRepository.save.mockResolvedValue(saved);

      const result = await service.createCompanyAdvertiser(dto as any);
      expect(result.isActive).toBe(false);
    });
  });

  describe('getAllCompanyAdvertisers', () => {
    it('should return all advertisers ordered by createdAt DESC', async () => {
      const advertisers = [
        { id: 'adv-2', name: 'כאל דמו', createdAt: new Date('2026-03-10') },
        { id: 'adv-1', name: 'הפועל דמו', createdAt: new Date('2026-03-01') },
      ] as any[];

      companyAdvertiserRepository.find.mockResolvedValue(advertisers);

      const result = await service.getAllCompanyAdvertisers();

      expect(result).toHaveLength(2);
      expect(companyAdvertiserRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no advertisers exist', async () => {
      companyAdvertiserRepository.find.mockResolvedValue([]);

      const result = await service.getAllCompanyAdvertisers();
      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // updateCompanyAd
  // ─────────────────────────────────────────────────────────────────
  describe('updateCompanyAd', () => {
    it('should update allowed fields', async () => {
      const ad = {
        id: 'company-ad-1',
        title: 'כותרת ישנה',
        dailyBudgetNis: 300,
        contentHe: 'תוכן ישן',
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.updateCompanyAd('company-ad-1', {
        title: 'כותרת חדשה',
        dailyBudgetNis: 500,
      } as any);

      expect(result.title).toBe('כותרת חדשה');
      expect(result.dailyBudgetNis).toBe(500);
      expect(result.contentHe).toBe('תוכן ישן'); // unchanged
    });

    it('should throw NotFoundException when ad not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCompanyAd('nonexistent', { title: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // endCompanyAd
  // ─────────────────────────────────────────────────────────────────
  describe('endCompanyAd', () => {
    it('should set status to ended and isActive to false', async () => {
      const ad = {
        id: 'company-ad-1',
        isActive: true,
        status: 'approved',
        endedAt: null,
      } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.endCompanyAd('company-ad-1', 'admin-1');

      expect(result.status).toBe('ended');
      expect(result.isActive).toBe(false);
      expect(result.endedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(
        service.endCompanyAd('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // recordCompanyAdImpression + recordCompanyAdClick
  // ─────────────────────────────────────────────────────────────────
  describe('recordCompanyAdImpression', () => {
    it('should increment impressions by 1', async () => {
      const ad = { id: 'company-ad-1', impressions: 42, clicks: 5 } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.recordCompanyAdImpression('company-ad-1');

      expect(result.impressions).toBe(43);
      expect(result.clicks).toBe(5); // unchanged
    });

    it('should throw NotFoundException when not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(service.recordCompanyAdImpression('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordCompanyAdClick', () => {
    it('should increment clicks by 1', async () => {
      const ad = { id: 'company-ad-1', impressions: 43, clicks: 5 } as any;

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.recordCompanyAdClick('company-ad-1');

      expect(result.clicks).toBe(6);
      expect(result.impressions).toBe(43); // unchanged
    });

    it('should throw NotFoundException when not found', async () => {
      companyAdRepository.findOne.mockResolvedValue(null);

      await expect(service.recordCompanyAdClick('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getAllCompanyAds — filter combinations
  // ─────────────────────────────────────────────────────────────────
  describe('getAllCompanyAds', () => {
    it('should return all ads with advertiser join ordered by createdAt DESC', async () => {
      const qb = mockQueryBuilder();
      const ads = [
        { id: 'ca-2', adType: CompanyAdType.FEED_NATIVE, createdAt: new Date('2026-03-10') },
        { id: 'ca-1', adType: CompanyAdType.ARTICLE_BANNER, createdAt: new Date('2026-03-01') },
      ] as CompanyAd[];

      qb.getMany.mockResolvedValue(ads);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getAllCompanyAds();

      expect(result).toHaveLength(2);
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('ad.advertiser', 'advertiser');
      expect(qb.orderBy).toHaveBeenCalledWith('ad.createdAt', 'DESC');
    });

    it('should filter by adType when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllCompanyAds({ adType: CompanyAdType.ARTICLE_BANNER });

      expect(qb.andWhere).toHaveBeenCalledWith('ad.adType = :adType', {
        adType: CompanyAdType.ARTICLE_BANNER,
      });
    });

    it('should filter by advertiserId when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllCompanyAds({ advertiserId: 'adv-1' });

      expect(qb.andWhere).toHaveBeenCalledWith('ad.advertiserId = :advertiserId', {
        advertiserId: 'adv-1',
      });
    });

    it('should filter by isApproved: false for pending moderation queue', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllCompanyAds({ isApproved: false });

      expect(qb.andWhere).toHaveBeenCalledWith('ad.isApproved = :isApproved', {
        isApproved: false,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // System B — Full Lifecycle Flows
  // ─────────────────────────────────────────────────────────────────
  describe('System B — company ad lifecycle flows', () => {
    const makeCompanyAd = (overrides: Partial<CompanyAd> = {}): CompanyAd =>
      ({
        id: 'ca-flow-1',
        advertiserId: 'adv-1',
        adType: CompanyAdType.FEED_NATIVE,
        title: 'פרסומת בנק לבדיקת זרימה',
        contentHe: 'פתחו חשבון ותקבלו בונוס',
        ctaUrl: 'https://bank-demo.co.il',
        ctaLabelHe: 'למידע נוסף',
        dailyBudgetNis: 500,
        cpmNis: 20,
        impressions: 0,
        clicks: 0,
        isApproved: false,
        isActive: true,
        status: 'pending',
        approvedAt: null,
        rejectedAt: null,
        pausedAt: null,
        endedAt: null,
        rejectionReason: null,
        ...overrides,
      } as any);

    it('PENDING → APPROVED: ad becomes available for serving', async () => {
      const ad = makeCompanyAd();

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.approveCompanyAd('ca-flow-1', 'admin-1');

      expect(result.status).toBe('approved');
      expect(result.isApproved).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.approvedAt).toBeInstanceOf(Date);
    });

    it('PENDING → REJECTED: ad is deactivated with reason stored', async () => {
      const ad = makeCompanyAd();

      companyAdRepository.findOne.mockResolvedValue(ad);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.rejectCompanyAd(
        'ca-flow-1',
        'מודעה אינה עומדת בדרישות חוק הפרסום',
        'admin-1',
      );

      expect(result.status).toBe('rejected');
      expect(result.isApproved).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.rejectionReason).toBe('מודעה אינה עומדת בדרישות חוק הפרסום');
      expect(result.rejectedAt).toBeInstanceOf(Date);
    });

    it('APPROVED → PAUSED → APPROVED: ad can be suspended and re-activated', async () => {
      const approved = makeCompanyAd({ isApproved: true, isActive: true, status: 'approved' });

      // Pause
      companyAdRepository.findOne.mockResolvedValueOnce(approved);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const paused = await service.pauseCompanyAd('ca-flow-1', 'admin-1');
      expect(paused.status).toBe('paused');
      expect(paused.isActive).toBe(false);
      expect(paused.pausedAt).toBeInstanceOf(Date);

      // Resume
      companyAdRepository.findOne.mockResolvedValueOnce(paused);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const resumed = await service.resumeCompanyAd('ca-flow-1', 'admin-1');
      expect(resumed.status).toBe('approved');
      expect(resumed.isActive).toBe(true);
    });

    it('APPROVED → ENDED: endCompanyAd permanently closes the ad', async () => {
      const approved = makeCompanyAd({ isApproved: true, isActive: true, status: 'approved' });

      companyAdRepository.findOne.mockResolvedValue(approved);
      companyAdRepository.save.mockImplementation(async (a) => a as CompanyAd);

      const result = await service.endCompanyAd('ca-flow-1', 'admin-1');

      expect(result.status).toBe('ended');
      expect(result.isActive).toBe(false);
      expect(result.endedAt).toBeInstanceOf(Date);
    });

    it('budget gate: ad with exhausted daily budget not returned by getActiveCompanyAds', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getActiveCompanyAds(CompanyAdType.FEED_NATIVE);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(ad.impressions * ad.cpmNis / 1000) < ad.dailyBudgetNis OR ad.dailyBudgetNis = 0',
      );
      expect(result).toEqual([]);
    });

    it('impression + click tracking: independent counters', async () => {
      const ad = makeCompanyAd({ impressions: 100, clicks: 10 });

      // Record impression
      companyAdRepository.findOne.mockResolvedValueOnce(ad);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const afterImpression = await service.recordCompanyAdImpression('ca-flow-1');
      expect(afterImpression.impressions).toBe(101);
      expect(afterImpression.clicks).toBe(10);

      // Record click
      companyAdRepository.findOne.mockResolvedValueOnce(afterImpression);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const afterClick = await service.recordCompanyAdClick('ca-flow-1');
      expect(afterClick.clicks).toBe(11);
      expect(afterClick.impressions).toBe(101);
    });

    it('state guard: cannot pause a PENDING company ad', async () => {
      const pending = makeCompanyAd({ status: 'pending' });
      companyAdRepository.findOne.mockResolvedValue(pending);

      await expect(service.pauseCompanyAd('ca-flow-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('state guard: cannot resume an APPROVED company ad', async () => {
      const approved = makeCompanyAd({ status: 'approved', isActive: true });
      companyAdRepository.findOne.mockResolvedValue(approved);

      await expect(service.resumeCompanyAd('ca-flow-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it.each([
      CompanyAdType.FEED_NATIVE,
      CompanyAdType.ARTICLE_BANNER,
      CompanyAdType.ARTICLE_PRE_ROLL,
    ])('getActiveCompanyAds filters by adType "%s"', async (adType) => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      companyAdRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.getActiveCompanyAds(adType);

      expect(qb.where).toHaveBeenCalledWith('ad.adType = :adType', { adType });
    });

    it('full create → approve → impression → click → end flow', async () => {
      // 1. Create
      const dto = {
        adType: CompanyAdType.FEED_NATIVE,
        title: 'ביטוח דמו',
        contentHe: 'ביטוח רכב בזול',
        ctaUrl: 'https://demo.co.il',
        ctaLabelHe: 'לפרטים',
        dailyBudgetNis: 300,
        cpmNis: 15,
        startDate: '2026-03-11',
        endDate: '2026-06-11',
      };

      const newAd = makeCompanyAd({ ...dto } as any);
      companyAdRepository.create.mockReturnValue(newAd);
      companyAdRepository.save.mockResolvedValueOnce(newAd);

      const created = await service.createCompanyAd(dto as any, 'adv-1');
      expect(created.status).toBe('pending');

      // 2. Approve
      companyAdRepository.findOne.mockResolvedValueOnce(created);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const approved = await service.approveCompanyAd(created.id, 'admin-1');
      expect(approved.isApproved).toBe(true);

      // 3. Record impression
      companyAdRepository.findOne.mockResolvedValueOnce({ ...approved, impressions: 0 } as any);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const afterImpression = await service.recordCompanyAdImpression(approved.id);
      expect(afterImpression.impressions).toBe(1);

      // 4. Record click
      companyAdRepository.findOne.mockResolvedValueOnce({ ...afterImpression, clicks: 0 } as any);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const afterClick = await service.recordCompanyAdClick(approved.id);
      expect(afterClick.clicks).toBe(1);

      // 5. End
      companyAdRepository.findOne.mockResolvedValueOnce({ ...afterClick, status: 'approved', isActive: true } as any);
      companyAdRepository.save.mockImplementationOnce(async (a) => a as CompanyAd);

      const ended = await service.endCompanyAd(approved.id, 'admin-1');
      expect(ended.status).toBe('ended');
      expect(ended.isActive).toBe(false);
      expect(ended.endedAt).toBeInstanceOf(Date);
    });
  });
});
