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
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum DonationRecipientType {
  CANDIDATE = 'candidate',
  PARTY = 'party',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  TRANZILA = 'tranzila',
}

export enum DonationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('donations')
@Index('IDX_donations_cap_check', [
  'donorAppUserId',
  'recipientType',
  'recipientCandidateId',
])
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_donations_donorAppUserId')
  @Column({ type: 'uuid' })
  donorAppUserId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'donorAppUserId' })
  donorAppUser: AppUser;

  @Column({
    type: 'enum',
    enum: DonationRecipientType,
  })
  recipientType: DonationRecipientType;

  @Index('IDX_donations_recipientCandidateId')
  @Column({ type: 'uuid', nullable: true })
  recipientCandidateId: string | null;

  @ManyToOne(() => Candidate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recipientCandidateId' })
  recipientCandidate: Candidate | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountNis: number;

  @Column({ type: 'varchar', length: 64 })
  teutatZehutHash: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE,
  })
  paymentProvider: PaymentProvider;

  @Column({ type: 'varchar', length: 500, nullable: true })
  paymentIntentId: string | null;

  @Index('IDX_donations_status')
  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status: DonationStatus;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  receiptUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  comptrollerBatchId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
