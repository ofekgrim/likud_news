import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('gotv_engagement')
@Unique(['appUserId', 'electionId'])
export class GotvEngagement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  appUserId: string;

  @Column({ type: 'uuid' })
  electionId: string;

  @Column({ type: 'timestamp', nullable: true })
  votingPlanTime: Date;

  @Column({ type: 'uuid', nullable: true })
  plannedStationId: string;

  @Column({ type: 'timestamp', nullable: true })
  stationCheckinAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  votedBadgeClaimedAt: Date;

  @Column({ type: 'int', default: 0 })
  notificationsSent: number;

  @Column({ type: 'jsonb', default: '[]' })
  notificationLog: Record<string, unknown>[];

  @Column({ type: 'boolean', default: true })
  remindersEnabled: boolean;

  @Column({ type: 'jsonb', default: '[]' })
  remindersSnoozed: string[];

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appUserId' })
  appUser: AppUser;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Auto-deleted 90 days after the election check-in for privacy compliance
  @DeleteDateColumn()
  deletedAt: Date;
}
