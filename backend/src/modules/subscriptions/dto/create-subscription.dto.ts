import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import {
  SubscriptionTier,
  SubscriptionProvider,
  SubscriptionStatus,
} from '../entities/member-subscription.entity';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsEnum(SubscriptionProvider)
  provider: SubscriptionProvider;

  @IsString()
  externalSubscriptionId: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsDateString()
  startedAt: string;

  @IsDateString()
  expiresAt: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
