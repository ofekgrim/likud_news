import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { PrimaryElection } from '../../elections/entities/primary-election.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum KnessetSlotType {
  LEADER = 'leader',
  RESERVED_MINORITY = 'reserved_minority',
  RESERVED_WOMAN = 'reserved_woman',
  NATIONAL = 'national',
  DISTRICT = 'district',
}

@Entity('knesset_list_slots')
@Unique('UQ_knesset_list_slots_election_slot', ['electionId', 'slotNumber'])
@Index('IDX_knesset_list_slots_election', ['electionId'])
@Index('IDX_knesset_list_slots_candidate', ['candidateId'])
export class KnessetListSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  electionId: string;

  @ManyToOne(() => PrimaryElection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'electionId' })
  election: PrimaryElection;

  @Column({ type: 'int' })
  slotNumber: number;

  @Column({
    type: 'enum',
    enum: KnessetSlotType,
    default: KnessetSlotType.NATIONAL,
  })
  slotType: KnessetSlotType;

  @Column({ type: 'uuid', nullable: true })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;

  @Column({ type: 'uuid', nullable: true })
  assignedById: string;

  @Column({ type: 'uuid', nullable: true })
  confirmedById: string;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
