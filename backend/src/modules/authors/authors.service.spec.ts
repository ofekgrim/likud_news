import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';
import { Article } from '../articles/entities/article.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('AuthorsService', () => {
  let service: AuthorsService;
  let authorRepository: jest.Mocked<Repository<Author>>;
  let articleRepository: jest.Mocked<Repository<Article>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        { provide: getRepositoryToken(Author), useFactory: mockRepository },
        { provide: getRepositoryToken(Article), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    authorRepository = module.get(getRepositoryToken(Author));
    articleRepository = module.get(getRepositoryToken(Article));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create and save an author', async () => {
      const dto = {
        nameHe: 'ישראל ישראלי',
        nameEn: 'Israel Israeli',
        roleHe: 'כתב פוליטי',
      } as any;

      const author = { id: 'author-1', ...dto } as Author;

      authorRepository.create.mockReturnValue(author);
      authorRepository.save.mockResolvedValue(author);

      const result = await service.create(dto);

      expect(result).toEqual(author);
      expect(authorRepository.create).toHaveBeenCalledWith(dto);
      expect(authorRepository.save).toHaveBeenCalledWith(author);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all authors sorted by nameHe', async () => {
      const authors = [
        { id: '1', nameHe: 'אבי', isActive: true },
        { id: '2', nameHe: 'דוד', isActive: false },
      ] as Author[];

      authorRepository.find.mockResolvedValue(authors);

      const result = await service.findAll();

      expect(result).toEqual(authors);
      expect(authorRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { nameHe: 'ASC' },
      });
    });

    it('should return only active authors when activeOnly is true', async () => {
      const activeAuthors = [
        { id: '1', nameHe: 'אבי', isActive: true },
      ] as Author[];

      authorRepository.find.mockResolvedValue(activeAuthors);

      const result = await service.findAll(true);

      expect(result).toEqual(activeAuthors);
      expect(authorRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { nameHe: 'ASC' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return an author when found', async () => {
      const author = {
        id: 'author-1',
        nameHe: 'ישראל ישראלי',
      } as Author;

      authorRepository.findOne.mockResolvedValue(author);

      const result = await service.findOne('author-1');

      expect(result).toEqual(author);
      expect(authorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'author-1' },
      });
    });

    it('should throw NotFoundException when author not found', async () => {
      authorRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findArticlesById
  // ---------------------------------------------------------------------------
  describe('findArticlesById', () => {
    it('should return paginated articles by author with meta', async () => {
      const author = { id: 'author-1', nameHe: 'ישראל' } as Author;
      const articles = [
        { id: 'art-1', title: 'Article 1' },
        { id: 'art-2', title: 'Article 2' },
      ] as Article[];

      authorRepository.findOne.mockResolvedValue(author);

      const mockQb = mockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([articles, 15]);
      articleRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findArticlesById('author-1', 2, 5);

      expect(result).toEqual({
        data: articles,
        author,
        meta: { total: 15, page: 2, limit: 5 },
      });
      expect(articleRepository.createQueryBuilder).toHaveBeenCalledWith('article');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('article.category', 'category');
      expect(mockQb.where).toHaveBeenCalledWith('article.authorId = :id', { id: 'author-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('article.status = :status', { status: 'published' });
      expect(mockQb.orderBy).toHaveBeenCalledWith('article.publishedAt', 'DESC');
      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update author fields and save', async () => {
      const existingAuthor = {
        id: 'author-1',
        nameHe: 'Old Name',
        isActive: true,
      } as Author;

      const dto = { nameHe: 'Updated Name' } as any;

      authorRepository.findOne.mockResolvedValue(existingAuthor);
      authorRepository.save.mockImplementation(async (a) => a as Author);

      const result = await service.update('author-1', dto);

      expect(result.nameHe).toBe('Updated Name');
      expect(authorRepository.save).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete an author', async () => {
      const author = {
        id: 'author-1',
        nameHe: 'Author to remove',
      } as Author;

      authorRepository.findOne.mockResolvedValue(author);
      authorRepository.remove.mockResolvedValue(author);

      await service.remove('author-1');

      expect(authorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'author-1' },
      });
      expect(authorRepository.remove).toHaveBeenCalledWith(author);
    });
  });
});
