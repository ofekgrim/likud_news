import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { PollingStation } from '../../polling-stations/entities/polling-station.entity';

@Entity('election_results')
export class ElectionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'uuid', nullable: true })
  stationId: string;

  @ManyToOne(() => PollingStation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'stationId' })
  station: PollingStation;

  @Column({ type: 'int', default: 0 })
  voteCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number;

  @Column({ type: 'boolean', default: false })
  isOfficial: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
