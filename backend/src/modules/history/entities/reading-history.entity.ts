import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('reading_history')
@Index('idx_history_device', ['deviceId', 'readAt'])
export class ReadingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  deviceId: string;

  @Column({ type: 'uuid' })
  articleId: string;

  @CreateDateColumn({ name: 'read_at' })
  readAt: Date;
}
