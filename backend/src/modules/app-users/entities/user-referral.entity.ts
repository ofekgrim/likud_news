import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppUser } from './app-user.entity';

@Entity('user_referrals')
@Index(['referrerId'])
@Index(['refereeId'], { unique: true }) // each referee can only be referred once
export class UserReferral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  referrerId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrerId' })
  referrer: AppUser;

  @Column({ type: 'uuid' })
  refereeId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'refereeId' })
  referee: AppUser;

  @Column({ type: 'varchar', length: 8 })
  code: string;

  @CreateDateColumn()
  claimedAt: Date;
}
