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

@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user_device', ['userId', 'deviceId'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'varchar', length: 500 })
  tokenHash: string;

  @Column({ type: 'varchar', length: 200 })
  deviceId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  platform: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
