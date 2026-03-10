import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('campaign_events')
export class CampaignEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  district: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'uuid', nullable: true })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'uuid', nullable: true })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'int', default: 0 })
  rsvpCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
