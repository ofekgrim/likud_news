import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ArticleAnalyticsService } from './article-analytics.service';
import { ArticleAnalytics, AnalyticsEventType } from './entities/article-analytics.entity';
import { Article } from '../articles/entities/article.entity';

const mockAnalyticsQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
};

const mockArticleQueryBuilder = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue(undefined),
};

const mockAnalyticsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockAnalyticsQueryBuilder),
});

const mockArticleRepository = () => ({
  createQueryBuilder: jest.fn().mockReturnValue(mockArticleQueryBuilder),
});

describe('ArticleAnalyticsService', () => {
  let service: ArticleAnalyticsService;
  let analyticsRepo: ReturnType<typeof mockAnalyticsRepository>;
  let articleRepo: ReturnType<typeof mockArticleRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleAnalyticsService,
        {
          provide: getRepositoryToken(ArticleAnalytics),
          useFactory: mockAnalyticsRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useFactory: mockArticleRepository,
        },
      ],
    }).compile();

    service = module.get<ArticleAnalyticsService>(ArticleAnalyticsService);
    analyticsRepo = module.get(getRepositoryToken(ArticleAnalytics));
    articleRepo = module.get(getRepositoryToken(Article));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackEvent', () => {
    const dto = {
      articleId: 'article-uuid-1',
      eventType: AnalyticsEventType.VIEW,
    };

    it('should create and save an analytics entry', async () => {
      const record = { id: 'analytics-uuid', ...dto, createdAt: new Date() };
      analyticsRepo.create.mockReturnValue(record);
      analyticsRepo.save.mockResolvedValue(record);

      const result = await service.trackEvent(dto, 'device-123');

      expect(analyticsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          articleId: dto.articleId,
          eventType: dto.eventType,
          deviceId: 'device-123',
        }),
      );
      expect(analyticsRepo.save).toHaveBeenCalledWith(record);
      expect(result).toEqual(record);
    });

    it('should increment article viewCount for VIEW events', async () => {
      const record = { id: 'analytics-uuid', ...dto, createdAt: new Date() };
      analyticsRepo.create.mockReturnValue(record);
      analyticsRepo.save.mockResolvedValue(record);

      await service.trackEvent(dto);

      expect(articleRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockArticleQueryBuilder.update).toHaveBeenCalledWith(Article);
      expect(mockArticleQueryBuilder.set).toHaveBeenCalledWith({
        viewCount: expect.any(Function),
      });
      expect(mockArticleQueryBuilder.where).toHaveBeenCalledWith(
        'id = :id',
        { id: dto.articleId },
      );
    });

    it('should increment article shareCount for SHARE events', async () => {
      const shareDto = {
        articleId: 'article-uuid-1',
        eventType: AnalyticsEventType.SHARE,
        platform: 'twitter',
      };
      const record = { id: 'analytics-uuid', ...shareDto, createdAt: new Date() };
      analyticsRepo.create.mockReturnValue(record);
      analyticsRepo.save.mockResolvedValue(record);

      await service.trackEvent(shareDto);

      expect(articleRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockArticleQueryBuilder.set).toHaveBeenCalledWith({
        shareCount: expect.any(Function),
      });
    });
  });

  describe('getArticleStats', () => {
    it('should return event counts grouped by event type', async () => {
      const rawRows = [
        { eventType: 'view', count: 150 },
        { eventType: 'share', count: 12 },
      ];
      mockAnalyticsQueryBuilder.getRawMany.mockResolvedValue(rawRows);

      const result = await service.getArticleStats('article-uuid-1');

      expect(analyticsRepo.createQueryBuilder).toHaveBeenCalledWith('a');
      expect(mockAnalyticsQueryBuilder.where).toHaveBeenCalledWith(
        'a.articleId = :articleId',
        { articleId: 'article-uuid-1' },
      );
      expect(result).toEqual({ view: 150, share: 12 });
    });
  });

  describe('getTopArticles', () => {
    it('should return articles ordered by count descending', async () => {
      const rawRows = [
        { articleId: 'a1', title: 'Top Article', heroImageUrl: 'img.jpg', count: 500 },
        { articleId: 'a2', title: 'Second Article', heroImageUrl: 'img2.jpg', count: 300 },
      ];
      mockAnalyticsQueryBuilder.getRawMany.mockResolvedValue(rawRows);

      const result = await service.getTopArticles('view', 'all_time', 20);

      expect(mockAnalyticsQueryBuilder.where).toHaveBeenCalledWith(
        'a.eventType = :eventType',
        { eventType: 'view' },
      );
      expect(mockAnalyticsQueryBuilder.orderBy).toHaveBeenCalledWith('"count"', 'DESC');
      expect(mockAnalyticsQueryBuilder.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual(rawRows);
    });
  });

  describe('getDailyTrend', () => {
    it('should return date-count pairs ordered by date ascending', async () => {
      const rawRows = [
        { date: '2026-03-08', count: 45 },
        { date: '2026-03-09', count: 62 },
        { date: '2026-03-10', count: 38 },
      ];
      mockAnalyticsQueryBuilder.getRawMany.mockResolvedValue(rawRows);

      const result = await service.getDailyTrend('article-uuid-1', 'view', 30);

      expect(mockAnalyticsQueryBuilder.where).toHaveBeenCalledWith(
        'a.articleId = :articleId',
        { articleId: 'article-uuid-1' },
      );
      expect(mockAnalyticsQueryBuilder.andWhere).toHaveBeenCalledWith(
        'a.eventType = :eventType',
        { eventType: 'view' },
      );
      expect(mockAnalyticsQueryBuilder.orderBy).toHaveBeenCalledWith('"date"', 'ASC');
      expect(result).toEqual(rawRows);
    });
  });

  describe('getOverviewStats', () => {
    it('should return global counts per event type', async () => {
      const rawRows = [
        { eventType: 'view', count: 5000 },
        { eventType: 'share', count: 200 },
        { eventType: 'favorite', count: 350 },
      ];
      mockAnalyticsQueryBuilder.getRawMany.mockResolvedValue(rawRows);

      const result = await service.getOverviewStats();

      expect(mockAnalyticsQueryBuilder.groupBy).toHaveBeenCalledWith('a.eventType');
      expect(result).toEqual({ view: 5000, share: 200, favorite: 350 });
    });
  });

  describe('getReferrerBreakdown', () => {
    it('should return referrer counts ordered by count descending', async () => {
      const rawRows = [
        { referrer: 'home_feed', count: 300 },
        { referrer: 'push', count: 120 },
        { referrer: 'direct', count: 80 },
      ];
      mockAnalyticsQueryBuilder.getRawMany.mockResolvedValue(rawRows);

      const result = await service.getReferrerBreakdown('article-uuid-1');

      expect(mockAnalyticsQueryBuilder.where).toHaveBeenCalledWith(
        'a.articleId = :articleId',
        { articleId: 'article-uuid-1' },
      );
      expect(mockAnalyticsQueryBuilder.orderBy).toHaveBeenCalledWith('"count"', 'DESC');
      expect(result).toEqual(rawRows);
    });
  });
});
