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

@Entity('article_embeddings')
@Index(['articleId', 'chunkIndex'])
export class ArticleEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  articleId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @Column({ type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  chunkText: string;

  // Stored as vector string '[0.1, 0.2, ...]' — pgvector
  // The actual column type is vector(768) set in migration
  @Column({ type: 'text' })
  embedding: string;

  @Column({ type: 'varchar', length: 100, default: 'alephbert-768' })
  model: string;

  @CreateDateColumn()
  createdAt: Date;
}
