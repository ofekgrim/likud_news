import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyQuiz } from './entities/daily-quiz.entity';
import { DailyQuizAttempt } from './entities/daily-quiz-attempt.entity';
import { GamificationService } from './gamification.service';
import { PointAction } from './entities/user-points.entity';
import { CreateDailyQuizDto } from './dto/create-daily-quiz.dto';
import { SubmitDailyQuizDto } from './dto/submit-daily-quiz.dto';

@Injectable()
export class DailyQuizService {
  private readonly logger = new Logger(DailyQuizService.name);

  constructor(
    @InjectRepository(DailyQuiz)
    private readonly dailyQuizRepository: Repository<DailyQuiz>,
    @InjectRepository(DailyQuizAttempt)
    private readonly attemptRepository: Repository<DailyQuizAttempt>,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Get today's active quiz. Returns null if no quiz set for today.
   */
  async getTodayQuiz(userId?: string): Promise<{
    quiz: DailyQuiz | null;
    userCompleted: boolean;
    userScore?: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const quiz = await this.dailyQuizRepository.findOne({
      where: { date: today, isActive: true },
    });

    if (!quiz) {
      return { quiz: null, userCompleted: false };
    }

    // Strip correct answers from questions for client
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ label: o.label })),
      })),
    };

    if (!userId) {
      return { quiz: sanitizedQuiz as DailyQuiz, userCompleted: false };
    }

    const attempt = await this.attemptRepository.findOne({
      where: { userId, quizId: quiz.id },
    });

    return {
      quiz: attempt ? quiz : (sanitizedQuiz as DailyQuiz),
      userCompleted: !!attempt,
      userScore: attempt?.score,
    };
  }

  /**
   * Submit a daily quiz attempt. Awards points based on score.
   */
  async submitAttempt(
    userId: string,
    dto: SubmitDailyQuizDto,
  ): Promise<{
    score: number;
    totalQuestions: number;
    pointsAwarded: number;
    correctAnswers: boolean[];
  }> {
    const quiz = await this.dailyQuizRepository.findOne({
      where: { id: dto.quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check if already attempted
    const existing = await this.attemptRepository.findOne({
      where: { userId, quizId: dto.quizId },
    });

    if (existing) {
      throw new ConflictException('Quiz already completed');
    }

    // Score the quiz
    const correctAnswers = quiz.questions.map((q, i) => {
      const selectedIndex = dto.answers[i];
      return q.options[selectedIndex]?.isCorrect ?? false;
    });

    const score = correctAnswers.filter(Boolean).length;
    const totalQuestions = quiz.questions.length;

    // Calculate points: base reward scaled by score percentage
    const scoreRatio = score / totalQuestions;
    const pointsAwarded = Math.round(quiz.pointsReward * scoreRatio);

    // Save attempt
    const attempt = this.attemptRepository.create({
      userId,
      quizId: quiz.id,
      answers: dto.answers,
      score,
      totalQuestions,
      pointsAwarded,
    });
    await this.attemptRepository.save(attempt);

    // Award points
    if (pointsAwarded > 0) {
      await this.gamificationService.trackAction(
        userId,
        PointAction.DAILY_QUIZ_COMPLETE,
        {
          quizId: quiz.id,
          date: quiz.date,
          score,
          totalQuestions,
        },
      );
    }

    return { score, totalQuestions, pointsAwarded, correctAnswers };
  }

  /**
   * Create a new daily quiz (admin).
   */
  async createQuiz(dto: CreateDailyQuizDto): Promise<DailyQuiz> {
    const existing = await this.dailyQuizRepository.findOne({
      where: { date: dto.date },
    });

    if (existing) {
      throw new ConflictException(`Quiz already exists for date ${dto.date}`);
    }

    const quiz = this.dailyQuizRepository.create({
      date: dto.date,
      questions: dto.questions,
      pointsReward: dto.pointsReward ?? 20,
    });

    return this.dailyQuizRepository.save(quiz);
  }

  /**
   * Update an existing daily quiz (admin).
   */
  async updateQuiz(
    id: string,
    dto: Partial<CreateDailyQuizDto>,
  ): Promise<DailyQuiz> {
    const quiz = await this.dailyQuizRepository.findOne({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (dto.questions) quiz.questions = dto.questions;
    if (dto.pointsReward !== undefined) quiz.pointsReward = dto.pointsReward;

    return this.dailyQuizRepository.save(quiz);
  }

  /**
   * List daily quizzes with completion stats (admin).
   */
  async listQuizzes(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Array<DailyQuiz & { completionCount: number; averageScore: number }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [quizzes, total] = await this.dailyQuizRepository.findAndCount({
      order: { date: 'DESC' },
      skip,
      take: limit,
    });

    const data = await Promise.all(
      quizzes.map(async (quiz) => {
        const [completionCount, avgResult] = await Promise.all([
          this.attemptRepository.count({ where: { quizId: quiz.id } }),
          this.attemptRepository
            .createQueryBuilder('a')
            .select('AVG(a.score)', 'avg')
            .where('a.quizId = :quizId', { quizId: quiz.id })
            .getRawOne(),
        ]);

        return {
          ...quiz,
          completionCount,
          averageScore: parseFloat(avgResult?.avg || '0'),
        };
      }),
    );

    return { data, total, page, limit };
  }

  /**
   * Delete a daily quiz (admin).
   */
  async deleteQuiz(id: string): Promise<void> {
    const quiz = await this.dailyQuizRepository.findOne({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    await this.dailyQuizRepository.remove(quiz);
  }
}
