import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MissionType {
  READ_ARTICLE = 'read_article',
  COMPLETE_QUIZ = 'complete_quiz',
  VOTE_POLL = 'vote_poll',
  SHARE_CONTENT = 'share_content',
  CHECK_MEMBERSHIP = 'check_membership',
  RSVP_EVENT = 'rsvp_event',
  VIEW_CANDIDATE = 'view_candidate',
  USE_MATCHER = 'use_matcher',
}

export enum MissionFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ONCE_PER_CYCLE = 'once_per_cycle',
}

@Entity('daily_missions')
export class DailyMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MissionType,
  })
  type: MissionType;

  @Column({ type: 'varchar', length: 500 })
  descriptionHe: string;

  @Column({ type: 'varchar', length: 500 })
  descriptionEn: string;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  iconName: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: MissionFrequency,
    default: MissionFrequency.DAILY,
  })
  frequency: MissionFrequency;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
