import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { AppUser } from '../../app-users/entities/app-user.entity';

@Entity('reading_history')
@Index('idx_history_device', ['deviceId', 'readAt'])
@Index('idx_history_user', ['userId', 'readAt'])
export class ReadingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  deviceId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => AppUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'uuid' })
  articleId: string;

  @ManyToOne(() => Article, { eager: false })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @CreateDateColumn({ name: 'read_at' })
  readAt: Date;
}
