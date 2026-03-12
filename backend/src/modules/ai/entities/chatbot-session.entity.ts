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
import { AppUser } from '../../app-users/entities/app-user.entity';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export enum ChatFeedback {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

@Entity('chatbot_sessions')
export class ChatbotSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  appUserId: string;

  @ManyToOne(() => AppUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appUserId' })
  appUser: AppUser;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  deviceId: string;

  @Column({ type: 'jsonb', default: [] })
  messages: ChatMessage[];

  @Column({
    type: 'enum',
    enum: ChatFeedback,
    nullable: true,
  })
  feedback: ChatFeedback | null;

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'boolean', default: false })
  flaggedForReview: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
