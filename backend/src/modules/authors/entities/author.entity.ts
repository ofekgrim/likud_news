import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('authors')
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nameHe: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nameEn: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  roleHe: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  roleEn: string;

  @Column({ type: 'text', nullable: true })
  bioHe: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  avatarUrl: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  avatarThumbnailUrl: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  socialLinks: Record<string, string>;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
