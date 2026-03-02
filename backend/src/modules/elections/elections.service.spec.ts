import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import {
  PrimaryElection,
  ElectionStatus,
} from './entities/primary-election.entity';
import { SseService } from '../sse/sse.service';

const mockQueryBuilder = {
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
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

const mockSseService = () => ({
  emitBreaking: jest.fn(),
  emitTicker: jest.fn(),
  emitPrimaries: jest.fn(),
});

describe('ElectionsService', () => {
  let service: ElectionsService;
  let repository: ReturnType<typeof mockRepository>;
  let sseService: ReturnType<typeof mockSseService>;

  const mockElection: Partial<PrimaryElection> = {
    id: 'uuid-election-1',
    title: 'פריימריז 2026',
    subtitle: 'בחירות מקדימות לליכוד',
    description: 'תיאור מלא של הבחירות',
    electionDate: new Date('2026-06-15'),
    registrationDeadline: new Date('2026-05-01'),
    status: ElectionStatus.DRAFT,
    coverImageUrl: 'https://cdn.example.com/election-cover.jpg',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionsService,
        {
          provide: getRepositoryToken(PrimaryElection),
          useFactory: mockRepository,
        },
        {
          provide: SseService,
          useFactory: mockSseService,
        },
      ],
    }).compile();

    service = module.get<ElectionsService>(ElectionsService);
    repository = module.get(getRepositoryToken(PrimaryElection));
    sseService = module.get(SseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ─────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const elections = [mockElection];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([elections, 1]);

      const result = await service.findAll({});

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('election');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'election.electionDate',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        data: elections,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply status filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: ElectionStatus.VOTING });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'election.status = :status',
        { status: ElectionStatus.VOTING },
      );
    });

    it('should apply isActive filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isActive: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'election.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should not apply filters when none provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should calculate correct skip and take for page 2', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should calculate totalPages correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 55]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.totalPages).toBe(3);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return an election by id', async () => {
      repository.findOne.mockResolvedValue(mockElection);

      const result = await service.findOne('uuid-election-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-election-1' },
      });
      expect(result).toEqual(mockElection);
    });

    it('should throw NotFoundException when election not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include the election id in the error message', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(
        'Election with id "bad-id" not found',
      );
    });
  });

  // ── create ──────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create and save a new election', async () => {
      const dto = {
        title: 'פריימריז 2026',
        electionDate: '2026-06-15',
        description: 'תיאור',
      };

      repository.create.mockReturnValue(mockElection);
      repository.save.mockResolvedValue(mockElection);

      const result = await service.create(dto as any);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockElection);
      expect(result).toEqual(mockElection);
    });
  });

  // ── update ──────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update election fields and save', async () => {
      const existing = { ...mockElection };
      const dto = { title: 'פריימריז מעודכן 2026' };
      const updatedElection = { ...existing, ...dto };

      repository.findOne.mockResolvedValue(existing);
      repository.save.mockResolvedValue(updatedElection);

      const result = await service.update('uuid-election-1', dto as any);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-election-1' },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedElection);
    });

    it('should throw NotFoundException when election not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete by setting isActive to false', async () => {
      const election = { ...mockElection, isActive: true };

      repository.findOne.mockResolvedValue(election);
      repository.save.mockResolvedValue({ ...election, isActive: false });

      await service.remove('uuid-election-1');

      expect(election.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException when election not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── updateStatus ────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update the election status', async () => {
      const election = { ...mockElection, status: ElectionStatus.DRAFT };
      const saved = { ...election, status: ElectionStatus.UPCOMING };

      repository.findOne.mockResolvedValue(election);
      repository.save.mockResolvedValue(saved);

      const result = await service.updateStatus(
        'uuid-election-1',
        ElectionStatus.UPCOMING,
      );

      expect(election.status).toBe(ElectionStatus.UPCOMING);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });

    it('should emit SSE breaking event when status is VOTING', async () => {
      const election = { ...mockElection, status: ElectionStatus.UPCOMING };
      const saved = {
        ...election,
        id: 'uuid-election-1',
        title: 'פריימריז 2026',
        status: ElectionStatus.VOTING,
      };

      repository.findOne.mockResolvedValue(election);
      repository.save.mockResolvedValue(saved);

      await service.updateStatus('uuid-election-1', ElectionStatus.VOTING);

      expect(sseService.emitBreaking).toHaveBeenCalledWith({
        type: 'election_voting_started',
        electionId: 'uuid-election-1',
        title: 'פריימריז 2026',
      });
    });

    it('should NOT emit SSE when status is DRAFT', async () => {
      const election = { ...mockElection };

      repository.findOne.mockResolvedValue(election);
      repository.save.mockResolvedValue({ ...election, status: ElectionStatus.DRAFT });

      await service.updateStatus('uuid-election-1', ElectionStatus.DRAFT);

      expect(sseService.emitBreaking).not.toHaveBeenCalled();
    });

    it('should NOT emit SSE when status is COMPLETED', async () => {
      const election = { ...mockElection };

      repository.findOne.mockResolvedValue(election);
      repository.save.mockResolvedValue({
        ...election,
        status: ElectionStatus.COMPLETED,
      });

      await service.updateStatus('uuid-election-1', ElectionStatus.COMPLETED);

      expect(sseService.emitBreaking).not.toHaveBeenCalled();
    });

    it('should NOT emit SSE when status is COUNTING', async () => {
      const election = { ...mockElection };

      repository.findOne.mockResolvedValue(election);
      repository.save.mockResolvedValue({
        ...election,
        status: ElectionStatus.COUNTING,
      });

      await service.updateStatus('uuid-election-1', ElectionStatus.COUNTING);

      expect(sseService.emitBreaking).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when election not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', ElectionStatus.VOTING),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
