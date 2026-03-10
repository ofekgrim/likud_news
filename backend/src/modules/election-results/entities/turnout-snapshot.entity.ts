import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';

@Entity('turnout_snapshots')
export class TurnoutSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'varchar', length: 200, nullable: true })
  district: string;

  @Column({ type: 'int', default: 0 })
  eligibleVoters: number;

  @Column({ type: 'int', default: 0 })
  actualVoters: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage: number;

  @CreateDateColumn()
  snapshotAt: Date;
}
