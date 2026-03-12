import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PollingStation } from './polling-station.entity';

@Entity('station_reports')
export class StationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stationId: string;

  @ManyToOne(() => PollingStation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stationId' })
  station: PollingStation;

  // SHA-256 hash of the userId — one-way, used only for deduplication/rate-limiting.
  // Raw user identity is never stored alongside station location.
  @Column({ type: 'varchar', length: 64 })
  userIdHash: string;

  @Column({ type: 'int' })
  waitTimeMinutes: number;

  @Column({ type: 'varchar', length: 20, default: 'moderate' })
  crowdLevel: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  reportedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
