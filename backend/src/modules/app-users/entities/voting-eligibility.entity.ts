import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { AppUser } from './app-user.entity';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('voting_eligibility')
@Unique(['userId', 'electionId'])
export class VotingEligibility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  electionId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  approvedBy: string;

  @CreateDateColumn()
  approvedAt: Date;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;
}
