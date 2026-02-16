import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  filename: string;

  @Column({ type: 'varchar', length: 2000 })
  url: string;

  @Column({ type: 'varchar', length: 2000 })
  s3Key: string;

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  caption: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  altText: string;

  @ManyToOne(() => Article, (article) => article.media, { nullable: true })
  article: Article;

  @Column({ type: 'uuid', nullable: true })
  articleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
