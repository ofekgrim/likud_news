import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from '../articles/entities/article.entity';
import { ElectionStatus } from '../elections/entities/primary-election.entity';
import { CommunityPoll } from '../community-polls/entities/community-poll.entity';
import { CampaignEvent } from '../campaign-events/entities/campaign-event.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PollVote } from '../community-polls/entities/poll-vote.entity';
import { EventRsvp } from '../campaign-events/entities/event-rsvp.entity';
import { QuizResponse } from '../quiz/entities/quiz-response.entity';
import { DailyQuiz } from '../gamification/entities/daily-quiz.entity';
import { DailyQuizAttempt } from '../gamification/entities/daily-quiz-attempt.entity';
import { CompanyAd, CompanyAdType } from '../ads/entities/company-ad.entity';
import { CandidateAdPlacement, AdPlacementType } from '../ads/entities/candidate-ad-placement.entity';
import { FeedItemDto, FeedItemType } from './dto/feed-item.dto';
import { QueryFeedDto, FeedMode } from './dto/query-feed.dto';
import { FeedAlgorithmService } from './feed-algorithm.service';
import { UserFollowsService, UserFollowsMap } from '../user-follows/user-follows.service';
import { SseService } from '../sse/sse.service';
import { ElectionResultsService } from '../election-results/election-results.service';
import { CandidatesService } from '../candidates/candidates.service';

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

  /**
   * Cache versioning map for feed invalidation.
   * Maps content type to version number (timestamp).
   * Incrementing version invalidates all caches for that type.
   */
  private feedCacheVersion: { [key: string]: number } = {};

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
    @InjectRepository(PollVote)
    private readonly pollVoteRepository: Repository<PollVote>,
    @InjectRepository(EventRsvp)
    private readonly eventRsvpRepository: Repository<EventRsvp>,
    @InjectRepository(QuizResponse)
    private readonly quizResponseRepository: Repository<QuizResponse>,
    @InjectRepository(DailyQuiz)
    private readonly dailyQuizRepository: Repository<DailyQuiz>,
    @InjectRepository(DailyQuizAttempt)
    private readonly dailyQuizAttemptRepository: Repository<DailyQuizAttempt>,
    @InjectRepository(CompanyAd)
    private readonly companyAdRepository: Repository<CompanyAd>,
    @InjectRepository(CandidateAdPlacement)
    private readonly candidateAdRepository: Repository<CandidateAdPlacement>,
    private readonly algorithmService: FeedAlgorithmService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly electionResultsService: ElectionResultsService,
    private readonly candidatesService: CandidatesService,
    @Optional()
    private readonly userFollowsService?: UserFollowsService,
    @Optional() @Inject(SseService) private readonly sseService?: SseService,
  ) {}

  /**
   * Get unified feed with mixed content types.
   *
   * Supports two modes:
   * - `latest` (default for anonymous): standard priority algorithm sort
   * - `personalized` (default for authenticated): "For You" feed boosted by user follows
   *
   * Caching strategy:
   * - Public feeds (no deviceId/userId): cached for 2 minutes
   * - Personalized feeds (with deviceId/userId): cached for 30s (user) / 60s (device)
   * - Cache key includes: page, limit, types, categoryId, deviceId, userId, mode
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
      mode: FeedMode;
    };
  }> {
    const { page = 1, limit = 20, types, categoryId, deviceId, userId } = query;

    // Resolve feed mode: explicit > default (personalized for authenticated, latest for anon)
    const mode = query.mode ?? (userId ? FeedMode.PERSONALIZED : FeedMode.LATEST);
    const isPersonalized = mode === FeedMode.PERSONALIZED && !!userId;

    // Generate cache key
    const cacheKey = this.generateCacheKey(query, mode);

    // Try to get from cache
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for key: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for key: ${cacheKey}, fetching fresh data (mode: ${mode})...`);

    // Fetch user follows map if personalized mode is active
    let userFollows: UserFollowsMap | null = null;
    if (isPersonalized && this.userFollowsService) {
      try {
        userFollows = await this.userFollowsService.getUserFollowsMap(userId);
        this.logger.debug(
          `User follows loaded: ${userFollows.categories.size} categories, ` +
          `${userFollows.members.size} members, ${userFollows.authors.size} authors, ` +
          `${userFollows.tags.size} tags`,
        );
      } catch (err) {
        this.logger.warn(`Failed to load user follows for ${userId}: ${err.message}`);
        // Fall back to non-personalized mode
        userFollows = null;
      }
    }

    // Determine which content types to fetch
    const activeTypes = types || Object.values(FeedItemType);

    // Fetch content in parallel
    // When personalized, fetch articles with member/tag relations for matching
    const [
      articles,
      polls,
      events,
      elections,
      quizzes,
      dailyQuizItem,
    ] = await Promise.all([
      activeTypes.includes(FeedItemType.ARTICLE)
        ? this.fetchArticles(categoryId, deviceId, userId, !!userFollows)
        : [],
      activeTypes.includes(FeedItemType.POLL)
        ? this.fetchPolls(deviceId, userId)
        : [],
      activeTypes.includes(FeedItemType.EVENT)
        ? this.fetchEvents(deviceId, userId)
        : [],
      [], // Elections removed from feed — shown via dedicated election day page
      activeTypes.includes(FeedItemType.QUIZ_PROMPT)
        ? this.fetchQuizzes(deviceId, userId)
        : [],
      this.fetchDailyQuiz(userId),
    ]);

    this.logger.log(
      `Fetched: ${articles.length} articles, ${polls.length} polls, ${events.length} events, ${elections.length} elections, ${quizzes.length} quizzes, dailyQuiz: ${dailyQuizItem ? 'yes' : 'no'}`,
    );

    this.logger.debug('Starting transformation...');
    // Transform to FeedItemDto and compute priorities
    let feedItems: FeedItemDto[] = [
      ...articles.map((a) => this.transformArticle(a)),
      ...polls.map((p) => this.transformPoll(p, deviceId, userId)),
      ...events.map((e) => this.transformEvent(e, deviceId, userId)),
      ...quizzes.map((q) => this.transformQuiz(q, deviceId, userId)),
      ...(dailyQuizItem ? [dailyQuizItem] : []),
    ];

    this.logger.debug(`Transformed ${feedItems.length} items, computing priorities...`);

    if (userFollows) {
      // Personalized mode: compute personalized priority for each item
      feedItems = feedItems.map((item) => ({
        ...item,
        sortPriority: this.algorithmService.computePersonalizedPriority(item, userFollows),
      }));
    } else {
      // Standard mode: compute base priority for each item
      feedItems = feedItems.map((item) => ({
        ...item,
        sortPriority: this.algorithmService.computePriority(item),
      }));
    }

    this.logger.debug('Sorting by priority...');
    // Sort by priority (highest first)
    feedItems.sort((a, b) => b.sortPriority - a.sortPriority);

    this.logger.debug('Interleaving...');
    // Apply interleaving for diversity
    feedItems = this.algorithmService.interleave(feedItems);

    this.logger.debug('Applying cardinality limits...');
    // Apply cardinality limits to the full list (not per-page)
    feedItems = this.algorithmService.applyCardinalityLimits(
      feedItems,
      feedItems.length, // Apply limits globally, not per page
    );

    // Use post-cardinality count for accurate pagination
    const totalItems = feedItems.length;

    this.logger.debug('Paginating...');
    // Paginate
    const start = (page - 1) * limit;
    const paginatedItems = feedItems.slice(start, start + limit);

    // Inject approved company feed-native ads at positions 4 and 14
    try {
      const today = new Date().toISOString().split('T')[0];
      const companyAds = await this.companyAdRepository
        .createQueryBuilder('ad')
        .leftJoinAndSelect('ad.advertiser', 'advertiser')
        .where('ad.adType = :adType', { adType: CompanyAdType.FEED_NATIVE })
        .andWhere('ad.isApproved = true')
        .andWhere('ad.isActive = true')
        .andWhere('ad.status = :status', { status: 'approved' })
        .andWhere('(ad.startDate IS NULL OR ad.startDate <= :today)', { today })
        .andWhere('(ad.endDate IS NULL OR ad.endDate >= :today)', { today })
        .andWhere('(ad.impressions * ad.cpmNis / 1000) < ad.dailyBudgetNis OR ad.dailyBudgetNis = 0')
        .getMany();

      if (companyAds.length > 0) {
        const adItems: FeedItemDto[] = companyAds.map((ad) => ({
          id: `company-ad-${ad.id}`,
          type: FeedItemType.COMPANY_AD,
          publishedAt: ad.createdAt,
          isPinned: false,
          sortPriority: 0,
          companyAd: {
            adId: ad.id,
            advertiserName: ad.advertiser?.name || '',
            advertiserLogoUrl: ad.advertiser?.logoUrl || null,
            title: ad.title,
            contentHe: ad.contentHe,
            imageUrl: ad.imageUrl,
            ctaUrl: ad.ctaUrl,
            ctaLabelHe: ad.ctaLabelHe,
          },
        }));

        // Inject at positions 4 and 14 (0-indexed) if enough items exist
        if (paginatedItems.length > 4) {
          paginatedItems.splice(4, 0, adItems[0]);
        }
        if (adItems.length > 1 && paginatedItems.length > 14) {
          paginatedItems.splice(14, 0, adItems[1 % adItems.length]);
        } else if (adItems.length === 1 && paginatedItems.length > 14) {
          paginatedItems.splice(14, 0, adItems[0]);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to inject company ads: ${err.message}`);
    }

    // Inject approved candidate feed_sponsored ads at positions 8 and 20
    try {
      const today = new Date().toISOString().split('T')[0];
      const candidateAds = await this.candidateAdRepository
        .createQueryBuilder('ad')
        .leftJoinAndSelect('ad.candidate', 'candidate')
        .where('ad.placementType = :type', { type: AdPlacementType.FEED_SPONSORED })
        .andWhere('ad.isApproved = true')
        .andWhere('ad.isActive = true')
        .andWhere('ad.status = :status', { status: 'approved' })
        .andWhere('(ad.startDate IS NULL OR ad.startDate <= :today)', { today })
        .andWhere('(ad.endDate IS NULL OR ad.endDate >= :today)', { today })
        .andWhere('(ad.impressions * ad.cpmNis / 1000) < ad.dailyBudgetNis OR ad.dailyBudgetNis = 0')
        .getMany();

      if (candidateAds.length > 0) {
        // For article-linked ads: fetch full article data and emit as ARTICLE type with isSponsored=true
        // For other types: emit as CANDIDATE_AD type (uses ad's own title/image)
        const articleLinkedAds = candidateAds.filter(
          (ad) => ad.linkedContentType === 'article' && ad.linkedContentId,
        );
        const otherAds = candidateAds.filter(
          (ad) => !(ad.linkedContentType === 'article' && ad.linkedContentId),
        );

        // Batch-fetch full article data for article-linked ads
        const articleMap = new Map<string, any>();
        if (articleLinkedAds.length > 0) {
          const articleIdList = articleLinkedAds.map((ad) => ad.linkedContentId as string);
          const rawArticles = await this.articleRepository
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.category', 'category')
            .leftJoinAndSelect('a.authorEntity', 'authorEntity')
            .where('a.id IN (:...ids)', { ids: articleIdList })
            .getMany();
          const enriched = await this.enrichWithCommentCounts(rawArticles);
          enriched.forEach((a: any) => articleMap.set(a.id, a));
        }

        const adItems: FeedItemDto[] = [];

        // Article-linked ads → emit as real ARTICLE with isSponsored flag
        for (const ad of articleLinkedAds) {
          const article = articleMap.get(ad.linkedContentId!);
          if (!article) continue;
          adItems.push({
            id: article.id,
            type: FeedItemType.ARTICLE,
            publishedAt: article.publishedAt,
            isPinned: false,
            sortPriority: 0,
            article: {
              id: article.id,
              title: article.title,
              titleEn: article.titleEn,
              subtitle: article.subtitle,
              heroImageUrl: article.heroImageUrl,
              categoryId: article.categoryId || article.category?.id,
              categoryName: article.category?.name,
              categoryColor: article.category?.color,
              authorId: article.authorId || article.authorEntity?.id,
              memberIds: [],
              tagIds: [],
              isBreaking: article.isBreaking,
              viewCount: article.viewCount,
              commentCount: article.commentCount || 0,
              shareCount: article.shareCount,
              readingTimeMinutes: article.readingTimeMinutes,
              publishedAt: article.publishedAt,
              slug: article.slug,
              author: article.author,
              authorEntityName: article.authorEntity?.nameHe || article.authorEntity?.nameEn,
              isSponsored: true,
              sponsorName: ad.candidate?.fullName || '',
            },
          });
        }

        // Non-article ads → emit as CANDIDATE_AD with ad's own content
        for (const ad of otherAds) {
          adItems.push({
            id: `candidate-ad-${ad.id}`,
            type: FeedItemType.CANDIDATE_AD,
            publishedAt: ad.createdAt,
            isPinned: false,
            sortPriority: 0,
            candidateAd: {
              adId: ad.id,
              candidateName: ad.candidate?.fullName || '',
              candidatePhotoUrl: ad.candidate?.photoUrl || null,
              title: ad.title,
              contentHe: ad.contentHe,
              imageUrl: ad.imageUrl,
              linkedContentType: ad.linkedContentType,
              linkedContentId: ad.linkedContentId,
              linkedContentSlug: null,
              ctaUrl: ad.ctaUrl,
            },
          });
        }

        if (paginatedItems.length > 8) {
          paginatedItems.splice(8, 0, adItems[0]);
        }
        if (adItems.length > 1 && paginatedItems.length > 20) {
          paginatedItems.splice(20, 0, adItems[1 % adItems.length]);
        } else if (adItems.length === 1 && paginatedItems.length > 20) {
          paginatedItems.splice(20, 0, adItems[0]);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to inject candidate ads: ${err.message}`);
    }

    this.logger.debug(`Returning ${paginatedItems.length} items (total: ${totalItems}, mode: ${mode})`);
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
        mode,
      },
    };

    // Store in cache — short TTL for personalized feeds so interactions are reflected quickly
    const ttl = userId ? 30 * 1000 : deviceId ? 60 * 1000 : 2 * 60 * 1000;
    await this.cacheManager.set(cacheKey, result, ttl);
    this.logger.debug(`Cached result with key: ${cacheKey} (TTL: ${ttl / 1000}s)`);

    return result;
  }

  /**
   * Fetch published articles.
   *
   * @param categoryId - Optional category filter
   * @param deviceId - Device ID (unused, reserved for future personalization)
   * @param userId - User ID (unused here, used by caller for personalization)
   * @param includeRelations - When true, eagerly loads members and tags
   *   relations needed for personalized feed matching. Only enabled when
   *   personalization is active to avoid unnecessary JOINs on anonymous feeds.
   */
  private async fetchArticles(
    categoryId?: string,
    deviceId?: string,
    userId?: string,
    includeRelations?: boolean,
  ): Promise<Article[]> {
    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.authorEntity', 'authorEntity')
      .where('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .take(500); // Fetch all published articles for full pagination

    // Load member and tag relations for personalization matching
    if (includeRelations) {
      qb.leftJoinAndSelect('article.members', 'members');
      qb.leftJoinAndSelect('article.tags', 'tags');
    }

    if (categoryId) {
      qb.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    const articles = await qb.getMany();

    // Deduplicate articles by title (keep the most recent one)
    const seen = new Set<string>();
    const uniqueArticles = articles.filter((a) => {
      const key = a.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Batch-enrich with comment counts
    return this.enrichWithCommentCounts(uniqueArticles);
  }

  /**
   * Fetch active polls.
   * Only includes polls that are active AND not past their closing date.
   */
  private async fetchPolls(
    deviceId?: string,
    userId?: string,
  ): Promise<CommunityPoll[]> {
    const now = new Date();
    const qb = this.pollRepository
      .createQueryBuilder('poll')
      .where('poll.isActive = :isActive', { isActive: true })
      .andWhere(
        '(poll.closedAt IS NULL OR poll.closedAt > :now)',
        { now },
      );

    // Exclude polls the user has already voted on
    if (userId) {
      const votedPollIds = await this.pollVoteRepository
        .createQueryBuilder('vote')
        .select('vote.pollId')
        .where('vote.userId = :userId', { userId })
        .getRawMany();
      const ids = votedPollIds.map((v) => v.vote_pollId || v.pollId);
      if (ids.length > 0) {
        qb.andWhere('poll.id NOT IN (:...votedPollIds)', { votedPollIds: ids });
      }
    }

    return qb
      .orderBy('poll.createdAt', 'DESC')
      .take(10)
      .getMany();
  }

  /**
   * Fetch upcoming and ongoing events.
   * Includes events that haven't started yet, and events that have started
   * but whose endTime hasn't passed (ongoing events).
   * Excludes events that are fully in the past.
   */
  private async fetchEvents(
    deviceId?: string,
    userId?: string,
  ): Promise<CampaignEvent[]> {
    const now = new Date();
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.isActive = :isActive', { isActive: true })
      .andWhere(
        '(event.startTime >= :now OR (event.endTime IS NOT NULL AND event.endTime >= :now))',
        { now },
      );

    // Exclude events the user has RSVP'd to (going)
    if (userId) {
      const rsvpEventIds = await this.eventRsvpRepository
        .createQueryBuilder('rsvp')
        .select('rsvp.eventId')
        .where('rsvp.userId = :userId', { userId })
        .andWhere("rsvp.status = 'going'")
        .getRawMany();
      const ids = rsvpEventIds.map((r) => r.rsvp_eventId || r.eventId);
      if (ids.length > 0) {
        qb.andWhere('event.id NOT IN (:...rsvpEventIds)', { rsvpEventIds: ids });
      }
    }

    return qb
      .orderBy('event.startTime', 'ASC')
      .take(10)
      .getMany();
  }

  /**
   * Fetch active elections (with live results if available).
   * Excludes completed, cancelled, and draft elections.
   */
  private async fetchElections(): Promise<PrimaryElection[]> {
    const now = new Date();
    const allowedStatuses = [
      ElectionStatus.UPCOMING,
      ElectionStatus.ACTIVE,
      ElectionStatus.VOTING,
      ElectionStatus.COUNTING,
    ];
    return this.electionRepository
      .createQueryBuilder('election')
      .where('election.isActive = :isActive', { isActive: true })
      .andWhere('election.status IN (:...allowedStatuses)', { allowedStatuses })
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
    // Get elections that have active quiz questions, with question count in a single query
    const qb = this.electionRepository
      .createQueryBuilder('election')
      .addSelect('COUNT(q.id)', 'questionsCount')
      .innerJoin('quiz_questions', 'q', 'q.electionId = election.id AND q.isActive = true')
      .where('election.isActive = :electionActive', { electionActive: true });

    // Exclude quizzes the user has already completed
    if (userId) {
      const completedElectionIds = await this.quizResponseRepository
        .createQueryBuilder('response')
        .select('response.electionId')
        .where('response.userId = :userId', { userId })
        .getRawMany();
      const ids = completedElectionIds.map((r) => r.response_electionId || r.electionId);
      if (ids.length > 0) {
        qb.andWhere('election.id NOT IN (:...completedElectionIds)', { completedElectionIds: ids });
      }
    }

    const electionsWithQuiz = await qb
      .groupBy('election.id')
      .orderBy('election.createdAt', 'DESC')
      .take(3)
      .getRawAndEntities();

    // Merge question counts into election entities
    const countMap = new Map(
      electionsWithQuiz.raw.map((r: any) => [r.election_id, parseInt(r.questionsCount, 10)]),
    );
    for (const election of electionsWithQuiz.entities) {
      (election as any).questionsCount = countMap.get(election.id) || 0;
    }

    return electionsWithQuiz.entities;
  }

  /**
   * Fetch today's daily quiz as a feed item (if one exists and user hasn't completed it).
   */
  private async fetchDailyQuiz(userId?: string): Promise<FeedItemDto | null> {
    const today = new Date().toISOString().split('T')[0];

    const quiz = await this.dailyQuizRepository.findOne({
      where: { date: today, isActive: true },
    });

    if (!quiz) return null;

    // If user is logged in, check if they already completed today's quiz
    if (userId) {
      const attempt = await this.dailyQuizAttemptRepository.findOne({
        where: { userId, quizId: quiz.id },
      });
      if (attempt) {
        // User already completed — remove from feed
        return null;
      }
    }

    return {
      id: `daily-quiz-${quiz.id}`,
      type: FeedItemType.DAILY_QUIZ,
      publishedAt: quiz.createdAt,
      isPinned: true,
      sortPriority: 1200,
      dailyQuiz: {
        id: quiz.id,
        date: quiz.date,
        questionsCount: quiz.questions.length,
        pointsReward: quiz.pointsReward,
        userHasCompleted: false,
      },
    };
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
      categoryId: article.categoryId,
      authorId: article.authorId,
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
      // Preserve member/tag arrays for personalization matching
      members: article.members?.map((m: any) => ({ id: m.id })) || [],
      tags: article.tags?.map((t: any) => ({ id: t.id })) || [],
      commentCount: commentCountMap[article.id] || 0,
    }));
  }

  /**
   * Transform Article to FeedItemDto.
   *
   * Includes optional `categoryId`, `authorId`, `memberIds`, and `tagIds`
   * fields used by the personalization algorithm to match against user follows.
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
        categoryId: article.categoryId || article.category?.id,
        categoryName: article.category?.name,
        categoryColor: article.category?.color,
        authorId: article.authorId || article.authorEntity?.id,
        memberIds: article.members?.map((m: any) => m.id) || [],
        tagIds: article.tags?.map((t: any) => t.id) || [],
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
        userHasVoted: false, // Always false in feed (not tracked at feed level)
        votedOptionIndex: null, // User's voted option index (if voted), null otherwise
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
   * Transform Election to FeedItemDto with real turnout + candidate data.
   */
  private async transformElection(election: PrimaryElection): Promise<FeedItemDto> {
    const isLive = this.isElectionLive(election.electionDate);

    // Query real turnout data
    let turnoutPercentage = 0;
    let eligibleVoters = 0;
    let actualVoters = 0;

    try {
      const snapshots = await this.electionResultsService.getTurnout(election.id);
      const overall = snapshots.find((s) => !s.district);
      if (overall) {
        turnoutPercentage = overall.percentage;
        eligibleVoters = overall.eligibleVoters;
        actualVoters = overall.actualVoters;
      } else if (snapshots.length > 0) {
        eligibleVoters = snapshots.reduce((sum, s) => sum + s.eligibleVoters, 0);
        actualVoters = snapshots.reduce((sum, s) => sum + s.actualVoters, 0);
        turnoutPercentage = eligibleVoters > 0
          ? parseFloat(((actualVoters / eligibleVoters) * 100).toFixed(1))
          : 0;
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch turnout for election ${election.id}: ${err.message}`);
    }

    // Query real vote results (top 3 candidates)
    let topCandidates: { id: string; name: string; votesCount: number; percentage: number; imageUrl?: string }[] = [];

    try {
      const results = await this.electionResultsService.getResults(election.id);
      topCandidates = results.slice(0, 3).map((r) => ({
        id: r.candidate?.id ?? r.candidateId,
        name: r.candidate?.fullName ?? 'Unknown',
        votesCount: r.voteCount,
        percentage: r.percentage ?? 0,
        imageUrl: r.candidate?.photoUrl ?? undefined,
      }));
    } catch (err) {
      this.logger.warn(`Failed to fetch results for election ${election.id}: ${err.message}`);
    }

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
        electionNameEn: election.subtitle || election.title,
        turnoutPercentage,
        eligibleVoters,
        actualVoters,
        isLive,
        topCandidates,
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
      const feedItem = await this.transformElection(election);
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
   * Key format: feed:{mode}:{types}:{category}:{device}:{user}:page{X}:limit{Y}:v{version}
   */
  private generateCacheKey(query: QueryFeedDto, mode: FeedMode): string {
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

    // Get current version for this content type (0 if not set)
    const version = this.feedCacheVersion[typesStr] || 0;

    return `feed:${mode}:${typesStr}:cat${categoryStr}:dev${deviceStr}:usr${userStr}:p${page}:l${limit}:v${version}`;
  }

  /**
   * Invalidate feed cache.
   *
   * Call this when new content is published to ensure users see fresh data.
   * Uses cache versioning strategy: increments version number to invalidate.
   *
   * @param contentType - Optional: invalidate only specific content type caches
   * @param categoryId - Optional: invalidate only specific category caches (not used in current implementation)
   */
  async invalidateFeedCache(
    contentType?: FeedItemType,
    categoryId?: string,
  ): Promise<void> {
    try {
      // Determine which type key to invalidate
      const typeKey = contentType || 'all';

      // Increment version to invalidate all caches with this type
      // Using timestamp ensures unique version even if called multiple times quickly
      const newVersion = Date.now();
      this.feedCacheVersion[typeKey] = newVersion;

      this.logger.log(
        `Feed cache invalidated for type "${typeKey}" (new version: ${newVersion})`,
      );

      // Old cache entries will auto-expire with TTL (2-5 minutes)
      // New requests will use new version in cache key, effectively bypassing old cache
    } catch (error) {
      this.logger.error('Failed to invalidate feed cache', error);
    }
  }
}
