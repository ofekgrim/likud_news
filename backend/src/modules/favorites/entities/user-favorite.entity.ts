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
import { AppUser } from '../../app-users/entities/app-user.entity';
import { BookmarkFolder } from '../../bookmark-folders/entities/bookmark-folder.entity';

@Entity('user_favorites')
@Unique(['deviceId', 'articleId'])
@Index('idx_favorites_device', ['deviceId', 'createdAt'])
@Index('idx_favorites_user', ['userId', 'createdAt'])
export class UserFavorite {
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

  @Column({ type: 'uuid', nullable: true })
  folderId?: string;

  @ManyToOne(() => BookmarkFolder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folderId' })
  folder: BookmarkFolder;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
