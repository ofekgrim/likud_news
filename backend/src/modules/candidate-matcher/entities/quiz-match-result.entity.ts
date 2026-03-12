import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('quiz_match_results')
export class QuizMatchResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  appUserId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  deviceId: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'float' })
  matchPct: number;

  @Column({ type: 'jsonb', default: {} })
  categoryBreakdown: Record<string, number>;

  @CreateDateColumn()
  computedAt: Date;
}
