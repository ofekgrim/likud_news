import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { Article, ArticleStatus } from './entities/article.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  softRemove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
});

describe('ArticlesService', () => {
  let service: ArticlesService;
  let repository: jest.Mocked<Repository<Article>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    repository = module.get(getRepositoryToken(Article));
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

      const query = { page: 1, limit: 20 } as any;
      const result = await service.findAll(query);

      expect(result).toEqual({
        data: articles,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
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
    it('should return article and increment view count', async () => {
      const article = { id: 'uuid-1', slug: 'test', viewCount: 5 } as Article;

      const mockQbFind = mockQueryBuilder();
      mockQbFind.getOne.mockResolvedValue(article);

      const mockQbIncrement = mockQueryBuilder();
      mockQbIncrement.execute.mockResolvedValue(undefined);

      repository.createQueryBuilder
        .mockReturnValueOnce(mockQbFind as any)
        .mockReturnValueOnce(mockQbIncrement as any);

      const result = await service.findBySlug('test');

      expect(result).toEqual(article);
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
      expect(mockQbFind.where).toHaveBeenCalledWith('article.slug = :slug', {
        slug: 'test',
      });
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
        relations: ['category', 'members', 'media'],
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
        relations: ['category', 'members', 'media'],
      });
      expect(repository.softRemove).toHaveBeenCalledWith(article);
    });
  });
});
