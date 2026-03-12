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

describe('ElectionResultsService', () => {
  let service: ElectionResultsService;
  let resultRepository: jest.Mocked<Repository<ElectionResult>>;
  let turnoutRepository: jest.Mocked<Repository<TurnoutSnapshot>>;
  let slotRepository: jest.Mocked<Repository<KnessetListSlot>>;
  let sseService: { emitBreaking: jest.Mock; emitTicker: jest.Mock; emitPrimaries: jest.Mock };
  let cacheManager: typeof mockCacheManager;

  beforeEach(async () => {
    // Reset cache manager mocks
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
    turnoutRepository = module.get(getRepositoryToken(TurnoutSnapshot));
    slotRepository = module.get(getRepositoryToken(KnessetListSlot));
    sseService = module.get(SseService);
    cacheManager = mockCacheManager;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // getResults
  // ---------------------------------------------------------------------------
  describe('getResults', () => {
    it('should return aggregate results for an election ordered by voteCount DESC', async () => {
      const electionId = 'election-uuid-1';
      const results = [
        { id: 'r1', electionId, candidateId: 'c1', voteCount: 1000, stationId: null },
        { id: 'r2', electionId, candidateId: 'c2', voteCount: 800, stationId: null },
      ] as ElectionResult[];

      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue(results);

      const result = await service.getResults(electionId);

      expect(resultRepository.createQueryBuilder).toHaveBeenCalledWith('result');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('result.candidate', 'candidate');
      expect(qb.where).toHaveBeenCalledWith('result.electionId = :electionId', { electionId });
      expect(qb.andWhere).toHaveBeenCalledWith('result.stationId IS NULL');
      expect(qb.orderBy).toHaveBeenCalledWith('result.voteCount', 'DESC');
      expect(result).toEqual(results);
    });

    it('should return empty array when no results exist', async () => {
      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      const result = await service.getResults('election-uuid-999');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getResultsByStation
  // ---------------------------------------------------------------------------
  describe('getResultsByStation', () => {
    it('should return results for a specific station ordered by voteCount DESC', async () => {
      const electionId = 'election-uuid-1';
      const stationId = 'station-uuid-1';
      const results = [
        { id: 'r1', electionId, candidateId: 'c1', voteCount: 200, stationId },
        { id: 'r2', electionId, candidateId: 'c2', voteCount: 150, stationId },
      ] as ElectionResult[];

      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue(results);

      const result = await service.getResultsByStation(electionId, stationId);

      expect(resultRepository.createQueryBuilder).toHaveBeenCalledWith('result');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('result.candidate', 'candidate');
      expect(qb.where).toHaveBeenCalledWith('result.electionId = :electionId', { electionId });
      expect(qb.andWhere).toHaveBeenCalledWith('result.stationId = :stationId', { stationId });
      expect(qb.orderBy).toHaveBeenCalledWith('result.voteCount', 'DESC');
      expect(result).toEqual(results);
    });

    it('should return empty array when no results exist for the station', async () => {
      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      const result = await service.getResultsByStation('election-uuid-1', 'station-uuid-999');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // addResult
  // ---------------------------------------------------------------------------
  describe('addResult', () => {
    it('should create a new result when none exists', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        candidateId: 'candidate-uuid-1',
        voteCount: 500,
      };

      const newResult = {
        id: 'result-uuid-1',
        ...dto,
        stationId: null,
        percentage: null,
        isOfficial: false,
      } as unknown as ElectionResult;

      resultRepository.findOne.mockResolvedValue(null);
      resultRepository.create.mockReturnValue(newResult);
      resultRepository.save.mockResolvedValue(newResult);

      // Mock the recalculatePercentages internal query
      const recalcQb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(recalcQb as any);
      recalcQb.getMany.mockResolvedValue([newResult]);

      const result = await service.addResult(dto);

      expect(resultRepository.findOne).toHaveBeenCalledWith({
        where: { electionId: dto.electionId, candidateId: dto.candidateId, stationId: null },
      });
      expect(resultRepository.create).toHaveBeenCalledWith(dto);
      expect(resultRepository.save).toHaveBeenCalledWith(newResult);
      expect(result).toEqual(newResult);
    });

    it('should update an existing result (upsert) when one exists', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        candidateId: 'candidate-uuid-1',
        voteCount: 750,
        isOfficial: true,
      };

      const existing = {
        id: 'result-uuid-1',
        electionId: dto.electionId,
        candidateId: dto.candidateId,
        stationId: null,
        voteCount: 500,
        isOfficial: false,
      } as unknown as ElectionResult;

      resultRepository.findOne.mockResolvedValue(existing);
      resultRepository.save.mockImplementation(async (entity) => entity as ElectionResult);

      // Mock the recalculatePercentages internal query
      const recalcQb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(recalcQb as any);
      recalcQb.getMany.mockResolvedValue([existing]);

      const result = await service.addResult(dto);

      // Should NOT create a new entity
      expect(resultRepository.create).not.toHaveBeenCalled();
      // Should update the voteCount on the existing entity
      expect(existing.voteCount).toBe(750);
      expect(existing.isOfficial).toBe(true);
      expect(resultRepository.save).toHaveBeenCalledWith(existing);
      expect(result).toEqual(existing);
    });

    it('should handle stationId in the where clause when provided', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        candidateId: 'candidate-uuid-1',
        stationId: 'station-uuid-1',
        voteCount: 200,
      };

      resultRepository.findOne.mockResolvedValue(null);
      const created = { id: 'new-uuid', ...dto } as unknown as ElectionResult;
      resultRepository.create.mockReturnValue(created);
      resultRepository.save.mockResolvedValue(created);

      const recalcQb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(recalcQb as any);
      recalcQb.getMany.mockResolvedValue([created]);

      await service.addResult(dto);

      expect(resultRepository.findOne).toHaveBeenCalledWith({
        where: {
          electionId: dto.electionId,
          candidateId: dto.candidateId,
          stationId: 'station-uuid-1',
        },
      });
    });

    it('should call recalculatePercentages after saving', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        candidateId: 'candidate-uuid-1',
        voteCount: 600,
      };

      const result1 = {
        id: 'r1',
        electionId: dto.electionId,
        candidateId: 'c1',
        voteCount: 600,
        percentage: null,
      } as unknown as ElectionResult;
      const result2 = {
        id: 'r2',
        electionId: dto.electionId,
        candidateId: 'c2',
        voteCount: 400,
        percentage: null,
      } as unknown as ElectionResult;

      resultRepository.findOne.mockResolvedValue(null);
      resultRepository.create.mockReturnValue(result1);
      resultRepository.save
        .mockResolvedValueOnce(result1) // save the addResult
        .mockResolvedValueOnce([result1, result2] as any); // save from recalculate

      const recalcQb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(recalcQb as any);
      recalcQb.getMany.mockResolvedValue([result1, result2]);

      await service.addResult(dto);

      // recalculatePercentages should have queried all results and saved updated percentages
      expect(recalcQb.where).toHaveBeenCalledWith('result.electionId = :electionId', {
        electionId: dto.electionId,
      });
      expect(recalcQb.andWhere).toHaveBeenCalledWith('result.stationId IS NULL');
      // save called twice: once for addResult, once for recalculate
      expect(resultRepository.save).toHaveBeenCalledTimes(2);
      // Verify percentages were calculated: 600/(600+400)=60%, 400/(600+400)=40%
      expect(result1.percentage).toBe(60);
      expect(result2.percentage).toBe(40);
    });

    it('should not update percentages when total votes is 0', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        candidateId: 'candidate-uuid-1',
        voteCount: 0,
      };

      const result1 = {
        id: 'r1',
        electionId: dto.electionId,
        candidateId: 'c1',
        voteCount: 0,
        percentage: null,
      } as unknown as ElectionResult;

      resultRepository.findOne.mockResolvedValue(null);
      resultRepository.create.mockReturnValue(result1);
      resultRepository.save.mockResolvedValue(result1);

      const recalcQb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(recalcQb as any);
      recalcQb.getMany.mockResolvedValue([result1]);

      await service.addResult(dto);

      // save should only be called once (for the initial addResult save, not for recalculate)
      expect(resultRepository.save).toHaveBeenCalledTimes(1);
      expect(result1.percentage).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // publishResults
  // ---------------------------------------------------------------------------
  describe('publishResults', () => {
    it('should bulk update publishedAt and isOfficial, then emit SSE event', async () => {
      const electionId = 'election-uuid-1';
      const isOfficial = true;

      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.execute.mockResolvedValue({ affected: 5 });

      await service.publishResults(electionId, isOfficial);

      expect(resultRepository.createQueryBuilder).toHaveBeenCalled();
      expect(qb.update).toHaveBeenCalledWith(ElectionResult);
      expect(qb.set).toHaveBeenCalledWith({
        publishedAt: expect.any(Date),
        isOfficial: true,
      });
      expect(qb.where).toHaveBeenCalledWith('electionId = :electionId', { electionId });
      expect(qb.execute).toHaveBeenCalled();

      expect(sseService.emitBreaking).toHaveBeenCalledWith({
        type: 'election_results_published',
        electionId,
        isOfficial: true,
      });
    });

    it('should emit SSE event with isOfficial=false for preliminary results', async () => {
      const electionId = 'election-uuid-1';
      const isOfficial = false;

      const qb = mockQueryBuilder();
      resultRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.execute.mockResolvedValue({ affected: 3 });

      await service.publishResults(electionId, isOfficial);

      expect(qb.set).toHaveBeenCalledWith({
        publishedAt: expect.any(Date),
        isOfficial: false,
      });
      expect(sseService.emitBreaking).toHaveBeenCalledWith({
        type: 'election_results_published',
        electionId,
        isOfficial: false,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // bulkImportResults
  // ---------------------------------------------------------------------------
  describe('bulkImportResults', () => {
    it('should call addResult for each dto and return all saved results', async () => {
      const dtos = [
        { electionId: 'e1', candidateId: 'c1', voteCount: 100 },
        { electionId: 'e1', candidateId: 'c2', voteCount: 200 },
        { electionId: 'e1', candidateId: 'c3', voteCount: 300 },
      ];

      // Mock addResult behavior for each call
      const savedResults = dtos.map((dto, i) => ({
        id: `result-uuid-${i + 1}`,
        ...dto,
        stationId: null,
        percentage: null,
        isOfficial: false,
      })) as unknown as ElectionResult[];

      // For each addResult call: findOne(null), create, save, then recalculate QB
      for (let i = 0; i < dtos.length; i++) {
        resultRepository.findOne.mockResolvedValueOnce(null);
        resultRepository.create.mockReturnValueOnce(savedResults[i]);
        resultRepository.save.mockResolvedValueOnce(savedResults[i]);

        const recalcQb = mockQueryBuilder();
        resultRepository.createQueryBuilder.mockReturnValueOnce(recalcQb as any);
        recalcQb.getMany.mockResolvedValue([savedResults[i]]);
        // save for recalculate (totalVotes > 0 for each)
        resultRepository.save.mockResolvedValueOnce([savedResults[i]] as any);
      }

      const result = await service.bulkImportResults(dtos);

      expect(result).toHaveLength(3);
      expect(resultRepository.findOne).toHaveBeenCalledTimes(3);
    });

    it('should return empty array when given empty input', async () => {
      const result = await service.bulkImportResults([]);

      expect(result).toEqual([]);
      expect(resultRepository.findOne).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getTurnout
  // ---------------------------------------------------------------------------
  describe('getTurnout', () => {
    it('should return latest turnout snapshot per district using subquery', async () => {
      const electionId = 'election-uuid-1';
      const snapshots = [
        {
          id: 's1',
          electionId,
          district: 'North',
          eligibleVoters: 1000,
          actualVoters: 500,
          percentage: 50,
          snapshotAt: new Date('2026-02-22T16:00:00Z'),
        },
        {
          id: 's2',
          electionId,
          district: 'South',
          eligibleVoters: 2000,
          actualVoters: 800,
          percentage: 40,
          snapshotAt: new Date('2026-02-22T16:00:00Z'),
        },
      ] as TurnoutSnapshot[];

      // Mock the subquery builder (for the inner query)
      const subQb = mockQueryBuilder();
      turnoutRepository.createQueryBuilder
        .mockReturnValueOnce(subQb as any) // subQuery
        .mockReturnValueOnce(mockQueryBuilder() as any); // main query — overridden below

      // Mock the main query builder
      const mainQb = mockQueryBuilder();
      turnoutRepository.createQueryBuilder.mockReset();
      turnoutRepository.createQueryBuilder
        .mockReturnValueOnce(subQb as any)
        .mockReturnValueOnce(mainQb as any);
      mainQb.getMany.mockResolvedValue(snapshots);

      const result = await service.getTurnout(electionId);

      expect(turnoutRepository.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(turnoutRepository.createQueryBuilder).toHaveBeenCalledWith('turnout');
      expect(result).toEqual(snapshots);
    });
  });

  // ---------------------------------------------------------------------------
  // addTurnoutSnapshot
  // ---------------------------------------------------------------------------
  describe('addTurnoutSnapshot', () => {
    it('should calculate percentage correctly and save snapshot', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        district: 'Central',
        eligibleVoters: 1000,
        actualVoters: 500,
      };

      const snapshot = {
        id: 'snapshot-uuid-1',
        ...dto,
        percentage: 50,
        snapshotAt: new Date(),
      } as TurnoutSnapshot;

      turnoutRepository.create.mockReturnValue(snapshot);
      turnoutRepository.save.mockResolvedValue(snapshot);

      const result = await service.addTurnoutSnapshot(dto);

      expect(turnoutRepository.create).toHaveBeenCalledWith({
        ...dto,
        percentage: 50,
      });
      expect(turnoutRepository.save).toHaveBeenCalledWith(snapshot);
      expect(result).toEqual(snapshot);
    });

    it('should calculate percentage with decimal precision', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        district: 'North',
        eligibleVoters: 3000,
        actualVoters: 1234,
      };

      const expectedPercentage = parseFloat(((1234 / 3000) * 100).toFixed(2)); // 41.13

      const snapshot = {
        id: 'snapshot-uuid-2',
        ...dto,
        percentage: expectedPercentage,
        snapshotAt: new Date(),
      } as TurnoutSnapshot;

      turnoutRepository.create.mockReturnValue(snapshot);
      turnoutRepository.save.mockResolvedValue(snapshot);

      await service.addTurnoutSnapshot(dto);

      expect(turnoutRepository.create).toHaveBeenCalledWith({
        ...dto,
        percentage: expectedPercentage,
      });
    });

    it('should set percentage to 0 when eligibleVoters is 0', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        eligibleVoters: 0,
        actualVoters: 0,
      };

      const snapshot = {
        id: 'snapshot-uuid-3',
        ...dto,
        percentage: 0,
        snapshotAt: new Date(),
      } as TurnoutSnapshot;

      turnoutRepository.create.mockReturnValue(snapshot);
      turnoutRepository.save.mockResolvedValue(snapshot);

      await service.addTurnoutSnapshot(dto);

      expect(turnoutRepository.create).toHaveBeenCalledWith({
        ...dto,
        percentage: 0,
      });
    });

    it('should emit SSE event with turnout data', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        district: 'South',
        eligibleVoters: 2000,
        actualVoters: 900,
      };

      const snapshot = {
        id: 'snapshot-uuid-4',
        ...dto,
        percentage: 45,
        snapshotAt: new Date(),
      } as TurnoutSnapshot;

      turnoutRepository.create.mockReturnValue(snapshot);
      turnoutRepository.save.mockResolvedValue(snapshot);

      await service.addTurnoutSnapshot(dto);

      expect(sseService.emitBreaking).toHaveBeenCalledWith({
        type: 'turnout_update',
        electionId: dto.electionId,
        district: 'South',
        percentage: 45,
        actualVoters: 900,
        eligibleVoters: 2000,
      });
    });

    it('should use "overall" as district in SSE event when district is not provided', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        eligibleVoters: 5000,
        actualVoters: 2500,
      } as any;

      const snapshot = {
        id: 'snapshot-uuid-5',
        ...dto,
        percentage: 50,
        snapshotAt: new Date(),
      } as TurnoutSnapshot;

      turnoutRepository.create.mockReturnValue(snapshot);
      turnoutRepository.save.mockResolvedValue(snapshot);

      await service.addTurnoutSnapshot(dto);

      expect(sseService.emitBreaking).toHaveBeenCalledWith(
        expect.objectContaining({
          district: 'overall',
        }),
      );
    });

    it('should handle 100% turnout correctly', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        district: 'Small District',
        eligibleVoters: 100,
        actualVoters: 100,
      };

      const snapshot = {
        id: 'snapshot-uuid-6',
        ...dto,
        percentage: 100,
        snapshotAt: new Date(),
      } as TurnoutSnapshot;

      turnoutRepository.create.mockReturnValue(snapshot);
      turnoutRepository.save.mockResolvedValue(snapshot);

      await service.addTurnoutSnapshot(dto);

      expect(turnoutRepository.create).toHaveBeenCalledWith({
        ...dto,
        percentage: 100,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getTurnoutTimeline
  // ---------------------------------------------------------------------------
  describe('getTurnoutTimeline', () => {
    it('should return snapshots ordered by snapshotAt ASC', async () => {
      const electionId = 'election-uuid-1';
      const snapshots = [
        {
          id: 's1',
          electionId,
          district: 'North',
          percentage: 20,
          snapshotAt: new Date('2026-02-22T08:00:00Z'),
        },
        {
          id: 's2',
          electionId,
          district: 'North',
          percentage: 35,
          snapshotAt: new Date('2026-02-22T12:00:00Z'),
        },
        {
          id: 's3',
          electionId,
          district: 'North',
          percentage: 55,
          snapshotAt: new Date('2026-02-22T16:00:00Z'),
        },
      ] as TurnoutSnapshot[];

      const qb = mockQueryBuilder();
      turnoutRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue(snapshots);

      const result = await service.getTurnoutTimeline(electionId);

      expect(turnoutRepository.createQueryBuilder).toHaveBeenCalledWith('turnout');
      expect(qb.where).toHaveBeenCalledWith('turnout.electionId = :electionId', { electionId });
      expect(qb.orderBy).toHaveBeenCalledWith('turnout.snapshotAt', 'ASC');
      expect(result).toEqual(snapshots);
    });

    it('should filter by district when provided', async () => {
      const electionId = 'election-uuid-1';
      const district = 'Central';

      const qb = mockQueryBuilder();
      turnoutRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      await service.getTurnoutTimeline(electionId, district);

      expect(qb.andWhere).toHaveBeenCalledWith('turnout.district = :district', { district });
    });

    it('should not filter by district when not provided', async () => {
      const electionId = 'election-uuid-1';

      const qb = mockQueryBuilder();
      turnoutRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      await service.getTurnoutTimeline(electionId);

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('should return empty array when no snapshots exist', async () => {
      const qb = mockQueryBuilder();
      turnoutRepository.createQueryBuilder.mockReturnValue(qb as any);
      qb.getMany.mockResolvedValue([]);

      const result = await service.getTurnoutTimeline('election-uuid-999');

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // Knesset List Assembly
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // getAssembledList
  // ---------------------------------------------------------------------------
  describe('getAssembledList', () => {
    const electionId = 'election-uuid-1';

    it('should return ordered slots with candidates', async () => {
      const slots = [
        {
          id: 'slot-1',
          electionId,
          slotNumber: 1,
          slotType: KnessetSlotType.LEADER,
          candidateId: 'c1',
          candidate: { id: 'c1', fullName: 'Leader' },
          isConfirmed: true,
        },
        {
          id: 'slot-2',
          electionId,
          slotNumber: 2,
          slotType: KnessetSlotType.NATIONAL,
          candidateId: 'c2',
          candidate: { id: 'c2', fullName: 'National 1' },
          isConfirmed: false,
        },
      ] as unknown as KnessetListSlot[];

      slotRepository.find.mockResolvedValue(slots);

      const result = await service.getAssembledList(electionId);

      expect(slotRepository.find).toHaveBeenCalledWith({
        where: { electionId },
        relations: ['candidate'],
        order: { slotNumber: 'ASC' },
      });
      expect(result).toEqual(slots);
    });

    it('should return cached data when available', async () => {
      const cached = [
        { id: 'slot-1', slotNumber: 1, candidateId: 'c1' },
      ];
      cacheManager.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getAssembledList(electionId);

      expect(result).toEqual(cached);
      expect(slotRepository.find).not.toHaveBeenCalled();
    });

    it('should cache the result after fetching', async () => {
      slotRepository.find.mockResolvedValue([]);

      await service.getAssembledList(electionId);

      expect(cacheManager.set).toHaveBeenCalledWith(
        `knesset-list:${electionId}`,
        JSON.stringify([]),
        5000,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // assignSlot
  // ---------------------------------------------------------------------------
  describe('assignSlot', () => {
    const adminId = 'admin-uuid-1';
    const dto = {
      electionId: 'election-uuid-1',
      slotNumber: 5,
      candidateId: 'candidate-uuid-1',
      slotType: KnessetSlotType.NATIONAL,
      notes: 'Test note',
    };

    it('should assign a candidate to a new slot', async () => {
      slotRepository.findOne.mockResolvedValue(null);
      const created = {
        id: 'slot-uuid-1',
        ...dto,
        assignedById: adminId,
        isConfirmed: false,
      } as unknown as KnessetListSlot;
      slotRepository.create.mockReturnValue(created);
      slotRepository.save.mockResolvedValue(created);

      const result = await service.assignSlot(dto, adminId);

      expect(slotRepository.create).toHaveBeenCalledWith({
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: dto.candidateId,
        slotType: dto.slotType,
        notes: dto.notes,
        assignedById: adminId,
      });
      expect(slotRepository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
      expect(cacheManager.del).toHaveBeenCalledWith(`knesset-list:${dto.electionId}`);
    });

    it('should update an existing unconfirmed slot', async () => {
      const existing = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'old-candidate',
        slotType: KnessetSlotType.DISTRICT,
        isConfirmed: false,
        assignedById: 'old-admin',
        notes: 'Old note',
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(existing);
      slotRepository.save.mockImplementation(async (entity) => entity as KnessetListSlot);

      const result = await service.assignSlot(dto, adminId);

      expect(existing.candidateId).toBe(dto.candidateId);
      expect(existing.slotType).toBe(dto.slotType);
      expect(existing.assignedById).toBe(adminId);
      expect(result).toEqual(existing);
    });

    it('should reject if slot is already confirmed', async () => {
      const confirmed = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'c1',
        isConfirmed: true,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(confirmed);

      await expect(service.assignSlot(dto, adminId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // confirmSlot
  // ---------------------------------------------------------------------------
  describe('confirmSlot', () => {
    const assignerAdminId = 'admin-uuid-1';
    const confirmerAdminId = 'admin-uuid-2';
    const dto = {
      electionId: 'election-uuid-1',
      slotNumber: 5,
    };

    it('should set confirmation fields', async () => {
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

    it('should reject same admin as assigner (dual confirmation)', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'candidate-uuid-1',
        isConfirmed: false,
        assignedById: assignerAdminId,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(
        service.confirmSlot(dto, assignerAdminId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if slot not found', async () => {
      slotRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmSlot(dto, confirmerAdminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject if no candidate assigned', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: null,
        isConfirmed: false,
        assignedById: assignerAdminId,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(
        service.confirmSlot(dto, confirmerAdminId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if slot is already confirmed', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId: dto.electionId,
        slotNumber: dto.slotNumber,
        candidateId: 'candidate-uuid-1',
        isConfirmed: true,
        assignedById: assignerAdminId,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(
        service.confirmSlot(dto, confirmerAdminId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // unassignSlot
  // ---------------------------------------------------------------------------
  describe('unassignSlot', () => {
    const electionId = 'election-uuid-1';
    const slotNumber = 5;

    it('should work for unconfirmed slots', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId,
        slotNumber,
        candidateId: 'c1',
        isConfirmed: false,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);
      slotRepository.remove.mockResolvedValue(slot);

      await service.unassignSlot(electionId, slotNumber);

      expect(slotRepository.remove).toHaveBeenCalledWith(slot);
      expect(cacheManager.del).toHaveBeenCalledWith(`knesset-list:${electionId}`);
    });

    it('should reject confirmed slots', async () => {
      const slot = {
        id: 'slot-uuid-1',
        electionId,
        slotNumber,
        candidateId: 'c1',
        isConfirmed: true,
      } as unknown as KnessetListSlot;

      slotRepository.findOne.mockResolvedValue(slot);

      await expect(
        service.unassignSlot(electionId, slotNumber),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      slotRepository.findOne.mockResolvedValue(null);

      await expect(
        service.unassignSlot(electionId, slotNumber),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // getSlotStatistics
  // ---------------------------------------------------------------------------
  describe('getSlotStatistics', () => {
    it('should return correct counts', async () => {
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

    it('should return zero counts when no slots exist', async () => {
      slotRepository.find.mockResolvedValue([]);

      const result = await service.getSlotStatistics('election-uuid-1');

      expect(result.totalSlots).toBe(0);
      expect(result.filledSlots).toBe(0);
      expect(result.confirmedSlots).toBe(0);
      expect(result.byType).toEqual({
        leader: 0,
        reserved_minority: 0,
        reserved_woman: 0,
        national: 0,
        district: 0,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getLeaderboardWithDelta
  // ---------------------------------------------------------------------------
  describe('getLeaderboardWithDelta', () => {
    const electionId = 'election-uuid-1';

    it('should return ranked candidates', async () => {
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
      expect(result[0].rank).toBe(1);
      expect(result[0].candidateId).toBe('c1');
      expect(result[0].voteCount).toBe(1000);
      expect(result[1].rank).toBe(2);
      expect(result[1].candidateId).toBe('c2');
    });

    it('should return cached data when available', async () => {
      const cached = [
        { candidateId: 'c1', voteCount: 1000, rank: 1, delta: 0 },
      ];
      cacheManager.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getLeaderboardWithDelta(electionId);

      expect(result).toEqual(cached);
      expect(resultRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should cache the result after fetching', async () => {
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
  });
});
