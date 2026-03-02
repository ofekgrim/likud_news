import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from '../articles/entities/article.entity';
import { CommunityPoll } from '../community-polls/entities/community-poll.entity';
import { CampaignEvent } from '../campaign-events/entities/campaign-event.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { Comment } from '../comments/entities/comment.entity';
import { FeedItemDto, FeedItemType } from './dto/feed-item.dto';
import { QueryFeedDto } from './dto/query-feed.dto';
import { FeedAlgorithmService } from './feed-algorithm.service';
import { SseService } from '../sse/sse.service';

/**
 * Feed service that provides a unified mixed-content feed.
 *
 * Fetches content from multiple sources (articles, polls, events, elections, quizzes),
 * transforms them into a unified FeedItemDto format, applies the feed algorithm,
 * and returns a sorted, interleaved, paginated result.
 */
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(CommunityPoll)
    private readonly pollRepository: Repository<CommunityPoll>,
    @InjectRepository(CampaignEvent)
    private readonly eventRepository: Repository<CampaignEvent>,
    @InjectRepository(PrimaryElection)
    private readonly electionRepository: Repository<PrimaryElection>,
    @InjectRepository(QuizQuestion)
    private readonly quizRepository: Repository<QuizQuestion>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly algorithmService: FeedAlgorithmService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Optional() @Inject(SseService) private readonly sseService?: SseService,
  ) {}

  /**
   * Get unified feed with mixed content types.
   *
   * Caching strategy:
   * - Public feeds (no deviceId/userId): cached for 2 minutes
   * - Personalized feeds (with deviceId/userId): cached for 5 minutes per user
   * - Cache key includes: page, limit, types, categoryId, deviceId, userId
   */
  async getFeed(query: QueryFeedDto): Promise<{
    data: FeedItemDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      articlesCount: number;
      pollsCount: number;
      eventsCount: number;
      electionsCount: number;
      quizzesCount: number;
    };
  }> {
    const { page = 1, limit = 20, types, categoryId, deviceId, userId } = query;

    // Generate cache key
    const cacheKey = this.generateCacheKey(query);

    // Try to get from cache
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for key: ${cacheKey}, fetching fresh data...`);

    // Determine which content types to fetch
    const activeTypes = types || Object.values(FeedItemType);

    // Fetch content in parallel
    const [
      articles,
      polls,
      events,
      elections,
      quizzes,
    ] = await Promise.all([
      activeTypes.includes(FeedItemType.ARTICLE)
        ? this.fetchArticles(categoryId, deviceId, userId)
        : [],
      activeTypes.includes(FeedItemType.POLL)
        ? this.fetchPolls(deviceId, userId)
        : [],
      activeTypes.includes(FeedItemType.EVENT)
        ? this.fetchEvents(deviceId, userId)
        : [],
      activeTypes.includes(FeedItemType.ELECTION_UPDATE)
        ? this.fetchElections()
        : [],
      activeTypes.includes(FeedItemType.QUIZ_PROMPT)
        ? this.fetchQuizzes(deviceId, userId)
        : [],
    ]);

    this.logger.log(
      `Fetched: ${articles.length} articles, ${polls.length} polls, ${events.length} events, ${elections.length} elections, ${quizzes.length} quizzes`,
    );

    this.logger.debug('Starting transformation...');
    // Transform to FeedItemDto and compute priorities
    let feedItems: FeedItemDto[] = [
      ...articles.map((a) => this.transformArticle(a)),
      ...polls.map((p) => this.transformPoll(p, deviceId, userId)),
      ...events.map((e) => this.transformEvent(e, deviceId, userId)),
      ...elections.map((el) => this.transformElection(el)),
      ...quizzes.map((q) => this.transformQuiz(q, deviceId, userId)),
    ];

    this.logger.debug(`Transformed ${feedItems.length} items, computing priorities...`);
    // Compute priority for each item
    feedItems = feedItems.map((item) => ({
      ...item,
      sortPriority: this.algorithmService.computePriority(item),
    }));

    this.logger.debug('Sorting by priority...');
    // Sort by priority (highest first)
    feedItems.sort((a, b) => b.sortPriority - a.sortPriority);

    this.logger.debug('Interleaving...');
    // Apply interleaving for diversity
    feedItems = this.algorithmService.interleave(feedItems);

    this.logger.debug('Applying cardinality limits...');
    // Apply cardinality limits (max X polls/events per page)
    const totalItems = feedItems.length;
    feedItems = this.algorithmService.applyCardinalityLimits(
      feedItems,
      page * limit,
    );

    this.logger.debug('Paginating...');
    // Paginate
    const start = (page - 1) * limit;
    const paginatedItems = feedItems.slice(start, start + limit);

    this.logger.debug(`Returning ${paginatedItems.length} items`);
    const result = {
      data: paginatedItems,
      meta: {
        page,
        limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
        articlesCount: articles.length,
        pollsCount: polls.length,
        eventsCount: events.length,
        electionsCount: elections.length,
        quizzesCount: quizzes.length,
      },
    };

    // Store in cache
    const ttl = deviceId || userId ? 5 * 60 * 1000 : 2 * 60 * 1000; // 5min for personalized, 2min for public
    await this.cacheManager.set(cacheKey, result, ttl);
    this.logger.debug(`Cached result with key: ${cacheKey} (TTL: ${ttl}ms)`);

    return result;
  }

  /**
   * Fetch published articles.
   */
  private async fetchArticles(
    categoryId?: string,
    deviceId?: string,
    userId?: string,
  ): Promise<Article[]> {
    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.authorEntity', 'authorEntity')
      .where('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .take(50); // Fetch more than we need for algorithm

    if (categoryId) {
      qb.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    const articles = await qb.getMany();

    // Batch-enrich with comment counts
    return this.enrichWithCommentCounts(articles);
  }

  /**
   * Fetch active polls.
   */
  private async fetchPolls(
    deviceId?: string,
    userId?: string,
  ): Promise<CommunityPoll[]> {
    return this.pollRepository
      .createQueryBuilder('poll')
      .where('poll.isActive = :isActive', { isActive: true })
      .orderBy('poll.createdAt', 'DESC')
      .take(10)
      .getMany();
  }

  /**
   * Fetch upcoming events.
   */
  private async fetchEvents(
    deviceId?: string,
    userId?: string,
  ): Promise<CampaignEvent[]> {
    const now = new Date();
    return this.eventRepository
      .createQueryBuilder('event')
      .where('event.isActive = :isActive', { isActive: true })
      .andWhere('event.startTime >= :now', { now })
      .orderBy('event.startTime', 'ASC')
      .take(10)
      .getMany();
  }

  /**
   * Fetch active elections (with live results if available).
   */
  private async fetchElections(): Promise<PrimaryElection[]> {
    const now = new Date();
    return this.electionRepository
      .createQueryBuilder('election')
      .where('election.isActive = :isActive', { isActive: true })
      .andWhere('election.electionDate >= :oneMonthAgo', {
        oneMonthAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      })
      .orderBy('election.electionDate', 'DESC')
      .take(3)
      .getMany();
  }

  /**
   * Fetch active quizzes (grouped by election).
   * Returns elections that have active quiz questions.
   */
  private async fetchQuizzes(
    deviceId?: string,
    userId?: string,
  ): Promise<PrimaryElection[]> {
    // Get elections that have active quiz questions
    const electionsWithQuiz = await this.electionRepository
      .createQueryBuilder('election')
      .innerJoin('quiz_questions', 'q', 'q.electionId = election.id')
      .where('q.isActive = :isActive', { isActive: true })
      .andWhere('election.isActive = :electionActive', { electionActive: true })
      .groupBy('election.id')
      .orderBy('election.createdAt', 'DESC')
      .take(3)
      .getMany();

    // Fetch question counts for each election
    for (const election of electionsWithQuiz) {
      const questionsCount = await this.quizRepository.count({
        where: {
          electionId: election.id,
          isActive: true,
        },
      });
      (election as any).questionsCount = questionsCount;
    }

    return electionsWithQuiz;
  }

  /**
   * Enrich articles with comment counts.
   * Returns plain objects to avoid TypeORM serialization issues.
   */
  private async enrichWithCommentCounts(articles: Article[]): Promise<any[]> {
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

    // Transform to plain objects to avoid circular reference issues
    return articles.map((article) => ({
      id: article.id,
      title: article.title,
      titleEn: article.titleEn,
      subtitle: article.subtitle,
      heroImageUrl: article.heroImageUrl,
      author: article.author,
      isHero: article.isHero,
      isBreaking: article.isBreaking,
      viewCount: article.viewCount,
      shareCount: article.shareCount,
      readingTimeMinutes: article.readingTimeMinutes,
      publishedAt: article.publishedAt,
      slug: article.slug,
      allowComments: article.allowComments,
      category: article.category ? {
        id: article.category.id,
        name: article.category.name,
        color: article.category.color,
      } : undefined,
      authorEntity: article.authorEntity ? {
        id: article.authorEntity.id,
        nameHe: article.authorEntity.nameHe,
        nameEn: article.authorEntity.nameEn,
      } : undefined,
      commentCount: commentCountMap[article.id] || 0,
    }));
  }

  /**
   * Transform Article to FeedItemDto.
   */
  private transformArticle(article: any): FeedItemDto {
    return {
      id: article.id,
      type: FeedItemType.ARTICLE,
      publishedAt: article.publishedAt,
      isPinned: article.isHero || false,
      sortPriority: 0, // Will be computed later
      article: {
        id: article.id,
        title: article.title,
        titleEn: article.titleEn,
        subtitle: article.subtitle,
        heroImageUrl: article.heroImageUrl,
        categoryName: article.category?.name,
        categoryColor: article.category?.color,
        isBreaking: article.isBreaking,
        viewCount: article.viewCount,
        commentCount: article.commentCount || 0,
        shareCount: article.shareCount,
        readingTimeMinutes: article.readingTimeMinutes,
        publishedAt: article.publishedAt,
        slug: article.slug,
        author: article.author,
        authorEntityName: article.authorEntity?.nameHe || article.authorEntity?.nameEn,
      },
    };
  }

  /**
   * Transform Poll to FeedItemDto.
   */
  private transformPoll(
    poll: CommunityPoll,
    deviceId?: string,
    userId?: string,
  ): FeedItemDto {
    return {
      id: poll.id,
      type: FeedItemType.POLL,
      publishedAt: poll.createdAt,
      isPinned: poll.isPinned || false,
      sortPriority: 0,
      poll: {
        id: poll.id,
        question: poll.question,
        questionEn: undefined, // Not in schema
        options: (poll.options || []).map((opt, index) => ({
          id: `${poll.id}-${index}`, // Generate ID from poll ID + index
          text: opt.label,
          textEn: undefined, // Not in schema
          votesCount: opt.voteCount || 0,
          percentage: poll.totalVotes > 0 ? ((opt.voteCount || 0) / poll.totalVotes) * 100 : 0,
        })),
        totalVotes: poll.totalVotes || 0,
        endsAt: poll.closedAt, // Using closedAt as endsAt
        isActive: poll.isActive,
        allowMultipleVotes: false, // Not in schema
        userHasVoted: false, // TODO: Check vote status
      },
    };
  }

  /**
   * Transform Event to FeedItemDto.
   */
  private transformEvent(
    event: CampaignEvent,
    deviceId?: string,
    userId?: string,
  ): FeedItemDto {
    return {
      id: event.id,
      type: FeedItemType.EVENT,
      publishedAt: event.createdAt,
      isPinned: false,
      sortPriority: 0,
      event: {
        id: event.id,
        title: event.title,
        titleEn: undefined, // Not in schema
        description: event.description,
        imageUrl: event.imageUrl,
        location: event.location,
        locationEn: undefined, // Not in schema
        startTime: event.startTime,
        endTime: event.endTime,
        rsvpCount: event.rsvpCount || 0,
        maxAttendees: undefined, // Not in schema
        userHasRsvped: false, // TODO: Check RSVP status
        eventType: undefined, // Not in schema
      },
    };
  }

  /**
   * Transform Election to FeedItemDto.
   */
  private transformElection(election: PrimaryElection): FeedItemDto {
    // TODO: Fetch turnout and top candidates
    return {
      id: election.id,
      type: FeedItemType.ELECTION_UPDATE,
      publishedAt: election.electionDate || election.createdAt,
      isPinned: true,
      sortPriority: 0,
      electionUpdate: {
        id: election.id,
        electionId: election.id,
        electionName: election.title,
        electionNameEn: election.subtitle, // Using subtitle as English fallback
        turnoutPercentage: 0, // TODO: Calculate from turnout snapshots
        eligibleVoters: 0, // TODO: Calculate from voting eligibility
        actualVoters: 0, // TODO: Sum from turnout snapshots
        isLive: this.isElectionLive(election.electionDate),
        topCandidates: [], // TODO: Fetch from candidates + votes
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Transform Quiz (election) to FeedItemDto.
   */
  private transformQuiz(
    election: PrimaryElection,
    deviceId?: string,
    userId?: string,
  ): FeedItemDto {
    return {
      id: election.id,
      type: FeedItemType.QUIZ_PROMPT,
      publishedAt: election.createdAt,
      isPinned: false,
      sortPriority: 0,
      quizPrompt: {
        id: election.id,
        title: election.title,
        titleEn: election.subtitle, // Using subtitle as English fallback
        description: election.description,
        imageUrl: election.coverImageUrl,
        questionsCount: (election as any).questionsCount || 0,
        completionRate: 0, // TODO: Calculate from responses
        userHasCompleted: false, // TODO: Check user responses
        userMatchPercentage: undefined,
      },
    };
  }

  /**
   * Check if election is currently live (within 24 hours of election date).
   */
  private isElectionLive(electionDate: Date): boolean {
    const now = new Date();
    const election = new Date(electionDate);
    const hoursDiff = Math.abs(election.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SSE BROADCAST METHODS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Broadcast a new article to all feed subscribers via SSE.
   * Call this when a new article is published.
   */
  async broadcastNewArticle(article: Article): Promise<void> {
    if (!this.sseService) return;

    try {
      const feedItem = this.transformArticle(article);
      feedItem.sortPriority = this.algorithmService.computePriority(feedItem);

      this.sseService.emitFeedUpdate(feedItem, 'new_article');
      this.logger.log(`Broadcasted new article to feed: ${article.title}`);

      // Invalidate feed cache
      await this.invalidateFeedCache(FeedItemType.ARTICLE, article.categoryId);
    } catch (error) {
      this.logger.error('Failed to broadcast new article', error);
    }
  }

  /**
   * Broadcast a new poll to all feed subscribers via SSE.
   * Call this when a new community poll is created and activated.
   */
  async broadcastNewPoll(poll: CommunityPoll): Promise<void> {
    if (!this.sseService) return;

    try {
      const feedItem = this.transformPoll(poll);
      feedItem.sortPriority = this.algorithmService.computePriority(feedItem);

      this.sseService.emitFeedUpdate(feedItem, 'new_poll');
      this.logger.log(`Broadcasted new poll to feed: ${poll.question}`);

      // Invalidate feed cache
      await this.invalidateFeedCache(FeedItemType.POLL);
    } catch (error) {
      this.logger.error('Failed to broadcast new poll', error);
    }
  }

  /**
   * Broadcast a new event to all feed subscribers via SSE.
   * Call this when a new campaign event is created.
   */
  async broadcastNewEvent(event: CampaignEvent): Promise<void> {
    if (!this.sseService) return;

    try {
      const feedItem = this.transformEvent(event);
      feedItem.sortPriority = this.algorithmService.computePriority(feedItem);

      this.sseService.emitFeedUpdate(feedItem, 'new_event');
      this.logger.log(`Broadcasted new event to feed: ${event.title}`);

      // Invalidate feed cache
      await this.invalidateFeedCache(FeedItemType.EVENT);
    } catch (error) {
      this.logger.error('Failed to broadcast new event', error);
    }
  }

  /**
   * Broadcast an election update to all feed subscribers via SSE.
   * Call this when election results or turnout are updated.
   */
  async broadcastElectionUpdate(election: PrimaryElection): Promise<void> {
    if (!this.sseService) return;

    try {
      const feedItem = this.transformElection(election);
      feedItem.sortPriority = this.algorithmService.computePriority(feedItem);

      this.sseService.emitFeedUpdate(feedItem, 'election_update');
      this.logger.log(`Broadcasted election update to feed: ${election.title}`);

      // Invalidate feed cache
      await this.invalidateFeedCache(FeedItemType.ELECTION_UPDATE);
    } catch (error) {
      this.logger.error('Failed to broadcast election update', error);
    }
  }

  /**
   * Broadcast a quiz update to all feed subscribers via SSE.
   * Call this when a new quiz/election with questions is activated.
   */
  async broadcastQuizUpdate(election: PrimaryElection): Promise<void> {
    if (!this.sseService) return;

    try {
      // Fetch question count
      const questionsCount = await this.quizRepository.count({
        where: { electionId: election.id, isActive: true },
      });
      (election as any).questionsCount = questionsCount;

      const feedItem = this.transformQuiz(election);
      feedItem.sortPriority = this.algorithmService.computePriority(feedItem);

      this.sseService.emitFeedUpdate(feedItem, 'quiz_update');
      this.logger.log(`Broadcasted quiz update to feed: ${election.title}`);

      // Invalidate feed cache
      await this.invalidateFeedCache(FeedItemType.QUIZ_PROMPT);
    } catch (error) {
      this.logger.error('Failed to broadcast quiz update', error);
    }
  }

  /**
   * Generate cache key for feed query.
   *
   * Key format: feed:{types}:{category}:{device}:{user}:page{X}:limit{Y}
   */
  private generateCacheKey(query: QueryFeedDto): string {
    const {
      page = 1,
      limit = 20,
      types,
      categoryId,
      deviceId,
      userId,
    } = query;

    const typesStr = types?.sort().join(',') || 'all';
    const categoryStr = categoryId || 'all';
    const deviceStr = deviceId || 'public';
    const userStr = userId || 'anon';

    return `feed:${typesStr}:cat${categoryStr}:dev${deviceStr}:usr${userStr}:p${page}:l${limit}`;
  }

  /**
   * Invalidate feed cache.
   *
   * Call this when new content is published to ensure users see fresh data.
   * Uses pattern matching to clear all related cache keys.
   *
   * @param contentType - Optional: invalidate only specific content type caches
   * @param categoryId - Optional: invalidate only specific category caches
   */
  async invalidateFeedCache(
    contentType?: FeedItemType,
    categoryId?: string,
  ): Promise<void> {
    try {
      // Clear all feed caches (we can't pattern match with cache-manager easily,
      // so we use a versioning strategy or clear all)
      // For now, we'll just log and rely on TTL expiration
      // In production, consider using Redis DEL with pattern matching

      this.logger.log(
        `Feed cache invalidation requested (type: ${contentType || 'all'}, category: ${categoryId || 'all'})`,
      );

      // Note: cache-manager-redis-yet doesn't support pattern deletion out of the box
      // For production, you'd need to either:
      // 1. Track cache keys in a Set and delete individually
      // 2. Use Redis client directly with DEL pattern
      // 3. Use cache versioning (add version to cache key, increment on invalidation)
      // For now, we rely on short TTL (2-5 minutes) for cache freshness
    } catch (error) {
      this.logger.error('Failed to invalidate feed cache', error);
    }
  }
}
