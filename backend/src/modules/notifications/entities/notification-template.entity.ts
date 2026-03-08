import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationContentType } from '../enums/notification.enums';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  titleTemplate: string;

  @Column({ type: 'text' })
  bodyTemplate: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  imageUrlTemplate: string;

  @Column({ type: 'enum', enum: NotificationContentType })
  contentType: NotificationContentType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  triggerEvent: string;

  @Column({ type: 'boolean', default: false })
  isAutoTrigger: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  defaultAudience: Record<string, unknown>;

  @Column({ type: 'jsonb', default: '[]' })
  variables: { name: string; required: boolean; description: string }[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

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
