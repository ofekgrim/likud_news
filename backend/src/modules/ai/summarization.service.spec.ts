import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SummarizationService } from './summarization.service';
import { ArticleAiSummary } from './entities/article-ai-summary.entity';
import { Article } from '../articles/entities/article.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockQueryBuilder = () => ({
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
});

describe('SummarizationService', () => {
  let service: SummarizationService;
  let summaryRepository: ReturnType<typeof mockRepository>;
  let articleRepository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummarizationService,
        {
          provide: getRepositoryToken(ArticleAiSummary),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useFactory: mockRepository,
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SummarizationService>(SummarizationService);
    summaryRepository = module.get(getRepositoryToken(ArticleAiSummary));
    articleRepository = module.get(getRepositoryToken(Article));

    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue(undefined);
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getSummary ──────────────────────────────────────────────────────
  describe('getSummary', () => {
    it('should return null for unsummarized article', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      summaryRepository.findOne.mockResolvedValue(null);

      const result = await service.getSummary('article-1');

      expect(result).toBeNull();
    });

    it('should return cached summary on second call', async () => {
      const summary = {
        id: 'sum-1',
        articleId: 'article-1',
        summaryHe: 'Test summary',
        keyPointsHe: ['point 1', 'point 2'],
        modelUsed: 'dictalm-3.0',
        tokensUsed: 100,
      };

      // Simulate cache hit
      mockCacheManager.get.mockResolvedValue(summary);

      const result = await service.getSummary('article-1');

      expect(result).toEqual(summary);
      // Should not hit DB since cache returned data
      expect(summaryRepository.findOne).not.toHaveBeenCalled();
    });

    it('should cache result from DB and return it', async () => {
      const summary = {
        id: 'sum-1',
        articleId: 'article-1',
        summaryHe: 'Test summary',
        keyPointsHe: ['point 1'],
        modelUsed: 'dictalm-3.0',
        tokensUsed: 100,
      };

      mockCacheManager.get.mockResolvedValue(null);
      summaryRepository.findOne.mockResolvedValue(summary);

      const result = await service.getSummary('article-1');

      expect(result).toEqual(summary);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'ai:summary:article-1',
        summary,
        24 * 60 * 60 * 1000,
      );
    });
  });

  // ── summarizeArticle ────────────────────────────────────────────────
  describe('summarizeArticle', () => {
    it('should return existing summary if already summarized', async () => {
      const existing = {
        id: 'sum-1',
        articleId: 'article-1',
        summaryHe: 'Existing summary',
        keyPointsHe: ['point 1'],
        modelUsed: 'dictalm-3.0',
        tokensUsed: 50,
      };

      // getSummary returns cached
      mockCacheManager.get.mockResolvedValue(existing);

      const result = await service.summarizeArticle('article-1');

      expect(result).toEqual(existing);
      // Should not try to fetch article or call LLM
      expect(articleRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw when article not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      summaryRepository.findOne.mockResolvedValue(null);
      articleRepository.findOne.mockResolvedValue(null);

      await expect(service.summarizeArticle('nonexistent')).rejects.toThrow(
        'Article nonexistent not found',
      );
    });

    it('should throw when no LLM configured', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      summaryRepository.findOne.mockResolvedValue(null);
      articleRepository.findOne.mockResolvedValue({
        id: 'article-1',
        title: 'Test',
        subtitle: 'Sub',
        content: 'Content',
        isBreaking: false,
      });

      // No LLM client configured (configService returns undefined)
      await expect(service.summarizeArticle('article-1')).rejects.toThrow();
    });
  });

  // ── processUnsummarizedArticles (Cron) ──────────────────────────────
  describe('processUnsummarizedArticles', () => {
    it('should process unsummarized articles found by query', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      articleRepository.createQueryBuilder.mockReturnValue(qb);

      await service.processUnsummarizedArticles();

      expect(articleRepository.createQueryBuilder).toHaveBeenCalledWith('a');
      expect(qb.leftJoin).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('ais.id IS NULL');
      expect(qb.andWhere).toHaveBeenCalledWith("a.status = 'published'");
    });
  });
});
