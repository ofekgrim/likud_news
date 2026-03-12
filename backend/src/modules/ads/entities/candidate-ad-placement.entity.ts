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
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum AdPlacementType {
  PROFILE_FEATURED = 'profile_featured',
  FEED_SPONSORED = 'feed_sponsored',
  PUSH_NOTIFICATION = 'push_notification',
  QUIZ_END = 'quiz_end',
}

export enum AdPlacementStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAUSED = 'paused',
  ENDED = 'ended',
}

@Entity('candidate_ad_placements')
export class CandidateAdPlacement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_ad_placements_candidateId')
  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Index('IDX_ad_placements_placementType')
  @Column({
    type: 'enum',
    enum: AdPlacementType,
  })
  placementType: AdPlacementType;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  contentHe: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  targetingRules: Record<string, unknown> | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyBudgetNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cpmNis: number;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Index('IDX_ad_placements_isApproved')
  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @Index('IDX_ad_placements_isActive')
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index('IDX_ad_placements_status')
  @Column({ type: 'varchar', length: 20, default: AdPlacementStatus.PENDING })
  status: AdPlacementStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  linkedContentType: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  linkedContentId: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  ctaUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
