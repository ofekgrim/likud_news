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

export enum AppUserRole {
  GUEST = 'guest',
  MEMBER = 'member',
  VERIFIED_MEMBER = 'verified_member',
}

export enum MembershipStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}

@Entity('app_users')
export class AppUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  deviceId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  passwordHash: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  displayName: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: AppUserRole,
    default: AppUserRole.GUEST,
  })
  role: AppUserRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  membershipId: string;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.UNVERIFIED,
  })
  membershipStatus: MembershipStatus;

  @Column({ type: 'timestamp', nullable: true })
  membershipVerifiedAt: Date;

  @Column({ type: 'uuid', array: true, default: '{}' })
  preferredCategories: string[];

  @Column({ type: 'jsonb', default: '{}' })
  notificationPrefs: Record<string, unknown>;

  // ── Granular notification preferences ────────────────────────────────
  @Column({ type: 'boolean', default: true })
  notifBreakingNews: boolean;

  @Column({ type: 'boolean', default: true })
  notifPrimariesUpdates: boolean;

  @Column({ type: 'boolean', default: true })
  notifDailyQuizReminder: boolean;

  @Column({ type: 'boolean', default: true })
  notifStreakAchievements: boolean;

  @Column({ type: 'boolean', default: true })
  notifEvents: boolean;

  @Column({ type: 'boolean', default: true })
  notifGotv: boolean;

  @Column({ type: 'boolean', default: false })
  notifAmaSessions: boolean;

  @Column({ type: 'varchar', length: 5, nullable: true })
  quietHoursStart: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  quietHoursEnd: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @ManyToOne('Branch', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: unknown;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
