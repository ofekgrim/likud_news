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
import { DailyMission } from './daily-mission.entity';

@Entity('user_daily_missions')
@Unique(['appUserId', 'missionId', 'date'])
export class UserDailyMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  appUserId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appUserId' })
  appUser: AppUser;

  @Column({ type: 'uuid' })
  missionId: string;

  @ManyToOne(() => DailyMission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'missionId' })
  mission: DailyMission;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
