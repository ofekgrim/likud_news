import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AmaSession, AmaSessionStatus } from './entities/ama-session.entity';
import {
  AmaQuestion,
  AmaQuestionStatus,
} from './entities/ama-question.entity';
import { CreateAmaSessionDto } from './dto/create-ama-session.dto';
import { UpdateAmaSessionDto } from './dto/update-ama-session.dto';
import { SubmitQuestionDto } from './dto/submit-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import {
  ModerateQuestionDto,
  ModerateAction,
} from './dto/moderate-question.dto';

// Hebrew profanity word list for content moderation
const HEBREW_PROFANITY_LIST = [
  'זונה',
  'מזדיין',
  'חרא',
  'כוס',
  'זין',
  'מניאק',
  'שרמוטה',
  'בןזונה',
  'בן זונה',
  'תחת',
  'מטומטם',
  'אידיוט',
  'טמבל',
  'חמור',
  'דביל',
];

@Injectable()
export class AmaService {
  private readonly logger = new Logger(AmaService.name);

  constructor(
    @InjectRepository(AmaSession)
    private readonly sessionRepo: Repository<AmaSession>,
    @InjectRepository(AmaQuestion)
    private readonly questionRepo: Repository<AmaQuestion>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // ── Session management ────────────────────────────────────────────────

  async createSession(
    dto: CreateAmaSessionDto,
    adminId: string,
  ): Promise<AmaSession> {
    const session = this.sessionRepo.create({
      ...dto,
      status: AmaSessionStatus.SCHEDULED,
      moderatorId: adminId,
    });
    return this.sessionRepo.save(session);
  }

  async updateSession(
    sessionId: string,
    dto: UpdateAmaSessionDto,
  ): Promise<AmaSession> {
    const session = await this.findSessionOrFail(sessionId);
    Object.assign(session, dto);
    return this.sessionRepo.save(session);
  }

  async startSession(sessionId: string): Promise<AmaSession> {
    const session = await this.findSessionOrFail(sessionId);
    session.status = AmaSessionStatus.LIVE;
    session.startedAt = new Date();
    return this.sessionRepo.save(session);
  }

  async endSession(sessionId: string): Promise<AmaSession> {
    const session = await this.findSessionOrFail(sessionId);
    session.status = AmaSessionStatus.ENDED;
    session.endedAt = new Date();
    return this.sessionRepo.save(session);
  }

  async archiveSession(sessionId: string): Promise<AmaSession> {
    const session = await this.findSessionOrFail(sessionId);
    session.status = AmaSessionStatus.ARCHIVED;
    return this.sessionRepo.save(session);
  }

  async getSession(sessionId: string): Promise<AmaSession & { questions: AmaQuestion[] }> {
    const session = await this.findSessionOrFail(sessionId);
    const questions = await this.questionRepo.find({
      where: { sessionId },
      order: { upvoteCount: 'DESC', createdAt: 'ASC' },
    });
    return { ...session, questions };
  }

  async getSessions(filter?: {
    status?: AmaSessionStatus;
  }): Promise<AmaSession[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (filter?.status) {
      where.status = filter.status;
    }
    return this.sessionRepo.find({
      where,
      order: { scheduledAt: 'DESC' },
    });
  }

  async getUpcomingSessions(): Promise<AmaSession[]> {
    return this.sessionRepo.find({
      where: {
        status: In([AmaSessionStatus.SCHEDULED, AmaSessionStatus.LIVE]),
        isActive: true,
      },
      order: { scheduledAt: 'ASC' },
    });
  }

  // ── Question management ───────────────────────────────────────────────

  async submitQuestion(
    dto: SubmitQuestionDto,
    appUserId: string,
  ): Promise<AmaQuestion> {
    // Check profanity
    if (this.containsProfanity(dto.questionText)) {
      throw new BadRequestException(
        'השאלה מכילה תוכן לא הולם. אנא נסח מחדש.',
      );
    }

    const session = await this.findSessionOrFail(dto.sessionId);

    // Check max questions limit
    const questionCount = await this.questionRepo.count({
      where: { sessionId: dto.sessionId },
    });
    if (questionCount >= session.maxQuestions) {
      throw new BadRequestException('Session has reached maximum questions limit');
    }

    const question = this.questionRepo.create({
      sessionId: dto.sessionId,
      appUserId,
      questionText: dto.questionText,
      status: AmaQuestionStatus.PENDING,
    });
    return this.questionRepo.save(question);
  }

  async moderateQuestion(
    questionId: string,
    dto: ModerateQuestionDto,
    moderatorId: string,
  ): Promise<AmaQuestion> {
    const question = await this.findQuestionOrFail(questionId);
    question.status =
      dto.status === ModerateAction.APPROVED
        ? AmaQuestionStatus.APPROVED
        : AmaQuestionStatus.REJECTED;
    question.isModerated = true;
    question.moderatedById = moderatorId;
    return this.questionRepo.save(question);
  }

  async answerQuestion(
    questionId: string,
    dto: AnswerQuestionDto,
  ): Promise<AmaQuestion> {
    const question = await this.findQuestionOrFail(questionId);
    question.answerText = dto.answerText;
    question.answeredAt = new Date();
    question.status = AmaQuestionStatus.ANSWERED;
    return this.questionRepo.save(question);
  }

  async upvoteQuestion(
    questionId: string,
    appUserId: string,
  ): Promise<AmaQuestion> {
    const question = await this.findQuestionOrFail(questionId);

    // Check for duplicate upvote using Redis set
    const cacheKey = `ama:upvote:${questionId}`;
    const existingVoters =
      ((await this.cacheManager.get<string[]>(cacheKey)) as string[]) || [];

    if (existingVoters.includes(appUserId)) {
      throw new BadRequestException('You have already upvoted this question');
    }

    existingVoters.push(appUserId);
    await this.cacheManager.set(cacheKey, existingVoters, 24 * 60 * 60 * 1000); // 24 hours

    question.upvoteCount += 1;
    return this.questionRepo.save(question);
  }

  async getSessionQuestions(
    sessionId: string,
    status?: AmaQuestionStatus,
  ): Promise<AmaQuestion[]> {
    const where: Record<string, unknown> = { sessionId };
    if (status) {
      where.status = status;
    }
    return this.questionRepo.find({
      where,
      order: { isPinned: 'DESC', upvoteCount: 'DESC', createdAt: 'ASC' },
    });
  }

  async pinQuestion(questionId: string): Promise<AmaQuestion> {
    const question = await this.findQuestionOrFail(questionId);
    question.isPinned = !question.isPinned;
    return this.questionRepo.save(question);
  }

  // ── Private helpers ───────────────────────────────────────────────────

  private async findSessionOrFail(sessionId: string): Promise<AmaSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`AMA session ${sessionId} not found`);
    }
    return session;
  }

  private async findQuestionOrFail(questionId: string): Promise<AmaQuestion> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`AMA question ${questionId} not found`);
    }
    return question;
  }

  containsProfanity(text: string): boolean {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ');
    return HEBREW_PROFANITY_LIST.some((word) => normalized.includes(word));
  }
}
