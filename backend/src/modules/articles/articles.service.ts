import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { Tag } from '../tags/entities/tag.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Calculate reading time from body blocks (words / 200 wpm).
   */
  private calculateReadingTime(bodyBlocks: any[]): number {
    if (!bodyBlocks?.length) return 1;
    let wordCount = 0;
    for (const block of bodyBlocks) {
      if (block.type === 'paragraph' || block.type === 'heading') {
        const text = (block.text || '').replace(/<[^>]*>/g, '');
        wordCount += text.split(/\s+/).filter(Boolean).length;
      } else if (block.type === 'quote') {
        wordCount += (block.text || '').split(/\s+/).filter(Boolean).length;
      }
    }
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  /**
   * Create a new article.
   */
  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const { memberIds, tagIds, ...articleData } = createArticleDto;

    // Check slug uniqueness
    const existing = await this.articleRepository.findOne({
      where: { slug: articleData.slug },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(
        `An article with slug "${articleData.slug}" already exists`,
      );
    }

    const article = this.articleRepository.create(articleData);

    // Auto-calculate reading time from body blocks
    if (article.bodyBlocks) {
      article.readingTimeMinutes = this.calculateReadingTime(article.bodyBlocks);
    }

    // If memberIds are provided, attach the relation
    if (memberIds?.length) {
      article.members = memberIds.map(
        (id) => ({ id }) as Article['members'][number],
      );
    }

    // If tagIds are provided, attach the relation
    if (tagIds?.length) {
      article.tags = tagIds.map((id) => ({ id }) as Tag);
    }

    return this.articleRepository.save(article);
  }

  /**
   * Paginated article feed with filtering.
   */
  async findAll(query: QueryArticlesDto): Promise<{
    data: Article[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      categoryId,
      status,
      isBreaking,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .orderBy('article.publishedAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (categoryId) {
      qb.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    if (status) {
      qb.andWhere('article.status = :status', { status });
    }

    if (isBreaking !== undefined) {
      qb.andWhere('article.isBreaking = :isBreaking', { isBreaking });
    }

    if (search) {
      qb.andWhere(
        '(article.title ILIKE :search OR article.subtitle ILIKE :search OR article.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single article by its slug. Also increments the view count.
   */
  async findBySlug(slug: string): Promise<any> {
    const article = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.members', 'members')
      .leftJoinAndSelect('article.media', 'media')
      .leftJoinAndSelect('article.authorEntity', 'authorEntity')
      .leftJoinAndSelect('article.tags', 'tags')
      .where('article.slug = :slug', { slug })
      .getOne();

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // Fire-and-forget view count increment
    void this.incrementViewCount(article.id);

    // Fetch related, same-category, and recommended articles in parallel
    const [relatedArticles, sameCategoryArticles, recommendedArticles] = await Promise.all([
      this.findRelated(article.id, 5),
      this.findSameCategory(article.id, 5),
      this.findRecommendations(article.id, 5),
    ]);

    return {
      ...article,
      relatedArticles,
      sameCategoryArticles,
      recommendedArticles,
      categoryName: article.category?.name,
      categoryColor: article.category?.color,
    };
  }

  /**
   * Find the current hero article (the most recently published article marked as hero).
   */
  async findHero(): Promise<Article | null> {
    const article = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.isHero = :isHero', { isHero: true })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .getOne();

    return article || null;
  }

  /**
   * Find all breaking news articles.
   */
  async findBreaking(): Promise<Article[]> {
    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.isBreaking = :isBreaking', { isBreaking: true })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .getMany();
  }

  /**
   * Find the most-read (highest viewCount) published articles.
   */
  async findMostRead(limit: number = 10): Promise<Article[]> {
    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.viewCount', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Find a single article by ID.
   */
  async findOne(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'members', 'media', 'authorEntity', 'tags'],
    });

    if (!article) {
      throw new NotFoundException(`Article with id "${id}" not found`);
    }

    return article;
  }

  /**
   * Update an article by ID.
   */
  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.findOne(id);

    const { memberIds, tagIds, ...updateData } = updateArticleDto;

    // If slug is being changed, check uniqueness
    if (updateData.slug && updateData.slug !== article.slug) {
      const existing = await this.articleRepository.findOne({
        where: { slug: updateData.slug },
        withDeleted: true,
      });
      if (existing) {
        throw new ConflictException(
          `An article with slug "${updateData.slug}" already exists`,
        );
      }
    }

    Object.assign(article, updateData);

    // Auto-calculate reading time if bodyBlocks changed
    if (updateData.bodyBlocks) {
      article.readingTimeMinutes = this.calculateReadingTime(article.bodyBlocks);
    }

    // Update member relations if provided
    if (memberIds !== undefined) {
      article.members = memberIds.map(
        (id) => ({ id }) as Article['members'][number],
      );
    }

    // Update tag relations if provided
    if (tagIds !== undefined) {
      article.tags = tagIds.map((id) => ({ id }) as Tag);
    }

    return this.articleRepository.save(article);
  }

  /**
   * Soft-delete an article by ID.
   */
  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepository.softRemove(article);
  }

  /**
   * Increment the view count of an article.
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.articleRepository
      .createQueryBuilder()
      .update(Article)
      .set({ viewCount: () => '"viewCount" + 1' })
      .where('id = :id', { id })
      .execute();
  }

  /**
   * Full-text search across articles.
   */
  async search(searchQuery: string, limit: number = 20): Promise<Article[]> {
    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .andWhere(
        '(article.title ILIKE :q OR article.titleEn ILIKE :q OR article.subtitle ILIKE :q OR article.content ILIKE :q)',
        { q: `%${searchQuery}%` },
      )
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Find related articles by shared tags, excluding the current article.
   */
  async findRelated(articleId: string, limit: number = 5): Promise<Article[]> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
      relations: ['tags'],
    });

    if (!article || !article.tags?.length) {
      return [];
    }

    const tagIds = article.tags.map((t) => t.id);

    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .innerJoin('article.tags', 'tag', 'tag.id IN (:...tagIds)', { tagIds })
      .where('article.id != :articleId', { articleId })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Find articles from the same category, excluding the current article.
   */
  async findSameCategory(articleId: string, limit: number = 5): Promise<Article[]> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article?.categoryId) {
      return [];
    }

    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.categoryId = :categoryId', { categoryId: article.categoryId })
      .andWhere('article.id != :articleId', { articleId })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Find recommended articles from different categories (most read).
   * Excludes the current article and articles from the same category.
   */
  async findRecommendations(articleId: string, limit: number = 5): Promise<Article[]> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });
    if (!article) return [];

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.id != :articleId', { articleId })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED });

    if (article.categoryId) {
      qb.andWhere('article.categoryId != :categoryId', { categoryId: article.categoryId });
    }

    return qb
      .orderBy('article.viewCount', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Increment the share count of an article.
   */
  async incrementShareCount(id: string): Promise<{ shareCount: number }> {
    await this.articleRepository
      .createQueryBuilder()
      .update(Article)
      .set({ shareCount: () => '"shareCount" + 1' })
      .where('id = :id', { id })
      .execute();

    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with id "${id}" not found`);
    }

    return { shareCount: article.shareCount };
  }
}
