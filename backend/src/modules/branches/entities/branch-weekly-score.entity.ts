import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Branch } from './branch.entity';

@Entity('branch_weekly_scores')
@Unique(['branchId', 'weekStart'])
export class BranchWeeklyScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.weeklyScores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column({ type: 'date' })
  weekStart: string;

  @Column({ type: 'int', default: 0 })
  totalScore: number;

  @Column({ type: 'float', default: 0 })
  perCapitaScore: number;

  @Column({ type: 'int', default: 0 })
  activeMemberCount: number;

  @Column({ type: 'int', nullable: true })
  rank: number;

  @Column({ type: 'int', nullable: true })
  prevRank: number;

  @Column({ type: 'jsonb', default: {} })
  scoreBreakdown: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;
}
