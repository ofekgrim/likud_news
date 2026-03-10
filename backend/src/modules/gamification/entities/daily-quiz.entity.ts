import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

export interface DailyQuizQuestion {
  questionText: string;
  questionTextEn?: string;
  options: Array<{
    label: string;
    isCorrect: boolean;
  }>;
  linkedArticleId?: string;
  linkedArticleSlug?: string;
}

@Entity('daily_quizzes')
@Unique(['date'])
export class DailyQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'jsonb' })
  questions: DailyQuizQuestion[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 20 })
  pointsReward: number;

  @CreateDateColumn()
  createdAt: Date;
}
