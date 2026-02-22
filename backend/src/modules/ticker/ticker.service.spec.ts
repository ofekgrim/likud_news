import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TickerService } from './ticker.service';
import { TickerItem } from './entities/ticker-item.entity';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

describe('TickerService', () => {
  let service: TickerService;
  let repository: ReturnType<typeof mockRepository>;

  const mockTickerItem: Partial<TickerItem> = {
    id: 'uuid-1',
    text: 'מבזק חדשות ראשון',
    linkUrl: 'https://example.com/article/1',
    articleId: undefined,
    position: 0,
    isActive: true,
    expiresAt: undefined,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TickerService,
        {
          provide: getRepositoryToken(TickerItem),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TickerService>(TickerService);
    repository = module.get(getRepositoryToken(TickerItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a ticker item', async () => {
      const dto = {
        text: 'מבזק חדשות ראשון',
        linkUrl: 'https://example.com/article/1',
      };

      repository.create.mockReturnValue(mockTickerItem);
      repository.save.mockResolvedValue(mockTickerItem);

      const result = await service.create(dto as any);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockTickerItem);
      expect(result).toEqual(mockTickerItem);
    });
  });

  describe('findAll', () => {
    it('should return all items sorted by position', async () => {
      const items = [
        mockTickerItem,
        { ...mockTickerItem, id: 'uuid-2', position: 1 },
      ];
      repository.find.mockResolvedValue(items);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { position: 'ASC' },
      });
      expect(result).toEqual(items);
    });
  });

  describe('findActive', () => {
    it('should return only active non-expired items', async () => {
      const activeItems = [mockTickerItem];
      mockQueryBuilder.getMany.mockResolvedValue(activeItems);

      const result = await service.findActive();

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('ticker');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ticker.isActive = :isActive',
        { isActive: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticker.expiresAt IS NULL OR ticker.expiresAt > :now)',
        expect.objectContaining({ now: expect.any(Date) }),
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'ticker.position',
        'ASC',
      );
      expect(result).toEqual(activeItems);
    });
  });

  describe('findOne', () => {
    it('should return a ticker item by id', async () => {
      repository.findOne.mockResolvedValue(mockTickerItem);

      const result = await service.findOne('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(mockTickerItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reorder', () => {
    it('should update positions for all items', async () => {
      const orderedIds = ['uuid-3', 'uuid-1', 'uuid-2'];
      repository.update.mockResolvedValue({ affected: 1 });
      repository.find.mockResolvedValue([]);

      const result = await service.reorder(orderedIds);

      expect(repository.update).toHaveBeenCalledTimes(3);
      expect(repository.update).toHaveBeenCalledWith('uuid-3', { position: 0 });
      expect(repository.update).toHaveBeenCalledWith('uuid-1', { position: 1 });
      expect(repository.update).toHaveBeenCalledWith('uuid-2', { position: 2 });
      expect(repository.find).toHaveBeenCalledWith({
        order: { position: 'ASC' },
      });
    });
  });
});
