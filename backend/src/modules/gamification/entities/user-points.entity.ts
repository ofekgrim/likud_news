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
}

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
