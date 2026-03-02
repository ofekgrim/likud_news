import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { Tag } from '../tags/entities/tag.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { Comment } from '../comments/entities/comment.entity';
import { SseService } from '../sse/sse.service';
import { PushService } from '../push/push.service';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(UserFavorite)
    private readonly favoriteRepository: Repository<UserFavorite>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly sseService: SseService,
    private readonly pushService: PushService,
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

    const saved = await this.articleRepository.save(article);

    // Fire-and-forget: notify if article is published
    void this.notifyIfPublished(saved, createArticleDto.sendPushNotification);

    return saved;
  }

  /**
   * Emit SSE new_article event and optionally send push notification.
   */
  private async notifyIfPublished(
    article: Article,
    sendPush?: boolean,
  ): Promise<void> {
    if (article.status !== ArticleStatus.PUBLISHED) return;

    const payload = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      heroImageUrl: article.heroImageUrl,
      isBreaking: article.isBreaking,
      categoryId: article.categoryId,
    };

    // Always emit SSE for new/updated published articles
    this.sseService.emitNewArticle(payload);

    // Also emit on breaking stream if it's breaking news
    if (article.isBreaking) {
      this.sseService.emitBreaking(payload);
    }

    // Send push notification if requested
    if (sendPush) {
      try {
        await this.pushService.sendToAll({
          title: article.isBreaking ? 'מבזק' : 'כתבה חדשה',
          body: article.title,
          imageUrl: article.heroImageUrl || undefined,
          data: {
            articleSlug: article.slug,
            type: article.isBreaking ? 'breaking' : 'article',
          },
        });
        this.logger.log(`Push notification sent for article: ${article.slug}`);
      } catch (error) {
        this.logger.error(`Failed to send push for article ${article.slug}:`, error);
      }
    }
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
      category,
      status,
      isBreaking,
      isHero,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'DESC',
      engagementFilter,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.authorEntity', 'authorEntity')
      .skip(skip)
      .take(limit);

    if (categoryId) {
      qb.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    if (category) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug: category });
    }

    if (status) {
      qb.andWhere('article.status = :status', { status });
    }

    if (isBreaking !== undefined) {
      qb.andWhere('article.isBreaking = :isBreaking', { isBreaking });
    }

    if (isHero !== undefined) {
      qb.andWhere('article.isHero = :isHero', { isHero });
    }

    if (search) {
      qb.andWhere(
        '(article.title ILIKE :search OR article.subtitle ILIKE :search OR article.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply engagement filters
    if (engagementFilter === 'high_views') {
      qb.andWhere('article.viewCount >= :minViews', { minViews: 1000 });
    }

    // Apply high_comments filter (requires comment join and grouping)
    const needsCommentJoin = engagementFilter === 'high_comments' || sortBy === 'commentCount';

    if (needsCommentJoin) {
      qb.leftJoin('comments', 'c', 'c.articleId = article.id AND c.isApproved = true')
        .groupBy('article.id')
        .addGroupBy('category.id')
        .addGroupBy('authorEntity.id');

      if (engagementFilter === 'high_comments') {
        qb.having('COUNT(c.id) >= :minComments', { minComments: 10 });
      }
    }

    // Apply sorting
    if (sortBy === 'commentCount') {
      qb.addSelect('COUNT(c.id)', 'comment_count')
        .orderBy('comment_count', sortOrder);
    } else {
      qb.orderBy(`article.${sortBy}`, sortOrder);
    }

    const [data, total] = await qb.getManyAndCount();

    // Batch-count comments for returned articles
    const articleIds = data.map((a) => a.id);
    let commentCountMap: Record<string, number> = {};
    if (articleIds.length > 0) {
      const counts = await this.commentRepository
        .createQueryBuilder('c')
        .select('c.articleId', 'articleId')
        .addSelect('COUNT(*)::int', 'count')
        .where('c.articleId IN (:...articleIds)', { articleIds })
        .andWhere('c.isApproved = true')
        .groupBy('c.articleId')
        .getRawMany();
      commentCountMap = Object.fromEntries(
        counts.map((r) => [r.articleId, r.count]),
      );
    }

    // Enrich articles with comment count and author name
    const enriched = data.map((article) => {
      const plain = JSON.parse(JSON.stringify(article));
      return {
        ...plain,
        commentCount: commentCountMap[article.id] || 0,
        authorEntityName: article.authorEntity?.nameHe || article.authorEntity?.nameEn || null,
        categoryName: article.category?.name,
        categoryColor: article.category?.color,
      };
    });

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single article by its slug. Also increments the view count.
   */
  async findBySlug(
    slug: string,
    deviceId?: string,
    userId?: string,
  ): Promise<any> {
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

    // Count comments for this article
    const commentCount = await this.commentRepository.count({
      where: { articleId: article.id, isApproved: true },
    });

    // Check favorite status for this device/user
    let isFavorite = false;
    if (userId || deviceId) {
      const whereClause = userId
        ? { userId, articleId: article.id }
        : { deviceId, articleId: article.id };
      const fav = await this.favoriteRepository.findOne({
        where: whereClause,
      });
      isFavorite = !!fav;
    }

    // Fetch related, same-category, recommended, and latest articles in parallel
    const [relatedArticles, sameCategoryArticles, recommendedArticles, latestArticles] = await Promise.all([
      this.findRelated(article.id, 5),
      this.findSameCategory(article.id, 5),
      this.findRecommendations(article.id, 5),
      this.findLatest(article.id, 10),
    ]);

    // Serialize entity to plain object first — spreading a TypeORM entity
    // directly loses properties due to internal property descriptors.
    const plain = JSON.parse(JSON.stringify(article));

    return {
      ...plain,
      isFavorite,
      commentCount,
      relatedArticles,
      sameCategoryArticles,
      recommendedArticles,
      latestArticles,
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
    const wasDraft = article.status !== ArticleStatus.PUBLISHED;

    const { memberIds, tagIds, sendPushNotification, ...updateData } = updateArticleDto as UpdateArticleDto & { sendPushNotification?: boolean };

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

    const saved = await this.articleRepository.save(article);

    // Notify only when transitioning from non-published → published
    if (wasDraft && saved.status === ArticleStatus.PUBLISHED) {
      void this.notifyIfPublished(saved, sendPushNotification);
    }

    return saved;
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
   * Full-text search across articles with pagination.
   * Searches title, titleEn, subtitle, content, slug, hashtags, category name/slug, and tag names.
   */
  async search(
    searchQuery: string,
    page: number = 1,
    limit: number = 20,
    categoryId?: string,
  ): Promise<{
    data: Article[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoin('article.tags', 'tag')
      .where('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .andWhere(
        '(article.title ILIKE :q OR article.titleEn ILIKE :q OR article.subtitle ILIKE :q OR article.content ILIKE :q OR article.slug ILIKE :q OR article.hashtags ILIKE :q OR category.name ILIKE :q OR category.slug ILIKE :q OR tag."nameHe" ILIKE :q OR tag."nameEn" ILIKE :q)',
        { q: `%${searchQuery}%` },
      );

    if (categoryId) {
      qb.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    qb.orderBy('article.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

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
   * Find related articles by shared tags, excluding the current article.
   */
  async findRelated(articleId: string, limit: number = 5): Promise<any[]> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
      relations: ['tags'],
    });

    if (!article || !article.tags?.length) {
      return [];
    }

    const tagIds = article.tags.map((t) => t.id);

    const articles = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .innerJoin('article.tags', 'tag', 'tag.id IN (:...tagIds)', { tagIds })
      .where('article.id != :articleId', { articleId })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .getMany();

    return this.enrichArticlesWithCommentCount(articles);
  }

  /**
   * Find articles from the same category, excluding the current article.
   */
  async findSameCategory(articleId: string, limit: number = 5): Promise<any[]> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article?.categoryId) {
      return [];
    }

    const articles = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.categoryId = :categoryId', { categoryId: article.categoryId })
      .andWhere('article.id != :articleId', { articleId })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .getMany();

    return this.enrichArticlesWithCommentCount(articles);
  }

  /**
   * Find recommended articles from different categories (most read).
   * Excludes the current article and articles from the same category.
   */
  async findRecommendations(articleId: string, limit: number = 5): Promise<any[]> {
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

    const articles = await qb
      .orderBy('article.viewCount', 'DESC')
      .take(limit)
      .getMany();

    return this.enrichArticlesWithCommentCount(articles);
  }

  /**
   * Find latest published articles, excluding the current article.
   */
  async findLatest(articleId: string, limit: number = 10): Promise<any[]> {
    const articles = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.id != :articleId', { articleId })
      .andWhere('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .take(limit)
      .getMany();

    return this.enrichArticlesWithCommentCount(articles);
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

  /**
   * Enrich articles with comment counts via single batch query.
   */
  private async enrichArticlesWithCommentCount(articles: Article[]): Promise<any[]> {
    if (articles.length === 0) return [];

    const articleIds = articles.map((a) => a.id);

    const counts = await this.commentRepository
      .createQueryBuilder('c')
      .select('c.articleId', 'articleId')
      .addSelect('COUNT(*)::int', 'count')
      .where('c.articleId IN (:...articleIds)', { articleIds })
      .andWhere('c.isApproved = true')
      .groupBy('c.articleId')
      .getRawMany();

    const commentCountMap: Record<string, number> = Object.fromEntries(
      counts.map((r) => [r.articleId, r.count]),
    );

    return articles.map((article) => {
      const plain = JSON.parse(JSON.stringify(article));
      return {
        ...plain,
        commentCount: commentCountMap[article.id] || 0,
        categoryName: article.category?.name,
        categoryColor: article.category?.color,
      };
    });
  }
}
