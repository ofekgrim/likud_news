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
import { Article } from '../../articles/entities/article.entity';

@Entity('article_ai_summaries')
@Unique(['articleId'])
export class ArticleAiSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  articleId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @Column({ type: 'text' })
  summaryHe: string;

  @Column({ type: 'jsonb' })
  keyPointsHe: string[];

  @Column({ type: 'text', nullable: true })
  politicalAngleHe: string;

  @Column({ type: 'varchar', length: 100 })
  modelUsed: string;

  @Column({ type: 'int' })
  tokensUsed: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
