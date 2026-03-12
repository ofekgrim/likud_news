import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Donation,
  DonationRecipientType,
  DonationStatus,
} from './entities/donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { ConfirmDonationDto } from './dto/confirm-donation.dto';
import { DonationEligibilityDto } from './dto/donation-eligibility.dto';
import { GamificationService } from '../gamification/gamification.service';
import { PointAction } from '../gamification/entities/user-points.entity';

/** Israeli law compliance caps */
const MAX_CANDIDATE_DONATION_NIS = 11377; // Per candidate per election cycle
const MAX_PARTY_DONATION_NIS = 2000; // Per household per year

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Check whether the user is eligible to donate to the given recipient,
   * and how much capacity remains under the legal caps.
   */
  async checkEligibility(
    appUserId: string,
    recipientType: string,
    recipientCandidateId?: string,
  ): Promise<DonationEligibilityDto> {
    const cap =
      recipientType === DonationRecipientType.CANDIDATE
        ? MAX_CANDIDATE_DONATION_NIS
        : MAX_PARTY_DONATION_NIS;

    const totalDonated = await this.sumCompletedDonations(
      appUserId,
      recipientType,
      recipientCandidateId,
    );

    const remaining = Math.max(0, cap - totalDonated);

    const result: DonationEligibilityDto = {
      eligible: remaining > 0,
      remainingCandidateCap:
        recipientType === DonationRecipientType.CANDIDATE ? remaining : 0,
      remainingPartyCap:
        recipientType === DonationRecipientType.PARTY ? remaining : 0,
    };

    if (remaining <= 0) {
      result.reason = `Donation cap of ${cap} NIS reached for this recipient`;
    }

    return result;
  }

  /**
   * Create a new donation in pending state after checking eligibility.
   */
  async createDonation(
    dto: CreateDonationDto,
    appUserId: string,
  ): Promise<Donation> {
    if (dto.amountNis <= 0) {
      throw new BadRequestException('Donation amount must be positive');
    }

    const cap =
      dto.recipientType === DonationRecipientType.CANDIDATE
        ? MAX_CANDIDATE_DONATION_NIS
        : MAX_PARTY_DONATION_NIS;

    const totalDonated = await this.sumCompletedDonations(
      appUserId,
      dto.recipientType,
      dto.recipientCandidateId,
    );

    const remaining = cap - totalDonated;

    if (dto.amountNis > remaining) {
      throw new BadRequestException(
        `Donation exceeds cap. Maximum allowed: ${remaining} NIS (cap: ${cap}, already donated: ${totalDonated})`,
      );
    }

    const donation = this.donationRepository.create({
      donorAppUserId: appUserId,
      recipientType: dto.recipientType,
      recipientCandidateId: dto.recipientCandidateId || null,
      amountNis: dto.amountNis,
      teutatZehutHash: dto.teutatZehutHash,
      status: DonationStatus.PENDING,
    });

    const saved = await this.donationRepository.save(donation);
    this.logger.log(
      `Donation ${saved.id} created: ${dto.amountNis} NIS to ${dto.recipientType} by user ${appUserId}`,
    );

    return saved;
  }

  /**
   * Confirm a donation after successful payment.
   */
  async confirmDonation(dto: ConfirmDonationDto): Promise<Donation> {
    const donation = await this.donationRepository.findOne({
      where: { id: dto.donationId },
    });

    if (!donation) {
      throw new NotFoundException(`Donation ${dto.donationId} not found`);
    }

    if (donation.status !== DonationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot confirm donation with status '${donation.status}'. Only pending donations can be confirmed.`,
      );
    }

    donation.paymentIntentId = dto.paymentIntentId;
    donation.status = DonationStatus.COMPLETED;
    // Placeholder: in production, generate a PDF receipt and upload to S3
    donation.receiptUrl = `https://receipts.likud.org.il/${donation.id}.pdf`;

    const saved = await this.donationRepository.save(donation);

    // Award "I Donated" badge via gamification (+25 points)
    try {
      await this.gamificationService.awardPoints({
        userId: donation.donorAppUserId,
        action: PointAction.EVENT_RSVP, // Re-use existing action type for donation points
        points: 25,
        metadata: {
          source: 'donation',
          donationId: donation.id,
          recipientType: donation.recipientType,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to award donation points: ${e.message}`);
    }

    this.logger.log(`Donation ${donation.id} confirmed with payment ${dto.paymentIntentId}`);

    return saved;
  }

  /**
   * Get a single donation with relations.
   */
  async getDonation(donationId: string): Promise<Donation> {
    const donation = await this.donationRepository.findOne({
      where: { id: donationId },
      relations: ['donorAppUser', 'recipientCandidate'],
    });

    if (!donation) {
      throw new NotFoundException(`Donation ${donationId} not found`);
    }

    return donation;
  }

  /**
   * Get donation history for a user, ordered by creation date descending.
   */
  async getDonationHistory(appUserId: string): Promise<Donation[]> {
    return this.donationRepository.find({
      where: { donorAppUserId: appUserId },
      relations: ['recipientCandidate'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Refund a completed donation (admin action).
   */
  async refundDonation(donationId: string, adminId: string): Promise<Donation> {
    const donation = await this.donationRepository.findOne({
      where: { id: donationId },
    });

    if (!donation) {
      throw new NotFoundException(`Donation ${donationId} not found`);
    }

    if (donation.status !== DonationStatus.COMPLETED) {
      throw new BadRequestException(
        `Cannot refund donation with status '${donation.status}'. Only completed donations can be refunded.`,
      );
    }

    donation.status = DonationStatus.REFUNDED;
    donation.metadata = {
      ...(donation.metadata || {}),
      refundedBy: adminId,
      refundedAt: new Date().toISOString(),
    };

    const saved = await this.donationRepository.save(donation);
    this.logger.log(`Donation ${donationId} refunded by admin ${adminId}`);

    return saved;
  }

  /**
   * Generate CSV data for the monthly State Comptroller report.
   * Returns an array of row objects suitable for CSV serialization.
   */
  async getComptrollerExport(
    month: string,
  ): Promise<
    Array<{
      date: string;
      amount: number;
      teutatZehutHash: string;
      recipientType: string;
      recipientName: string;
    }>
  > {
    // month is in YYYY-MM format
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 1);

    const donations = await this.donationRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.recipientCandidate', 'c')
      .where('d.status = :status', { status: DonationStatus.COMPLETED })
      .andWhere('d.createdAt >= :startDate', { startDate })
      .andWhere('d.createdAt < :endDate', { endDate })
      .orderBy('d.createdAt', 'ASC')
      .getMany();

    return donations.map((d) => ({
      date: d.createdAt.toISOString().split('T')[0],
      amount: Number(d.amountNis),
      teutatZehutHash: d.teutatZehutHash,
      recipientType: d.recipientType,
      recipientName:
        d.recipientType === DonationRecipientType.CANDIDATE
          ? d.recipientCandidate?.fullName || 'Unknown'
          : 'Likud Party',
    }));
  }

  /**
   * Get aggregated donation statistics.
   */
  async getDonationStats(
    recipientType?: string,
    recipientCandidateId?: string,
  ): Promise<{
    totalAmount: number;
    donorCount: number;
    avgAmount: number;
  }> {
    const qb = this.donationRepository
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.amountNis), 0)', 'totalAmount')
      .addSelect('COUNT(DISTINCT d.donorAppUserId)', 'donorCount')
      .addSelect('COALESCE(AVG(d.amountNis), 0)', 'avgAmount')
      .where('d.status = :status', { status: DonationStatus.COMPLETED });

    if (recipientType) {
      qb.andWhere('d.recipientType = :recipientType', { recipientType });
    }

    if (recipientCandidateId) {
      qb.andWhere('d.recipientCandidateId = :recipientCandidateId', {
        recipientCandidateId,
      });
    }

    const result = await qb.getRawOne();

    return {
      totalAmount: Number(result?.totalAmount || 0),
      donorCount: Number(result?.donorCount || 0),
      avgAmount: Number(Number(result?.avgAmount || 0).toFixed(2)),
    };
  }

  /**
   * Sum completed donations by a user to a specific recipient.
   */
  private async sumCompletedDonations(
    appUserId: string,
    recipientType: string,
    recipientCandidateId?: string,
  ): Promise<number> {
    const qb = this.donationRepository
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.amountNis), 0)', 'total')
      .where('d.donorAppUserId = :appUserId', { appUserId })
      .andWhere('d.recipientType = :recipientType', { recipientType })
      .andWhere('d.status = :status', { status: DonationStatus.COMPLETED });

    if (recipientCandidateId) {
      qb.andWhere('d.recipientCandidateId = :recipientCandidateId', {
        recipientCandidateId,
      });
    }

    const result = await qb.getRawOne();
    return Number(result?.total || 0);
  }
}
