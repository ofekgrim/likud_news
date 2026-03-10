import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';
import { NotificationLog } from './notification-log.entity';
import { NotificationReceiptStatus } from '../enums/notification.enums';

@Entity('notification_receipts')
@Index('idx_notification_receipts_log', ['logId'])
@Index('idx_notification_receipts_user', ['userId'])
@Index('idx_notification_receipts_device', ['deviceId', 'createdAt'])
export class NotificationReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  logId: string;

  @ManyToOne(() => NotificationLog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'logId' })
  log: NotificationLog;

  @Column({ type: 'uuid', nullable: true })
  pushTokenId: string;

  @Column({ type: 'varchar', length: 200 })
  deviceId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => AppUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({
    type: 'enum',
    enum: NotificationReceiptStatus,
    default: NotificationReceiptStatus.SENT,
  })
  status: NotificationReceiptStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  failureReason: string;

  @Column({ type: 'timestamp', nullable: true })
  openedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
