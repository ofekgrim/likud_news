import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RagService } from './rag.service';
import {
  ChatbotSession,
  ChatFeedback,
  ChatMessage,
} from './entities/chatbot-session.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

const mockRagService = {
  retrieveContext: jest.fn(),
  buildContextPrompt: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('ChatService', () => {
  let service: ChatService;
  let sessionRepository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatbotSession),
          useFactory: mockRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RagService, useValue: mockRagService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    sessionRepository = module.get(getRepositoryToken(ChatbotSession));

    // Reset mocks
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue(undefined);
    mockRagService.retrieveContext.mockResolvedValue([]);
    mockRagService.buildContextPrompt.mockReturnValue('');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── createSession ───────────────────────────────────────────────────
  describe('createSession', () => {
    it('should create a session with appUserId', async () => {
      const session = {
        id: 'session-1',
        appUserId: 'user-1',
        deviceId: null,
        messages: [],
        messageCount: 0,
        flaggedForReview: false,
        feedback: null,
      };

      sessionRepository.create.mockReturnValue(session);
      sessionRepository.save.mockResolvedValue(session);

      const result = await service.createSession('user-1');

      expect(sessionRepository.create).toHaveBeenCalledWith({
        appUserId: 'user-1',
        deviceId: undefined,
        messages: [],
        messageCount: 0,
        flaggedForReview: false,
      });
      expect(result.appUserId).toBe('user-1');
      expect(result.messages).toEqual([]);
    });

    it('should create a session with deviceId (anonymous)', async () => {
      const session = {
        id: 'session-2',
        appUserId: null,
        deviceId: 'device-abc',
        messages: [],
        messageCount: 0,
        flaggedForReview: false,
        feedback: null,
      };

      sessionRepository.create.mockReturnValue(session);
      sessionRepository.save.mockResolvedValue(session);

      const result = await service.createSession(undefined, 'device-abc');

      expect(sessionRepository.create).toHaveBeenCalledWith({
        appUserId: undefined,
        deviceId: 'device-abc',
        messages: [],
        messageCount: 0,
        flaggedForReview: false,
      });
      expect(result.deviceId).toBe('device-abc');
      expect(result.appUserId).toBeNull();
    });
  });

  // ── getSession ──────────────────────────────────────────────────────
  describe('getSession', () => {
    it('should return session with messages', async () => {
      const session = {
        id: 'session-1',
        messages: [
          { role: 'user', content: 'Hello', timestamp: '2026-01-01T00:00:00Z' },
          {
            role: 'assistant',
            content: 'Hi!',
            timestamp: '2026-01-01T00:00:01Z',
          },
        ],
        messageCount: 1,
      };

      sessionRepository.findOne.mockResolvedValue(session);

      const result = await service.getSession('session-1');

      expect(result.messages).toHaveLength(2);
      expect(result.id).toBe('session-1');
    });

    it('should throw NotFoundException for missing session', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(service.getSession('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── chat ────────────────────────────────────────────────────────────
  describe('chat', () => {
    it('should append messages and return fallback when no LLM configured', async () => {
      const session = {
        id: 'session-1',
        messages: [] as ChatMessage[],
        messageCount: 0,
      };

      sessionRepository.findOne.mockResolvedValue(session);
      sessionRepository.save.mockImplementation(async (s) => s);

      const reply = await service.chat('session-1', 'Hello');

      // Both DictaLM and Claude are unconfigured, so we get the fallback message
      expect(reply).toBe(
        'מצטער, לא הצלחתי לעבד את הבקשה כרגע. אנא נסה שוב מאוחר יותר.',
      );

      // Session should have both user + assistant messages
      expect(session.messages).toHaveLength(2);
      expect(session.messages[0].role).toBe('user');
      expect(session.messages[0].content).toBe('Hello');
      expect(session.messages[1].role).toBe('assistant');
    });

    it('should respect system prompt (RAG context is built)', async () => {
      const session = {
        id: 'session-1',
        messages: [] as ChatMessage[],
        messageCount: 0,
      };

      sessionRepository.findOne.mockResolvedValue(session);
      sessionRepository.save.mockImplementation(async (s) => s);
      mockRagService.retrieveContext.mockResolvedValue([
        { chunkText: 'some context', articleId: 'art-1', score: 0.9 },
      ]);
      mockRagService.buildContextPrompt.mockReturnValue(
        'Context from articles...',
      );

      await service.chat('session-1', 'What is Likud?');

      // Verify RAG was called
      expect(mockRagService.retrieveContext).toHaveBeenCalledWith(
        'What is Likud?',
      );
      expect(mockRagService.buildContextPrompt).toHaveBeenCalled();
    });

    it('should increment messageCount', async () => {
      const session = {
        id: 'session-1',
        messages: [] as ChatMessage[],
        messageCount: 0,
      };

      sessionRepository.findOne.mockResolvedValue(session);
      sessionRepository.save.mockImplementation(async (s) => s);

      await service.chat('session-1', 'Hello');

      expect(session.messageCount).toBe(1);
    });
  });

  // ── flagSession ─────────────────────────────────────────────────────
  describe('flagSession', () => {
    it('should set flaggedForReview to true', async () => {
      const session = {
        id: 'session-1',
        flaggedForReview: false,
      };

      sessionRepository.findOne.mockResolvedValue(session);
      sessionRepository.save.mockImplementation(async (s) => s);

      const result = await service.flagSession('session-1');

      expect(result.flaggedForReview).toBe(true);
      expect(sessionRepository.save).toHaveBeenCalled();
    });
  });

  // ── provideFeedback ─────────────────────────────────────────────────
  describe('provideFeedback', () => {
    it('should update feedback field', async () => {
      const session = {
        id: 'session-1',
        feedback: null,
      };

      sessionRepository.findOne.mockResolvedValue(session);
      sessionRepository.save.mockImplementation(async (s) => s);

      const result = await service.provideFeedback(
        'session-1',
        ChatFeedback.POSITIVE,
      );

      expect(result.feedback).toBe(ChatFeedback.POSITIVE);
      expect(sessionRepository.save).toHaveBeenCalled();
    });
  });
});
