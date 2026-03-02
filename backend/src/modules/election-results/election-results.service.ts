import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectionResult } from './entities/election-result.entity';
import { TurnoutSnapshot } from './entities/turnout-snapshot.entity';
import { CreateResultDto } from './dto/create-result.dto';
import { CreateTurnoutDto } from './dto/create-turnout.dto';
import { SseService } from '../sse/sse.service';

@Injectable()
export class ElectionResultsService {
  constructor(
    @InjectRepository(ElectionResult)
    private readonly resultRepository: Repository<ElectionResult>,
    @InjectRepository(TurnoutSnapshot)
    private readonly turnoutRepository: Repository<TurnoutSnapshot>,
    private readonly sseService: SseService,
  ) {}

  /**
   * Get all results for an election, grouped by candidate, sorted by voteCount DESC.
   */
  async getResults(electionId: string): Promise<ElectionResult[]> {
    return this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.candidate', 'candidate')
      .where('result.electionId = :electionId', { electionId })
      .andWhere('result.stationId IS NULL')
      .orderBy('result.voteCount', 'DESC')
      .getMany();
  }

  /**
   * Get results for a specific station.
   */
  async getResultsByStation(
    electionId: string,
    stationId: string,
  ): Promise<ElectionResult[]> {
    return this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.candidate', 'candidate')
      .where('result.electionId = :electionId', { electionId })
      .andWhere('result.stationId = :stationId', { stationId })
      .orderBy('result.voteCount', 'DESC')
      .getMany();
  }

  /**
   * Create or update a result (upsert on electionId+candidateId+stationId).
   * Recalculates percentages for all candidates in the election+station scope.
   */
  async addResult(dto: CreateResultDto): Promise<ElectionResult> {
    // Find existing result for this combination
    const whereClause: any = {
      electionId: dto.electionId,
      candidateId: dto.candidateId,
    };
    if (dto.stationId) {
      whereClause.stationId = dto.stationId;
    } else {
      whereClause.stationId = null as any;
    }

    let result = await this.resultRepository.findOne({ where: whereClause });

    if (result) {
      result.voteCount = dto.voteCount;
      if (dto.isOfficial !== undefined) {
        result.isOfficial = dto.isOfficial;
      }
    } else {
      result = this.resultRepository.create(dto);
    }

    const saved = await this.resultRepository.save(result);

    // Recalculate percentages for all results in this scope
    await this.recalculatePercentages(dto.electionId, dto.stationId || null);

    return saved;
  }

  /**
   * Recalculate percentages for all results in a given election+station scope.
   */
  private async recalculatePercentages(
    electionId: string,
    stationId: string | null,
  ): Promise<void> {
    const qb = this.resultRepository
      .createQueryBuilder('result')
      .where('result.electionId = :electionId', { electionId });

    if (stationId) {
      qb.andWhere('result.stationId = :stationId', { stationId });
    } else {
      qb.andWhere('result.stationId IS NULL');
    }

    const results = await qb.getMany();
    const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);

    if (totalVotes > 0) {
      for (const result of results) {
        result.percentage = parseFloat(
          ((result.voteCount / totalVotes) * 100).toFixed(2),
        );
      }
      await this.resultRepository.save(results);
    }
  }

  /**
   * Update a single result by ID. Recalculates percentages in scope.
   */
  async updateResult(
    id: string,
    dto: Partial<CreateResultDto>,
  ): Promise<ElectionResult> {
    const result = await this.resultRepository.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException(`Election result ${id} not found`);
    }

    if (dto.voteCount !== undefined) result.voteCount = dto.voteCount;
    if (dto.isOfficial !== undefined) result.isOfficial = dto.isOfficial;

    const saved = await this.resultRepository.save(result);
    await this.recalculatePercentages(
      result.electionId,
      result.stationId || null,
    );
    return saved;
  }

  /**
   * Delete a single result by ID. Recalculates percentages in scope.
   */
  async deleteResult(id: string): Promise<void> {
    const result = await this.resultRepository.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException(`Election result ${id} not found`);
    }

    const { electionId, stationId } = result;
    await this.resultRepository.remove(result);
    await this.recalculatePercentages(electionId, stationId || null);
  }

  /**
   * Publish results: set publishedAt and isOfficial flag. Emit SSE event.
   */
  async publishResults(
    electionId: string,
    isOfficial: boolean,
  ): Promise<void> {
    await this.resultRepository
      .createQueryBuilder()
      .update(ElectionResult)
      .set({
        publishedAt: new Date(),
        isOfficial,
      })
      .where('electionId = :electionId', { electionId })
      .execute();

    this.sseService.emitBreaking({
      type: 'election_results_published',
      electionId,
      isOfficial,
    });
  }

  /**
   * Bulk import/upsert results.
   */
  async bulkImportResults(results: CreateResultDto[]): Promise<ElectionResult[]> {
    const saved: ElectionResult[] = [];

    for (const dto of results) {
      const result = await this.addResult(dto);
      saved.push(result);
    }

    return saved;
  }

  /**
   * Get latest turnout snapshots for an election, grouped by district.
   */
  async getTurnout(electionId: string): Promise<TurnoutSnapshot[]> {
    // Get the latest snapshot per district using a subquery
    const subQuery = this.turnoutRepository
      .createQueryBuilder('t')
      .select('MAX(t.snapshotAt)', 'maxSnapshot')
      .addSelect('t.district', 'district')
      .where('t.electionId = :electionId')
      .groupBy('t.district');

    const snapshots = await this.turnoutRepository
      .createQueryBuilder('turnout')
      .where('turnout.electionId = :electionId', { electionId })
      .andWhere(
        `(turnout.district, turnout.snapshotAt) IN (${subQuery.getQuery()})`,
      )
      .setParameters(subQuery.getParameters())
      .orderBy('turnout.district', 'ASC')
      .getMany();

    // Convert percentage from string to number (PostgreSQL numeric type serializes as string)
    return snapshots.map(snapshot => ({
      ...snapshot,
      percentage: parseFloat(snapshot.percentage as any),
    }));
  }

  /**
   * Add a turnout snapshot. Auto-calculate percentage. Emit SSE event.
   */
  async addTurnoutSnapshot(dto: CreateTurnoutDto): Promise<TurnoutSnapshot> {
    const percentage =
      dto.eligibleVoters > 0
        ? parseFloat(
            ((dto.actualVoters / dto.eligibleVoters) * 100).toFixed(2),
          )
        : 0;

    const snapshot = this.turnoutRepository.create({
      ...dto,
      percentage,
    });

    const saved = await this.turnoutRepository.save(snapshot);

    this.sseService.emitBreaking({
      type: 'turnout_update',
      electionId: dto.electionId,
      district: dto.district || 'overall',
      percentage,
      actualVoters: dto.actualVoters,
      eligibleVoters: dto.eligibleVoters,
    });

    return saved;
  }

  /**
   * Get time-series turnout data for an election, optionally filtered by district.
   */
  async getTurnoutTimeline(
    electionId: string,
    district?: string,
  ): Promise<TurnoutSnapshot[]> {
    const qb = this.turnoutRepository
      .createQueryBuilder('turnout')
      .where('turnout.electionId = :electionId', { electionId })
      .orderBy('turnout.snapshotAt', 'ASC');

    if (district) {
      qb.andWhere('turnout.district = :district', { district });
    }

    return qb.getMany();
  }
}
