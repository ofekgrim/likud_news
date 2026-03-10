import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';

export enum PointAction {
  QUIZ_COMPLETE = 'quiz_complete',
  ENDORSEMENT = 'endorsement',
  POLL_VOTE = 'poll_vote',
  EVENT_RSVP = 'event_rsvp',
  COMMENT = 'comment',
  SHARE = 'share',
  LOGIN_STREAK = 'login_streak',
  PROFILE_COMPLETE = 'profile_complete',
  DAILY_QUIZ_COMPLETE = 'daily_quiz_complete',
  ARTICLE_READ = 'article_read',
  DAILY_LOGIN = 'daily_login',
  STREAK_BONUS = 'streak_bonus',
}

/** Default point values per action */
export const POINT_VALUES: Record<PointAction, number> = {
  [PointAction.ARTICLE_READ]: 5,
  [PointAction.DAILY_LOGIN]: 5,
  [PointAction.POLL_VOTE]: 10,
  [PointAction.ENDORSEMENT]: 10,
  [PointAction.COMMENT]: 10,
  [PointAction.SHARE]: 15,
  [PointAction.DAILY_QUIZ_COMPLETE]: 20,
  [PointAction.QUIZ_COMPLETE]: 20,
  [PointAction.EVENT_RSVP]: 25,
  [PointAction.LOGIN_STREAK]: 5,
  [PointAction.PROFILE_COMPLETE]: 50,
  [PointAction.STREAK_BONUS]: 0, // varies by milestone
};

@Entity('user_points')
export class UserPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({
    type: 'enum',
    enum: PointAction,
  })
  action: PointAction;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  earnedAt: Date;
}
