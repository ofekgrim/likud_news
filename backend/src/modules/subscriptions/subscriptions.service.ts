import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  MemberSubscription,
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionProvider,
} from './entities/member-subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

/** Static list of VIP benefits */
const VIP_BENEFITS = [
  {
    id: 'ad_free',
    titleKey: 'premium.benefit_ad_free',
    descriptionKey: 'premium.benefit_ad_free',
    icon: 'block',
  },
  {
    id: 'early_news',
    titleKey: 'premium.benefit_early_news',
    descriptionKey: 'premium.benefit_early_news',
    icon: 'flash_on',
  },
  {
    id: 'unlimited_history',
    titleKey: 'premium.benefit_unlimited',
    descriptionKey: 'premium.benefit_unlimited',
    icon: 'history',
  },
  {
    id: 'premium_badge',
    titleKey: 'premium.benefit_badge',
    descriptionKey: 'premium.benefit_badge',
    icon: 'verified',
  },
  {
    id: 'priority_support',
    titleKey: 'premium.benefit_support',
    descriptionKey: 'premium.benefit_support',
    icon: 'support_agent',
  },
];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(MemberSubscription)
    private readonly subscriptionRepository: Repository<MemberSubscription>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get the current active subscription for an app user, or null if none.
   */
  async getSubscription(appUserId: string): Promise<MemberSubscription | null> {
    return this.subscriptionRepository.findOne({
      where: [
        { appUserId, status: SubscriptionStatus.ACTIVE },
        { appUserId, status: SubscriptionStatus.TRIAL },
        { appUserId, status: SubscriptionStatus.GRACE_PERIOD },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create a new subscription (typically from RevenueCat webhook).
   */
  async createSubscription(
    appUserId: string,
    dto: CreateSubscriptionDto,
  ): Promise<MemberSubscription> {
    const subscription = this.subscriptionRepository.create({
      appUserId,
      tier: dto.tier,
      provider: dto.provider,
      externalSubscriptionId: dto.externalSubscriptionId,
      status: dto.status || SubscriptionStatus.ACTIVE,
      startedAt: new Date(dto.startedAt),
      expiresAt: new Date(dto.expiresAt),
      metadata: dto.metadata || null,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    this.logger.log(
      `Subscription created for user ${appUserId}: ${saved.id} (${dto.tier})`,
    );

    return saved;
  }

  /**
   * Update subscription status by external ID.
   */
  async updateSubscriptionStatus(
    externalId: string,
    status: SubscriptionStatus,
    expiresAt?: Date,
  ): Promise<MemberSubscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { externalSubscriptionId: externalId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with external ID ${externalId} not found`,
      );
    }

    subscription.status = status;
    if (expiresAt) {
      subscription.expiresAt = expiresAt;
    }
    if (status === SubscriptionStatus.CANCELLED) {
      subscription.cancelledAt = new Date();
    }

    const saved = await this.subscriptionRepository.save(subscription);
    this.logger.log(
      `Subscription ${subscription.id} status updated to ${status}`,
    );

    return saved;
  }

  /**
   * Cancel a user's active subscription.
   */
  async cancelSubscription(appUserId: string): Promise<MemberSubscription> {
    const subscription = await this.getSubscription(appUserId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();

    const saved = await this.subscriptionRepository.save(subscription);
    this.logger.log(
      `Subscription ${subscription.id} cancelled for user ${appUserId}`,
    );

    return saved;
  }

  /**
   * Check whether a user has an active VIP subscription.
   */
  async isVip(appUserId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: [
        { appUserId, status: SubscriptionStatus.ACTIVE },
        { appUserId, status: SubscriptionStatus.GRACE_PERIOD },
      ],
    });

    return !!subscription;
  }

  /**
   * Return the list of VIP benefits.
   */
  getVipBenefits(): typeof VIP_BENEFITS {
    return VIP_BENEFITS;
  }

  /**
   * Handle a RevenueCat webhook event.
   */
  async handleRevenueCatWebhook(payload: {
    event: {
      type: string;
      app_user_id: string;
      product_id?: string;
      expiration_at_ms?: number;
      subscriber_attributes?: Record<string, unknown>;
    };
    api_key?: string;
  }): Promise<void> {
    const { event } = payload;
    const appUserId = event.app_user_id;
    const externalId = `rc_${appUserId}_${Date.now()}`;

    this.logger.log(
      `RevenueCat webhook: ${event.type} for user ${appUserId}`,
    );

    switch (event.type) {
      case 'INITIAL_PURCHASE': {
        const tier = this.mapProductToTier(event.product_id);
        const expiresAt = event.expiration_at_ms
          ? new Date(event.expiration_at_ms)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await this.createSubscription(appUserId, {
          tier,
          provider: SubscriptionProvider.APPLE,
          externalSubscriptionId: externalId,
          startedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        });
        break;
      }

      case 'RENEWAL': {
        const existing = await this.getSubscription(appUserId);
        if (existing) {
          const newExpiresAt = event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await this.updateSubscriptionStatus(
            existing.externalSubscriptionId,
            SubscriptionStatus.ACTIVE,
            newExpiresAt,
          );
        }
        break;
      }

      case 'CANCELLATION': {
        const existing = await this.getSubscription(appUserId);
        if (existing) {
          await this.updateSubscriptionStatus(
            existing.externalSubscriptionId,
            SubscriptionStatus.CANCELLED,
          );
        }
        break;
      }

      case 'EXPIRATION': {
        const existing = await this.getSubscription(appUserId);
        if (existing) {
          await this.updateSubscriptionStatus(
            existing.externalSubscriptionId,
            SubscriptionStatus.EXPIRED,
          );
        }
        break;
      }

      default:
        this.logger.warn(`Unhandled RevenueCat event type: ${event.type}`);
    }
  }

  /**
   * Get subscription statistics for admin dashboard.
   */
  async getSubscriptionStats(): Promise<{
    totalActive: number;
    totalCancelled: number;
    totalExpired: number;
    monthlyCount: number;
    annualCount: number;
  }> {
    const [totalActive, totalCancelled, totalExpired, monthlyCount, annualCount] =
      await Promise.all([
        this.subscriptionRepository.count({
          where: { status: SubscriptionStatus.ACTIVE },
        }),
        this.subscriptionRepository.count({
          where: { status: SubscriptionStatus.CANCELLED },
        }),
        this.subscriptionRepository.count({
          where: { status: SubscriptionStatus.EXPIRED },
        }),
        this.subscriptionRepository.count({
          where: {
            status: SubscriptionStatus.ACTIVE,
            tier: SubscriptionTier.VIP_MONTHLY,
          },
        }),
        this.subscriptionRepository.count({
          where: {
            status: SubscriptionStatus.ACTIVE,
            tier: SubscriptionTier.VIP_ANNUAL,
          },
        }),
      ]);

    return {
      totalActive,
      totalCancelled,
      totalExpired,
      monthlyCount,
      annualCount,
    };
  }

  /**
   * Validate the RevenueCat webhook auth header.
   */
  validateWebhookAuth(authHeader: string | undefined): void {
    const webhookSecret = this.configService.get<string>(
      'REVENUECAT_WEBHOOK_SECRET',
      'rc_webhook_secret_dev',
    );

    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      throw new UnauthorizedException('Invalid webhook authentication');
    }
  }

  /**
   * Map a RevenueCat product ID to our subscription tier.
   */
  private mapProductToTier(productId?: string): SubscriptionTier {
    if (productId?.includes('annual') || productId?.includes('yearly')) {
      return SubscriptionTier.VIP_ANNUAL;
    }
    return SubscriptionTier.VIP_MONTHLY;
  }
}
