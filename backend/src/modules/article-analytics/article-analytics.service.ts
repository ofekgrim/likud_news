import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleAnalytics, AnalyticsEventType } from './entities/article-analytics.entity';
import { Article } from '../articles/entities/article.entity';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class ArticleAnalyticsService {
  private readonly logger = new Logger(ArticleAnalyticsService.name);

  constructor(
    @InjectRepository(ArticleAnalytics)
    private readonly analyticsRepository: Repository<ArticleAnalytics>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  /**
   * Track an analytics event. Also fire-and-forget increment viewCount/shareCount on article.
   */
  async trackEvent(dto: TrackEventDto, deviceId?: string, userId?: string): Promise<ArticleAnalytics> {
    const record = this.analyticsRepository.create({
      articleId: dto.articleId,
      eventType: dto.eventType,
      ...(deviceId && { deviceId }),
      ...(userId && { userId }),
      ...(dto.platform && { platform: dto.platform }),
      ...(dto.referrer && { referrer: dto.referrer }),
      ...(dto.readTimeSeconds != null && { readTimeSeconds: dto.readTimeSeconds }),
      ...(dto.scrollDepthPercent != null && { scrollDepthPercent: dto.scrollDepthPercent }),
    } as Partial<ArticleAnalytics>);

    const saved = await this.analyticsRepository.save(record);

    // Fire-and-forget: increment counters on article
    if (dto.eventType === AnalyticsEventType.VIEW) {
      void this.articleRepository
        .createQueryBuilder()
        .update(Article)
        .set({ viewCount: () => '"viewCount" + 1' })
        .where('id = :id', { id: dto.articleId })
        .execute();
    } else if (dto.eventType === AnalyticsEventType.SHARE) {
      void this.articleRepository
        .createQueryBuilder()
        .update(Article)
        .set({ shareCount: () => '"shareCount" + 1' })
        .where('id = :id', { id: dto.articleId })
        .execute();
    }

    return saved;
  }

  /**
   * Get aggregated stats for a single article.
   */
  async getArticleStats(articleId: string, dateFrom?: string, dateTo?: string): Promise<Record<string, number>> {
    const qb = this.analyticsRepository
      .createQueryBuilder('a')
      .select('a.eventType', 'eventType')
      .addSelect('COUNT(*)::int', 'count')
      .where('a.articleId = :articleId', { articleId })
      .groupBy('a.eventType');

    if (dateFrom) qb.andWhere('a.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('a.createdAt <= :dateTo', { dateTo });

    const rows = await qb.getRawMany();
    const stats: Record<string, number> = {};
    for (const row of rows) {
      stats[row.eventType] = row.count;
    }
    return stats;
  }

  /**
   * Top articles by a specific event type within a period.
   */
  async getTopArticles(
    eventType: string = 'view',
    period: string = 'all_time',
    limit: number = 20,
  ): Promise<Array<{ articleId: string; title: string; heroImageUrl: string; count: number }>> {
    const qb = this.analyticsRepository
      .createQueryBuilder('a')
      .select('a.articleId', 'articleId')
      .addSelect('art.title', 'title')
      .addSelect('art.heroImageUrl', 'heroImageUrl')
      .addSelect('COUNT(*)::int', 'count')
      .innerJoin(Article, 'art', 'art.id = a.articleId')
      .where('a.eventType = :eventType', { eventType })
      .groupBy('a.articleId')
      .addGroupBy('art.title')
      .addGroupBy('art.heroImageUrl')
      .orderBy('"count"', 'DESC')
      .limit(limit);

    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      qb.andWhere('a.createdAt >= :since', { since: weekAgo });
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      qb.andWhere('a.createdAt >= :since', { since: monthAgo });
    }

    return qb.getRawMany();
  }

  /**
   * Daily trend for a specific article and event type.
   */
  async getDailyTrend(
    articleId: string,
    eventType: string = 'view',
    days: number = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.analyticsRepository
      .createQueryBuilder('a')
      .select("TO_CHAR(a.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)::int', 'count')
      .where('a.articleId = :articleId', { articleId })
      .andWhere('a.eventType = :eventType', { eventType })
      .andWhere('a.createdAt >= :since', { since })
      .groupBy("TO_CHAR(a.createdAt, 'YYYY-MM-DD')")
      .orderBy('"date"', 'ASC')
      .getRawMany();

    return rows;
  }

  /**
   * Overview stats (total counts per event type) across all articles.
   */
  async getOverviewStats(dateFrom?: string, dateTo?: string): Promise<Record<string, number>> {
    const qb = this.analyticsRepository
      .createQueryBuilder('a')
      .select('a.eventType', 'eventType')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('a.eventType');

    if (dateFrom) qb.andWhere('a.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('a.createdAt <= :dateTo', { dateTo });

    const rows = await qb.getRawMany();
    const stats: Record<string, number> = {};
    for (const row of rows) {
      stats[row.eventType] = row.count;
    }
    return stats;
  }

  /**
   * Referrer breakdown for a specific article or all articles.
   */
  async getReferrerBreakdown(articleId?: string): Promise<Array<{ referrer: string; count: number }>> {
    const qb = this.analyticsRepository
      .createQueryBuilder('a')
      .select('COALESCE(a.referrer, \'direct\')', 'referrer')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('a.referrer')
      .orderBy('"count"', 'DESC');

    if (articleId) {
      qb.where('a.articleId = :articleId', { articleId });
    }

    return qb.getRawMany();
  }
}
