import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Tag, TagType } from './entities/tag.entity';
import { Article } from '../articles/entities/article.entity';

const mockArticleQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockTagRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockArticleRepository = () => ({
  createQueryBuilder: jest.fn().mockReturnValue(mockArticleQueryBuilder),
});

describe('TagsService', () => {
  let service: TagsService;
  let tagRepo: ReturnType<typeof mockTagRepository>;
  let articleRepo: ReturnType<typeof mockArticleRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useFactory: mockTagRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useFactory: mockArticleRepository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    tagRepo = module.get(getRepositoryToken(Tag));
    articleRepo = module.get(getRepositoryToken(Article));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new tag', async () => {
      const dto = { nameHe: 'פוליטיקה', slug: 'politics', tagType: TagType.TOPIC };
      const tag = { id: 'tag-uuid-1', ...dto, createdAt: new Date() } as Tag;

      tagRepo.findOne.mockResolvedValue(null);
      tagRepo.create.mockReturnValue(tag);
      tagRepo.save.mockResolvedValue(tag);

      const result = await service.create(dto);

      expect(tagRepo.findOne).toHaveBeenCalledWith({ where: { slug: 'politics' } });
      expect(tagRepo.create).toHaveBeenCalledWith(dto);
      expect(tagRepo.save).toHaveBeenCalledWith(tag);
      expect(result).toEqual(tag);
    });

    it('should throw ConflictException when slug already exists', async () => {
      const dto = { nameHe: 'פוליטיקה', slug: 'politics' };
      tagRepo.findOne.mockResolvedValue({ id: 'existing-uuid', slug: 'politics' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all tags sorted by nameHe', async () => {
      const tags = [
        { id: '1', nameHe: 'אבטחה', slug: 'security' },
        { id: '2', nameHe: 'פוליטיקה', slug: 'politics' },
      ] as Tag[];

      tagRepo.find.mockResolvedValue(tags);

      const result = await service.findAll();

      expect(tagRepo.find).toHaveBeenCalledWith({ order: { nameHe: 'ASC' } });
      expect(result).toEqual(tags);
    });
  });

  describe('findOne', () => {
    it('should return a tag by id', async () => {
      const tag = { id: 'tag-uuid-1', nameHe: 'פוליטיקה', slug: 'politics' } as Tag;
      tagRepo.findOne.mockResolvedValue(tag);

      const result = await service.findOne('tag-uuid-1');

      expect(tagRepo.findOne).toHaveBeenCalledWith({ where: { id: 'tag-uuid-1' } });
      expect(result).toEqual(tag);
    });

    it('should throw NotFoundException when tag not found', async () => {
      tagRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a tag by slug', async () => {
      const tag = { id: 'tag-uuid-1', nameHe: 'פוליטיקה', slug: 'politics' } as Tag;
      tagRepo.findOne.mockResolvedValue(tag);

      const result = await service.findBySlug('politics');

      expect(tagRepo.findOne).toHaveBeenCalledWith({ where: { slug: 'politics' } });
      expect(result).toEqual(tag);
    });

    it('should throw NotFoundException when slug not found', async () => {
      tagRepo.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and save a tag', async () => {
      const existing = { id: 'tag-uuid-1', nameHe: 'פוליטיקה', slug: 'politics' } as Tag;
      const updateDto = { nameHe: 'פוליטיקה ישראלית' };
      const updated = { ...existing, ...updateDto };

      tagRepo.findOne.mockResolvedValue(existing);
      tagRepo.save.mockResolvedValue(updated);

      const result = await service.update('tag-uuid-1', updateDto);

      expect(tagRepo.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });
  });

  describe('findArticlesBySlug', () => {
    it('should return paginated articles for a tag', async () => {
      const tag = { id: 'tag-uuid-1', nameHe: 'פוליטיקה', slug: 'politics' } as Tag;
      const articles = [
        { id: 'art-1', title: 'Article 1' },
        { id: 'art-2', title: 'Article 2' },
      ] as Article[];

      tagRepo.findOne.mockResolvedValue(tag);
      mockArticleQueryBuilder.getManyAndCount.mockResolvedValue([articles, 2]);

      const result = await service.findArticlesBySlug('politics', 1, 20);

      expect(articleRepo.createQueryBuilder).toHaveBeenCalledWith('article');
      expect(mockArticleQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'article.tags',
        'tag',
        'tag.id = :tagId',
        { tagId: tag.id },
      );
      expect(mockArticleQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockArticleQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        data: articles,
        tag,
        meta: { total: 2, page: 1, limit: 20 },
      });
    });
  });

  describe('remove', () => {
    it('should remove a tag by id', async () => {
      const tag = { id: 'tag-uuid-1', nameHe: 'פוליטיקה', slug: 'politics' } as Tag;
      tagRepo.findOne.mockResolvedValue(tag);
      tagRepo.remove.mockResolvedValue(tag);

      await service.remove('tag-uuid-1');

      expect(tagRepo.findOne).toHaveBeenCalledWith({ where: { id: 'tag-uuid-1' } });
      expect(tagRepo.remove).toHaveBeenCalledWith(tag);
    });
  });
});
