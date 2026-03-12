import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum AmaSessionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  ARCHIVED = 'archived',
}

@Entity('ama_sessions')
export class AmaSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({
    type: 'enum',
    enum: AmaSessionStatus,
    default: AmaSessionStatus.DRAFT,
  })
  status: AmaSessionStatus;

  @Column({ type: 'uuid', nullable: true })
  moderatorId: string;

  @Column({ type: 'int', default: 100 })
  maxQuestions: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
