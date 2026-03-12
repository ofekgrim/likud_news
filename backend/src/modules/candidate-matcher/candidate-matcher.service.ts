import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { PolicyStatement, PolicyCategory } from './entities/policy-statement.entity';
import { CandidatePosition } from './entities/candidate-position.entity';
import { MemberQuizResponse, QuizAnswer } from './entities/member-quiz-response.entity';
import { QuizMatchResult } from './entities/quiz-match-result.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { MatcherAlgorithmService } from './matcher-algorithm.service';
import { SubmitResponsesDto } from './dto/submit-responses.dto';
import {
  CreatePolicyStatementDto,
  UpdatePolicyStatementDto,
} from './dto/create-policy-statement.dto';
import { BulkUpsertPositionsDto } from './dto/bulk-upsert-positions.dto';
import { MatchResultResponseDto, CandidateMatchDto } from './dto/match-result.dto';

/** Cache TTL for match results: 30 minutes in milliseconds */
const MATCH_CACHE_TTL = 30 * 60 * 1000;

@Injectable()
export class CandidateMatcherService {
  private readonly logger = new Logger(CandidateMatcherService.name);

  constructor(
    @InjectRepository(PolicyStatement)
    private readonly statementRepository: Repository<PolicyStatement>,
    @InjectRepository(CandidatePosition)
    private readonly positionRepository: Repository<CandidatePosition>,
    @InjectRepository(MemberQuizResponse)
    private readonly responseRepository: Repository<MemberQuizResponse>,
    @InjectRepository(QuizMatchResult)
    private readonly matchResultRepository: Repository<QuizMatchResult>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(PrimaryElection)
    private readonly electionRepository: Repository<PrimaryElection>,
    private readonly matcherAlgorithm: MatcherAlgorithmService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // ─── Statements (Public) ──────────────────────────────────

  /**
   * Get active policy statements for an election, with optional category filter.
   * Paginated and sorted by sortOrder.
   */
  async getStatements(
    electionId: string,
    options: {
      category?: PolicyCategory;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: PolicyStatement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { category, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { electionId, isActive: true };
    if (category) {
      where.category = category;
    }

    const [data, total] = await this.statementRepository.findAndCount({
      where,
      order: { sortOrder: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Responses ────────────────────────────────────────────

  /**
   * Submit or upsert quiz responses for a user/device.
   * Supports both authenticated (appUserId) and anonymous (deviceId) users.
   */
  async submitResponses(
    dto: SubmitResponsesDto,
    appUserId?: string,
    deviceId?: string,
  ): Promise<{ saved: number; electionId: string }> {
    if (!appUserId && !deviceId) {
      throw new BadRequestException(
        'Either authenticated user or device ID header is required',
      );
    }

    // Verify election exists
    const election = await this.electionRepository.findOne({
      where: { id: dto.electionId },
    });
    if (!election) {
      throw new NotFoundException(
        `Election "${dto.electionId}" not found`,
      );
    }

    // Verify all statement IDs exist and belong to this election
    const statementIds = dto.responses.map((r) => r.statementId);
    const validStatements = await this.statementRepository
      .createQueryBuilder('s')
      .where('s.id IN (:...ids)', { ids: statementIds })
      .andWhere('s."electionId" = :electionId', {
        electionId: dto.electionId,
      })
      .andWhere('s."isActive" = true')
      .getCount();

    if (validStatements !== statementIds.length) {
      throw new BadRequestException(
        'One or more statement IDs are invalid or do not belong to this election',
      );
    }

    // Upsert each response
    let savedCount = 0;
    for (const item of dto.responses) {
      // Find existing response for this user+statement+election
      const whereClause: any = {
        statementId: item.statementId,
        electionId: dto.electionId,
      };
      if (appUserId) {
        whereClause.appUserId = appUserId;
      } else {
        whereClause.deviceId = deviceId;
      }

      let response = await this.responseRepository.findOne({
        where: whereClause,
      });

      if (response) {
        // Update existing
        response.answer = item.answer;
        response.importanceWeight = item.importanceWeight ?? 1.0;
      } else {
        // Create new
        response = this.responseRepository.create({
          appUserId: appUserId || undefined,
          deviceId: deviceId || undefined,
          statementId: item.statementId,
          electionId: dto.electionId,
          answer: item.answer,
          importanceWeight: item.importanceWeight ?? 1.0,
        });
      }

      await this.responseRepository.save(response);
      savedCount++;
    }

    // Invalidate cached match results for this user/device + election
    const cacheKey = this.buildMatchCacheKey(
      dto.electionId,
      appUserId,
      deviceId,
    );
    await this.cacheManager.del(cacheKey);

    this.logger.log(
      `Saved ${savedCount} responses for election ${dto.electionId} (user: ${appUserId || deviceId})`,
    );

    return { saved: savedCount, electionId: dto.electionId };
  }

  // ─── Match Computation ────────────────────────────────────

  /**
   * Compute match results for a user/device against all candidates in an election.
   *
   * Flow:
   * 1. Check Redis cache
   * 2. Load user responses from DB
   * 3. Load all candidate positions for election
   * 4. For each candidate: call matcherAlgorithm.computeMatch()
   * 5. Build category breakdown per candidate
   * 6. Sort by matchPct desc, take top 10
   * 7. Upsert quiz_match_results
   * 8. Cache in Redis (30min TTL)
   * 9. Return results
   */
  async computeMatches(
    electionId: string,
    appUserId?: string,
    deviceId?: string,
  ): Promise<MatchResultResponseDto> {
    if (!appUserId && !deviceId) {
      throw new BadRequestException(
        'Either authenticated user or device ID header is required',
      );
    }

    // 1. Check Redis cache
    const cacheKey = this.buildMatchCacheKey(electionId, appUserId, deviceId);
    const cached = await this.cacheManager.get<MatchResultResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for match: ${cacheKey}`);
      return cached;
    }

    // 2. Load user responses from DB (with statement relation for category info)
    const responseWhere: any = { electionId };
    if (appUserId) {
      responseWhere.appUserId = appUserId;
    } else {
      responseWhere.deviceId = deviceId;
    }

    const responses = await this.responseRepository.find({
      where: responseWhere,
      relations: ['statement'],
    });

    if (responses.length === 0) {
      throw new NotFoundException(
        'No responses found. Please complete the questionnaire first.',
      );
    }

    // Get total statements count for this election
    const totalStatements = await this.statementRepository.count({
      where: { electionId, isActive: true },
    });

    // Filter out skips for counting answered
    const answeredResponses = responses.filter(
      (r) => r.answer !== QuizAnswer.SKIP,
    );

    // 3. Load all candidate positions for this election
    const allPositions = await this.positionRepository
      .createQueryBuilder('cp')
      .innerJoinAndSelect('cp.candidate', 'c')
      .innerJoinAndSelect('cp.statement', 's')
      .where('s."electionId" = :electionId', { electionId })
      .andWhere('c."isActive" = true')
      .getMany();

    // Group positions by candidateId
    const candidatePositionsMap = new Map<string, CandidatePosition[]>();
    const candidateInfoMap = new Map<
      string,
      { fullName: string; photoUrl: string }
    >();

    for (const pos of allPositions) {
      if (!candidatePositionsMap.has(pos.candidateId)) {
        candidatePositionsMap.set(pos.candidateId, []);
        candidateInfoMap.set(pos.candidateId, {
          fullName: pos.candidate?.fullName || '',
          photoUrl: pos.candidate?.photoUrl || '',
        });
      }
      candidatePositionsMap.get(pos.candidateId)!.push(pos);
    }

    // 4. Compute matches for each candidate
    const matchResults =
      this.matcherAlgorithm.computeMatchesForCandidates(
        responses,
        candidatePositionsMap,
      );

    // 5-6. Take top 10, build response
    const topMatches = matchResults.slice(0, 10);

    const matches: CandidateMatchDto[] = topMatches.map((result) => {
      const info = candidateInfoMap.get(result.candidateId);
      return {
        candidateId: result.candidateId,
        candidateName: info?.fullName || '',
        photoUrl: info?.photoUrl || '',
        matchPct: result.matchPct,
        categoryBreakdown: result.categoryBreakdown,
      };
    });

    const now = new Date();

    // 7. Upsert quiz_match_results in DB
    for (const match of topMatches) {
      const existingWhere: any = {
        candidateId: match.candidateId,
        electionId,
      };
      if (appUserId) {
        existingWhere.appUserId = appUserId;
      } else {
        existingWhere.deviceId = deviceId;
      }

      let existing = await this.matchResultRepository.findOne({
        where: existingWhere,
      });

      if (existing) {
        existing.matchPct = match.matchPct;
        existing.categoryBreakdown = match.categoryBreakdown;
        await this.matchResultRepository.save(existing);
      } else {
        const newResult = this.matchResultRepository.create({
          appUserId: appUserId || undefined,
          deviceId: deviceId || undefined,
          candidateId: match.candidateId,
          electionId,
          matchPct: match.matchPct,
          categoryBreakdown: match.categoryBreakdown,
        });
        await this.matchResultRepository.save(newResult);
      }
    }

    const result: MatchResultResponseDto = {
      electionId,
      matches,
      totalAnswered: answeredResponses.length,
      totalStatements,
      computedAt: now.toISOString(),
    };

    // 8. Cache in Redis
    await this.cacheManager.set(cacheKey, result, MATCH_CACHE_TTL);
    this.logger.debug(`Cached match result: ${cacheKey} (TTL: 30min)`);

    return result;
  }

  // ─── Candidate Positions (Public) ─────────────────────────

  /**
   * Get all positions for a single candidate.
   */
  async getCandidatePositions(
    candidateId: string,
  ): Promise<CandidatePosition[]> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
    });
    if (!candidate) {
      throw new NotFoundException(
        `Candidate "${candidateId}" not found`,
      );
    }

    return this.positionRepository.find({
      where: { candidateId },
      relations: ['statement'],
      order: { statement: { sortOrder: 'ASC' } },
    });
  }

  // ─── Admin: Statements ────────────────────────────────────

  /**
   * Create a new policy statement (admin only).
   */
  async createStatement(
    dto: CreatePolicyStatementDto,
  ): Promise<PolicyStatement> {
    // Verify election exists
    const election = await this.electionRepository.findOne({
      where: { id: dto.electionId },
    });
    if (!election) {
      throw new NotFoundException(
        `Election "${dto.electionId}" not found`,
      );
    }

    const statement = this.statementRepository.create(dto);
    return this.statementRepository.save(statement);
  }

  /**
   * Update an existing policy statement (admin only).
   */
  async updateStatement(
    id: string,
    dto: UpdatePolicyStatementDto,
  ): Promise<PolicyStatement> {
    const statement = await this.statementRepository.findOne({
      where: { id },
    });
    if (!statement) {
      throw new NotFoundException(
        `Policy statement "${id}" not found`,
      );
    }

    Object.assign(statement, dto);
    return this.statementRepository.save(statement);
  }

  // ─── Admin: Positions ─────────────────────────────────────

  /**
   * Bulk upsert candidate positions (admin only).
   * For each item: if (candidateId, statementId) exists, update; otherwise insert.
   */
  async bulkUpsertPositions(
    dto: BulkUpsertPositionsDto,
  ): Promise<{ upserted: number }> {
    let upserted = 0;

    for (const item of dto.positions) {
      let position = await this.positionRepository.findOne({
        where: {
          candidateId: item.candidateId,
          statementId: item.statementId,
        },
      });

      if (position) {
        position.position = item.position;
        position.justificationHe = item.justificationHe ?? null;
      } else {
        position = this.positionRepository.create({
          candidateId: item.candidateId,
          statementId: item.statementId,
          position: item.position,
          justificationHe: item.justificationHe ?? null,
        });
      }

      await this.positionRepository.save(position);
      upserted++;
    }

    this.logger.log(`Bulk upserted ${upserted} candidate positions`);
    return { upserted };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private buildMatchCacheKey(
    electionId: string,
    appUserId?: string,
    deviceId?: string,
  ): string {
    const userKey = appUserId || deviceId;
    return `match:${electionId}:${userKey}`;
  }
}
