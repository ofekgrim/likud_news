import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('quiz_responses')
@Unique(['userId', 'electionId'])
export class QuizResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'jsonb', default: '[]' })
  answers: { questionId: string; selectedValue: number; importance: number }[];

  @Column({ type: 'jsonb', default: '[]' })
  matchResults: { candidateId: string; candidateName: string; matchPercentage: number }[];

  @Column({ type: 'timestamp', default: () => 'now()' })
  completedAt: Date;
}
