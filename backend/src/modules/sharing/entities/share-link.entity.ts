import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ShareContentType {
  ARTICLE = 'article',
  CANDIDATE = 'candidate',
  QUIZ_RESULT = 'quiz_result',
  EVENT = 'event',
  POLL = 'poll',
}

@Entity('share_links')
export class ShareLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ShareContentType,
  })
  contentType: ShareContentType;

  @Column({ type: 'uuid' })
  @Index('idx_share_links_content')
  contentId: string;

  @Column({ type: 'varchar', length: 8, unique: true })
  @Index('idx_share_links_short_code', { unique: true })
  shortCode: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ogTitle: string;

  @Column({ type: 'text', nullable: true })
  ogDescription: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  ogImageUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmSource: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmMedium: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmCampaign: string;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
