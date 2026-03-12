import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';

export enum MilestoneType {
  DAYS_7 = '7d',
  DAYS_14 = '14d',
  DAYS_30 = '30d',
  DAYS_100 = '100d',
  DAYS_365 = '365d',
}

@Entity('streak_milestones')
@Unique(['userId', 'milestone'])
export class StreakMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({
    type: 'enum',
    enum: MilestoneType,
  })
  milestone: MilestoneType;

  @Column({ type: 'int' })
  bonusPoints: number;

  @CreateDateColumn()
  earnedAt: Date;
}
