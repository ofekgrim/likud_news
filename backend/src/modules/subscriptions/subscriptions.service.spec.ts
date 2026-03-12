import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  MemberSubscription,
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionProvider,
} from './entities/member-subscription.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

const mockConfigService = {
  get: jest.fn().mockReturnValue('rc_webhook_secret_dev'),
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepository: jest.Mocked<Repository<MemberSubscription>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(MemberSubscription),
          useFactory: mockRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepository = module.get(
      getRepositoryToken(MemberSubscription),
    );

    // Reset mocks
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('rc_webhook_secret_dev');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────
  // getSubscription
  // ─────────────────────────────────────────────────────────────────
  describe('getSubscription', () => {
    it('should return active subscription for user', async () => {
      const subscription = {
        id: 'sub-1',
        appUserId: 'user-1',
        status: SubscriptionStatus.ACTIVE,
        tier: SubscriptionTier.VIP_MONTHLY,
      } as MemberSubscription;

      subscriptionRepository.findOne.mockResolvedValue(subscription);

      const result = await service.getSubscription('user-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('sub-1');
      expect(result!.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should return null for non-subscriber', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.getSubscription('user-no-sub');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // isVip
  // ─────────────────────────────────────────────────────────────────
  describe('isVip', () => {
    it('should return true for active subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.ACTIVE,
      } as MemberSubscription);

      const result = await service.isVip('user-1');

      expect(result).toBe(true);
    });

    it('should return true for grace_period subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.GRACE_PERIOD,
      } as MemberSubscription);

      const result = await service.isVip('user-1');

      expect(result).toBe(true);
    });

    it('should return false for expired subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.isVip('user-expired');

      expect(result).toBe(false);
    });

    it('should return false for cancelled subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.isVip('user-cancelled');

      expect(result).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // handleRevenueCatWebhook
  // ─────────────────────────────────────────────────────────────────
  describe('handleRevenueCatWebhook', () => {
    it('should process INITIAL_PURCHASE event', async () => {
      const savedSub = {
        id: 'sub-new',
        appUserId: 'user-1',
        tier: SubscriptionTier.VIP_MONTHLY,
        status: SubscriptionStatus.ACTIVE,
      } as MemberSubscription;

      subscriptionRepository.create.mockReturnValue(savedSub);
      subscriptionRepository.save.mockResolvedValue(savedSub);

      await service.handleRevenueCatWebhook({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-1',
          product_id: 'com.likud.vip.monthly',
          expiration_at_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
        },
      });

      expect(subscriptionRepository.create).toHaveBeenCalled();
      expect(subscriptionRepository.save).toHaveBeenCalled();
    });

    it('should process RENEWAL event', async () => {
      const existingSub = {
        id: 'sub-1',
        appUserId: 'user-1',
        externalSubscriptionId: 'ext-1',
        status: SubscriptionStatus.ACTIVE,
      } as MemberSubscription;

      // First call: getSubscription (findOne)
      // Second call: updateSubscriptionStatus (findOne)
      subscriptionRepository.findOne
        .mockResolvedValueOnce(existingSub)
        .mockResolvedValueOnce(existingSub);
      subscriptionRepository.save.mockImplementation(
        async (d) => d as MemberSubscription,
      );

      await service.handleRevenueCatWebhook({
        event: {
          type: 'RENEWAL',
          app_user_id: 'user-1',
          expiration_at_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
        },
      });

      expect(subscriptionRepository.save).toHaveBeenCalled();
    });

    it('should process CANCELLATION event', async () => {
      const existingSub = {
        id: 'sub-1',
        appUserId: 'user-1',
        externalSubscriptionId: 'ext-1',
        status: SubscriptionStatus.ACTIVE,
      } as MemberSubscription;

      subscriptionRepository.findOne
        .mockResolvedValueOnce(existingSub)
        .mockResolvedValueOnce(existingSub);
      subscriptionRepository.save.mockImplementation(
        async (d) => d as MemberSubscription,
      );

      await service.handleRevenueCatWebhook({
        event: {
          type: 'CANCELLATION',
          app_user_id: 'user-1',
        },
      });

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.CANCELLED,
        }),
      );
    });

    it('should process EXPIRATION event', async () => {
      const existingSub = {
        id: 'sub-1',
        appUserId: 'user-1',
        externalSubscriptionId: 'ext-1',
        status: SubscriptionStatus.ACTIVE,
      } as MemberSubscription;

      subscriptionRepository.findOne
        .mockResolvedValueOnce(existingSub)
        .mockResolvedValueOnce(existingSub);
      subscriptionRepository.save.mockImplementation(
        async (d) => d as MemberSubscription,
      );

      await service.handleRevenueCatWebhook({
        event: {
          type: 'EXPIRATION',
          app_user_id: 'user-1',
        },
      });

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.EXPIRED,
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // cancelSubscription
  // ─────────────────────────────────────────────────────────────────
  describe('cancelSubscription', () => {
    it('should update status to cancelled', async () => {
      const activeSub = {
        id: 'sub-1',
        appUserId: 'user-1',
        status: SubscriptionStatus.ACTIVE,
        cancelledAt: null,
      } as MemberSubscription;

      subscriptionRepository.findOne.mockResolvedValue(activeSub);
      subscriptionRepository.save.mockImplementation(
        async (d) => d as MemberSubscription,
      );

      const result = await service.cancelSubscription('user-1');

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
    });

    it('should throw when no active subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelSubscription('user-no-sub'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getSubscriptionStats
  // ─────────────────────────────────────────────────────────────────
  describe('getSubscriptionStats', () => {
    it('should return correct counts', async () => {
      subscriptionRepository.count
        .mockResolvedValueOnce(100) // totalActive
        .mockResolvedValueOnce(20) // totalCancelled
        .mockResolvedValueOnce(10) // totalExpired
        .mockResolvedValueOnce(60) // monthlyCount
        .mockResolvedValueOnce(40); // annualCount

      const result = await service.getSubscriptionStats();

      expect(result).toEqual({
        totalActive: 100,
        totalCancelled: 20,
        totalExpired: 10,
        monthlyCount: 60,
        annualCount: 40,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getVipBenefits
  // ─────────────────────────────────────────────────────────────────
  describe('getVipBenefits', () => {
    it('should return list of benefits', () => {
      const benefits = service.getVipBenefits();

      expect(benefits).toHaveLength(5);
      expect(benefits[0].id).toBe('ad_free');
      expect(benefits[4].id).toBe('priority_support');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // validateWebhookAuth
  // ─────────────────────────────────────────────────────────────────
  describe('validateWebhookAuth', () => {
    it('should pass with valid auth header', () => {
      expect(() =>
        service.validateWebhookAuth('Bearer rc_webhook_secret_dev'),
      ).not.toThrow();
    });

    it('should throw with invalid auth header', () => {
      expect(() =>
        service.validateWebhookAuth('Bearer wrong_secret'),
      ).toThrow(UnauthorizedException);
    });

    it('should throw with missing auth header', () => {
      expect(() => service.validateWebhookAuth(undefined)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
