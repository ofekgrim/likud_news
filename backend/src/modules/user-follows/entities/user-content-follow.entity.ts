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
import { AppUser } from '../../app-users/entities/app-user.entity';

/**
 * Polymorphic content follow types.
 * Users can follow categories, members (politicians), authors (journalists), or tags.
 */
export enum ContentFollowType {
  CATEGORY = 'category',
  MEMBER = 'member',
  AUTHOR = 'author',
  TAG = 'tag',
}

/**
 * Polymorphic user-content follow entity.
 *
 * Stores follow relationships between app users and various content types
 * (categories, members, authors, tags). Used by the feed personalization
 * algorithm to boost relevant content for each user.
 *
 * The `targetId` is a UUID referencing the followed entity's PK,
 * and `type` discriminates which table it belongs to.
 */
@Entity('user_content_follows')
@Unique(['userId', 'type', 'targetId'])
@Index('idx_ucf_user_type', ['userId', 'type'])
export class UserContentFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'enum', enum: ContentFollowType })
  type: ContentFollowType;

  @Column({ type: 'uuid' })
  targetId: string;

  @CreateDateColumn()
  createdAt: Date;
}
