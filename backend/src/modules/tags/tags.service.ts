import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Article } from '../articles/entities/article.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagRepository.findOne({
      where: { slug: createTagDto.slug },
    });
    if (existing) {
      throw new ConflictException(
        `Tag with slug "${createTagDto.slug}" already exists`,
      );
    }
    const tag = this.tagRepository.create(createTagDto);
    return this.tagRepository.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find({
      order: { nameHe: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }
    return tag;
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    // If slug is being changed, check uniqueness
    if (updateTagDto.slug && updateTagDto.slug !== tag.slug) {
      const existing = await this.tagRepository.findOne({
        where: { slug: updateTagDto.slug },
      });
      if (existing) {
        throw new ConflictException(
          `Tag with slug "${updateTagDto.slug}" already exists`,
        );
      }
    }

    Object.assign(tag, updateTagDto);
    return this.tagRepository.save(tag);
  }

  async findArticlesBySlug(
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Article[];
    tag: Tag;
    meta: { total: number; page: number; limit: number };
  }> {
    const tag = await this.findBySlug(slug);

    const [articles, total] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .innerJoin('article.tags', 'tag', 'tag.id = :tagId', { tagId: tag.id })
      .where('article.status = :status', { status: 'published' })
      .orderBy('article.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: articles,
      tag,
      meta: { total, page, limit },
    };
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepository.remove(tag);
  }
}
