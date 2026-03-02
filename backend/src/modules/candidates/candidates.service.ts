import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { QueryCandidatesDto } from './dto/query-candidates.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
  ) {}

  /**
   * Generate a URL-friendly slug from a name.
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\u0590-\u05FF\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Paginated candidates list with filtering.
   */
  async findAll(query: QueryCandidatesDto): Promise<{
    data: Candidate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, electionId, district, isActive } = query;
    const skip = (page - 1) * limit;

    const qb = this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.election', 'election')
      .orderBy('candidate.sortOrder', 'ASC')
      .skip(skip)
      .take(limit);

    if (electionId) {
      qb.andWhere('candidate.electionId = :electionId', { electionId });
    }

    if (district) {
      qb.andWhere('candidate.district = :district', { district });
    }

    if (isActive !== undefined) {
      qb.andWhere('candidate.isActive = :isActive', { isActive });
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
   * Find all active candidates for an election, ordered by sortOrder.
   */
  async findByElection(electionId: string): Promise<Candidate[]> {
    return this.candidateRepository
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.election', 'election')
      .where('candidate.electionId = :electionId', { electionId })
      .andWhere('candidate.isActive = :isActive', { isActive: true })
      .orderBy('candidate.sortOrder', 'ASC')
      .getMany();
  }

  /**
   * Find a single candidate by ID with election relation loaded.
   */
  async findOne(id: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['election'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with id "${id}" not found`);
    }

    return candidate;
  }

  /**
   * Find a single candidate by slug.
   */
  async findBySlug(slug: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { slug },
      relations: ['election'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with slug "${slug}" not found`);
    }

    return candidate;
  }

  /**
   * Create a new candidate. Auto-generates slug from fullName if not provided.
   */
  async create(dto: CreateCandidateDto): Promise<Candidate> {
    if (!dto.slug) {
      dto.slug = this.slugify(dto.fullName);
    }

    const candidate = this.candidateRepository.create(dto);
    return this.candidateRepository.save(candidate);
  }

  /**
   * Update a candidate by ID.
   */
  async update(id: string, dto: UpdateCandidateDto): Promise<Candidate> {
    const candidate = await this.findOne(id);
    Object.assign(candidate, dto);
    return this.candidateRepository.save(candidate);
  }

  /**
   * Soft-delete a candidate (set isActive=false).
   */
  async remove(id: string): Promise<void> {
    const candidate = await this.findOne(id);
    candidate.isActive = false;
    await this.candidateRepository.save(candidate);
  }

  /**
   * Increment endorsement count by 1.
   */
  async incrementEndorsement(id: string): Promise<Candidate> {
    await this.candidateRepository
      .createQueryBuilder()
      .update(Candidate)
      .set({ endorsementCount: () => '"endorsementCount" + 1' })
      .where('id = :id', { id })
      .execute();

    return this.findOne(id);
  }

  /**
   * Decrement endorsement count by 1 (minimum 0).
   */
  async decrementEndorsement(id: string): Promise<Candidate> {
    await this.candidateRepository
      .createQueryBuilder()
      .update(Candidate)
      .set({
        endorsementCount: () =>
          'GREATEST("endorsementCount" - 1, 0)',
      })
      .where('id = :id', { id })
      .execute();

    return this.findOne(id);
  }
}
