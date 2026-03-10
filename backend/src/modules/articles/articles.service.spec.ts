import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { Article, ArticleStatus } from './entities/article.entity';
import { Tag } from '../tags/entities/tag.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { Comment } from '../comments/entities/comment.entity';
import { SseService } from '../sse/sse.service';
import { PushService } from '../push/push.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FeedService } from '../feed/feed.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  softRemove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
  update: jest.fn(),
});

const mockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
});

describe('ArticlesService', () => {
  let service: ArticlesService;
  let repository: jest.Mocked<Repository<Article>>;
  let commentRepository: jest.Mocked<Repository<Comment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useFactory: mockRepository },
        { provide: getRepositoryToken(Tag), useFactory: mockRepository },
        { provide: getRepositoryToken(UserFavorite), useFactory: mockRepository },
        { provide: getRepositoryToken(Comment), useFactory: mockRepository },
        { provide: SseService, useValue: { emitNewArticle: jest.fn(), emitBreaking: jest.fn() } },
        { provide: PushService, useValue: { sendToTopic: jest.fn() } },
        { provide: NotificationsService, useValue: { triggerContentNotification: jest.fn().mockResolvedValue(undefined) } },
        { provide: FeedService, useValue: { broadcastNewArticle: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    repository = module.get(getRepositoryToken(Article));
    commentRepository = module.get(getRepositoryToken(Comment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save an article', async () => {
      const dto = {
        title: 'Test Article',
        content: '<p>Content</p>',
        slug: 'test-article',
      } as any;

      const article = { id: 'uuid-1', ...dto } as Article;

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(article);
      repository.save.mockResolvedValue(article);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-article' },
        withDeleted: true,
      });
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Test Article',
        content: '<p>Content</p>',
        slug: 'test-article',
      });
      expect(repository.save).toHaveBeenCalledWith(article);
      expect(result).toEqual(article);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      const dto = {
        title: 'Test Article',
        content: '<p>Content</p>',
        slug: 'existing-slug',
      } as any;

      repository.findOne.mockResolvedValue({ id: 'existing' } as Article);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated articles', async () => {
      const mockQb = mockQueryBuilder();
      const articles = [
        { id: '1', title: 'Article 1' },
        { id: '2', title: 'Article 2' },
      ] as Article[];
      mockQb.getManyAndCount.mockResolvedValue([articles, 2]);
      repository.createQueryBuilder.mockReturnValue(mockQb as any);

      // Mock comment count query builder
      const commentQb = mockQueryBuilder();
      commentQb.getRawMany.mockResolvedValue([]);
      commentRepository.createQueryBuilder.mockReturnValue(commentQb as any);

      const query = { page: 1, limit: 20 } as any;
      const result = await service.findAll(query);

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(expect.objectContaining({ id: '1', commentCount: 0 }));
      expect(result.data[1]).toEqual(expect.objectContaining({ id: '2', commentCount: 0 }));
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith(
        'article.category',
        'category',
      );
      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'article.publishedAt',
        'DESC',
      );
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findBySlug', () => {
    it('should return article with related data and increment view count', async () => {
      const article = {
        id: 'uuid-1',
        slug: 'test',
        viewCount: 5,
        category: { name: 'Politics', color: '#0099DB' },
      } as unknown as Article;

      const mockQbFind = mockQueryBuilder();
      mockQbFind.getOne.mockResolvedValue(article);

      // Spy on internal methods to avoid deeply mocking their QB chains
      jest
        .spyOn(service as any, 'incrementViewCount')
        .mockResolvedValue(undefined);
      jest.spyOn(service as any, 'findRelated').mockResolvedValue([]);
      jest.spyOn(service as any, 'findSameCategory').mockResolvedValue([]);
      jest.spyOn(service as any, 'findRecommendations').mockResolvedValue([]);
      jest.spyOn(service as any, 'findLatest').mockResolvedValue([]);

      repository.createQueryBuilder.mockReturnValueOnce(mockQbFind as any);

      // Mock comment count and favorite check
      commentRepository.count.mockResolvedValue(0);

      const result = await service.findBySlug('test');

      expect(mockQbFind.leftJoinAndSelect).toHaveBeenCalledWith(
        'article.category',
        'category',
      );
      expect(mockQbFind.leftJoinAndSelect).toHaveBeenCalledWith(
        'article.members',
        'members',
      );
      expect(mockQbFind.leftJoinAndSelect).toHaveBeenCalledWith(
        'article.media',
        'media',
      );
      expect(mockQbFind.leftJoinAndSelect).toHaveBeenCalledWith(
        'article.authorEntity',
        'authorEntity',
      );
      expect(mockQbFind.leftJoinAndSelect).toHaveBeenCalledWith(
        'article.tags',
        'tags',
      );
      expect(mockQbFind.where).toHaveBeenCalledWith('article.slug = :slug', {
        slug: 'test',
      });

      // Result should include related arrays and category metadata
      expect(result).toEqual(
        expect.objectContaining({
          id: 'uuid-1',
          slug: 'test',
          relatedArticles: [],
          sameCategoryArticles: [],
          recommendedArticles: [],
          latestArticles: [],
          categoryName: 'Politics',
          categoryColor: '#0099DB',
        }),
      );
    });

    it('should throw NotFoundException when article not found by slug', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getOne.mockResolvedValue(null);
      repository.createQueryBuilder.mockReturnValue(mockQb as any);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findHero', () => {
    it('should return the hero article', async () => {
      const heroArticle = {
        id: 'uuid-hero',
        isHero: true,
        status: ArticleStatus.PUBLISHED,
      } as Article;

      const mockQb = mockQueryBuilder();
      mockQb.getOne.mockResolvedValue(heroArticle);
      repository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findHero();

      expect(result).toEqual(heroArticle);
      expect(mockQb.where).toHaveBeenCalledWith('article.isHero = :isHero', {
        isHero: true,
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'article.status = :status',
        { status: ArticleStatus.PUBLISHED },
      );
      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'article.publishedAt',
        'DESC',
      );
    });
  });

  describe('findOne', () => {
    it('should return article by id', async () => {
      const article = { id: 'uuid-1', title: 'Test' } as Article;
      repository.findOne.mockResolvedValue(article);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(article);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: ['category', 'members', 'media', 'authorEntity', 'tags'],
      });
    });

    it('should throw NotFoundException when article not found by id', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete an article', async () => {
      const article = { id: 'uuid-1', title: 'Test' } as Article;
      repository.findOne.mockResolvedValue(article);
      repository.softRemove.mockResolvedValue(article);

      await service.remove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: ['category', 'members', 'media', 'authorEntity', 'tags'],
      });
      expect(repository.softRemove).toHaveBeenCalledWith(article);
    });
  });
});
