import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';

@Entity('user_streaks')
@Unique(['userId'])
export class UserStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  @Column({ type: 'date', nullable: true })
  lastActivityDate: string | null;

  @Column({ type: 'int', default: 0 })
  freezeTokens: number;

  @Column({ type: 'int', default: 0 })
  freezeTokensUsed: number;

  @Column({ type: 'date', nullable: true })
  lastFreezeUsedDate: string | null;

  @Column({ type: 'int', default: 1 })
  tier: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
