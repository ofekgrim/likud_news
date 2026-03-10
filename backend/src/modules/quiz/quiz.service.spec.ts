import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QuizService } from './quiz.service';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { NotificationsService } from '../notifications/notifications.service';

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

describe('QuizService', () => {
  let service: QuizService;
  let questionRepository: jest.Mocked<Repository<QuizQuestion>>;
  let responseRepository: jest.Mocked<Repository<QuizResponse>>;
  let candidateRepository: jest.Mocked<Repository<Candidate>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: getRepositoryToken(QuizQuestion), useFactory: mockRepository },
        { provide: getRepositoryToken(QuizResponse), useFactory: mockRepository },
        { provide: getRepositoryToken(Candidate), useFactory: mockRepository },
        { provide: getRepositoryToken(PrimaryElection), useFactory: mockRepository },
        { provide: NotificationsService, useValue: { triggerContentNotification: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    questionRepository = module.get(getRepositoryToken(QuizQuestion));
    responseRepository = module.get(getRepositoryToken(QuizResponse));
    candidateRepository = module.get(getRepositoryToken(Candidate));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // getQuestions
  // ---------------------------------------------------------------------------
  describe('getQuestions', () => {
    it('should return active questions ordered by sortOrder', async () => {
      const electionId = 'election-uuid-1';
      const questions = [
        { id: 'q1', electionId, sortOrder: 0, isActive: true },
        { id: 'q2', electionId, sortOrder: 1, isActive: true },
      ] as QuizQuestion[];

      questionRepository.find.mockResolvedValue(questions);

      const result = await service.getQuestions(electionId);

      expect(result).toEqual(questions);
      expect(questionRepository.find).toHaveBeenCalledWith({
        where: { electionId, isActive: true },
        order: { sortOrder: 'ASC' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createQuestion
  // ---------------------------------------------------------------------------
  describe('createQuestion', () => {
    it('should create and save a quiz question', async () => {
      const dto = {
        electionId: 'election-uuid-1',
        questionText: 'Do you support policy X?',
        options: [
          { label: 'Strongly Agree', value: 2 },
          { label: 'Agree', value: 1 },
          { label: 'Neutral', value: 0 },
          { label: 'Disagree', value: -1 },
          { label: 'Strongly Disagree', value: -2 },
        ],
        importance: 'high',
        category: 'Economy',
        sortOrder: 0,
      } as any;

      const question = { id: 'q-uuid-1', ...dto, isActive: true } as QuizQuestion;

      questionRepository.create.mockReturnValue(question);
      questionRepository.save.mockResolvedValue(question);

      const result = await service.createQuestion(dto);

      expect(questionRepository.create).toHaveBeenCalledWith(dto);
      expect(questionRepository.save).toHaveBeenCalledWith(question);
      expect(result).toEqual(question);
    });
  });

  // ---------------------------------------------------------------------------
  // updateQuestion
  // ---------------------------------------------------------------------------
  describe('updateQuestion', () => {
    it('should update an existing question', async () => {
      const id = 'q-uuid-1';
      const existing = {
        id,
        questionText: 'Old text',
        sortOrder: 0,
        isActive: true,
      } as QuizQuestion;
      const dto = { questionText: 'Updated text' } as any;
      const updated = { ...existing, questionText: 'Updated text' } as QuizQuestion;

      questionRepository.findOne.mockResolvedValue(existing);
      questionRepository.save.mockResolvedValue(updated);

      const result = await service.updateQuestion(id, dto);

      expect(questionRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(questionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when question not found', async () => {
      questionRepository.findOne.mockResolvedValue(null);

      await expect(service.updateQuestion('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(questionRepository.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteQuestion
  // ---------------------------------------------------------------------------
  describe('deleteQuestion', () => {
    it('should soft-delete a question by setting isActive to false', async () => {
      const id = 'q-uuid-1';
      const question = { id, isActive: true } as QuizQuestion;

      questionRepository.findOne.mockResolvedValue(question);
      questionRepository.save.mockResolvedValue({ ...question, isActive: false } as QuizQuestion);

      await service.deleteQuestion(id);

      expect(questionRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(question.isActive).toBe(false);
      expect(questionRepository.save).toHaveBeenCalledWith(question);
    });

    it('should throw NotFoundException when question not found', async () => {
      questionRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteQuestion('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(questionRepository.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // submitQuiz
  // ---------------------------------------------------------------------------
  describe('submitQuiz', () => {
    const userId = 'user-uuid-1';
    const electionId = 'election-uuid-1';

    const makeCandidate = (
      id: string,
      fullName: string,
      positions: Record<string, number>,
    ): Candidate =>
      ({
        id,
        fullName,
        electionId,
        isActive: true,
        quizPositions: positions,
      }) as Candidate;

    it('should compute match results, sort by percentage DESC, and create a new response', async () => {
      const candidates = [
        makeCandidate('c1', 'Alice', { q1: 2, q2: 1 }),
        makeCandidate('c2', 'Bob', { q1: -2, q2: -1 }),
      ];

      const answers = [
        { questionId: 'q1', selectedValue: 2, importance: 1 },
        { questionId: 'q2', selectedValue: 1, importance: 1 },
      ];

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const result = await service.submitQuiz(userId, { electionId, answers } as any);

      // Alice should have perfect match (100%), Bob perfect disagreement (0%)
      expect(result[0].candidateId).toBe('c1');
      expect(result[0].candidateName).toBe('Alice');
      expect(result[0].matchPercentage).toBe(100);

      expect(result[1].candidateId).toBe('c2');
      expect(result[1].candidateName).toBe('Bob');
      expect(result[1].matchPercentage).toBe(0);

      // Should have created a new response (not updated)
      expect(responseRepository.create).toHaveBeenCalled();
      expect(responseRepository.save).toHaveBeenCalled();
    });

    it('should update an existing response on re-submit (upsert)', async () => {
      const candidates = [
        makeCandidate('c1', 'Alice', { q1: 2 }),
      ];

      const answers = [
        { questionId: 'q1', selectedValue: 2, importance: 1 },
      ];

      const existingResponse = {
        id: 'resp-1',
        userId,
        electionId,
        answers: [],
        matchResults: [],
        completedAt: new Date('2025-01-01'),
      } as unknown as QuizResponse;

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(existingResponse);
      responseRepository.save.mockImplementation(async (data) => data as any);

      await service.submitQuiz(userId, { electionId, answers } as any);

      // Should NOT create new — should update existing
      expect(responseRepository.create).not.toHaveBeenCalled();
      expect(existingResponse.answers).toEqual(answers);
      expect(existingResponse.completedAt).toBeInstanceOf(Date);
      expect(responseRepository.save).toHaveBeenCalledWith(existingResponse);
    });

    it('should return empty array when no candidates found and save answers', async () => {
      candidateRepository.find.mockResolvedValue([]);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const result = await service.submitQuiz(userId, {
        electionId,
        answers: [{ questionId: 'q1', selectedValue: 1, importance: 1 }],
      } as any);

      expect(result).toEqual([]);
      expect(responseRepository.save).toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // computeMatch algorithm tests (via submitQuiz)
    // -------------------------------------------------------------------------
    it('should return 100% when user and candidate perfectly agree', async () => {
      const candidates = [
        makeCandidate('c1', 'Agree', { q1: 2, q2: 1, q3: -1 }),
      ];
      const answers = [
        { questionId: 'q1', selectedValue: 2, importance: 1 },
        { questionId: 'q2', selectedValue: 1, importance: 1 },
        { questionId: 'q3', selectedValue: -1, importance: 1 },
      ];

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const result = await service.submitQuiz(userId, { electionId, answers } as any);

      expect(result[0].matchPercentage).toBe(100);
    });

    it('should return 0% when user and candidate perfectly disagree', async () => {
      const candidates = [
        makeCandidate('c1', 'Disagree', { q1: -2, q2: -1 }),
      ];
      const answers = [
        { questionId: 'q1', selectedValue: 2, importance: 1 },
        { questionId: 'q2', selectedValue: 1, importance: 1 },
      ];

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const result = await service.submitQuiz(userId, { electionId, answers } as any);

      expect(result[0].matchPercentage).toBe(0);
    });

    it('should return a value between 0 and 100 for mixed answers', async () => {
      const candidates = [
        makeCandidate('c1', 'Mixed', { q1: 2, q2: -1 }),
      ];
      const answers = [
        { questionId: 'q1', selectedValue: 2, importance: 1 },
        { questionId: 'q2', selectedValue: 1, importance: 1 },
      ];

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const result = await service.submitQuiz(userId, { electionId, answers } as any);

      expect(result[0].matchPercentage).toBeGreaterThan(0);
      expect(result[0].matchPercentage).toBeLessThan(100);
    });

    it('should return 0 when all user answers are zero', async () => {
      const candidates = [
        makeCandidate('c1', 'Candidate', { q1: 2, q2: 1 }),
      ];
      const answers = [
        { questionId: 'q1', selectedValue: 0, importance: 1 },
        { questionId: 'q2', selectedValue: 0, importance: 1 },
      ];

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const result = await service.submitQuiz(userId, { electionId, answers } as any);

      expect(result[0].matchPercentage).toBe(0);
    });

    it('should return 0 when candidate has no positions (all zeros)', async () => {
      const candidates = [
        makeCandidate('c1', 'Empty', {}),
      ];
      const answers = [
        { questionId: 'q1', selectedValue: 2, importance: 1 },
        { questionId: 'q2', selectedValue: 1, importance: 1 },
      ];

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const result = await service.submitQuiz(userId, { electionId, answers } as any);

      expect(result[0].matchPercentage).toBe(0);
    });

    it('should give higher importance-weighted answers more influence on match', async () => {
      // Candidate agrees on q1, disagrees on q2
      const candidates = [
        makeCandidate('c1', 'Weighted', { q1: 2, q2: -2 }),
      ];

      // When importance on the agreeing question is high
      const answersHighAgree = [
        { questionId: 'q1', selectedValue: 2, importance: 3 },
        { questionId: 'q2', selectedValue: 2, importance: 1 },
      ];

      // When importance on the disagreeing question is high
      const answersHighDisagree = [
        { questionId: 'q1', selectedValue: 2, importance: 1 },
        { questionId: 'q2', selectedValue: 2, importance: 3 },
      ];

      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const resultHighAgree = await service.submitQuiz(userId, {
        electionId,
        answers: answersHighAgree,
      } as any);

      // Reset mocks for second call
      candidateRepository.find.mockResolvedValue(candidates);
      responseRepository.findOne.mockResolvedValue(null);
      responseRepository.create.mockImplementation((data) => data as any);
      responseRepository.save.mockImplementation(async (data) => data as any);

      const resultHighDisagree = await service.submitQuiz(userId, {
        electionId,
        answers: answersHighDisagree,
      } as any);

      // Higher importance on the agreeing question should yield a higher match
      expect(resultHighAgree[0].matchPercentage).toBeGreaterThan(
        resultHighDisagree[0].matchPercentage,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getMyResults
  // ---------------------------------------------------------------------------
  describe('getMyResults', () => {
    it('should return the quiz response when found', async () => {
      const response = {
        id: 'resp-1',
        userId: 'user-uuid-1',
        electionId: 'election-uuid-1',
        answers: [],
        matchResults: [],
      } as unknown as QuizResponse;

      responseRepository.findOne.mockResolvedValue(response);

      const result = await service.getMyResults('user-uuid-1', 'election-uuid-1');

      expect(result).toEqual(response);
      expect(responseRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', electionId: 'election-uuid-1' },
      });
    });

    it('should return null when no response found', async () => {
      responseRepository.findOne.mockResolvedValue(null);

      const result = await service.getMyResults('user-uuid-1', 'election-uuid-1');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // reorderQuestions
  // ---------------------------------------------------------------------------
  describe('reorderQuestions', () => {
    it('should update sortOrder for each question in the given order', async () => {
      const electionId = 'election-uuid-1';
      const questionIds = ['q3', 'q1', 'q2'];

      questionRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.reorderQuestions(electionId, questionIds);

      expect(questionRepository.update).toHaveBeenCalledTimes(3);
      expect(questionRepository.update).toHaveBeenCalledWith(
        { id: 'q3', electionId },
        { sortOrder: 0 },
      );
      expect(questionRepository.update).toHaveBeenCalledWith(
        { id: 'q1', electionId },
        { sortOrder: 1 },
      );
      expect(questionRepository.update).toHaveBeenCalledWith(
        { id: 'q2', electionId },
        { sortOrder: 2 },
      );
    });
  });
});
