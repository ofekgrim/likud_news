import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';

export enum SubscriptionTier {
  VIP_MONTHLY = 'vip_monthly',
  VIP_ANNUAL = 'vip_annual',
}

export enum SubscriptionProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
  DIRECT = 'direct',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
  GRACE_PERIOD = 'grace_period',
}

@Entity('member_subscriptions')
export class MemberSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_member_subscriptions_appUserId')
  @Column({ type: 'uuid' })
  appUserId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appUserId' })
  appUser: AppUser;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionProvider,
  })
  provider: SubscriptionProvider;

  @Index('IDX_member_subscriptions_externalId')
  @Column({ type: 'varchar', length: 500 })
  externalSubscriptionId: string;

  @Index('IDX_member_subscriptions_status')
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
