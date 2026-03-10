import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationAnalyticsService } from './notification-analytics.service';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationReceipt } from './entities/notification-receipt.entity';
import { NotificationLogStatus } from './enums/notification.enums';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
  findAndCount: jest.fn(),
});

const mockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
});

describe('NotificationAnalyticsService', () => {
  let service: NotificationAnalyticsService;
  let logRepo: jest.Mocked<Repository<NotificationLog>>;
  let receiptRepo: jest.Mocked<Repository<NotificationReceipt>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationAnalyticsService,
        { provide: getRepositoryToken(NotificationLog), useFactory: mockRepository },
        { provide: getRepositoryToken(NotificationReceipt), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<NotificationAnalyticsService>(NotificationAnalyticsService);
    logRepo = module.get(getRepositoryToken(NotificationLog));
    receiptRepo = module.get(getRepositoryToken(NotificationReceipt));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalytics', () => {
    function setupQueryBuilderMocks(
      totals: Record<string, string | null>,
      byContentType: { contentType: string; count: string }[],
      byDay: { date: string; count: string }[],
      recentLogs: NotificationLog[] = [],
    ) {
      // Each createQueryBuilder call returns a fresh mock with chaining
      const totalsQb = mockQueryBuilder();
      totalsQb.getRawOne.mockResolvedValue(totals);

      const contentTypeQb = mockQueryBuilder();
      contentTypeQb.getRawMany.mockResolvedValue(byContentType);

      const byDayQb = mockQueryBuilder();
      byDayQb.getRawMany.mockResolvedValue(byDay);

      logRepo.createQueryBuilder
        .mockReturnValueOnce(totalsQb as any)   // totals query
        .mockReturnValueOnce(contentTypeQb as any) // byContentType query
        .mockReturnValueOnce(byDayQb as any);      // byDay query

      logRepo.find.mockResolvedValue(recentLogs);
    }

    it('should return aggregated analytics with correct rates', async () => {
      setupQueryBuilderMocks(
        { totalSent: '100', totalFailed: '5', totalOpened: '40', totalTargeted: '120' },
        [
          { contentType: 'article', count: '60' },
          { contentType: 'poll', count: '40' },
        ],
        [
          { date: '2026-03-08', count: '50' },
          { date: '2026-03-09', count: '50' },
        ],
      );

      const result = await service.getAnalytics(30);

      expect(result.totalSent).toBe(100);
      expect(result.totalFailed).toBe(5);
      expect(result.totalOpened).toBe(40);
      expect(result.totalDelivered).toBe(95); // 100 - 5
      expect(result.openRate).toBeCloseTo(40); // (40/100) * 100
      expect(result.deliveryRate).toBeCloseTo(83.33, 1); // (100/120) * 100
      expect(result.byContentType).toHaveLength(2);
      expect(result.byDay).toHaveLength(2);
    });

    it('should handle zero-division when totalSent is 0', async () => {
      setupQueryBuilderMocks(
        { totalSent: '0', totalFailed: '0', totalOpened: '0', totalTargeted: '0' },
        [],
        [],
      );

      const result = await service.getAnalytics(30);

      expect(result.totalSent).toBe(0);
      expect(result.totalDelivered).toBe(0);
      expect(result.openRate).toBe(0);
      expect(result.deliveryRate).toBe(0);
      expect(result.byContentType).toEqual([]);
      expect(result.byDay).toEqual([]);
    });

    it('should handle null totals from database', async () => {
      setupQueryBuilderMocks(
        { totalSent: null, totalFailed: null, totalOpened: null, totalTargeted: null },
        [],
        [],
      );

      const result = await service.getAnalytics();

      expect(result.totalSent).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.totalOpened).toBe(0);
      expect(result.totalDelivered).toBe(0);
      expect(result.openRate).toBe(0);
      expect(result.deliveryRate).toBe(0);
    });

    it('should pass the correct date filter based on days parameter', async () => {
      const totalsQb = mockQueryBuilder();
      totalsQb.getRawOne.mockResolvedValue({
        totalSent: '10', totalFailed: '0', totalOpened: '5', totalTargeted: '10',
      });

      const contentTypeQb = mockQueryBuilder();
      contentTypeQb.getRawMany.mockResolvedValue([]);

      const byDayQb = mockQueryBuilder();
      byDayQb.getRawMany.mockResolvedValue([]);

      logRepo.createQueryBuilder
        .mockReturnValueOnce(totalsQb as any)
        .mockReturnValueOnce(contentTypeQb as any)
        .mockReturnValueOnce(byDayQb as any);

      logRepo.find.mockResolvedValue([]);

      await service.getAnalytics(7);

      // Verify the totals query builder was called with status filter
      expect(totalsQb.andWhere).toHaveBeenCalledWith(
        'log.status IN (:...statuses)',
        { statuses: [NotificationLogStatus.SENT, NotificationLogStatus.SENDING] },
      );

      // Verify recent logs query uses SENT status
      expect(logRepo.find).toHaveBeenCalledWith({
        where: { status: NotificationLogStatus.SENT },
        order: { sentAt: 'DESC' },
        take: 10,
        relations: ['template'],
      });
    });
  });
});
