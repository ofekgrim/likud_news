import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { PolicyStatement } from './policy-statement.entity';

export enum PositionValue {
  AGREE = 'agree',
  NEUTRAL = 'neutral',
  DISAGREE = 'disagree',
}

@Entity('candidate_positions')
@Unique('UQ_candidate_positions_candidate_statement', [
  'candidateId',
  'statementId',
])
export class CandidatePosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'uuid' })
  statementId: string;

  @ManyToOne(() => PolicyStatement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statementId' })
  statement: PolicyStatement;

  @Column({
    type: 'enum',
    enum: PositionValue,
  })
  position: PositionValue;

  @Column({ type: 'text', nullable: true })
  justificationHe: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
