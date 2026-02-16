import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ticker_items')
@Index('idx_ticker_active', ['isActive', 'position'], {
  where: 'is_active = true',
})
export class TickerItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  text: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  linkUrl: string;

  @Column({ type: 'uuid', nullable: true })
  articleId: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
