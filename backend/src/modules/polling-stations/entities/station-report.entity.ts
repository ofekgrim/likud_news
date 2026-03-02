import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PollingStation } from './polling-station.entity';
import { AppUser } from '../../app-users/entities/app-user.entity';

@Entity('station_reports')
export class StationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stationId: string;

  @ManyToOne(() => PollingStation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stationId' })
  station: PollingStation;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({ type: 'int' })
  waitTimeMinutes: number;

  @Column({ type: 'varchar', length: 20, default: 'moderate' })
  crowdLevel: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  reportedAt: Date;
}
