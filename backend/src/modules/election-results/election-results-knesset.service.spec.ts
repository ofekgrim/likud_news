import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ElectionResultsService } from './election-results.service';
import { ElectionResult } from './entities/election-result.entity';
import { TurnoutSnapshot } from './entities/turnout-snapshot.entity';
import { KnessetListSlot, KnessetSlotType } from './entities/knesset-list-slot.entity';
import { SseService } from '../sse/sse.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  clone: jest.fn(),
  setParameters: jest.fn().mockReturnThis(),
  getQuery: jest.fn().mockReturnValue('subquery'),
  getParameters: jest.fn().mockReturnValue({}),
});

const mockSseService = () => ({
  emitBreaking: jest.fn(),
  emitTicker: jest.fn(),
  emitPrimaries: jest.fn(),
});

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

describe('ElectionResultsService - Knesset List Assembly (extended)', () => {
  let service: ElectionResultsService;
  let resultRepository: jest.Mocked<Repository<ElectionResult>>;
  let slotRepository: jest.Mocked<Repository<KnessetListSlot>>;
  let cacheManager: typeof mockCacheManager;

  beforeEach(async () => {
    mockCacheManager.get.mockReset().mockResolvedValue(null);
    mockCacheManager.set.mockReset().mockResolvedValue(undefined);
    mockCacheManager.del.mockReset().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionResultsService,
        { provide: getRepositoryToken(ElectionResult), useFactory: mockRepository },
        { provide: getRepositoryToken(TurnoutSnapshot), useFactory: mockRepository },
        { provide: getRepositoryToken(KnessetListSlot), useFactory: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: SseService, useFactory: mockSseService },
      ],
    }).compile();

    service = module.get<ElectionResultsService>(ElectionResultsService);
    resultRepository = module.get(getRepositoryToken(ElectionResult));
    slotRepository = module.get(getRepositoryToken(KnessetListSlot));
    cacheManager = mockCacheManager;
  });

  // ===========================================================================
  // getAssembledList
  // ===========================================================================
  describe('getAssembledList', () => {
    const electionId = 'election-uuid-1';

    it('should return slots ordered by slotNumber ASC', async () => {
      const slots = [
        { id: 's1', electionId, slotNumber: 1, slotType: KnessetSlotType.LEADER, candidateId: 'c1' },
        { id: 's2', electionId, slotNumber: 2, slotType: KnessetSlotType.NATIONAL, candidateId: 'c2' },
        { id: 's3', electionId, slotNumber: 3, slotType: KnessetSlotType.DISTRICT, candidateId: 'c3' },
      ] as unknown as KnessetListSlot[];

      slotRepository.find.mockResolvedValue(slots);

      const result = await service.getAssembledList(electionId);

      expect(result).toEqual(slots);
      expect(slotRepository.find).toHaveBeenCalledWith({
        where: { electionId },
        relations: ['candidate'],
        order: { slotNumber: 'ASC' },
      });
    });

    it('should return cached data on cache hit (no DB query)', async () => {
      const cached = [
        { id: 's1', slotNumber: 1, candidateId: 'c1' },
        { id: 's2', slotNumber: 2, candidateId: 'c2' },
      ];
      cacheManager.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getAssembledList(electionId);

      expect(result).toEqual(cached);
      expect(slotRepository.find).not.toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalledWith(`knesset-list:${electionId}`);
    });

    it('should query DB on cache miss and cache the result', async () => {
      const slots = [
        { id: 's1', slotNumber: 1, candidateId: 'c1' },
      ] as unknown as KnessetListSlot[];

      slotRepository.find.mockResolvedValue(slots);

      const result = await service.getAssembledList(electionId);

      expect(result).toEqual(slots);
      expect(slotRepository.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        `knesset-list:${electionId}`,
        JSON.stringify(slots),
        5000,
      );
    });
  });

  // ===========================================================================
  // assignSlot
  // ===========================================================================
  describe('assignSlot', () => {
    const adminId = 'admin-uuid-1';

    it('should assign candidate to an empty slot', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        slotNumber: 3,
        candidateId: 'candidate-uuid-1',
        slotType: KnessetSlotType.NATIONAL,
      };

      slotRepository.findOne.mockResolvedValue(null);
      const created = {
        id: 'slot-new',
        ...dto,
        assignedById: adminId,
        isConfirmed: false,
      } as unknown as KnessetListSlot;
      slotRepository.create.mockReturnValue(created);
      slotRepository.save.mockResolvedValue(created);

      const result = await service.assignSlot(dto, adminId);

      expect(result).toEqual(created);
      expect(slotRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          electionId: dto.electionId,
          slotNumber: dto.slotNumber,
          candidateId: dto.candidateId,
          slotType: dto.slotType,
          assignedById: adminId,
        }),
      );
      expect(cacheManager.del).toHaveBeenCalledWith(`knesset-list:${dto.electionId}`);
    });

    it('should replace candidate on unconfirmed slot with a different candidate', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        slotNumber: 5,
        candidateId: 'new-candidate',
        slotType: KnessetSlotType.DISTRICT,
      };

      const existing = {
        id: 'slot-existing',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'old-candidate',
        slotType: KnessetSlotType.NATIONAL,
        isConfirmed: false,
        assignedById: 'old-admin',
        notes: 'Old note',
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(existing);
      slotRepository.save.mockImplementation(async (entity) => entity as KnessetListSlot);

      const result = await service.assignSlot(dto, adminId);

      expect(result.candidateId).toBe('new-candidate');
      expect(result.slotType).toBe(KnessetSlotType.DISTRICT);
      expect(result.assignedById).toBe(adminId);
      expect(slotRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when assigning to a confirmed slot', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        slotNumber: 1,
        candidateId: 'candidate-new',
        slotType: KnessetSlotType.LEADER,
      };

      const confirmed = {
        id: 'slot-confirmed',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'candidate-old',
        isConfirmed: true,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(confirmed);

      await expect(service.assignSlot(dto, adminId)).rejects.toThrow(BadRequestException);
      await expect(service.assignSlot(dto, adminId)).rejects.toThrow(/confirmed/i);
    });
  });

  // ===========================================================================
  // confirmSlot
  // ===========================================================================
  describe('confirmSlot', () => {
    const assignerAdminId = 'admin-uuid-assigner';
    const confirmerAdminId = 'admin-uuid-confirmer';
    const dto = { electionId: 'election-uuid-1', slotNumber: 5 };

    it('should confirm with a different admin than assigner', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'candidate-uuid-1',
        isConfirmed: false,
        assignedById: assignerAdminId,
        confirmedById: null,
        confirmedAt: null,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);
      slotRepository.save.mockImplementation(async (entity) => entity as KnessetListSlot);

      const result = await service.confirmSlot(dto, confirmerAdminId);

      expect(result.isConfirmed).toBe(true);
      expect(result.confirmedById).toBe(confirmerAdminId);
      expect(result.confirmedAt).toBeInstanceOf(Date);
      expect(cacheManager.del).toHaveBeenCalledWith(`knesset-list:${dto.electionId}`);
    });

    it('should throw ForbiddenException when same admin tries to confirm (dual confirmation)', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'candidate-uuid-1',
        isConfirmed: false,
        assignedById: assignerAdminId,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(service.confirmSlot(dto, assignerAdminId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when slot has no candidate', async () => {
      const slot = {
        id: 'slot-uuid-empty',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: null,
        isConfirmed: false,
        assignedById: assignerAdminId,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(service.confirmSlot(dto, confirmerAdminId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      slotRepository.findOne.mockResolvedValue(null);

      await expect(service.confirmSlot(dto, confirmerAdminId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when slot is already confirmed', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'candidate-uuid-1',
        isConfirmed: true,
        assignedById: assignerAdminId,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(service.confirmSlot(dto, confirmerAdminId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ===========================================================================
  // unassignSlot
  // ===========================================================================
  describe('unassignSlot', () => {
    const electionId = 'election-uuid-1';

    it('should remove candidate from an unconfirmed slot', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId,
        slotNumber: 5,
        candidateId: 'c1',
        isConfirmed: false,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);
      slotRepository.remove.mockResolvedValue(slot);

      await service.unassignSlot(electionId, 5);

      expect(slotRepository.remove).toHaveBeenCalledWith(slot);
      expect(cacheManager.del).toHaveBeenCalledWith(`knesset-list:${electionId}`);
    });

    it('should throw BadRequestException when unassigning a confirmed slot', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId,
        slotNumber: 5,
        candidateId: 'c1',
        isConfirmed: true,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(service.unassignSlot(electionId, 5)).rejects.toThrow(
        BadRequestException,
      );
      expect(slotRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      slotRepository.findOne.mockResolvedValue(null);

      await expect(service.unassignSlot(electionId, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ===========================================================================
  // getSlotStatistics
  // ===========================================================================
  describe('getSlotStatistics', () => {
    it('should return correct counts by type', async () => {
      const electionId = 'election-uuid-1';
      const slots = [
        { slotType: KnessetSlotType.LEADER, candidateId: 'c1', isConfirmed: true },
        { slotType: KnessetSlotType.NATIONAL, candidateId: 'c2', isConfirmed: true },
        { slotType: KnessetSlotType.NATIONAL, candidateId: 'c3', isConfirmed: false },
        { slotType: KnessetSlotType.RESERVED_WOMAN, candidateId: null, isConfirmed: false },
        { slotType: KnessetSlotType.DISTRICT, candidateId: 'c4', isConfirmed: false },
        { slotType: KnessetSlotType.RESERVED_MINORITY, candidateId: null, isConfirmed: false },
      ] as unknown as KnessetListSlot[];

      slotRepository.find.mockResolvedValue(slots);

      const result = await service.getSlotStatistics(electionId);

      expect(result.totalSlots).toBe(6);
      expect(result.filledSlots).toBe(4);
      expect(result.confirmedSlots).toBe(2);
      expect(result.byType).toEqual({
        leader: 1,
        reserved_minority: 1,
        reserved_woman: 1,
        national: 2,
        district: 1,
      });
    });

    it('should return all-zero counts when no slots exist', async () => {
      slotRepository.find.mockResolvedValue([]);

      const result = await service.getSlotStatistics('empty-election');

      expect(result.totalSlots).toBe(0);
      expect(result.filledSlots).toBe(0);
      expect(result.confirmedSlots).toBe(0);
      // All types should have 0 count
      for (const type of Object.values(KnessetSlotType)) {
        expect(result.byType[type]).toBe(0);
      }
    });
  });

  // ===========================================================================
  // getLeaderboardWithDelta
  // ===========================================================================
  describe('getLeaderboardWithDelta', () => {
    const electionId = 'election-uuid-1';

    it('should return ranked candidates with delta and correct rank numbers', async () => {
      const results = [
        {
          candidateId: 'c1',
          candidate: { id: 'c1', fullName: 'Candidate A' },
          voteCount: 1000,
          percentage: '55.00',
        },
        {
          candidateId: 'c2',
          candidate: { id: 'c2', fullName: 'Candidate B' },
          voteCount: 800,
          percentage: '45.00',
        },
      ] as unknown as ElectionResult[];

      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue(results);

      const result = await service.getLeaderboardWithDelta(electionId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          candidateId: 'c1',
          voteCount: 1000,
          percentage: 55,
          delta: 0,
          rank: 1,
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          candidateId: 'c2',
          voteCount: 800,
          percentage: 45,
          delta: 0,
          rank: 2,
        }),
      );
    });

    it('should return cached data on cache hit (no DB query)', async () => {
      const cached = [
        { candidateId: 'c1', voteCount: 1000, rank: 1, delta: 0, percentage: 55 },
      ];
      cacheManager.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getLeaderboardWithDelta(electionId);

      expect(result).toEqual(cached);
      expect(resultRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should cache the result after fetching from DB', async () => {
      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      await service.getLeaderboardWithDelta(electionId);

      expect(cacheManager.set).toHaveBeenCalledWith(
        `leaderboard-delta:${electionId}`,
        expect.any(String),
        5000,
      );
    });

    it('should return empty array for election with no results', async () => {
      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      const result = await service.getLeaderboardWithDelta(electionId);

      expect(result).toEqual([]);
    });
  });
});
