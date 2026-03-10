import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CommunityPoll } from './community-poll.entity';
import { AppUser } from '../../app-users/entities/app-user.entity';

@Entity('poll_votes')
@Unique(['pollId', 'userId'])
export class PollVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pollId: string;

  @ManyToOne(() => CommunityPoll, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: CommunityPoll;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'int' })
  optionIndex: number;

  @CreateDateColumn()
  createdAt: Date;
}
