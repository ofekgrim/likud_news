import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import {
  CandidateAdPlacement,
  AdPlacementType,
  AdPlacementStatus,
} from './entities/candidate-ad-placement.entity';
import { CreateAdPlacementDto } from './dto/create-ad-placement.dto';
import { UpdateAdPlacementDto } from './dto/update-ad-placement.dto';
import { CompanyAdvertiser } from './entities/company-advertiser.entity';
import { CompanyAd, CompanyAdType } from './entities/company-ad.entity';
import { CreateCompanyAdvertiserDto } from './dto/create-company-advertiser.dto';
import { CreateCompanyAdDto } from './dto/create-company-ad.dto';
import { UpdateCompanyAdDto } from './dto/update-company-ad.dto';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    @InjectRepository(CandidateAdPlacement)
    private readonly adRepository: Repository<CandidateAdPlacement>,
    @InjectRepository(CompanyAdvertiser)
    private readonly companyAdvertiserRepository: Repository<CompanyAdvertiser>,
    @InjectRepository(CompanyAd)
    private readonly companyAdRepository: Repository<CompanyAd>,
  ) {}

  /**
   * Create a new ad placement for a candidate.
   */
  async createPlacement(
    dto: CreateAdPlacementDto,
    candidateId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = this.adRepository.create({
      ...dto,
      candidateId,
      imageUrl: dto.imageUrl || null,
      targetingRules: dto.targetingRules || null,
      isApproved: false,
      isActive: true,
      impressions: 0,
      clicks: 0,
    });

    const saved = await this.adRepository.save(placement);
    this.logger.log(
      `Ad placement ${saved.id} created for candidate ${candidateId}: "${dto.title}"`,
    );
    return saved;
  }

  /**
   * Update an existing ad placement.
   */
  async updatePlacement(
    id: string,
    dto: UpdateAdPlacementDto,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${id} not found`);
    }

    Object.assign(placement, dto);
    const saved = await this.adRepository.save(placement);
    this.logger.log(`Ad placement ${id} updated`);
    return saved;
  }

  /**
   * Approve an ad placement (admin action).
   */
  async approvePlacement(
    id: string,
    adminId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${id} not found`);
    }

    placement.isApproved = true;
    placement.isActive = true;
    placement.status = AdPlacementStatus.APPROVED;
    placement.approvedAt = new Date();
    const saved = await this.adRepository.save(placement);
    this.logger.log(`Ad placement ${id} approved by admin ${adminId}`);
    return saved;
  }

  /**
   * Get active placements filtered by type, within date range,
   * approved, active, and with budget not exhausted.
   */
  async getActivePlacements(
    type: AdPlacementType,
    targeting?: Record<string, unknown>,
  ): Promise<CandidateAdPlacement[]> {
    const today = new Date().toISOString().split('T')[0];

    const qb = this.adRepository
      .createQueryBuilder('ad')
      .leftJoinAndSelect('ad.candidate', 'candidate')
      .where('ad.placementType = :type', { type })
      .andWhere('ad.isApproved = :isApproved', { isApproved: true })
      .andWhere('ad.isActive = :isActive', { isActive: true })
      .andWhere('ad.startDate <= :today', { today })
      .andWhere('ad.endDate >= :today', { today });

    // Budget check: daily spend = (impressions * cpmNis) / 1000
    // Only return ads where spend < dailyBudgetNis
    qb.andWhere(
      '(ad.impressions * ad.cpmNis / 1000) < ad.dailyBudgetNis',
    );

    const placements = await qb.getMany();
    return placements;
  }

  /**
   * Record an impression for a placement and check daily budget.
   */
  async recordImpression(
    placementId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({
      where: { id: placementId },
    });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${placementId} not found`);
    }

    placement.impressions += 1;
    const saved = await this.adRepository.save(placement);
    return saved;
  }

  /**
   * Record a click for a placement.
   */
  async recordClick(
    placementId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({
      where: { id: placementId },
    });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${placementId} not found`);
    }

    placement.clicks += 1;
    const saved = await this.adRepository.save(placement);
    return saved;
  }

  /**
   * Get placement stats aggregated. Optionally filter by candidate.
   */
  async getPlacementStats(candidateId?: string): Promise<{
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    totalSpendNis: number;
    activePlacements: number;
  }> {
    const qb = this.adRepository
      .createQueryBuilder('ad')
      .select('COALESCE(SUM(ad.impressions), 0)', 'totalImpressions')
      .addSelect('COALESCE(SUM(ad.clicks), 0)', 'totalClicks')
      .addSelect(
        'COALESCE(SUM(ad.impressions * ad.cpmNis / 1000), 0)',
        'totalSpendNis',
      )
      .addSelect(
        'COUNT(CASE WHEN ad.isActive = true AND ad.isApproved = true THEN 1 END)',
        'activePlacements',
      );

    if (candidateId) {
      qb.where('ad.candidateId = :candidateId', { candidateId });
    }

    const result = await qb.getRawOne();

    const totalImpressions = Number(result?.totalImpressions || 0);
    const totalClicks = Number(result?.totalClicks || 0);
    const ctr =
      totalImpressions > 0
        ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
        : 0;

    return {
      totalImpressions,
      totalClicks,
      ctr,
      totalSpendNis: Number(Number(result?.totalSpendNis || 0).toFixed(2)),
      activePlacements: Number(result?.activePlacements || 0),
    };
  }

  /**
   * Get all placements for admin with optional filters.
   */
  async getAllPlacements(filter?: {
    type?: AdPlacementType;
    candidateId?: string;
    isApproved?: boolean;
    isActive?: boolean;
  }): Promise<CandidateAdPlacement[]> {
    const qb = this.adRepository
      .createQueryBuilder('ad')
      .leftJoinAndSelect('ad.candidate', 'candidate')
      .orderBy('ad.createdAt', 'DESC');

    if (filter?.type) {
      qb.andWhere('ad.placementType = :type', { type: filter.type });
    }
    if (filter?.candidateId) {
      qb.andWhere('ad.candidateId = :candidateId', {
        candidateId: filter.candidateId,
      });
    }
    if (filter?.isApproved !== undefined) {
      qb.andWhere('ad.isApproved = :isApproved', {
        isApproved: filter.isApproved,
      });
    }
    if (filter?.isActive !== undefined) {
      qb.andWhere('ad.isActive = :isActive', {
        isActive: filter.isActive,
      });
    }

    return qb.getMany();
  }

  /**
   * Deactivate an ad placement.
   */
  async deactivatePlacement(id: string): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${id} not found`);
    }

    placement.isActive = false;
    const saved = await this.adRepository.save(placement);
    this.logger.log(`Ad placement ${id} deactivated`);
    return saved;
  }

  /**
   * Reject an ad placement (admin action).
   */
  async rejectPlacement(
    id: string,
    reason: string,
    adminId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${id} not found`);
    }

    placement.isApproved = false;
    placement.isActive = false;
    placement.status = AdPlacementStatus.REJECTED;
    placement.rejectionReason = reason;
    placement.rejectedAt = new Date();
    const saved = await this.adRepository.save(placement);
    this.logger.log(`Ad placement ${id} rejected by admin ${adminId}: ${reason}`);
    return saved;
  }

  /**
   * Pause an approved ad placement (admin action).
   */
  async pausePlacement(
    id: string,
    adminId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${id} not found`);
    }
    if (placement.status !== AdPlacementStatus.APPROVED) {
      throw new BadRequestException(
        `Ad placement ${id} must be in approved status to pause (current: ${placement.status})`,
      );
    }

    placement.isActive = false;
    placement.status = AdPlacementStatus.PAUSED;
    placement.pausedAt = new Date();
    const saved = await this.adRepository.save(placement);
    this.logger.log(`Ad placement ${id} paused by admin ${adminId}`);
    return saved;
  }

  /**
   * Resume a paused ad placement (admin action).
   */
  async resumePlacement(
    id: string,
    adminId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${id} not found`);
    }
    if (placement.status !== AdPlacementStatus.PAUSED) {
      throw new BadRequestException(
        `Ad placement ${id} must be in paused status to resume (current: ${placement.status})`,
      );
    }

    placement.isActive = true;
    placement.status = AdPlacementStatus.APPROVED;
    const saved = await this.adRepository.save(placement);
    this.logger.log(`Ad placement ${id} resumed by admin ${adminId}`);
    return saved;
  }

  /**
   * End an ad placement (admin action).
   */
  async endPlacement(
    id: string,
    adminId: string,
  ): Promise<CandidateAdPlacement> {
    const placement = await this.adRepository.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Ad placement ${id} not found`);
    }

    placement.isActive = false;
    placement.status = AdPlacementStatus.ENDED;
    placement.endedAt = new Date();
    const saved = await this.adRepository.save(placement);
    this.logger.log(`Ad placement ${id} ended by admin ${adminId}`);
    return saved;
  }

  /**
   * Get breakdown stats by type, by candidate, and budget pacing.
   */
  async getBreakdownStats(): Promise<{
    byType: Array<{
      type: AdPlacementType;
      count: number;
      impressions: number;
      clicks: number;
      ctr: number;
      totalSpendNis: number;
      activePlacements: number;
    }>;
    byCandidate: Array<{
      candidateId: string;
      candidateName: string;
      count: number;
      impressions: number;
      clicks: number;
      totalSpendNis: number;
    }>;
    budgetPacing: Array<{
      id: string;
      title: string;
      candidateName: string;
      dailyBudgetNis: number;
      currentSpendNis: number;
      pacingPct: number;
      status: AdPlacementStatus;
    }>;
  }> {
    // byType: GROUP BY placementType
    const byTypeRaw: Array<{
      type: AdPlacementType;
      count: string;
      impressions: string;
      clicks: string;
      totalSpendNis: string;
      activePlacements: string;
    }> = await this.adRepository
      .createQueryBuilder('ad')
      .select('ad.placementType', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(ad.impressions), 0)', 'impressions')
      .addSelect('COALESCE(SUM(ad.clicks), 0)', 'clicks')
      .addSelect(
        'COALESCE(SUM(ad.impressions * ad.cpmNis / 1000), 0)',
        'totalSpendNis',
      )
      .addSelect(
        'COUNT(CASE WHEN ad.isActive = true AND ad.isApproved = true THEN 1 END)',
        'activePlacements',
      )
      .groupBy('ad.placementType')
      .getRawMany();

    const byType = byTypeRaw.map((row) => {
      const impressions = Number(row.impressions);
      const clicks = Number(row.clicks);
      const ctr =
        impressions > 0
          ? Number(((clicks / impressions) * 100).toFixed(2))
          : 0;
      return {
        type: row.type,
        count: Number(row.count),
        impressions,
        clicks,
        ctr,
        totalSpendNis: Number(Number(row.totalSpendNis).toFixed(2)),
        activePlacements: Number(row.activePlacements),
      };
    });

    // byCandidate: JOIN candidate, GROUP BY candidateId + name
    const byCandidateRaw: Array<{
      candidateId: string;
      candidateName: string;
      count: string;
      impressions: string;
      clicks: string;
      totalSpendNis: string;
    }> = await this.adRepository
      .createQueryBuilder('ad')
      .leftJoin('ad.candidate', 'candidate')
      .select('ad.candidateId', 'candidateId')
      .addSelect('candidate.fullName', 'candidateName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(ad.impressions), 0)', 'impressions')
      .addSelect('COALESCE(SUM(ad.clicks), 0)', 'clicks')
      .addSelect(
        'COALESCE(SUM(ad.impressions * ad.cpmNis / 1000), 0)',
        'totalSpendNis',
      )
      .groupBy('ad.candidateId')
      .addGroupBy('candidate.fullName')
      .getRawMany();

    const byCandidate = byCandidateRaw.map((row) => ({
      candidateId: row.candidateId,
      candidateName: row.candidateName || '',
      count: Number(row.count),
      impressions: Number(row.impressions),
      clicks: Number(row.clicks),
      totalSpendNis: Number(Number(row.totalSpendNis).toFixed(2)),
    }));

    // budgetPacing: approved and paused ads
    const pacingPlacements = await this.adRepository.find({
      where: { status: In([AdPlacementStatus.APPROVED, AdPlacementStatus.PAUSED]) },
      relations: ['candidate'],
    });

    const budgetPacing = pacingPlacements.map((p) => {
      const currentSpendNis = Number(
        ((Number(p.impressions) * Number(p.cpmNis)) / 1000).toFixed(2),
      );
      const pacingPct =
        Number(p.dailyBudgetNis) > 0
          ? Number(
              ((currentSpendNis / Number(p.dailyBudgetNis)) * 100).toFixed(1),
            )
          : 0;
      return {
        id: p.id,
        title: p.title,
        candidateName: p.candidate?.fullName || '',
        dailyBudgetNis: Number(p.dailyBudgetNis),
        currentSpendNis,
        pacingPct,
        status: p.status,
      };
    });

    return { byType, byCandidate, budgetPacing };
  }

  // ─── Company Advertiser Methods ─────────────────────────────────────────

  async createCompanyAdvertiser(dto: CreateCompanyAdvertiserDto): Promise<CompanyAdvertiser> {
    const advertiser = this.companyAdvertiserRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.companyAdvertiserRepository.save(advertiser);
    this.logger.log(`Company advertiser created: ${saved.name} (${saved.id})`);
    return saved;
  }

  async getAllCompanyAdvertisers(): Promise<CompanyAdvertiser[]> {
    return this.companyAdvertiserRepository.find({ order: { createdAt: 'DESC' } });
  }

  // ─── Company Ad Methods ──────────────────────────────────────────────────

  async createCompanyAd(dto: CreateCompanyAdDto, advertiserId: string): Promise<CompanyAd> {
    const ad = this.companyAdRepository.create({
      ...dto,
      advertiserId,
      isApproved: false,
      isActive: true,
      status: 'pending',
      impressions: 0,
      clicks: 0,
    });
    const saved = await this.companyAdRepository.save(ad);
    this.logger.log(`Company ad ${saved.id} created for advertiser ${advertiserId}: "${dto.title}"`);
    return saved;
  }

  async getAllCompanyAds(filter?: {
    adType?: CompanyAdType;
    advertiserId?: string;
    isApproved?: boolean;
    isActive?: boolean;
  }): Promise<CompanyAd[]> {
    const qb = this.companyAdRepository
      .createQueryBuilder('ad')
      .leftJoinAndSelect('ad.advertiser', 'advertiser')
      .orderBy('ad.createdAt', 'DESC');

    if (filter?.adType) qb.andWhere('ad.adType = :adType', { adType: filter.adType });
    if (filter?.advertiserId) qb.andWhere('ad.advertiserId = :advertiserId', { advertiserId: filter.advertiserId });
    if (filter?.isApproved !== undefined) qb.andWhere('ad.isApproved = :isApproved', { isApproved: filter.isApproved });
    if (filter?.isActive !== undefined) qb.andWhere('ad.isActive = :isActive', { isActive: filter.isActive });

    return qb.getMany();
  }

  async approveCompanyAd(id: string, adminId: string): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);

    ad.isApproved = true;
    ad.isActive = true;
    ad.status = 'approved';
    ad.approvedAt = new Date();
    const saved = await this.companyAdRepository.save(ad);
    this.logger.log(`Company ad ${id} approved by admin ${adminId}`);
    return saved;
  }

  async rejectCompanyAd(id: string, reason: string, adminId: string): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);

    ad.isApproved = false;
    ad.isActive = false;
    ad.status = 'rejected';
    ad.rejectionReason = reason;
    ad.rejectedAt = new Date();
    const saved = await this.companyAdRepository.save(ad);
    this.logger.log(`Company ad ${id} rejected by admin ${adminId}: ${reason}`);
    return saved;
  }

  async pauseCompanyAd(id: string, adminId: string): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);
    if (ad.status !== 'approved') {
      throw new BadRequestException(
        `Company ad ${id} must be in approved status to pause (current: ${ad.status})`,
      );
    }

    ad.isActive = false;
    ad.status = 'paused';
    ad.pausedAt = new Date();
    const saved = await this.companyAdRepository.save(ad);
    this.logger.log(`Company ad ${id} paused by admin ${adminId}`);
    return saved;
  }

  async resumeCompanyAd(id: string, adminId: string): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);
    if (ad.status !== 'paused') {
      throw new BadRequestException(
        `Company ad ${id} must be in paused status to resume (current: ${ad.status})`,
      );
    }

    ad.isActive = true;
    ad.status = 'approved';
    const saved = await this.companyAdRepository.save(ad);
    this.logger.log(`Company ad ${id} resumed by admin ${adminId}`);
    return saved;
  }

  async endCompanyAd(id: string, adminId: string): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);

    ad.isActive = false;
    ad.status = 'ended';
    ad.endedAt = new Date();
    const saved = await this.companyAdRepository.save(ad);
    this.logger.log(`Company ad ${id} ended by admin ${adminId}`);
    return saved;
  }

  async getActiveCompanyAds(adType: CompanyAdType): Promise<CompanyAd[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.companyAdRepository
      .createQueryBuilder('ad')
      .leftJoinAndSelect('ad.advertiser', 'advertiser')
      .where('ad.adType = :adType', { adType })
      .andWhere('ad.isApproved = true')
      .andWhere('ad.isActive = true')
      .andWhere('ad.status = :status', { status: 'approved' })
      .andWhere('(ad.startDate IS NULL OR ad.startDate <= :today)', { today })
      .andWhere('(ad.endDate IS NULL OR ad.endDate >= :today)', { today })
      .andWhere('(ad.impressions * ad.cpmNis / 1000) < ad.dailyBudgetNis OR ad.dailyBudgetNis = 0')
      .getMany();
  }

  async recordCompanyAdImpression(id: string): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);

    ad.impressions += 1;
    return this.companyAdRepository.save(ad);
  }

  async recordCompanyAdClick(id: string): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);

    ad.clicks += 1;
    return this.companyAdRepository.save(ad);
  }

  async updateCompanyAd(id: string, dto: UpdateCompanyAdDto): Promise<CompanyAd> {
    const ad = await this.companyAdRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException(`Company ad ${id} not found`);
    Object.assign(ad, dto);
    const saved = await this.companyAdRepository.save(ad);
    this.logger.log(`Company ad ${id} updated`);
    return saved;
  }
}
