import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CampaignEvent } from './campaign-event.entity';
import { AppUser } from '../../app-users/entities/app-user.entity';

export enum RsvpStatus {
  INTERESTED = 'interested',
  GOING = 'going',
  NOT_GOING = 'not_going',
}

@Entity('event_rsvps')
export class EventRsvp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @ManyToOne(() => CampaignEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: CampaignEvent;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AppUser;

  @Column({
    type: 'enum',
    enum: RsvpStatus,
    default: RsvpStatus.INTERESTED,
  })
  status: RsvpStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
