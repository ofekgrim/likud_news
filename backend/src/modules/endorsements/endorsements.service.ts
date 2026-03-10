import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CandidateEndorsement } from './entities/candidate-endorsement.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { EndorseCandidateDto } from './dto/endorse-candidate.dto';
import { SseService } from '../sse/sse.service';

@Injectable()
export class EndorsementsService {
  constructor(
    @InjectRepository(CandidateEndorsement)
    private readonly endorsementRepository: Repository<CandidateEndorsement>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    private readonly dataSource: DataSource,
    private readonly sseService: SseService,
  ) {}

  /**
   * Endorse a candidate. If the user already endorsed someone in this election,
   * switch the endorsement (decrement old, increment new) within a transaction.
   */
  async endorse(
    userId: string,
    dto: EndorseCandidateDto,
  ): Promise<CandidateEndorsement> {
    const { candidateId, electionId } = dto;

    // Verify candidate exists
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, electionId },
    });
    if (!candidate) {
      throw new NotFoundException(
        `Candidate "${candidateId}" not found in election "${electionId}"`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const endorsementRepo = manager.getRepository(CandidateEndorsement);
      const candidateRepo = manager.getRepository(Candidate);

      // Check if user already endorsed in this election
      const existing = await endorsementRepo.findOne({
        where: { userId, electionId },
      });

      if (existing) {
        // If endorsing the same candidate, return existing
        if (existing.candidateId === candidateId) {
          return existing;
        }

        // Decrement old candidate's endorsement count
        await candidateRepo
          .createQueryBuilder()
          .update(Candidate)
          .set({ endorsementCount: () => '"endorsementCount" - 1' })
          .where('id = :id', { id: existing.candidateId })
          .execute();

        // Remove old endorsement
        await endorsementRepo.remove(existing);
      }

      // Increment new candidate's endorsement count
      await candidateRepo
        .createQueryBuilder()
        .update(Candidate)
        .set({ endorsementCount: () => '"endorsementCount" + 1' })
        .where('id = :id', { id: candidateId })
        .execute();

      // Create new endorsement
      const endorsement = endorsementRepo.create({
        userId,
        candidateId,
        electionId,
      });

      const saved = await endorsementRepo.save(endorsement);

      // Emit SSE event with updated endorsement counts
      await this.emitEndorsementUpdate(electionId);

      return saved;
    });
  }

  /**
   * Remove the user's endorsement for an election.
   */
  async removeEndorsement(userId: string, electionId: string): Promise<void> {
    const existing = await this.endorsementRepository.findOne({
      where: { userId, electionId },
    });

    if (!existing) {
      throw new NotFoundException(
        `No endorsement found for user in election "${electionId}"`,
      );
    }

    // Decrement candidate's endorsement count
    await this.candidateRepository
      .createQueryBuilder()
      .update(Candidate)
      .set({ endorsementCount: () => '"endorsementCount" - 1' })
      .where('id = :id', { id: existing.candidateId })
      .execute();

    await this.endorsementRepository.remove(existing);

    // Emit SSE event with updated endorsement counts
    await this.emitEndorsementUpdate(electionId);
  }

  /**
   * Emits an `endorsement_update` SSE event on the primaries stream
   * with the latest endorsement counts per candidate for the given election.
   */
  private async emitEndorsementUpdate(electionId: string): Promise<void> {
    try {
      const counts = await this.getEndorsementsByElection(electionId);
      this.sseService.emitPrimaries({
        event: 'endorsement_update',
        electionId,
        candidates: counts,
      });
    } catch {
      // Silently ignore SSE emission errors — they are non-critical.
    }
  }

  /**
   * Get the user's endorsement for a specific election.
   */
  async getUserEndorsement(
    userId: string,
    electionId: string,
  ): Promise<CandidateEndorsement | null> {
    return this.endorsementRepository.findOne({
      where: { userId, electionId },
      relations: ['candidate'],
    });
  }

  /**
   * Get paginated endorsements for a candidate, with user info.
   */
  async getEndorsementsByCandidate(
    candidateId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: CandidateEndorsement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.endorsementRepository
      .createQueryBuilder('endorsement')
      .leftJoinAndSelect('endorsement.user', 'user')
      .where('endorsement.candidateId = :candidateId', { candidateId })
      .orderBy('endorsement.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List all endorsements with optional filters (admin use).
   */
  async findAll(
    electionId?: string,
    candidateId?: string,
  ): Promise<{ data: CandidateEndorsement[] }> {
    const qb = this.endorsementRepository
      .createQueryBuilder('endorsement')
      .leftJoinAndSelect('endorsement.user', 'user')
      .leftJoinAndSelect('endorsement.candidate', 'candidate')
      .leftJoinAndSelect('candidate.election', 'election')
      .orderBy('endorsement.createdAt', 'DESC');

    if (electionId) {
      qb.andWhere('endorsement.electionId = :electionId', { electionId });
    }
    if (candidateId) {
      qb.andWhere('endorsement.candidateId = :candidateId', { candidateId });
    }

    const data = await qb.getMany();
    return { data };
  }

  /**
   * Delete an endorsement by its ID (admin use).
   */
  async deleteById(id: string): Promise<void> {
    const endorsement = await this.endorsementRepository.findOne({
      where: { id },
    });

    if (!endorsement) {
      throw new NotFoundException(`Endorsement "${id}" not found`);
    }

    // Decrement candidate's endorsement count
    await this.candidateRepository
      .createQueryBuilder()
      .update(Candidate)
      .set({ endorsementCount: () => '"endorsementCount" - 1' })
      .where('id = :id', { id: endorsement.candidateId })
      .execute();

    await this.endorsementRepository.remove(endorsement);
  }

  /**
   * Get endorsement counts per candidate for an election.
   */
  async getEndorsementsByElection(
    electionId: string,
  ): Promise<{ candidateId: string; candidateName: string; count: number }[]> {
    const results = await this.endorsementRepository
      .createQueryBuilder('endorsement')
      .select('endorsement.candidateId', 'candidateId')
      .addSelect('candidate.fullName', 'candidateName')
      .addSelect('COUNT(endorsement.id)', 'count')
      .innerJoin('endorsement.candidate', 'candidate')
      .where('endorsement.electionId = :electionId', { electionId })
      .groupBy('endorsement.candidateId')
      .addGroupBy('candidate.fullName')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      candidateId: r.candidateId,
      candidateName: r.candidateName,
      count: parseInt(r.count, 10),
    }));
  }
}
