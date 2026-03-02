import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'varchar', length: 300 })
  fullName: string;

  @Column({ type: 'varchar', length: 300, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  district: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  position: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  photoUrl: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  coverImageUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', default: [] })
  bioBlocks: Record<string, any>[];

  @Column({ type: 'jsonb', default: {} })
  quizPositions: Record<string, number>;

  @Column({ type: 'jsonb', default: {} })
  socialLinks: Record<string, string>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  website: string;

  @Column({ type: 'int', default: 0 })
  endorsementCount: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
