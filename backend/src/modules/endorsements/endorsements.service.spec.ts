import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { EndorsementsService } from './endorsements.service';
import { CandidateEndorsement } from './entities/candidate-endorsement.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
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
});

describe('EndorsementsService', () => {
  let service: EndorsementsService;
  let endorsementRepository: jest.Mocked<Repository<CandidateEndorsement>>;
  let candidateRepository: jest.Mocked<Repository<Candidate>>;
  let mockTransaction: jest.Mock;

  // These are the repos that will be used inside the transaction callback
  let txEndorsementRepo: ReturnType<typeof mockRepository>;
  let txCandidateRepo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    mockTransaction = jest.fn();
    txEndorsementRepo = mockRepository();
    txCandidateRepo = mockRepository();

    // The transaction mock invokes the callback with a mock manager
    mockTransaction.mockImplementation(async (cb) => {
      const mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === CandidateEndorsement) return txEndorsementRepo;
          if (entity === Candidate) return txCandidateRepo;
        }),
      };
      return cb(mockManager);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EndorsementsService,
        { provide: getRepositoryToken(CandidateEndorsement), useFactory: mockRepository },
        { provide: getRepositoryToken(Candidate), useFactory: mockRepository },
        { provide: DataSource, useValue: { transaction: mockTransaction } },
        { provide: SseService, useValue: { emitPrimaries: jest.fn() } },
      ],
    }).compile();

    service = module.get<EndorsementsService>(EndorsementsService);
    endorsementRepository = module.get(getRepositoryToken(CandidateEndorsement));
    candidateRepository = module.get(getRepositoryToken(Candidate));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // endorse
  // ---------------------------------------------------------------------------
  describe('endorse', () => {
    const userId = 'user-uuid-1';
    const electionId = 'election-uuid-1';
    const candidateId = 'candidate-uuid-1';
    const dto = { candidateId, electionId };

    it('should create a new endorsement when no existing endorsement', async () => {
      const candidate = { id: candidateId, electionId, fullName: 'Alice' } as Candidate;
      const newEndorsement = {
        id: 'end-uuid-1',
        userId,
        candidateId,
        electionId,
      } as CandidateEndorsement;

      // Candidate lookup (outside transaction)
      candidateRepository.findOne.mockResolvedValue(candidate);

      // Inside transaction: no existing endorsement
      txEndorsementRepo.findOne.mockResolvedValue(null);

      // Mock the queryBuilder for increment
      const txCandQb = mockQueryBuilder();
      txCandQb.execute.mockResolvedValue(undefined);
      txCandidateRepo.createQueryBuilder.mockReturnValue(txCandQb as any);

      // Create and save new endorsement
      txEndorsementRepo.create.mockReturnValue(newEndorsement);
      txEndorsementRepo.save.mockResolvedValue(newEndorsement);

      const result = await service.endorse(userId, dto);

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: candidateId, electionId },
      });
      expect(txEndorsementRepo.findOne).toHaveBeenCalledWith({
        where: { userId, electionId },
      });
      expect(txCandidateRepo.createQueryBuilder).toHaveBeenCalledTimes(1); // increment only
      expect(txEndorsementRepo.create).toHaveBeenCalledWith({
        userId,
        candidateId,
        electionId,
      });
      expect(txEndorsementRepo.save).toHaveBeenCalledWith(newEndorsement);
      expect(result).toEqual(newEndorsement);
    });

    it('should switch endorsement when user already endorsed a different candidate', async () => {
      const candidate = { id: candidateId, electionId, fullName: 'Alice' } as Candidate;
      const oldCandidateId = 'old-candidate-uuid';
      const existingEndorsement = {
        id: 'end-uuid-old',
        userId,
        candidateId: oldCandidateId,
        electionId,
      } as CandidateEndorsement;
      const newEndorsement = {
        id: 'end-uuid-new',
        userId,
        candidateId,
        electionId,
      } as CandidateEndorsement;

      candidateRepository.findOne.mockResolvedValue(candidate);

      // Inside transaction: existing endorsement for a different candidate
      txEndorsementRepo.findOne.mockResolvedValue(existingEndorsement);
      txEndorsementRepo.remove.mockResolvedValue(existingEndorsement);
      txEndorsementRepo.create.mockReturnValue(newEndorsement);
      txEndorsementRepo.save.mockResolvedValue(newEndorsement);

      // Two createQueryBuilder calls: decrement old + increment new
      const txCandQb1 = mockQueryBuilder();
      txCandQb1.execute.mockResolvedValue(undefined);
      const txCandQb2 = mockQueryBuilder();
      txCandQb2.execute.mockResolvedValue(undefined);
      txCandidateRepo.createQueryBuilder
        .mockReturnValueOnce(txCandQb1 as any)
        .mockReturnValueOnce(txCandQb2 as any);

      const result = await service.endorse(userId, dto);

      // Should decrement old candidate
      expect(txCandQb1.update).toHaveBeenCalledWith(Candidate);
      expect(txCandQb1.set).toHaveBeenCalledWith({
        endorsementCount: expect.any(Function),
      });
      expect(txCandQb1.where).toHaveBeenCalledWith('id = :id', { id: oldCandidateId });
      expect(txCandQb1.execute).toHaveBeenCalled();

      // Should remove old endorsement
      expect(txEndorsementRepo.remove).toHaveBeenCalledWith(existingEndorsement);

      // Should increment new candidate
      expect(txCandQb2.update).toHaveBeenCalledWith(Candidate);
      expect(txCandQb2.where).toHaveBeenCalledWith('id = :id', { id: candidateId });

      // Should create new endorsement
      expect(txEndorsementRepo.create).toHaveBeenCalledWith({
        userId,
        candidateId,
        electionId,
      });
      expect(result).toEqual(newEndorsement);
    });

    it('should return existing endorsement when endorsing the same candidate', async () => {
      const candidate = { id: candidateId, electionId, fullName: 'Alice' } as Candidate;
      const existingEndorsement = {
        id: 'end-uuid-1',
        userId,
        candidateId,
        electionId,
      } as CandidateEndorsement;

      candidateRepository.findOne.mockResolvedValue(candidate);
      txEndorsementRepo.findOne.mockResolvedValue(existingEndorsement);

      const result = await service.endorse(userId, dto);

      expect(result).toEqual(existingEndorsement);
      // Should NOT create, remove, or update anything
      expect(txEndorsementRepo.create).not.toHaveBeenCalled();
      expect(txEndorsementRepo.save).not.toHaveBeenCalled();
      expect(txEndorsementRepo.remove).not.toHaveBeenCalled();
      expect(txCandidateRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when candidate does not exist', async () => {
      candidateRepository.findOne.mockResolvedValue(null);

      await expect(service.endorse(userId, dto)).rejects.toThrow(NotFoundException);

      // Transaction should never be called
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // removeEndorsement
  // ---------------------------------------------------------------------------
  describe('removeEndorsement', () => {
    const userId = 'user-uuid-1';
    const electionId = 'election-uuid-1';

    it('should decrement endorsement count and remove the endorsement', async () => {
      const existing = {
        id: 'end-uuid-1',
        userId,
        candidateId: 'candidate-uuid-1',
        electionId,
      } as CandidateEndorsement;

      endorsementRepository.findOne.mockResolvedValue(existing);
      endorsementRepository.remove.mockResolvedValue(existing);

      const candQb = mockQueryBuilder();
      candQb.execute.mockResolvedValue(undefined);
      candidateRepository.createQueryBuilder.mockReturnValue(candQb as any);

      await service.removeEndorsement(userId, electionId);

      expect(endorsementRepository.findOne).toHaveBeenCalledWith({
        where: { userId, electionId },
      });

      // Should decrement via queryBuilder
      expect(candQb.update).toHaveBeenCalledWith(Candidate);
      expect(candQb.set).toHaveBeenCalledWith({
        endorsementCount: expect.any(Function),
      });
      expect(candQb.where).toHaveBeenCalledWith('id = :id', {
        id: 'candidate-uuid-1',
      });
      expect(candQb.execute).toHaveBeenCalled();

      expect(endorsementRepository.remove).toHaveBeenCalledWith(existing);
    });

    it('should throw NotFoundException when no endorsement found', async () => {
      endorsementRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeEndorsement(userId, electionId),
      ).rejects.toThrow(NotFoundException);

      expect(candidateRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(endorsementRepository.remove).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getUserEndorsement
  // ---------------------------------------------------------------------------
  describe('getUserEndorsement', () => {
    const userId = 'user-uuid-1';
    const electionId = 'election-uuid-1';

    it('should return the endorsement with candidate relation', async () => {
      const endorsement = {
        id: 'end-uuid-1',
        userId,
        candidateId: 'candidate-uuid-1',
        electionId,
        candidate: { id: 'candidate-uuid-1', fullName: 'Alice' },
      } as unknown as CandidateEndorsement;

      endorsementRepository.findOne.mockResolvedValue(endorsement);

      const result = await service.getUserEndorsement(userId, electionId);

      expect(result).toEqual(endorsement);
      expect(endorsementRepository.findOne).toHaveBeenCalledWith({
        where: { userId, electionId },
        relations: ['candidate'],
      });
    });

    it('should return null when no endorsement found', async () => {
      endorsementRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserEndorsement(userId, electionId);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getEndorsementsByCandidate
  // ---------------------------------------------------------------------------
  describe('getEndorsementsByCandidate', () => {
    it('should return paginated endorsements for a candidate', async () => {
      const candidateId = 'candidate-uuid-1';
      const endorsements = [
        { id: 'end-1', userId: 'u1', candidateId },
        { id: 'end-2', userId: 'u2', candidateId },
      ] as CandidateEndorsement[];

      const qb = mockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([endorsements, 5]);
      endorsementRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getEndorsementsByCandidate(candidateId, 1, 2);

      expect(result).toEqual({
        data: endorsements,
        total: 5,
        page: 1,
        limit: 2,
        totalPages: 3,
      });

      expect(endorsementRepository.createQueryBuilder).toHaveBeenCalledWith('endorsement');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('endorsement.user', 'user');
      expect(qb.where).toHaveBeenCalledWith(
        'endorsement.candidateId = :candidateId',
        { candidateId },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('endorsement.createdAt', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(2);
    });

    it('should use default page=1 and limit=20', async () => {
      const candidateId = 'candidate-uuid-1';
      const qb = mockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      endorsementRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getEndorsementsByCandidate(candidateId);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
    });
  });

  // ---------------------------------------------------------------------------
  // getEndorsementsByElection
  // ---------------------------------------------------------------------------
  describe('getEndorsementsByElection', () => {
    it('should return aggregated endorsement counts per candidate', async () => {
      const electionId = 'election-uuid-1';
      const rawResults = [
        { candidateId: 'c1', candidateName: 'Alice', count: '42' },
        { candidateId: 'c2', candidateName: 'Bob', count: '17' },
      ];

      const qb = mockQueryBuilder();
      qb.getRawMany.mockResolvedValue(rawResults);
      endorsementRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getEndorsementsByElection(electionId);

      expect(result).toEqual([
        { candidateId: 'c1', candidateName: 'Alice', count: 42 },
        { candidateId: 'c2', candidateName: 'Bob', count: 17 },
      ]);

      expect(endorsementRepository.createQueryBuilder).toHaveBeenCalledWith('endorsement');
      expect(qb.select).toHaveBeenCalledWith('endorsement.candidateId', 'candidateId');
      expect(qb.addSelect).toHaveBeenCalledWith('candidate.fullName', 'candidateName');
      expect(qb.addSelect).toHaveBeenCalledWith('COUNT(endorsement.id)', 'count');
      expect(qb.innerJoin).toHaveBeenCalledWith('endorsement.candidate', 'candidate');
      expect(qb.where).toHaveBeenCalledWith(
        'endorsement.electionId = :electionId',
        { electionId },
      );
      expect(qb.groupBy).toHaveBeenCalledWith('endorsement.candidateId');
      expect(qb.addGroupBy).toHaveBeenCalledWith('candidate.fullName');
      expect(qb.orderBy).toHaveBeenCalledWith('count', 'DESC');
    });

    it('should return empty array when no endorsements exist', async () => {
      const qb = mockQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);
      endorsementRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getEndorsementsByElection('empty-election');

      expect(result).toEqual([]);
    });
  });
});
