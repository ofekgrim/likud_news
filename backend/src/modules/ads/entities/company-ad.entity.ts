import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CompanyAdvertiser } from './company-advertiser.entity';

export enum CompanyAdType {
  ARTICLE_BANNER = 'article_banner',
  FEED_NATIVE = 'feed_native',
  ARTICLE_PRE_ROLL = 'article_pre_roll',
}

@Entity('company_ads')
export class CompanyAd {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_company_ads_advertiserId')
  @Column({ type: 'uuid' })
  advertiserId: string;

  @ManyToOne(() => CompanyAdvertiser, (a) => a.ads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'advertiserId' })
  advertiser: CompanyAdvertiser;

  @Index('IDX_company_ads_adType')
  @Column({
    type: 'varchar',
    length: 30,
    enum: CompanyAdType,
  })
  adType: CompanyAdType;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  contentHe: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  ctaUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ctaLabelHe: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  dailyBudgetNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cpmNis: number;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index('IDX_company_ads_status')
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
