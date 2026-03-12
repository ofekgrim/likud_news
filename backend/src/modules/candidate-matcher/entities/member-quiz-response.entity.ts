import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PolicyStatement } from './policy-statement.entity';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

export enum QuizAnswer {
  AGREE = 'agree',
  DISAGREE = 'disagree',
  SKIP = 'skip',
}

@Entity('member_quiz_responses')
@Unique('UQ_member_quiz_responses_user_statement_election', [
  'appUserId',
  'deviceId',
  'statementId',
  'electionId',
])
export class MemberQuizResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  appUserId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  deviceId: string;

  @Column({ type: 'uuid' })
  statementId: string;

  @ManyToOne(() => PolicyStatement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statementId' })
  statement: PolicyStatement;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({
    type: 'enum',
    enum: QuizAnswer,
  })
  answer: QuizAnswer;

  @Column({ type: 'float', default: 1.0 })
  importanceWeight: number;

  @CreateDateColumn()
  answeredAt: Date;
}
