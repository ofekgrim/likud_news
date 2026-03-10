import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationAudienceService } from './notification-audience.service';
import { PushToken } from '../push/entities/push-token.entity';

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
      expect(qb.leftJoin).toHaveBeenCalledWith('token.user', 'appUser');
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
