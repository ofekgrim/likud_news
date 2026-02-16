import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

@Entity('members')
@Index('idx_members_active', ['isActive', 'sortOrder'])
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nameEn: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  titleEn: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  bioEn: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  photoUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  socialTwitter: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  socialFacebook: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  socialInstagram: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToMany(() => Article, (article) => article.members)
  articles: Article[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
