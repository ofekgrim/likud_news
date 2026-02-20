import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Member } from '../../members/entities/member.entity';
import { Media } from '../../media/entities/media.entity';
import { Author } from '../../authors/entities/author.entity';
import { Tag } from '../../tags/entities/tag.entity';

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('articles')
@Index('idx_articles_published', ['publishedAt'], {
  where: "status = 'published'",
})
@Index('idx_articles_category', ['categoryId', 'publishedAt'])
@Index('idx_articles_slug', ['slug'], { unique: true })
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  titleEn: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  subtitle: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  contentEn: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  heroImageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  heroImageCaption: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  author: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags: string[];

  @Column({
    type: 'enum',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
  })
  status: ArticleStatus;

  @Column({ type: 'boolean', default: false })
  isHero: boolean;

  @Column({ type: 'boolean', default: false })
  isBreaking: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'varchar', length: 500, unique: true })
  slug: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'jsonb', default: [] })
  bodyBlocks: any[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  alertBannerText: string;

  @Column({ type: 'boolean', default: false })
  alertBannerEnabled: boolean;

  @Column({ type: 'varchar', length: 7, default: '#E53935' })
  alertBannerColor: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  heroImageCredit: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  heroImageCaptionHe: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  heroImageFullUrl: string;

  @ManyToOne(() => Author, { nullable: true, eager: false })
  @JoinColumn({ name: 'authorId' })
  authorEntity: Author;

  @Column({ type: 'uuid', nullable: true })
  authorId: string;

  @Column({ type: 'boolean', default: true })
  allowComments: boolean;

  @Column({ type: 'int', default: 0 })
  readingTimeMinutes: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @ManyToOne(() => Category, (category) => category.articles, {
    eager: false,
  })
  category: Category;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToMany(() => Member, (member) => member.articles)
  @JoinTable({ name: 'article_members' })
  members: Member[];

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'article_tags' })
  tags: Tag[];

  @OneToMany(() => Media, (media) => media.article)
  media: Media[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
