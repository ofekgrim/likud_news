import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

@Entity('stories')
@Index('idx_stories_sort', ['sortOrder'])
@Index('idx_stories_active', ['isActive', 'sortOrder'])
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 2000 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  videoUrl: string;

  @Column({ type: 'int', default: 5 })
  durationSeconds: number;

  @Column({ type: 'varchar', length: 10, default: 'image' })
  mediaType: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  linkUrl: string;

  @ManyToOne(() => Article, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @Column({ type: 'uuid', nullable: true })
  articleId: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
