import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';

export enum BadgeType {
  QUIZ_TAKER = 'quiz_taker',
  FIRST_VOTE = 'first_vote',
  ENDORSER = 'endorser',
  POLL_VOTER = 'poll_voter',
  EVENT_GOER = 'event_goer',
  TOP_CONTRIBUTOR = 'top_contributor',
  EARLY_BIRD = 'early_bird',
  SOCIAL_SHARER = 'social_sharer',
}

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({
    type: 'enum',
    enum: BadgeType,
  })
  badgeType: BadgeType;

  @CreateDateColumn()
  earnedAt: Date;
}
