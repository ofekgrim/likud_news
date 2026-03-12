import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CandidateMatcherService } from './candidate-matcher.service';
import { MatcherAlgorithmService } from './matcher-algorithm.service';
import { PolicyStatement, PolicyCategory } from './entities/policy-statement.entity';
import { CandidatePosition, PositionValue } from './entities/candidate-position.entity';
import { MemberQuizResponse, QuizAnswer } from './entities/member-quiz-response.entity';
import { QuizMatchResult } from './entities/quiz-match-result.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
  increment: jest.fn(),
});

const mockQueryBuilder = () => ({
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getCount: jest.fn(),
});

const mockMatcherAlgorithm = {
  computeMatch: jest.fn(),
  computeMatchesForCandidates: jest.fn(),
};

describe('CandidateMatcherService', () => {
  let service: CandidateMatcherService;
  let statementRepository: jest.Mocked<Repository<PolicyStatement>>;
  let positionRepository: jest.Mocked<Repository<CandidatePosition>>;
  let responseRepository: jest.Mocked<Repository<MemberQuizResponse>>;
  let matchResultRepository: jest.Mocked<Repository<QuizMatchResult>>;
  let candidateRepository: jest.Mocked<Repository<Candidate>>;
  let electionRepository: jest.Mocked<Repository<PrimaryElection>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCacheManager.get.mockReset();
    mockCacheManager.set.mockReset();
    mockCacheManager.del.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateMatcherService,
        { provide: getRepositoryToken(PolicyStatement), useFactory: mockRepository },
        { provide: getRepositoryToken(CandidatePosition), useFactory: mockRepository },
        { provide: getRepositoryToken(MemberQuizResponse), useFactory: mockRepository },
        { provide: getRepositoryToken(QuizMatchResult), useFactory: mockRepository },
        { provide: getRepositoryToken(Candidate), useFactory: mockRepository },
        { provide: getRepositoryToken(PrimaryElection), useFactory: mockRepository },
        { provide: MatcherAlgorithmService, useValue: mockMatcherAlgorithm },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CandidateMatcherService>(CandidateMatcherService);
    statementRepository = module.get(getRepositoryToken(PolicyStatement));
    positionRepository = module.get(getRepositoryToken(CandidatePosition));
    responseRepository = module.get(getRepositoryToken(MemberQuizResponse));
    matchResultRepository = module.get(getRepositoryToken(QuizMatchResult));
    candidateRepository = module.get(getRepositoryToken(Candidate));
    electionRepository = module.get(getRepositoryToken(PrimaryElection));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // getStatements
  // ---------------------------------------------------------------------------
  describe('getStatements', () => {
    it('should return paginated results with defaults', async () => {
      const statements = [
        { id: 'stmt-1', textHe: 'הצהרה 1', category: PolicyCategory.SECURITY },
      ] as PolicyStatement[];

      statementRepository.findAndCount.mockResolvedValue([statements, 1]);

      const result = await service.getStatements('election-1');

      expect(result).toEqual({
        data: statements,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(statementRepository.findAndCount).toHaveBeenCalledWith({
        where: { electionId: 'election-1', isActive: true },
        order: { sortOrder: 'ASC' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by category when provided', async () => {
      statementRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getStatements('election-1', {
        category: PolicyCategory.ECONOMY,
      });

      expect(statementRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            electionId: 'election-1',
            isActive: true,
            category: PolicyCategory.ECONOMY,
          },
        }),
      );
    });

    it('should calculate correct skip for page 3', async () => {
      statementRepository.findAndCount.mockResolvedValue([[], 50]);

      const result = await service.getStatements('election-1', {
        page: 3,
        limit: 10,
      });

      expect(statementRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.totalPages).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // submitResponses
  // ---------------------------------------------------------------------------
  describe('submitResponses', () => {
    it('should upsert responses correctly and return saved count', async () => {
      electionRepository.findOne.mockResolvedValue({ id: 'election-1' } as PrimaryElection);

      const qb = mockQueryBuilder();
      qb.getCount.mockResolvedValue(2);
      statementRepository.createQueryBuilder.mockReturnValue(qb as any);

      // First response: existing (update)
      // Second response: new (create)
      responseRepository.findOne
        .mockResolvedValueOnce({
          id: 'resp-1',
          answer: QuizAnswer.DISAGREE,
          importanceWeight: 1.0,
        } as any)
        .mockResolvedValueOnce(null);

      responseRepository.create.mockReturnValue({
        statementId: 's2',
        answer: QuizAnswer.AGREE,
      } as any);
      responseRepository.save.mockResolvedValue({} as any);

      const dto = {
        electionId: 'election-1',
        responses: [
          { statementId: 's1', answer: QuizAnswer.AGREE },
          { statementId: 's2', answer: QuizAnswer.AGREE },
        ],
      };

      const result = await service.submitResponses(dto, 'user-1');

      expect(result).toEqual({ saved: 2, electionId: 'election-1' });
      expect(responseRepository.save).toHaveBeenCalledTimes(2);
      // Cache should be invalidated
      expect(mockCacheManager.del).toHaveBeenCalledWith('match:election-1:user-1');
    });

    it('should throw BadRequestException when neither userId nor deviceId is provided', async () => {
      const dto = {
        electionId: 'election-1',
        responses: [{ statementId: 's1', answer: QuizAnswer.AGREE }],
      };

      await expect(service.submitResponses(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when election does not exist', async () => {
      electionRepository.findOne.mockResolvedValue(null);

      const dto = {
        electionId: 'nonexistent',
        responses: [{ statementId: 's1', answer: QuizAnswer.AGREE }],
      };

      await expect(
        service.submitResponses(dto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when statement IDs are invalid', async () => {
      electionRepository.findOne.mockResolvedValue({ id: 'election-1' } as PrimaryElection);

      const qb = mockQueryBuilder();
      // Only 1 valid statement out of 2 submitted
      qb.getCount.mockResolvedValue(1);
      statementRepository.createQueryBuilder.mockReturnValue(qb as any);

      const dto = {
        electionId: 'election-1',
        responses: [
          { statementId: 's1', answer: QuizAnswer.AGREE },
          { statementId: 's-invalid', answer: QuizAnswer.AGREE },
        ],
      };

      await expect(
        service.submitResponses(dto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // computeMatches
  // ---------------------------------------------------------------------------
  describe('computeMatches', () => {
    it('should return sorted results with candidate info', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const responses = [
        {
          id: 'r1',
          answer: QuizAnswer.AGREE,
          statementId: 's1',
          importanceWeight: 1.0,
          statement: { category: PolicyCategory.SECURITY },
        },
      ] as any[];

      responseRepository.find.mockResolvedValue(responses);
      statementRepository.count.mockResolvedValue(5);

      const posQb = mockQueryBuilder();
      posQb.getMany.mockResolvedValue([
        {
          candidateId: 'c1',
          statementId: 's1',
          position: PositionValue.AGREE,
          candidate: { fullName: 'יוסי כהן', photoUrl: 'https://img/c1.jpg' },
        },
        {
          candidateId: 'c2',
          statementId: 's1',
          position: PositionValue.DISAGREE,
          candidate: { fullName: 'דנה לוי', photoUrl: 'https://img/c2.jpg' },
        },
      ]);
      positionRepository.createQueryBuilder.mockReturnValue(posQb as any);

      mockMatcherAlgorithm.computeMatchesForCandidates.mockReturnValue([
        { candidateId: 'c1', matchPct: 100, categoryBreakdown: { security: 100 } },
        { candidateId: 'c2', matchPct: 0, categoryBreakdown: { security: 0 } },
      ]);

      matchResultRepository.findOne.mockResolvedValue(null);
      matchResultRepository.create.mockReturnValue({} as any);
      matchResultRepository.save.mockResolvedValue({} as any);

      const result = await service.computeMatches('election-1', 'user-1');

      expect(result.electionId).toBe('election-1');
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].candidateId).toBe('c1');
      expect(result.matches[0].candidateName).toBe('יוסי כהן');
      expect(result.matches[0].matchPct).toBe(100);
      expect(result.matches[1].candidateId).toBe('c2');
      expect(result.totalAnswered).toBe(1);
      expect(result.totalStatements).toBe(5);
      // Should cache results
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'match:election-1:user-1',
        expect.any(Object),
        30 * 60 * 1000,
      );
    });

    it('should return cached results on second call', async () => {
      const cachedResult = {
        electionId: 'election-1',
        matches: [
          { candidateId: 'c1', candidateName: 'יוסי', photoUrl: '', matchPct: 80, categoryBreakdown: {} },
        ],
        totalAnswered: 3,
        totalStatements: 5,
        computedAt: '2026-03-11T00:00:00.000Z',
      };
      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.computeMatches('election-1', 'user-1');

      expect(result).toEqual(cachedResult);
      // Should NOT query DB when cache hit
      expect(responseRepository.find).not.toHaveBeenCalled();
      expect(mockMatcherAlgorithm.computeMatchesForCandidates).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no user identity is provided', async () => {
      await expect(
        service.computeMatches('election-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user has no responses', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      responseRepository.find.mockResolvedValue([]);

      await expect(
        service.computeMatches('election-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // getCandidatePositions
  // ---------------------------------------------------------------------------
  describe('getCandidatePositions', () => {
    it('should return positions for a specific candidate', async () => {
      candidateRepository.findOne.mockResolvedValue({
        id: 'c1',
        fullName: 'יוסי כהן',
      } as Candidate);

      const positions = [
        { id: 'pos-1', candidateId: 'c1', statementId: 's1', position: PositionValue.AGREE },
        { id: 'pos-2', candidateId: 'c1', statementId: 's2', position: PositionValue.DISAGREE },
      ] as CandidatePosition[];

      positionRepository.find.mockResolvedValue(positions);

      const result = await service.getCandidatePositions('c1');

      expect(result).toEqual(positions);
      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(positionRepository.find).toHaveBeenCalledWith({
        where: { candidateId: 'c1' },
        relations: ['statement'],
        order: { statement: { sortOrder: 'ASC' } },
      });
    });

    it('should throw NotFoundException when candidate does not exist', async () => {
      candidateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCandidatePositions('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
