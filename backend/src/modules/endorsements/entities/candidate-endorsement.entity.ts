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
import { Candidate } from '../../candidates/entities/candidate.entity';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('candidate_endorsements')
@Unique(['userId', 'electionId'])
export class CandidateEndorsement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @CreateDateColumn()
  createdAt: Date;
}
