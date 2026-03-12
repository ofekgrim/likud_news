import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AmaSession } from './ama-session.entity';
import { AppUser } from '../../app-users/entities/app-user.entity';

export enum AmaQuestionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ANSWERED = 'answered',
  REJECTED = 'rejected',
}

@Entity('ama_questions')
export class AmaQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => AmaSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: AmaSession;

  @Index()
  @Column({ type: 'uuid' })
  appUserId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appUserId' })
  appUser: AppUser;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  answerText: string;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt: Date;

  @Column({ type: 'int', default: 0 })
  upvoteCount: number;

  @Column({
    type: 'enum',
    enum: AmaQuestionStatus,
    default: AmaQuestionStatus.PENDING,
  })
  status: AmaQuestionStatus;

  @Column({ type: 'boolean', default: false })
  isModerated: boolean;

  @Column({ type: 'uuid', nullable: true })
  moderatedById: string;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
