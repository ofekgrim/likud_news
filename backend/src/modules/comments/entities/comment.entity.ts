import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { Story } from '../../stories/entities/story.entity';
import { AppUser } from '../../app-users/entities/app-user.entity';

@Entity('comments')
@Index('idx_comments_user', ['userId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Article, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  @Column({ type: 'uuid', nullable: true })
  articleId: string;

  @ManyToOne(() => Story, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storyId' })
  story: Story;

  @Column({ type: 'uuid', nullable: true })
  storyId: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => AppUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'varchar', length: 200 })
  authorName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  authorEmail: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  authorAvatarUrl: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  authorRole: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: true })
  isApproved: boolean;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
