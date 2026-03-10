import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookmarkFoldersService } from './bookmark-folders.service';
import { BookmarkFolder } from './entities/bookmark-folder.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';

const mockFolderQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
};

const mockFavoriteQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

const mockFolderRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockFolderQueryBuilder),
});

const mockFavoriteRepository = () => ({
  createQueryBuilder: jest.fn().mockReturnValue(mockFavoriteQueryBuilder),
});

describe('BookmarkFoldersService', () => {
  let service: BookmarkFoldersService;
  let folderRepo: ReturnType<typeof mockFolderRepository>;
  let favoriteRepo: ReturnType<typeof mockFavoriteRepository>;

  const userId = 'user-uuid-1';
  const folderId = 'folder-uuid-1';

  const folder: Partial<BookmarkFolder> = {
    id: folderId,
    userId,
    name: 'My Folder',
    color: '#0099DB',
    sortOrder: 0,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkFoldersService,
        {
          provide: getRepositoryToken(BookmarkFolder),
          useFactory: mockFolderRepository,
        },
        {
          provide: getRepositoryToken(UserFavorite),
          useFactory: mockFavoriteRepository,
        },
      ],
    }).compile();

    service = module.get<BookmarkFoldersService>(BookmarkFoldersService);
    folderRepo = module.get(getRepositoryToken(BookmarkFolder));
    favoriteRepo = module.get(getRepositoryToken(UserFavorite));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return folders for the given user', async () => {
      const folders = [folder, { ...folder, id: 'folder-uuid-2', name: 'Second' }];
      folderRepo.find.mockResolvedValue(folders);

      const result = await service.findAllByUser(userId);

      expect(folderRepo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toEqual(folders);
    });
  });

  describe('findOne', () => {
    it('should return the folder when it exists and belongs to the user', async () => {
      folderRepo.findOne.mockResolvedValue(folder);

      const result = await service.findOne(folderId, userId);

      expect(folderRepo.findOne).toHaveBeenCalledWith({ where: { id: folderId } });
      expect(result).toEqual(folder);
    });

    it('should throw NotFoundException when folder does not exist', async () => {
      folderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when folder belongs to another user', async () => {
      folderRepo.findOne.mockResolvedValue({ ...folder, userId: 'other-user' });

      await expect(service.findOne(folderId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create a folder with the next sortOrder', async () => {
      const dto = { name: 'New Folder', color: '#FF0000' };
      const created = { id: 'new-uuid', userId, ...dto, sortOrder: 3 };

      mockFolderQueryBuilder.getRawOne.mockResolvedValue({ max: 2 });
      folderRepo.create.mockReturnValue(created);
      folderRepo.save.mockResolvedValue(created);

      const result = await service.create(userId, dto);

      expect(folderRepo.create).toHaveBeenCalledWith({
        userId,
        name: dto.name,
        color: dto.color,
        sortOrder: 3,
      });
      expect(folderRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update folder name and color', async () => {
      const dto = { name: 'Renamed', color: '#00FF00' };
      const existing = { ...folder };
      const updated = { ...existing, ...dto };

      folderRepo.findOne.mockResolvedValue(existing);
      folderRepo.save.mockResolvedValue(updated);

      const result = await service.update(folderId, userId, dto);

      expect(folderRepo.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should unlink favorites and delete the folder', async () => {
      folderRepo.findOne.mockResolvedValue(folder);
      mockFavoriteQueryBuilder.execute.mockResolvedValue({ affected: 2 });
      folderRepo.remove.mockResolvedValue(folder);

      await service.remove(folderId, userId);

      expect(favoriteRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockFavoriteQueryBuilder.update).toHaveBeenCalled();
      expect(mockFavoriteQueryBuilder.set).toHaveBeenCalledWith({
        folderId: expect.any(Function),
      });
      expect(mockFavoriteQueryBuilder.where).toHaveBeenCalledWith(
        'folderId = :folderId',
        { folderId },
      );
      expect(folderRepo.remove).toHaveBeenCalledWith(folder);
    });
  });

  describe('getFolderFavorites', () => {
    it('should return paginated favorites for a folder', async () => {
      const favorites = [
        { id: 'fav-1', folderId, userId, articleId: 'art-1', article: { id: 'art-1' } },
        { id: 'fav-2', folderId, userId, articleId: 'art-2', article: { id: 'art-2' } },
      ];

      folderRepo.findOne.mockResolvedValue(folder);
      mockFavoriteQueryBuilder.getManyAndCount.mockResolvedValue([favorites, 2]);

      const result = await service.getFolderFavorites(folderId, userId, 1, 20);

      expect(favoriteRepo.createQueryBuilder).toHaveBeenCalledWith('fav');
      expect(mockFavoriteQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'fav.article',
        'article',
      );
      expect(mockFavoriteQueryBuilder.where).toHaveBeenCalledWith(
        'fav.folderId = :folderId',
        { folderId },
      );
      expect(mockFavoriteQueryBuilder.andWhere).toHaveBeenCalledWith(
        'fav.userId = :userId',
        { userId },
      );
      expect(mockFavoriteQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockFavoriteQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({ data: favorites, total: 2, page: 1, limit: 20 });
    });
  });
});
