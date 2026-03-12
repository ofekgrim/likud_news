import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationAudienceService } from './notification-audience.service';
import { PushToken } from '../push/entities/push-token.entity';
import { PushService } from '../push/push.service';
import { AudienceRulesDto } from './dto/audience-rules.dto';

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
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getCount: jest.fn(),
});

describe('NotificationAudienceService', () => {
  let service: NotificationAudienceService;
  let pushTokenRepo: jest.Mocked<Repository<PushToken>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationAudienceService,
        { provide: getRepositoryToken(PushToken), useFactory: mockRepository },
        { provide: PushService, useValue: { isInQuietHours: jest.fn().mockReturnValue(false), checkFrequencyCap: jest.fn().mockResolvedValue(true), incrementFrequencyCount: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<NotificationAudienceService>(NotificationAudienceService);
    pushTokenRepo = module.get(getRepositoryToken(PushToken));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveAudience', () => {
    it('should return all active tokens when type is "all"', async () => {
      const tokens = [
        { id: 'token-1', token: 'fcm-1', isActive: true },
        { id: 'token-2', token: 'fcm-2', isActive: true },
      ] as PushToken[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(tokens);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.resolveAudience({ type: 'all' });

      expect(pushTokenRepo.createQueryBuilder).toHaveBeenCalledWith('token');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('token.user', 'appUser');
      expect(qb.where).toHaveBeenCalledWith('token.isActive = :active', { active: true });
      expect(qb.getMany).toHaveBeenCalled();
      expect(result).toEqual(tokens);
      expect(result).toHaveLength(2);
    });

    it('should filter by userIds when type is "specific_users"', async () => {
      const userIds = ['user-1', 'user-2'];
      const tokens = [
        { id: 'token-1', userId: 'user-1', token: 'fcm-1' },
      ] as PushToken[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(tokens);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.resolveAudience({
        type: 'specific_users',
        userIds,
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'token.userId IN (:...userIds)',
        { userIds },
      );
      expect(result).toEqual(tokens);
      expect(result).toHaveLength(1);
    });

    it('should apply exclusion logic with excludeUserIds', async () => {
      const excludeUserIds = ['user-99'];
      const tokens = [
        { id: 'token-1', token: 'fcm-1', isActive: true },
      ] as PushToken[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(tokens);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.resolveAudience({
        type: 'all',
        excludeUserIds,
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(token.userId IS NULL OR token.userId NOT IN (:...excludeIds))',
        { excludeIds: excludeUserIds },
      );
      expect(result).toEqual(tokens);
    });

    it('should apply role and platform filters for targeted audience', async () => {
      const tokens = [
        { id: 'token-1', token: 'fcm-1' },
      ] as PushToken[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(tokens);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.resolveAudience({
        type: 'targeted',
        roles: ['admin'],
        platforms: ['ios'],
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'appUser.role IN (:...roles)',
        { roles: ['admin'] },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'token.platform IN (:...platforms)',
        { platforms: ['ios'] },
      );
    });

    it('should return empty array when no tokens match', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.resolveAudience({
        type: 'specific_users',
        userIds: ['nonexistent-user'],
      });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('resolveAudience — quiet hours and frequency cap', () => {
    it('should bypass quiet hours and frequency cap for breaking news', async () => {
      const tokens = [
        { id: 'token-1', userId: 'user-1', token: 'fcm-1', user: { id: 'user-1' } },
      ] as unknown as PushToken[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(tokens);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const pushService = new (jest.fn().mockImplementation(() => ({
        isInQuietHours: jest.fn().mockReturnValue(true),  // normally filtered
        checkFrequencyCap: jest.fn().mockResolvedValue(false), // normally filtered
        incrementFrequencyCount: jest.fn(),
      })))() as any;

      // Re-create service with custom push service to verify breaking bypasses filters
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationAudienceService,
          { provide: getRepositoryToken(PushToken), useValue: pushTokenRepo },
          { provide: PushService, useValue: pushService },
        ],
      }).compile();

      const svc = module.get<NotificationAudienceService>(NotificationAudienceService);

      const result = await svc.resolveAudience({
        type: 'all',
        notificationPrefKey: 'breakingNews',
      });

      // Breaking news should bypass both quiet hours and frequency cap
      expect(result).toHaveLength(1);
      expect(pushService.isInQuietHours).not.toHaveBeenCalled();
      expect(pushService.checkFrequencyCap).not.toHaveBeenCalled();
    });

    it('should filter out users in quiet hours for non-breaking notifications', async () => {
      const tokens = [
        { id: 'token-1', userId: 'user-1', token: 'fcm-1', user: { id: 'user-1' } },
        { id: 'token-2', userId: 'user-2', token: 'fcm-2', user: { id: 'user-2' } },
      ] as unknown as PushToken[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(tokens);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const pushService = new (jest.fn().mockImplementation(() => ({
        isInQuietHours: jest.fn()
          .mockReturnValueOnce(true)  // user-1 in quiet hours
          .mockReturnValueOnce(false), // user-2 not in quiet hours
        checkFrequencyCap: jest.fn().mockResolvedValue(true),
        incrementFrequencyCount: jest.fn(),
      })))() as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationAudienceService,
          { provide: getRepositoryToken(PushToken), useValue: pushTokenRepo },
          { provide: PushService, useValue: pushService },
        ],
      }).compile();

      const svc = module.get<NotificationAudienceService>(NotificationAudienceService);

      const result = await svc.resolveAudience({
        type: 'all',
        notificationPrefKey: 'events',
      });

      // Only user-2 should pass (user-1 filtered by quiet hours)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('token-2');
    });

    it('should filter out users exceeding frequency cap', async () => {
      const tokens = [
        { id: 'token-1', userId: 'user-1', token: 'fcm-1', user: { id: 'user-1' } },
      ] as unknown as PushToken[];

      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(tokens);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const pushService = new (jest.fn().mockImplementation(() => ({
        isInQuietHours: jest.fn().mockReturnValue(false),
        checkFrequencyCap: jest.fn().mockResolvedValue(false), // over cap
        incrementFrequencyCount: jest.fn(),
      })))() as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationAudienceService,
          { provide: getRepositoryToken(PushToken), useValue: pushTokenRepo },
          { provide: PushService, useValue: pushService },
        ],
      }).compile();

      const svc = module.get<NotificationAudienceService>(NotificationAudienceService);

      const result = await svc.resolveAudience({
        type: 'all',
        notificationPrefKey: 'events',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('resolveAudience — notification preference filters', () => {
    it('should filter by typed notification preference column', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.resolveAudience({
        type: 'all',
        notificationPrefKey: 'events',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('appUser."notifEvents" = true');
    });

    it('should use JSONB fallback for unrecognized preference keys', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.resolveAudience({
        type: 'all',
        notificationPrefKey: 'customPref',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        `appUser."notificationPrefs" ->> :prefKey = 'true'`,
        { prefKey: 'customPref' },
      );
    });

    it('should filter by membershipStatuses for targeted audience', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.resolveAudience({
        type: 'targeted',
        membershipStatuses: ['active', 'pending'],
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'appUser.membershipStatus IN (:...statuses)',
        { statuses: ['active', 'pending'] },
      );
    });

    it('should filter by preferredCategories for targeted audience', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.resolveAudience({
        type: 'targeted',
        preferredCategories: ['cat-uuid-1', 'cat-uuid-2'],
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'appUser.preferredCategories && :cats',
        { cats: ['cat-uuid-1', 'cat-uuid-2'] },
      );
    });
  });

  describe('countAudience', () => {
    it('should return count for type "all"', async () => {
      const qb = mockQueryBuilder();
      qb.getCount.mockResolvedValue(150);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.countAudience({ type: 'all' });

      expect(qb.where).toHaveBeenCalledWith('token.isActive = :active', { active: true });
      expect(qb.getCount).toHaveBeenCalled();
      expect(result).toBe(150);
    });

    it('should return count with exclusions applied', async () => {
      const qb = mockQueryBuilder();
      qb.getCount.mockResolvedValue(98);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.countAudience({
        type: 'all',
        excludeUserIds: ['user-1', 'user-2'],
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(token.userId IS NULL OR token.userId NOT IN (:...excludeIds))',
        { excludeIds: ['user-1', 'user-2'] },
      );
      expect(result).toBe(98);
    });

    it('should return zero when no tokens match', async () => {
      const qb = mockQueryBuilder();
      qb.getCount.mockResolvedValue(0);
      pushTokenRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.countAudience({
        type: 'specific_users',
        userIds: ['nonexistent'],
      });

      expect(result).toBe(0);
    });
  });
});
