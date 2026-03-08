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
import {
  NotificationContentType,
  NotificationLogStatus,
} from '../enums/notification.enums';

@Entity('notification_logs')
@Index('idx_notification_logs_status', ['status'])
@Index('idx_notification_logs_sent_at', ['sentAt'])
@Index('idx_notification_logs_content', ['contentType', 'contentId'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  templateId: string;

  @ManyToOne(() => NotificationTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'templateId' })
  template: NotificationTemplate;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 50 })
  contentType: string;

  @Column({ type: 'uuid', nullable: true })
  contentId: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown>;

  @Column({ type: 'jsonb', default: '{}' })
  audienceRules: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  sentById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sentById' })
  sentBy: User;

  @Column({
    type: 'enum',
    enum: NotificationLogStatus,
    default: NotificationLogStatus.PENDING,
  })
  status: NotificationLogStatus;

  @Column({ type: 'int', default: 0 })
  totalTargeted: number;

  @Column({ type: 'int', default: 0 })
  totalSent: number;

  @Column({ type: 'int', default: 0 })
  totalFailed: number;

  @Column({ type: 'int', default: 0 })
  totalOpened: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
