import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { UserFavorite } from './entities/user-favorite.entity';

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

describe('FavoritesService', () => {
  let service: FavoritesService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(UserFavorite),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    repository = module.get(getRepositoryToken(UserFavorite));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFavorite', () => {
    const dto = { deviceId: 'device-123', articleId: 'article-uuid-1' };

    it('should create and save a new favorite', async () => {
      const created = { id: 'fav-uuid', ...dto, createdAt: new Date() };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.addFavorite(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: dto.deviceId, articleId: dto.articleId },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('should throw ConflictException if duplicate exists', async () => {
      const existing = {
        id: 'fav-uuid',
        ...dto,
        createdAt: new Date(),
      };
      repository.findOne.mockResolvedValue(existing);

      await expect(service.addFavorite(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('should delete favorite by deviceId and articleId', async () => {
      repository.delete.mockResolvedValue({ affected: 1 });

      await service.removeFavorite('device-123', 'article-uuid-1');

      expect(repository.delete).toHaveBeenCalledWith({
        deviceId: 'device-123',
        articleId: 'article-uuid-1',
      });
    });

    it('should call delete even when no matching record exists', async () => {
      repository.delete.mockResolvedValue({ affected: 0 });

      await service.removeFavorite('device-123', 'nonexistent-article');

      expect(repository.delete).toHaveBeenCalledWith({
        deviceId: 'device-123',
        articleId: 'nonexistent-article',
      });
    });
  });

  describe('findByDevice', () => {
    it('should return paginated favorites', async () => {
      const favorites = [
        {
          id: 'fav-1',
          deviceId: 'device-123',
          articleId: 'art-1',
          article: { id: 'art-1', title: 'Article 1' },
          createdAt: new Date(),
        },
        {
          id: 'fav-2',
          deviceId: 'device-123',
          articleId: 'art-2',
          article: { id: 'art-2', title: 'Article 2' },
          createdAt: new Date(),
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([favorites, 2]);

      const result = await service.findByDevice('device-123', 1, 20);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('favorite');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'favorite.article',
        'article',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'favorite.deviceId = :deviceId',
        { deviceId: 'device-123' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'favorite.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({ data: favorites, total: 2 });
    });

    it('should calculate correct skip value for page 2', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findByDevice('device-456', 2, 10);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });
});
