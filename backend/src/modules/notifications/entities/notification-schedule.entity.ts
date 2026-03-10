import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationTemplate } from './notification-template.entity';
import { NotificationScheduleType } from '../enums/notification.enums';

@Entity('notification_schedules')
@Index('idx_notification_schedules_next_run', ['nextRunAt'])
export class NotificationSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  templateId: string;

  @ManyToOne(() => NotificationTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: NotificationTemplate;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({
    type: 'enum',
    enum: NotificationScheduleType,
  })
  scheduleType: NotificationScheduleType;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cronExpression: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Jerusalem' })
  timezone: string;

  @Column({ type: 'jsonb', default: '{}' })
  audienceRules: Record<string, unknown>;

  @Column({ type: 'jsonb', default: '{}' })
  contextData: Record<string, string>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
