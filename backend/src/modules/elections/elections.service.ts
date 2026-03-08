import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PrimaryElection,
  ElectionStatus,
} from './entities/primary-election.entity';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { QueryElectionsDto } from './dto/query-elections.dto';
import { SseService } from '../sse/sse.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ElectionsService {
  private readonly logger = new Logger(ElectionsService.name);

  constructor(
    @InjectRepository(PrimaryElection)
    private readonly electionRepository: Repository<PrimaryElection>,
    private readonly sseService: SseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Paginated elections list with filtering.
   */
  async findAll(query: QueryElectionsDto): Promise<{
    data: PrimaryElection[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, status, isActive } = query;
    const skip = (page - 1) * limit;

    const qb = this.electionRepository
      .createQueryBuilder('election')
      .orderBy('election.electionDate', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      qb.andWhere('election.status = :status', { status });
    }

    if (isActive !== undefined) {
      qb.andWhere('election.isActive = :isActive', { isActive });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single election by ID.
   */
  async findOne(id: string): Promise<PrimaryElection> {
    const election = await this.electionRepository.findOne({
      where: { id },
    });

    if (!election) {
      throw new NotFoundException(`Election with id "${id}" not found`);
    }

    return election;
  }

  /**
   * Create a new election.
   */
  async create(dto: CreateElectionDto): Promise<PrimaryElection> {
    const election = this.electionRepository.create(dto);
    return this.electionRepository.save(election);
  }

  /**
   * Update an election by ID.
   */
  async update(id: string, dto: UpdateElectionDto): Promise<PrimaryElection> {
    const election = await this.findOne(id);
    Object.assign(election, dto);
    return this.electionRepository.save(election);
  }

  /**
   * Soft-delete an election (set isActive=false).
   */
  async remove(id: string): Promise<void> {
    const election = await this.findOne(id);
    election.isActive = false;
    await this.electionRepository.save(election);
  }

  /**
   * Update election status. Emits an SSE event when status becomes 'voting'.
   */
  async updateStatus(
    id: string,
    status: ElectionStatus,
  ): Promise<PrimaryElection> {
    const election = await this.findOne(id);
    election.status = status;
    const saved = await this.electionRepository.save(election);

    if (status === ElectionStatus.VOTING) {
      this.sseService.emitBreaking({
        type: 'election_voting_started',
        electionId: saved.id,
        title: saved.title,
      });

      // Fire notification when voting starts
      this.notificationsService.triggerContentNotification(
        'election.voting_started',
        'election',
        election.id,
        { election_title: election.title },
      ).catch((err) => this.logger.error(`Election notification failed: ${err.message}`));
    }

    return saved;
  }
}
