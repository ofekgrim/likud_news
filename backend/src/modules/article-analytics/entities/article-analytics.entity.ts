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

export enum AnalyticsEventType {
  VIEW = 'view',
  CLICK = 'click',
  READ_COMPLETE = 'read_complete',
  SHARE = 'share',
  FAVORITE = 'favorite',
  COMMENT = 'comment',
}

@Entity('article_analytics')
@Index('idx_article_analytics_article_event', ['articleId', 'eventType'])
@Index('idx_article_analytics_article_created', ['articleId', 'createdAt'])
@Index('idx_article_analytics_event_created', ['eventType', 'createdAt'])
export class ArticleAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  articleId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'enum', enum: AnalyticsEventType })
  eventType: AnalyticsEventType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referrer: string;

  @Column({ type: 'int', nullable: true })
  readTimeSeconds: number;

  @Column({ type: 'int', nullable: true })
  scrollDepthPercent: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
