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
import { Member } from '../../members/entities/member.entity';

@Entity('user_follows')
@Unique(['followerId', 'followeeId'])
export class UserFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  followerId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower: AppUser;

  @Column({ type: 'uuid' })
  followeeId: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followeeId' })
  followee: Member;

  @CreateDateColumn()
  createdAt: Date;
}
