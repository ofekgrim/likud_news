import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

@Entity('user_favorites')
@Unique(['deviceId', 'articleId'])
@Index('idx_favorites_device', ['deviceId', 'createdAt'])
export class UserFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  deviceId: string;

  @Column({ type: 'uuid' })
  articleId: string;

  @ManyToOne(() => Article, { eager: false })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @CreateDateColumn()
  createdAt: Date;
}
