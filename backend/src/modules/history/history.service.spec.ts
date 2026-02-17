import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { ReadingHistory } from './entities/reading-history.entity';

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
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

describe('HistoryService', () => {
  let service: HistoryService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: getRepositoryToken(ReadingHistory),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
    repository = module.get(getRepositoryToken(ReadingHistory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordRead', () => {
    const dto = { deviceId: 'device-123', articleId: 'article-uuid-1' };

    it('should create a new history record when none exists', async () => {
      const created = {
        id: 'history-uuid',
        ...dto,
        readAt: new Date(),
      };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.recordRead(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: dto.deviceId, articleId: dto.articleId },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('should update existing record readAt timestamp', async () => {
      const oldDate = new Date('2025-01-01');
      const existing = {
        id: 'history-uuid',
        ...dto,
        readAt: oldDate,
      } as ReadingHistory;
      repository.findOne.mockResolvedValue(existing);
      repository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.recordRead(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: dto.deviceId, articleId: dto.articleId },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(result.readAt).not.toEqual(oldDate);
      expect(result.readAt).toBeInstanceOf(Date);
      expect(repository.save).toHaveBeenCalledWith(existing);
    });

    it('should pass correct deviceId and articleId to findOne', async () => {
      const specificDto = {
        deviceId: 'specific-device-xyz',
        articleId: 'specific-article-abc',
      };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({ id: 'new', ...specificDto });
      repository.save.mockResolvedValue({ id: 'new', ...specificDto });

      await service.recordRead(specificDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          deviceId: 'specific-device-xyz',
          articleId: 'specific-article-abc',
        },
      });
    });
  });

  describe('findByDevice', () => {
    it('should return paginated history ordered by readAt DESC', async () => {
      const historyItems = [
        {
          id: 'h-1',
          deviceId: 'device-123',
          articleId: 'art-1',
          article: { id: 'art-1', title: 'Article 1' },
          readAt: new Date('2025-06-02'),
        },
        {
          id: 'h-2',
          deviceId: 'device-123',
          articleId: 'art-2',
          article: { id: 'art-2', title: 'Article 2' },
          readAt: new Date('2025-06-01'),
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([historyItems, 2]);

      const result = await service.findByDevice('device-123', 1, 20);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('history');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'history.article',
        'article',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'history.deviceId = :deviceId',
        { deviceId: 'device-123' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'history.readAt',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({ data: historyItems, total: 2 });
    });

    it('should handle empty results', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByDevice('device-no-history', 1, 10);

      expect(result).toEqual({ data: [], total: 0 });
    });

    it('should calculate correct skip value for pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findByDevice('device-123', 3, 15);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(30);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(15);
    });
  });
});
