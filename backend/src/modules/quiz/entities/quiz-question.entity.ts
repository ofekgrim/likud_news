import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  questionTextEn: string;

  @Column({ type: 'jsonb', default: '[]' })
  options: { label: string; labelEn?: string; value: number }[];

  @Column({ name: 'importance', type: 'varchar', length: 20, default: 'medium' })
  importanceLevel: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
