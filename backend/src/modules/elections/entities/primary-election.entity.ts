import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ElectionStatus {
  DRAFT = 'draft',
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  VOTING = 'voting',
  COUNTING = 'counting',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('primary_elections')
export class PrimaryElection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  electionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  registrationDeadline: Date;

  @Column({
    type: 'enum',
    enum: ElectionStatus,
    default: ElectionStatus.DRAFT,
  })
  status: ElectionStatus;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  coverImageUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
