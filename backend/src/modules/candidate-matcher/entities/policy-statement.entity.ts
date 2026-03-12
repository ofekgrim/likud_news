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

export enum PolicyCategory {
  SECURITY = 'security',
  ECONOMY = 'economy',
  JUDICIARY = 'judiciary',
  HOUSING = 'housing',
  SOCIAL = 'social',
  FOREIGN = 'foreign',
}

@Entity('policy_statements')
export class PolicyStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  textHe: string;

  @Column({ type: 'text', nullable: true })
  textEn: string;

  @Column({
    type: 'enum',
    enum: PolicyCategory,
  })
  category: PolicyCategory;

  @Column({ type: 'float', default: 1.0 })
  defaultWeight: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
