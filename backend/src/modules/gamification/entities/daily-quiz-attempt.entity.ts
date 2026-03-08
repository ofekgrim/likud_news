import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';
import { DailyQuiz } from './daily-quiz.entity';

@Entity('daily_quiz_attempts')
@Unique(['userId', 'quizId'])
export class DailyQuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'uuid' })
  quizId: string;

  @ManyToOne(() => DailyQuiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: DailyQuiz;

  @Column({ type: 'jsonb' })
  answers: number[];

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'int' })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @CreateDateColumn()
  completedAt: Date;
}
