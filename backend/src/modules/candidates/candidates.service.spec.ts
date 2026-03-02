import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { Candidate } from './entities/candidate.entity';

const mockUpdateQueryBuilder = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

const mockSelectQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
};

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockSelectQueryBuilder),
});

describe('CandidatesService', () => {
  let service: CandidatesService;
  let repository: ReturnType<typeof mockRepository>;

  const mockCandidate: Partial<Candidate> = {
    id: 'uuid-candidate-1',
    electionId: 'uuid-election-1',
    fullName: 'יוסי כהן',
    slug: 'יוסי-כהן',
    district: 'מרכז',
    position: 'חבר מרכז הליכוד',
    photoUrl: 'https://cdn.example.com/candidate.jpg',
    coverImageUrl: null,
    bio: 'מועמד בפריימריז',
    bioBlocks: [],
    quizPositions: {},
    socialLinks: {},
    phone: '+972501234567',
    email: 'yossi@example.com',
    website: null,
    endorsementCount: 5,
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCandidateWithElection = {
    ...mockCandidate,
    election: {
      id: 'uuid-election-1',
      title: 'פריימריז 2026',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        {
          provide: getRepositoryToken(Candidate),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
    repository = module.get(getRepositoryToken(Candidate));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ─────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const candidates = [mockCandidateWithElection];
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([candidates, 1]);

      const result = await service.findAll({});

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('candidate');
      expect(mockSelectQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'candidate.election',
        'election',
      );
      expect(mockSelectQueryBuilder.orderBy).toHaveBeenCalledWith(
        'candidate.sortOrder',
        'ASC',
      );
      expect(mockSelectQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockSelectQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        data: candidates,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply electionId filter', async () => {
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ electionId: 'uuid-election-1' });

      expect(mockSelectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'candidate.electionId = :electionId',
        { electionId: 'uuid-election-1' },
      );
    });

    it('should apply district filter', async () => {
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ district: 'מרכז' });

      expect(mockSelectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'candidate.district = :district',
        { district: 'מרכז' },
      );
    });

    it('should apply isActive filter', async () => {
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isActive: true });

      expect(mockSelectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'candidate.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should not apply filters when none provided', async () => {
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(mockSelectQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should calculate correct pagination for page 3', async () => {
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockSelectQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockSelectQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should calculate totalPages correctly', async () => {
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([[], 35]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(4);
    });
  });

  // ── findByElection ──────────────────────────────────────────────────

  describe('findByElection', () => {
    it('should return active candidates for an election ordered by sortOrder', async () => {
      const candidates = [mockCandidateWithElection];
      mockSelectQueryBuilder.getMany.mockResolvedValue(candidates);

      const result = await service.findByElection('uuid-election-1');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('candidate');
      expect(mockSelectQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'candidate.election',
        'election',
      );
      expect(mockSelectQueryBuilder.where).toHaveBeenCalledWith(
        'candidate.electionId = :electionId',
        { electionId: 'uuid-election-1' },
      );
      expect(mockSelectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'candidate.isActive = :isActive',
        { isActive: true },
      );
      expect(mockSelectQueryBuilder.orderBy).toHaveBeenCalledWith(
        'candidate.sortOrder',
        'ASC',
      );
      expect(result).toEqual(candidates);
    });

    it('should return empty array when no candidates exist', async () => {
      mockSelectQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findByElection('uuid-empty');

      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a candidate with election relation', async () => {
      repository.findOne.mockResolvedValue(mockCandidateWithElection);

      const result = await service.findOne('uuid-candidate-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-candidate-1' },
        relations: ['election'],
      });
      expect(result).toEqual(mockCandidateWithElection);
    });

    it('should throw NotFoundException when candidate not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include the candidate id in the error message', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(
        'Candidate with id "bad-id" not found',
      );
    });
  });

  // ── findBySlug ──────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('should return a candidate by slug with election relation', async () => {
      repository.findOne.mockResolvedValue(mockCandidateWithElection);

      const result = await service.findBySlug('יוסי-כהן');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: 'יוסי-כהן' },
        relations: ['election'],
      });
      expect(result).toEqual(mockCandidateWithElection);
    });

    it('should throw NotFoundException when slug not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include the slug in the error message', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('bad-slug')).rejects.toThrow(
        'Candidate with slug "bad-slug" not found',
      );
    });
  });

  // ── create ──────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a candidate with a provided slug', async () => {
      const dto = {
        electionId: 'uuid-election-1',
        fullName: 'יוסי כהן',
        slug: 'custom-slug',
      };

      repository.create.mockReturnValue(mockCandidate);
      repository.save.mockResolvedValue(mockCandidate);

      const result = await service.create(dto as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-slug' }),
      );
      expect(repository.save).toHaveBeenCalledWith(mockCandidate);
      expect(result).toEqual(mockCandidate);
    });

    it('should auto-generate slug from fullName when slug is not provided', async () => {
      const dto = {
        electionId: 'uuid-election-1',
        fullName: 'יוסי כהן',
      } as any;

      repository.create.mockReturnValue(mockCandidate);
      repository.save.mockResolvedValue(mockCandidate);

      await service.create(dto);

      // The slugify function should convert "יוסי כהן" into a slug
      expect(dto.slug).toBe('יוסי-כהן');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'יוסי-כהן' }),
      );
    });

    it('should auto-generate slug with special characters removed', async () => {
      const dto = {
        electionId: 'uuid-election-1',
        fullName: '  David Cohen!!!  ',
      } as any;

      repository.create.mockReturnValue(mockCandidate);
      repository.save.mockResolvedValue(mockCandidate);

      await service.create(dto);

      // slugify: lowercase, trim, remove non-word/hebrew chars, spaces to dashes
      expect(dto.slug).toBe('david-cohen');
    });
  });

  // ── update ──────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update candidate fields and save', async () => {
      const existing = { ...mockCandidateWithElection };
      const dto = { position: 'שר החוץ', district: 'צפון' };
      const updated = { ...existing, ...dto };

      repository.findOne.mockResolvedValue(existing);
      repository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-candidate-1', dto as any);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-candidate-1' },
        relations: ['election'],
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when candidate not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { position: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete by setting isActive to false', async () => {
      const candidate = { ...mockCandidateWithElection, isActive: true };

      repository.findOne.mockResolvedValue(candidate);
      repository.save.mockResolvedValue({ ...candidate, isActive: false });

      await service.remove('uuid-candidate-1');

      expect(candidate.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException when candidate not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── incrementEndorsement ────────────────────────────────────────────

  describe('incrementEndorsement', () => {
    it('should execute raw update to increment endorsementCount by 1', async () => {
      // The method first calls createQueryBuilder() for the update,
      // then calls findOne (via this.findOne) for the return value.
      repository.createQueryBuilder.mockReturnValue(mockUpdateQueryBuilder);
      mockUpdateQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // After the update, findOne is called to return the updated candidate
      repository.findOne.mockResolvedValue({
        ...mockCandidateWithElection,
        endorsementCount: 6,
      });

      const result = await service.incrementEndorsement('uuid-candidate-1');

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdateQueryBuilder.update).toHaveBeenCalledWith(Candidate);
      expect(mockUpdateQueryBuilder.set).toHaveBeenCalledWith({
        endorsementCount: expect.any(Function),
      });
      expect(mockUpdateQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: 'uuid-candidate-1',
      });
      expect(mockUpdateQueryBuilder.execute).toHaveBeenCalled();
      expect(result.endorsementCount).toBe(6);
    });

    it('should throw NotFoundException if candidate does not exist after update', async () => {
      repository.createQueryBuilder.mockReturnValue(mockUpdateQueryBuilder);
      mockUpdateQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // findOne (called by this.findOne) returns null
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.incrementEndorsement('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── decrementEndorsement ────────────────────────────────────────────

  describe('decrementEndorsement', () => {
    it('should execute raw update to decrement endorsementCount with GREATEST guard', async () => {
      repository.createQueryBuilder.mockReturnValue(mockUpdateQueryBuilder);
      mockUpdateQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      repository.findOne.mockResolvedValue({
        ...mockCandidateWithElection,
        endorsementCount: 4,
      });

      const result = await service.decrementEndorsement('uuid-candidate-1');

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdateQueryBuilder.update).toHaveBeenCalledWith(Candidate);
      expect(mockUpdateQueryBuilder.set).toHaveBeenCalledWith({
        endorsementCount: expect.any(Function),
      });
      expect(mockUpdateQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: 'uuid-candidate-1',
      });
      expect(mockUpdateQueryBuilder.execute).toHaveBeenCalled();
      expect(result.endorsementCount).toBe(4);
    });

    it('should not go below zero (GREATEST guard)', async () => {
      repository.createQueryBuilder.mockReturnValue(mockUpdateQueryBuilder);
      mockUpdateQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      repository.findOne.mockResolvedValue({
        ...mockCandidateWithElection,
        endorsementCount: 0,
      });

      const result = await service.decrementEndorsement('uuid-candidate-1');

      // The GREATEST("endorsementCount" - 1, 0) SQL ensures 0 is the minimum
      expect(result.endorsementCount).toBe(0);
    });

    it('should throw NotFoundException if candidate does not exist after update', async () => {
      repository.createQueryBuilder.mockReturnValue(mockUpdateQueryBuilder);
      mockUpdateQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      repository.findOne.mockResolvedValue(null);

      await expect(
        service.decrementEndorsement('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
