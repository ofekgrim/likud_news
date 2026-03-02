import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
