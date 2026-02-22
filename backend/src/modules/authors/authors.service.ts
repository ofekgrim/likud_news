import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './entities/author.entity';
import { Article } from '../articles/entities/article.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    const author = this.authorRepository.create(createAuthorDto);
    return this.authorRepository.save(author);
  }

  async findAll(activeOnly?: boolean): Promise<Author[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.authorRepository.find({
      where,
      order: { nameHe: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.authorRepository.findOne({ where: { id } });
    if (!author) {
      throw new NotFoundException(`Author with ID "${id}" not found`);
    }
    return author;
  }

  async findArticlesById(
    id: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Article[]; author: Author; meta: { total: number; page: number; limit: number } }> {
    const author = await this.findOne(id);

    const [articles, total] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.authorId = :id', { id })
      .andWhere('article.status = :status', { status: 'published' })
      .orderBy('article.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: articles,
      author,
      meta: { total, page, limit },
    };
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    const author = await this.findOne(id);
    Object.assign(author, updateAuthorDto);
    return this.authorRepository.save(author);
  }

  async remove(id: string): Promise<void> {
    const author = await this.findOne(id);
    await this.authorRepository.remove(author);
  }
}
