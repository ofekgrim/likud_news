import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TagType {
  TOPIC = 'topic',
  PERSON = 'person',
  LOCATION = 'location',
}

@Entity('tags')
@Index('idx_tags_slug', ['slug'], { unique: true })
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nameHe: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nameEn: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'enum', enum: TagType, default: TagType.TOPIC })
  tagType: TagType;

  @CreateDateColumn()
  createdAt: Date;
}
