import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AmaService } from './ama.service';
import { AmaSession, AmaSessionStatus } from './entities/ama-session.entity';
import {
  AmaQuestion,
  AmaQuestionStatus,
} from './entities/ama-question.entity';
import { ModerateAction } from './dto/moderate-question.dto';
import { In } from 'typeorm';

describe('AmaService', () => {
  let service: AmaService;

  const mockSessionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockQuestionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmaService,
        {
          provide: getRepositoryToken(AmaSession),
          useValue: mockSessionRepo,
        },
        {
          provide: getRepositoryToken(AmaQuestion),
          useValue: mockQuestionRepo,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AmaService>(AmaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────
  // createSession
  // ─────────────────────────────────────────────────────────────────────
  describe('createSession', () => {
    it('should create a session with scheduled status', async () => {
      const dto = {
        candidateId: 'candidate-uuid',
        title: 'AMA with candidate',
        scheduledAt: '2026-04-01T18:00:00Z',
      };
      const adminId = 'admin-uuid';

      const createdSession = {
        id: 'session-uuid',
        ...dto,
        status: AmaSessionStatus.SCHEDULED,
        moderatorId: adminId,
      };

      mockSessionRepo.create.mockReturnValue(createdSession);
      mockSessionRepo.save.mockResolvedValue(createdSession);

      const result = await service.createSession(dto, adminId);

      expect(mockSessionRepo.create).toHaveBeenCalledWith({
        ...dto,
        status: AmaSessionStatus.SCHEDULED,
        moderatorId: adminId,
      });
      expect(mockSessionRepo.save).toHaveBeenCalledWith(createdSession);
      expect(result.status).toBe(AmaSessionStatus.SCHEDULED);
      expect(result.moderatorId).toBe(adminId);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // startSession
  // ─────────────────────────────────────────────────────────────────────
  describe('startSession', () => {
    it('should set status to live and startedAt', async () => {
      const session = {
        id: 'session-uuid',
        status: AmaSessionStatus.SCHEDULED,
        startedAt: null,
      };

      mockSessionRepo.findOne.mockResolvedValue(session);
      mockSessionRepo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.startSession('session-uuid');

      expect(result.status).toBe(AmaSessionStatus.LIVE);
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      mockSessionRepo.findOne.mockResolvedValue(null);

      await expect(service.startSession('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // endSession
  // ─────────────────────────────────────────────────────────────────────
  describe('endSession', () => {
    it('should set status to ended and endedAt', async () => {
      const session = {
        id: 'session-uuid',
        status: AmaSessionStatus.LIVE,
        endedAt: null,
      };

      mockSessionRepo.findOne.mockResolvedValue(session);
      mockSessionRepo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.endSession('session-uuid');

      expect(result.status).toBe(AmaSessionStatus.ENDED);
      expect(result.endedAt).toBeInstanceOf(Date);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // submitQuestion
  // ─────────────────────────────────────────────────────────────────────
  describe('submitQuestion', () => {
    it('should create question with pending status', async () => {
      const session = {
        id: 'session-uuid',
        maxQuestions: 100,
      };
      const dto = {
        sessionId: 'session-uuid',
        questionText: 'מה דעתך על הרפורמה הכלכלית?',
      };
      const appUserId = 'user-uuid';

      const createdQuestion = {
        id: 'question-uuid',
        ...dto,
        appUserId,
        status: AmaQuestionStatus.PENDING,
      };

      mockSessionRepo.findOne.mockResolvedValue(session);
      mockQuestionRepo.count.mockResolvedValue(5);
      mockQuestionRepo.create.mockReturnValue(createdQuestion);
      mockQuestionRepo.save.mockResolvedValue(createdQuestion);

      const result = await service.submitQuestion(dto, appUserId);

      expect(result.status).toBe(AmaQuestionStatus.PENDING);
      expect(mockQuestionRepo.create).toHaveBeenCalledWith({
        sessionId: dto.sessionId,
        appUserId,
        questionText: dto.questionText,
        status: AmaQuestionStatus.PENDING,
      });
    });

    it('should reject questions containing profanity', async () => {
      const dto = {
        sessionId: 'session-uuid',
        questionText: 'אתה בן זונה',
      };

      await expect(service.submitQuestion(dto, 'user-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject when max questions limit is reached', async () => {
      const session = {
        id: 'session-uuid',
        maxQuestions: 5,
      };
      const dto = {
        sessionId: 'session-uuid',
        questionText: 'שאלה לגיטימית על מדיניות כלכלית',
      };

      mockSessionRepo.findOne.mockResolvedValue(session);
      mockQuestionRepo.count.mockResolvedValue(5);

      await expect(service.submitQuestion(dto, 'user-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // moderateQuestion
  // ─────────────────────────────────────────────────────────────────────
  describe('moderateQuestion', () => {
    it('should approve a question', async () => {
      const question = {
        id: 'question-uuid',
        status: AmaQuestionStatus.PENDING,
        isModerated: false,
        moderatedById: null,
      };

      mockQuestionRepo.findOne.mockResolvedValue(question);
      mockQuestionRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.moderateQuestion(
        'question-uuid',
        { status: ModerateAction.APPROVED },
        'moderator-uuid',
      );

      expect(result.status).toBe(AmaQuestionStatus.APPROVED);
      expect(result.isModerated).toBe(true);
      expect(result.moderatedById).toBe('moderator-uuid');
    });

    it('should reject a question', async () => {
      const question = {
        id: 'question-uuid',
        status: AmaQuestionStatus.PENDING,
        isModerated: false,
        moderatedById: null,
      };

      mockQuestionRepo.findOne.mockResolvedValue(question);
      mockQuestionRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.moderateQuestion(
        'question-uuid',
        { status: ModerateAction.REJECTED },
        'moderator-uuid',
      );

      expect(result.status).toBe(AmaQuestionStatus.REJECTED);
      expect(result.isModerated).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // answerQuestion
  // ─────────────────────────────────────────────────────────────────────
  describe('answerQuestion', () => {
    it('should set answerText and answeredAt', async () => {
      const question = {
        id: 'question-uuid',
        status: AmaQuestionStatus.APPROVED,
        answerText: null,
        answeredAt: null,
      };

      mockQuestionRepo.findOne.mockResolvedValue(question);
      mockQuestionRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.answerQuestion('question-uuid', {
        answerText: 'תודה על השאלה, הנה התשובה שלי...',
      });

      expect(result.answerText).toBe('תודה על השאלה, הנה התשובה שלי...');
      expect(result.answeredAt).toBeInstanceOf(Date);
      expect(result.status).toBe(AmaQuestionStatus.ANSWERED);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // upvoteQuestion
  // ─────────────────────────────────────────────────────────────────────
  describe('upvoteQuestion', () => {
    it('should increment upvoteCount', async () => {
      const question = {
        id: 'question-uuid',
        sessionId: 'session-uuid',
        upvoteCount: 5,
      };

      mockQuestionRepo.findOne.mockResolvedValue(question);
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockQuestionRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.upvoteQuestion(
        'question-uuid',
        'user-uuid',
      );

      expect(result.upvoteCount).toBe(6);
    });

    it('should prevent duplicate upvotes from the same user', async () => {
      const question = {
        id: 'question-uuid',
        sessionId: 'session-uuid',
        upvoteCount: 5,
      };

      mockQuestionRepo.findOne.mockResolvedValue(question);
      mockCacheManager.get.mockResolvedValue(['user-uuid']);

      await expect(
        service.upvoteQuestion('question-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // getSessionQuestions
  // ─────────────────────────────────────────────────────────────────────
  describe('getSessionQuestions', () => {
    it('should return questions ordered by upvoteCount DESC', async () => {
      const questions = [
        { id: 'q1', upvoteCount: 10, isPinned: false },
        { id: 'q2', upvoteCount: 5, isPinned: false },
        { id: 'q3', upvoteCount: 1, isPinned: false },
      ];

      mockQuestionRepo.find.mockResolvedValue(questions);

      const result = await service.getSessionQuestions('session-uuid');

      expect(result).toEqual(questions);
      expect(mockQuestionRepo.find).toHaveBeenCalledWith({
        where: { sessionId: 'session-uuid' },
        order: { isPinned: 'DESC', upvoteCount: 'DESC', createdAt: 'ASC' },
      });
    });

    it('should filter by status when provided', async () => {
      mockQuestionRepo.find.mockResolvedValue([]);

      await service.getSessionQuestions(
        'session-uuid',
        AmaQuestionStatus.APPROVED,
      );

      expect(mockQuestionRepo.find).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-uuid',
          status: AmaQuestionStatus.APPROVED,
        },
        order: { isPinned: 'DESC', upvoteCount: 'DESC', createdAt: 'ASC' },
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // getUpcomingSessions
  // ─────────────────────────────────────────────────────────────────────
  describe('getUpcomingSessions', () => {
    it('should return only scheduled and live sessions', async () => {
      const sessions = [
        { id: 's1', status: AmaSessionStatus.SCHEDULED },
        { id: 's2', status: AmaSessionStatus.LIVE },
      ];

      mockSessionRepo.find.mockResolvedValue(sessions);

      const result = await service.getUpcomingSessions();

      expect(result).toEqual(sessions);
      expect(mockSessionRepo.find).toHaveBeenCalledWith({
        where: {
          status: In([AmaSessionStatus.SCHEDULED, AmaSessionStatus.LIVE]),
          isActive: true,
        },
        order: { scheduledAt: 'ASC' },
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // pinQuestion
  // ─────────────────────────────────────────────────────────────────────
  describe('pinQuestion', () => {
    it('should toggle isPinned from false to true', async () => {
      const question = {
        id: 'question-uuid',
        isPinned: false,
      };

      mockQuestionRepo.findOne.mockResolvedValue(question);
      mockQuestionRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.pinQuestion('question-uuid');

      expect(result.isPinned).toBe(true);
    });

    it('should toggle isPinned from true to false', async () => {
      const question = {
        id: 'question-uuid',
        isPinned: true,
      };

      mockQuestionRepo.findOne.mockResolvedValue(question);
      mockQuestionRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.pinQuestion('question-uuid');

      expect(result.isPinned).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // containsProfanity
  // ─────────────────────────────────────────────────────────────────────
  describe('containsProfanity', () => {
    it('should detect Hebrew profanity', () => {
      expect(service.containsProfanity('אתה מניאק')).toBe(true);
    });

    it('should pass clean text', () => {
      expect(
        service.containsProfanity('מה דעתך על הרפורמה הכלכלית?'),
      ).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // archiveSession
  // ─────────────────────────────────────────────────────────────────────
  describe('archiveSession', () => {
    it('should set status to archived', async () => {
      const session = {
        id: 'session-uuid',
        status: AmaSessionStatus.ENDED,
      };

      mockSessionRepo.findOne.mockResolvedValue(session);
      mockSessionRepo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.archiveSession('session-uuid');

      expect(result.status).toBe(AmaSessionStatus.ARCHIVED);
    });
  });
});
