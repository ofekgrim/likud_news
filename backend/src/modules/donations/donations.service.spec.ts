import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DonationsService } from './donations.service';
import {
  Donation,
  DonationRecipientType,
  DonationStatus,
} from './entities/donation.entity';
import { GamificationService } from '../gamification/gamification.service';
import { PointAction } from '../gamification/entities/user-points.entity';

const mockGamificationService = {
  awardPoints: jest.fn().mockResolvedValue({}),
};

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
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getMany: jest.fn(),
});

describe('DonationsService', () => {
  let service: DonationsService;
  let donationRepository: jest.Mocked<Repository<Donation>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        { provide: getRepositoryToken(Donation), useFactory: mockRepository },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
    donationRepository = module.get(getRepositoryToken(Donation));

    // Reset mocks
    mockGamificationService.awardPoints.mockReset();
    mockGamificationService.awardPoints.mockResolvedValue({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Helper: stub sumCompletedDonations via queryBuilder ──────
  function stubSumCompletedDonations(total: number): void {
    const qb = mockQueryBuilder();
    qb.getRawOne.mockResolvedValue({ total: String(total) });
    donationRepository.createQueryBuilder.mockReturnValue(qb as any);
  }

  // ─────────────────────────────────────────────────────────────────
  // checkEligibility
  // ─────────────────────────────────────────────────────────────────
  describe('checkEligibility', () => {
    it('should return eligible for a new donor to a candidate', async () => {
      stubSumCompletedDonations(0);

      const result = await service.checkEligibility(
        'user-1',
        DonationRecipientType.CANDIDATE,
        'candidate-1',
      );

      expect(result.eligible).toBe(true);
      expect(result.remainingCandidateCap).toBe(11377);
      expect(result.remainingPartyCap).toBe(0);
      expect(result.reason).toBeUndefined();
    });

    it('should return ineligible when candidate cap exceeded (11377 NIS)', async () => {
      stubSumCompletedDonations(11377);

      const result = await service.checkEligibility(
        'user-1',
        DonationRecipientType.CANDIDATE,
        'candidate-1',
      );

      expect(result.eligible).toBe(false);
      expect(result.remainingCandidateCap).toBe(0);
      expect(result.reason).toContain('cap');
    });

    it('should return ineligible when party cap exceeded (2000 NIS)', async () => {
      stubSumCompletedDonations(2000);

      const result = await service.checkEligibility(
        'user-1',
        DonationRecipientType.PARTY,
      );

      expect(result.eligible).toBe(false);
      expect(result.remainingPartyCap).toBe(0);
      expect(result.reason).toContain('cap');
    });

    it('should calculate remaining amount correctly', async () => {
      stubSumCompletedDonations(5000);

      const result = await service.checkEligibility(
        'user-1',
        DonationRecipientType.CANDIDATE,
        'candidate-1',
      );

      expect(result.eligible).toBe(true);
      expect(result.remainingCandidateCap).toBe(6377); // 11377 - 5000
    });

    it('should calculate remaining party cap correctly', async () => {
      stubSumCompletedDonations(1500);

      const result = await service.checkEligibility(
        'user-1',
        DonationRecipientType.PARTY,
      );

      expect(result.eligible).toBe(true);
      expect(result.remainingPartyCap).toBe(500); // 2000 - 1500
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // createDonation
  // ─────────────────────────────────────────────────────────────────
  describe('createDonation', () => {
    it('should create a donation with pending status', async () => {
      stubSumCompletedDonations(0);

      const dto = {
        recipientType: DonationRecipientType.CANDIDATE,
        recipientCandidateId: 'candidate-1',
        amountNis: 1000,
        teutatZehutHash: 'a'.repeat(64),
      };

      const savedDonation = {
        id: 'donation-1',
        donorAppUserId: 'user-1',
        ...dto,
        status: DonationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      donationRepository.create.mockReturnValue(savedDonation);
      donationRepository.save.mockResolvedValue(savedDonation);

      const result = await service.createDonation(dto, 'user-1');

      expect(result.status).toBe(DonationStatus.PENDING);
      expect(donationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          donorAppUserId: 'user-1',
          amountNis: 1000,
          status: DonationStatus.PENDING,
        }),
      );
    });

    it('should reject when donation exceeds candidate cap', async () => {
      stubSumCompletedDonations(11000);

      const dto = {
        recipientType: DonationRecipientType.CANDIDATE,
        recipientCandidateId: 'candidate-1',
        amountNis: 500,
        teutatZehutHash: 'a'.repeat(64),
      };

      await expect(service.createDonation(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject negative amount', async () => {
      const dto = {
        recipientType: DonationRecipientType.CANDIDATE,
        recipientCandidateId: 'candidate-1',
        amountNis: -100,
        teutatZehutHash: 'a'.repeat(64),
      };

      await expect(service.createDonation(dto, 'user-1')).rejects.toThrow(
        'Donation amount must be positive',
      );
    });

    it('should reject zero amount', async () => {
      const dto = {
        recipientType: DonationRecipientType.CANDIDATE,
        recipientCandidateId: 'candidate-1',
        amountNis: 0,
        teutatZehutHash: 'a'.repeat(64),
      };

      await expect(service.createDonation(dto, 'user-1')).rejects.toThrow(
        'Donation amount must be positive',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // confirmDonation
  // ─────────────────────────────────────────────────────────────────
  describe('confirmDonation', () => {
    it('should update donation to completed status', async () => {
      const pendingDonation = {
        id: 'donation-1',
        donorAppUserId: 'user-1',
        status: DonationStatus.PENDING,
        recipientType: DonationRecipientType.CANDIDATE,
        amountNis: 500,
      } as Donation;

      donationRepository.findOne.mockResolvedValue(pendingDonation);
      donationRepository.save.mockImplementation(async (d) => d as Donation);

      const result = await service.confirmDonation({
        donationId: 'donation-1',
        paymentIntentId: 'pi_test_123',
      });

      expect(result.status).toBe(DonationStatus.COMPLETED);
      expect(result.paymentIntentId).toBe('pi_test_123');
      expect(result.receiptUrl).toBeDefined();
    });

    it('should award gamification points on confirmation', async () => {
      const pendingDonation = {
        id: 'donation-1',
        donorAppUserId: 'user-1',
        status: DonationStatus.PENDING,
        recipientType: DonationRecipientType.CANDIDATE,
        amountNis: 500,
      } as Donation;

      donationRepository.findOne.mockResolvedValue(pendingDonation);
      donationRepository.save.mockImplementation(async (d) => d as Donation);

      await service.confirmDonation({
        donationId: 'donation-1',
        paymentIntentId: 'pi_test_123',
      });

      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          points: 25,
          metadata: expect.objectContaining({ source: 'donation' }),
        }),
      );
    });

    it('should throw error on non-pending donation', async () => {
      const completedDonation = {
        id: 'donation-1',
        status: DonationStatus.COMPLETED,
      } as Donation;

      donationRepository.findOne.mockResolvedValue(completedDonation);

      await expect(
        service.confirmDonation({
          donationId: 'donation-1',
          paymentIntentId: 'pi_test_123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when donation not found', async () => {
      donationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmDonation({
          donationId: 'nonexistent',
          paymentIntentId: 'pi_test_123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getDonationHistory
  // ─────────────────────────────────────────────────────────────────
  describe('getDonationHistory', () => {
    it("should return user's donations ordered by date descending", async () => {
      const donations = [
        {
          id: 'donation-2',
          createdAt: new Date('2026-03-10'),
          amountNis: 500,
        },
        {
          id: 'donation-1',
          createdAt: new Date('2026-03-01'),
          amountNis: 300,
        },
      ] as Donation[];

      donationRepository.find.mockResolvedValue(donations);

      const result = await service.getDonationHistory('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('donation-2');
      expect(donationRepository.find).toHaveBeenCalledWith({
        where: { donorAppUserId: 'user-1' },
        relations: ['recipientCandidate'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // refundDonation
  // ─────────────────────────────────────────────────────────────────
  describe('refundDonation', () => {
    it('should update donation to refunded status', async () => {
      const completedDonation = {
        id: 'donation-1',
        status: DonationStatus.COMPLETED,
        metadata: null,
      } as Donation;

      donationRepository.findOne.mockResolvedValue(completedDonation);
      donationRepository.save.mockImplementation(async (d) => d as Donation);

      const result = await service.refundDonation('donation-1', 'admin-1');

      expect(result.status).toBe(DonationStatus.REFUNDED);
      expect(result.metadata).toEqual(
        expect.objectContaining({
          refundedBy: 'admin-1',
        }),
      );
    });

    it('should throw error on non-completed donation', async () => {
      const pendingDonation = {
        id: 'donation-1',
        status: DonationStatus.PENDING,
      } as Donation;

      donationRepository.findOne.mockResolvedValue(pendingDonation);

      await expect(
        service.refundDonation('donation-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when donation not found', async () => {
      donationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refundDonation('nonexistent', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getComptrollerExport
  // ─────────────────────────────────────────────────────────────────
  describe('getComptrollerExport', () => {
    it('should return correct CSV data for a given month', async () => {
      const donations = [
        {
          id: 'donation-1',
          createdAt: new Date('2026-03-05T10:00:00Z'),
          amountNis: 1000,
          teutatZehutHash: 'hash1',
          recipientType: DonationRecipientType.CANDIDATE,
          recipientCandidate: { fullName: 'Yossi Cohen' },
        },
        {
          id: 'donation-2',
          createdAt: new Date('2026-03-15T14:00:00Z'),
          amountNis: 500,
          teutatZehutHash: 'hash2',
          recipientType: DonationRecipientType.PARTY,
          recipientCandidate: null,
        },
      ] as any[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(donations);
      donationRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getComptrollerExport('2026-03');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2026-03-05',
        amount: 1000,
        teutatZehutHash: 'hash1',
        recipientType: 'candidate',
        recipientName: 'Yossi Cohen',
      });
      expect(result[1]).toEqual({
        date: '2026-03-15',
        amount: 500,
        teutatZehutHash: 'hash2',
        recipientType: 'party',
        recipientName: 'Likud Party',
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getDonationStats
  // ─────────────────────────────────────────────────────────────────
  describe('getDonationStats', () => {
    it('should return aggregated statistics', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalAmount: '5000',
        donorCount: '10',
        avgAmount: '500.00',
      });
      donationRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getDonationStats();

      expect(result).toEqual({
        totalAmount: 5000,
        donorCount: 10,
        avgAmount: 500,
      });
    });

    it('should filter by recipientType when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalAmount: '3000',
        donorCount: '5',
        avgAmount: '600.00',
      });
      donationRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getDonationStats(
        DonationRecipientType.CANDIDATE,
      );

      expect(result.totalAmount).toBe(3000);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'd.recipientType = :recipientType',
        { recipientType: DonationRecipientType.CANDIDATE },
      );
    });

    it('should filter by recipientCandidateId when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalAmount: '1000',
        donorCount: '2',
        avgAmount: '500.00',
      });
      donationRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getDonationStats(
        DonationRecipientType.CANDIDATE,
        'candidate-1',
      );

      expect(result.totalAmount).toBe(1000);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'd.recipientCandidateId = :recipientCandidateId',
        { recipientCandidateId: 'candidate-1' },
      );
    });

    it('should return zeros when no donations exist', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalAmount: '0',
        donorCount: '0',
        avgAmount: '0',
      });
      donationRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getDonationStats();

      expect(result).toEqual({
        totalAmount: 0,
        donorCount: 0,
        avgAmount: 0,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Donation caps are per recipient
  // ─────────────────────────────────────────────────────────────────
  describe('per-recipient cap isolation', () => {
    it('should allow max donation to multiple candidates independently', async () => {
      // For candidate A, user has donated 0
      const qbA = mockQueryBuilder();
      qbA.getRawOne.mockResolvedValue({ total: '0' });

      // For candidate B, user has donated 11377
      const qbB = mockQueryBuilder();
      qbB.getRawOne.mockResolvedValue({ total: '11377' });

      // First call: check eligibility for candidate A (should be eligible)
      donationRepository.createQueryBuilder.mockReturnValue(qbA as any);
      const resultA = await service.checkEligibility(
        'user-1',
        DonationRecipientType.CANDIDATE,
        'candidate-A',
      );
      expect(resultA.eligible).toBe(true);
      expect(resultA.remainingCandidateCap).toBe(11377);

      // Second call: check eligibility for candidate B (should NOT be eligible)
      donationRepository.createQueryBuilder.mockReturnValue(qbB as any);
      const resultB = await service.checkEligibility(
        'user-1',
        DonationRecipientType.CANDIDATE,
        'candidate-B',
      );
      expect(resultB.eligible).toBe(false);
      expect(resultB.remainingCandidateCap).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getDonation
  // ─────────────────────────────────────────────────────────────────
  describe('getDonation', () => {
    it('should return donation with relations', async () => {
      const donation = {
        id: 'donation-1',
        donorAppUser: { id: 'user-1', displayName: 'Test' },
        recipientCandidate: { id: 'candidate-1', fullName: 'Yossi' },
      } as any;

      donationRepository.findOne.mockResolvedValue(donation);

      const result = await service.getDonation('donation-1');

      expect(result.id).toBe('donation-1');
      expect(donationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'donation-1' },
        relations: ['donorAppUser', 'recipientCandidate'],
      });
    });

    it('should throw NotFoundException when donation not found', async () => {
      donationRepository.findOne.mockResolvedValue(null);

      await expect(service.getDonation('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
