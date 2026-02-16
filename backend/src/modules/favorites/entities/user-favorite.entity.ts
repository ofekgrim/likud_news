import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('user_favorites')
@Unique(['deviceId', 'articleId'])
@Index('idx_favorites_device', ['deviceId', 'createdAt'])
export class UserFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  deviceId: string;

  @Column({ type: 'uuid' })
  articleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
