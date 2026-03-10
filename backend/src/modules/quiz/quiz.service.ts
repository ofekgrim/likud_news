import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectRepository(QuizQuestion)
    private readonly questionRepository: Repository<QuizQuestion>,
    @InjectRepository(QuizResponse)
    private readonly responseRepository: Repository<QuizResponse>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(PrimaryElection)
    private readonly electionRepository: Repository<PrimaryElection>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get the first active election's ID (status = 'active' or 'voting').
   */
  async getActiveElectionId(): Promise<string> {
    const election = await this.electionRepository.findOne({
      where: [
        { status: 'active' as any },
        { status: 'voting' as any },
      ],
      order: { createdAt: 'DESC' },
    });

    if (!election) {
      throw new NotFoundException('No active election found');
    }

    return election.id;
  }

  /**
   * Get all active questions for an election, ordered by sortOrder.
   */
  async getQuestions(electionId: string): Promise<QuizQuestion[]> {
    return this.questionRepository.find({
      where: { electionId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Get ALL questions for an election (active + inactive), for admin use.
   */
  async getAllQuestions(electionId: string): Promise<QuizQuestion[]> {
    return this.questionRepository.find({
      where: { electionId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Create a quiz question (admin only).
   */
  async createQuestion(dto: CreateQuizQuestionDto): Promise<QuizQuestion> {
    const question = this.questionRepository.create(dto);
    const saved = await this.questionRepository.save(question);

    // Notify when first quiz question is activated for an election
    if (dto.electionId) {
      const questionCount = await this.questionRepository.count({
        where: { electionId: dto.electionId, isActive: true },
      });
      if (questionCount === 1) {
        this.notificationsService.triggerContentNotification(
          'quiz.activated',
          'quiz',
          dto.electionId,
        {
          quiz_title: 'שאלון התאמה',
          questions_count: '1',
        },
      ).catch((err) => this.logger.error(`Quiz notification failed: ${err.message}`));
      }
    }

    return saved;
  }

  /**
   * Update a quiz question (admin only).
   */
  async updateQuestion(
    id: string,
    dto: UpdateQuizQuestionDto,
  ): Promise<QuizQuestion> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Quiz question "${id}" not found`);
    }

    Object.assign(question, dto);
    return this.questionRepository.save(question);
  }

  /**
   * Soft-delete a quiz question (set isActive = false). Admin only.
   */
  async deleteQuestion(id: string): Promise<void> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Quiz question "${id}" not found`);
    }

    question.isActive = false;
    await this.questionRepository.save(question);
  }

  /**
   * Submit a quiz: compute cosine similarity between user answers and
   * each candidate's quiz positions, save results, and return match scores.
   */
  async submitQuiz(
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<{ candidateId: string; candidateName: string; matchPercentage: number }[]> {
    const { electionId, answers } = dto;

    // Get all active candidates for the election with their quizPositions
    const candidates = await this.candidateRepository.find({
      where: { electionId, isActive: true },
    });

    if (!candidates.length) {
      // No candidates yet — save answers without match results
      let response = await this.responseRepository.findOne({
        where: { userId, electionId },
      });
      if (response) {
        response.answers = answers;
        response.matchResults = [];
        response.completedAt = new Date();
      } else {
        response = this.responseRepository.create({
          userId,
          electionId,
          answers,
          matchResults: [],
          completedAt: new Date(),
        });
      }
      await this.responseRepository.save(response);
      return [];
    }

    // Compute match for each candidate
    const matchResults = candidates.map((candidate) => {
      const matchPercentage = this.computeMatch(
        answers,
        candidate.quizPositions || {},
      );
      return {
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        matchPercentage,
      };
    });

    // Sort by match percentage descending
    matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Check for existing response — upsert
    let response = await this.responseRepository.findOne({
      where: { userId, electionId },
    });

    const storedResults = matchResults.map((r) => ({
      candidateId: r.candidateId,
      candidateName: r.candidateName,
      matchPercentage: r.matchPercentage,
    }));

    if (response) {
      response.answers = answers;
      response.matchResults = storedResults;
      response.completedAt = new Date();
    } else {
      response = this.responseRepository.create({
        userId,
        electionId,
        answers,
        matchResults: storedResults,
      });
    }

    await this.responseRepository.save(response);

    return matchResults;
  }

  /**
   * Cosine similarity between user answers and candidate positions,
   * weighted by user-specified importance scores.
   *
   * userAnswers: [{ questionId, selectedValue, importance }]
   * candidatePositions: { [questionId]: number }
   *
   * Returns a percentage [0, 100].
   */
  private computeMatch(
    userAnswers: { questionId: string; selectedValue: number; importance: number }[],
    candidatePositions: Record<string, number>,
  ): number {
    let dotProduct = 0;
    let userMag = 0;
    let candMag = 0;

    for (const answer of userAnswers) {
      const candValue = candidatePositions[answer.questionId] ?? 0;
      const weight = answer.importance; // 1, 2, or 3
      const userVal = answer.selectedValue * weight;
      const candVal = candValue * weight;

      dotProduct += userVal * candVal;
      userMag += userVal * userVal;
      candMag += candVal * candVal;
    }

    if (userMag === 0 || candMag === 0) return 0;

    const similarity = dotProduct / (Math.sqrt(userMag) * Math.sqrt(candMag));

    // Convert from [-1, 1] to [0, 100]
    return Math.round(((similarity + 1) / 2) * 100);
  }

  /**
   * Get all elections that have quiz questions, with metadata.
   * Optionally includes whether a specific user has completed each quiz.
   */
  async getQuizElections(userId?: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    questionCount: number;
    candidateCount: number;
    hasCompleted: boolean;
    completedAt: string | null;
  }[]> {
    // Get elections that have at least one active quiz question
    const elections = await this.electionRepository
      .createQueryBuilder('e')
      .innerJoin('quiz_questions', 'q', 'q."electionId" = e.id AND q."isActive" = true')
      .select([
        'e.id AS id',
        'e.title AS title',
        'e.description AS description',
        'e.status AS status',
        'COUNT(DISTINCT q.id) AS "questionCount"',
      ])
      .groupBy('e.id')
      .orderBy('e."createdAt"', 'DESC')
      .getRawMany();

    // Get candidate counts per election
    const candidateCounts = await this.candidateRepository
      .createQueryBuilder('c')
      .select(['c."electionId"', 'COUNT(*) AS "candidateCount"'])
      .where('c."isActive" = true')
      .groupBy('c."electionId"')
      .getRawMany();

    const candMap = new Map<string, number>();
    for (const row of candidateCounts) {
      candMap.set(row.electionId, parseInt(row.candidateCount, 10));
    }

    // If user is authenticated, check which quizzes they've completed
    const completedMap = new Map<string, string>();
    if (userId) {
      const responses = await this.responseRepository.find({
        where: { userId },
        select: ['electionId', 'completedAt'],
      });
      for (const r of responses) {
        completedMap.set(r.electionId, r.completedAt?.toISOString() ?? null);
      }
    }

    return elections.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      status: e.status,
      questionCount: parseInt(e.questionCount, 10),
      candidateCount: candMap.get(e.id) ?? 0,
      hasCompleted: completedMap.has(e.id),
      completedAt: completedMap.get(e.id) ?? null,
    }));
  }

  /**
   * Get all quiz responses for an election (admin use).
   * Includes user info for display.
   */
  async getResponses(electionId: string): Promise<{
    data: QuizResponse[];
    total: number;
  }> {
    const [data, total] = await this.responseRepository.findAndCount({
      where: { electionId },
      relations: ['user'],
      order: { completedAt: 'DESC' },
    });
    return { data, total };
  }

  /**
   * Get existing quiz response for a user in an election.
   */
  async getMyResults(
    userId: string,
    electionId: string,
  ): Promise<QuizResponse | null> {
    return this.responseRepository.findOne({
      where: { userId, electionId },
    });
  }

  /**
   * Bulk update sortOrder for questions in an election.
   */
  async reorderQuestions(
    electionId: string,
    questionIds: string[],
  ): Promise<void> {
    const promises = questionIds.map((id, index) =>
      this.questionRepository.update(
        { id, electionId },
        { sortOrder: index },
      ),
    );

    await Promise.all(promises);
  }

  /**
   * Compute average match percentages per candidate across all quiz responses
   * for the given election. This aggregates every user's matchResults JSON
   * to produce a community-wide average for each candidate.
   *
   * Returns an array sorted by average match percentage descending.
   */
  async getAverageResults(
    electionId: string,
  ): Promise<{
    candidateId: string;
    candidateName: string;
    averageMatchPercentage: number;
    totalResponses: number;
  }[]> {
    // Use a raw query to unnest the JSONB matchResults array and compute averages
    const results = await this.responseRepository
      .createQueryBuilder('r')
      .select([
        "match->>'candidateId' AS \"candidateId\"",
        "match->>'candidateName' AS \"candidateName\"",
        'ROUND(AVG((match->>\'matchPercentage\')::numeric))::int AS "averageMatchPercentage"',
        'COUNT(DISTINCT r.id)::int AS "totalResponses"',
      ])
      .innerJoin(
        'jsonb_array_elements(r."matchResults")',
        'match',
        'TRUE',
      )
      .where('r."electionId" = :electionId', { electionId })
      .groupBy("match->>'candidateId'")
      .addGroupBy("match->>'candidateName'")
      .orderBy('"averageMatchPercentage"', 'DESC')
      .getRawMany();

    return results.map((row) => ({
      candidateId: row.candidateId,
      candidateName: row.candidateName,
      averageMatchPercentage: parseInt(row.averageMatchPercentage, 10) || 0,
      totalResponses: parseInt(row.totalResponses, 10) || 0,
    }));
  }
}
