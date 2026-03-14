import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  AppUser,
  AppUserRole,
  MembershipStatus,
} from './entities/app-user.entity';
import { VotingEligibility } from './entities/voting-eligibility.entity';
import { UserReferral } from './entities/user-referral.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPreferencesDto, NotificationPreferencesResponseDto } from './dto/update-notification-preferences.dto';
import { VerifyMembershipDto } from './dto/verify-membership.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AppUsersService {
  constructor(
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(VotingEligibility)
    private readonly votingEligibilityRepository: Repository<VotingEligibility>,
    @InjectRepository(UserReferral)
    private readonly userReferralRepository: Repository<UserReferral>,
  ) {}

  async findById(id: string): Promise<AppUser> {
    const user = await this.appUserRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByDeviceId(deviceId: string): Promise<AppUser | null> {
    return this.appUserRepository.findOne({ where: { deviceId } });
  }

  async findOrCreateByDeviceId(deviceId: string): Promise<AppUser> {
    let user = await this.appUserRepository.findOne({ where: { deviceId } });

    if (!user) {
      user = this.appUserRepository.create({
        deviceId,
        role: AppUserRole.GUEST,
      });
      user = await this.appUserRepository.save(user);
    }

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AppUser> {
    const user = await this.findById(userId);

    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.preferredCategories !== undefined)
      user.preferredCategories = dto.preferredCategories;
    if (dto.notificationPrefs !== undefined)
      user.notificationPrefs = dto.notificationPrefs;

    return this.appUserRepository.save(user);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<AppUser> {
    const user = await this.findById(userId);
    user.avatarUrl = avatarUrl;
    return this.appUserRepository.save(user);
  }

  async requestMembershipVerification(
    userId: string,
    dto: VerifyMembershipDto,
  ): Promise<AppUser> {
    const user = await this.findById(userId);

    if (user.membershipStatus === MembershipStatus.VERIFIED) {
      throw new BadRequestException('Membership is already verified');
    }

    user.membershipId = dto.membershipId;
    if (dto.fullName) user.displayName = dto.fullName;
    user.membershipStatus = MembershipStatus.PENDING;

    return this.appUserRepository.save(user);
  }

  async approveMembership(userId: string): Promise<AppUser> {
    const user = await this.findById(userId);
    user.membershipStatus = MembershipStatus.VERIFIED;
    user.membershipVerifiedAt = new Date();
    user.role = AppUserRole.VERIFIED_MEMBER;
    return this.appUserRepository.save(user);
  }

  async rejectMembership(userId: string): Promise<AppUser> {
    const user = await this.findById(userId);
    user.membershipStatus = MembershipStatus.UNVERIFIED;
    return this.appUserRepository.save(user);
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      membershipId: user.membershipId,
      membershipStatus: user.membershipStatus,
      membershipVerifiedAt: user.membershipVerifiedAt,
      preferredCategories: user.preferredCategories,
      notificationPrefs: user.notificationPrefs,
      notifBreakingNews: user.notifBreakingNews,
      notifPrimariesUpdates: user.notifPrimariesUpdates,
      notifDailyQuizReminder: user.notifDailyQuizReminder,
      notifStreakAchievements: user.notifStreakAchievements,
      notifEvents: user.notifEvents,
      notifGotv: user.notifGotv,
      notifAmaSessions: user.notifAmaSessions,
      quietHoursStart: user.quietHoursStart,
      quietHoursEnd: user.quietHoursEnd,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);

    if (!user.passwordHash) {
      throw new BadRequestException('No password set for this account');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.appUserRepository.save(user);
  }

  // ── Notification Preferences ────────────────────────────────────────

  async getNotificationPreferences(userId: string): Promise<NotificationPreferencesResponseDto> {
    const user = await this.findById(userId);
    return {
      notifBreakingNews: user.notifBreakingNews,
      notifPrimariesUpdates: user.notifPrimariesUpdates,
      notifDailyQuizReminder: user.notifDailyQuizReminder,
      notifStreakAchievements: user.notifStreakAchievements,
      notifEvents: user.notifEvents,
      notifGotv: user.notifGotv,
      notifAmaSessions: user.notifAmaSessions,
      quietHoursStart: user.quietHoursStart,
      quietHoursEnd: user.quietHoursEnd,
    };
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    const user = await this.findById(userId);

    if (dto.notifBreakingNews !== undefined) user.notifBreakingNews = dto.notifBreakingNews;
    if (dto.notifPrimariesUpdates !== undefined) user.notifPrimariesUpdates = dto.notifPrimariesUpdates;
    if (dto.notifDailyQuizReminder !== undefined) user.notifDailyQuizReminder = dto.notifDailyQuizReminder;
    if (dto.notifStreakAchievements !== undefined) user.notifStreakAchievements = dto.notifStreakAchievements;
    if (dto.notifEvents !== undefined) user.notifEvents = dto.notifEvents;
    if (dto.notifGotv !== undefined) user.notifGotv = dto.notifGotv;
    if (dto.notifAmaSessions !== undefined) user.notifAmaSessions = dto.notifAmaSessions;
    if (dto.quietHoursStart !== undefined) user.quietHoursStart = dto.quietHoursStart;
    if (dto.quietHoursEnd !== undefined) user.quietHoursEnd = dto.quietHoursEnd;

    const saved = await this.appUserRepository.save(user);

    return {
      notifBreakingNews: saved.notifBreakingNews,
      notifPrimariesUpdates: saved.notifPrimariesUpdates,
      notifDailyQuizReminder: saved.notifDailyQuizReminder,
      notifStreakAchievements: saved.notifStreakAchievements,
      notifEvents: saved.notifEvents,
      notifGotv: saved.notifGotv,
      notifAmaSessions: saved.notifAmaSessions,
      quietHoursStart: saved.quietHoursStart,
      quietHoursEnd: saved.quietHoursEnd,
    };
  }

  // ── Admin Methods ───────────────────────────────────────────────────

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: AppUserRole,
    membershipStatus?: MembershipStatus,
  ) {
    const qb = this.appUserRepository.createQueryBuilder('user');

    if (search) {
      qb.andWhere(
        '(user.displayName ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search OR user.membershipId ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    if (membershipStatus) {
      qb.andWhere('user.membershipStatus = :membershipStatus', {
        membershipStatus,
      });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleActive(userId: string): Promise<AppUser> {
    const user = await this.findById(userId);
    user.isActive = !user.isActive;
    return this.appUserRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.appUserRepository.remove(user);
  }

  // ── Voting Eligibility ────────────────────────────────────────────

  async approveVotingForElection(
    userId: string,
    electionId: string,
    approvedBy?: string,
  ): Promise<VotingEligibility> {
    await this.findById(userId);

    const existing = await this.votingEligibilityRepository.findOne({
      where: { userId, electionId },
    });
    if (existing) return existing;

    const eligibility = this.votingEligibilityRepository.create({
      userId,
      electionId,
      approvedBy,
    });
    return this.votingEligibilityRepository.save(eligibility);
  }

  async revokeVotingForElection(
    userId: string,
    electionId: string,
  ): Promise<void> {
    await this.votingEligibilityRepository.delete({ userId, electionId });
  }

  async getVotingEligibility(userId: string): Promise<VotingEligibility[]> {
    return this.votingEligibilityRepository.find({
      where: { userId },
      relations: ['election'],
      order: { approvedAt: 'DESC' },
    });
  }

  async bulkApproveVoting(
    userIds: string[],
    electionId: string,
    approvedBy?: string,
  ): Promise<{ approved: number }> {
    let count = 0;
    for (const userId of userIds) {
      const existing = await this.votingEligibilityRepository.findOne({
        where: { userId, electionId },
      });
      if (!existing) {
        await this.votingEligibilityRepository.save(
          this.votingEligibilityRepository.create({
            userId,
            electionId,
            approvedBy,
          }),
        );
        count++;
      }
    }
    return { approved: count };
  }

  // ── Referral System ─────────────────────────────────────────────────

  /** Returns existing referral code or generates a new unique 8-char one. */
  async getOrCreateReferralCode(userId: string): Promise<{ referralCode: string; totalReferrals: number }> {
    const user = await this.findById(userId);

    if (!user.referralCode) {
      // Generate unique 8-char alphanumeric code
      let code: string;
      let exists = true;
      do {
        code = randomBytes(4).toString('hex').toUpperCase();
        const existing = await this.appUserRepository.findOne({ where: { referralCode: code } });
        exists = !!existing;
      } while (exists);

      user.referralCode = code;
      await this.appUserRepository.save(user);
    }

    const totalReferrals = await this.userReferralRepository.count({
      where: { referrerId: userId },
    });

    return { referralCode: user.referralCode, totalReferrals };
  }

  /** Claims a referral code during registration. Awards 100 points to referrer. */
  async claimReferralCode(refereeId: string, code: string): Promise<void> {
    // Find referrer
    const referrer = await this.appUserRepository.findOne({
      where: { referralCode: code.toUpperCase() },
    });
    if (!referrer) return; // invalid code — fail silently, don't block registration

    if (referrer.id === refereeId) return; // can't refer yourself

    // Check not already claimed
    const alreadyClaimed = await this.userReferralRepository.findOne({
      where: { refereeId },
    });
    if (alreadyClaimed) return;

    await this.userReferralRepository.save(
      this.userReferralRepository.create({
        referrerId: referrer.id,
        refereeId,
        code: code.toUpperCase(),
      }),
    );
  }

  // ── Growth Analytics ────────────────────────────────────────────────

  /** DAU / WAU / MAU based on lastLoginAt. */
  async getActiveUsers(): Promise<{ dau: number; wau: number; mau: number }> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dau, wau, mau] = await Promise.all([
      this.appUserRepository.createQueryBuilder('u')
        .where('u.lastLoginAt >= :since', { since: dayAgo })
        .andWhere('u.isActive = true')
        .getCount(),
      this.appUserRepository.createQueryBuilder('u')
        .where('u.lastLoginAt >= :since', { since: weekAgo })
        .andWhere('u.isActive = true')
        .getCount(),
      this.appUserRepository.createQueryBuilder('u')
        .where('u.lastLoginAt >= :since', { since: monthAgo })
        .andWhere('u.isActive = true')
        .getCount(),
    ]);

    return { dau, wau, mau };
  }

  /** Daily new user registrations for the last N days. */
  async getUserGrowthTrend(days: number = 30): Promise<Array<{ date: string; count: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.appUserRepository
      .createQueryBuilder('u')
      .select("TO_CHAR(u.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)::int', 'count')
      .where('u.createdAt >= :since', { since })
      .groupBy("TO_CHAR(u.createdAt, 'YYYY-MM-DD')")
      .orderBy('"date"', 'ASC')
      .getRawMany();

    return rows;
  }

  /** User segmentation by role and membership status. */
  async getUserSegments(): Promise<{
    byRole: Array<{ role: string; count: number }>;
    byMembership: Array<{ status: string; count: number }>;
  }> {
    const [byRole, byMembership] = await Promise.all([
      this.appUserRepository
        .createQueryBuilder('u')
        .select('u.role', 'role')
        .addSelect('COUNT(*)::int', 'count')
        .where('u.isActive = true')
        .groupBy('u.role')
        .getRawMany(),
      this.appUserRepository
        .createQueryBuilder('u')
        .select('u.membershipStatus', 'status')
        .addSelect('COUNT(*)::int', 'count')
        .where('u.isActive = true')
        .groupBy('u.membershipStatus')
        .getRawMany(),
    ]);

    return { byRole, byMembership };
  }

  /** Retention cohort: users who registered in a given week and returned in subsequent weeks. */
  async getRetentionCohorts(weeks: number = 8): Promise<Array<{
    cohort: string;
    registered: number;
    retained: number[];
  }>> {
    const results: Array<{ cohort: string; registered: number; retained: number[] }> = [];
    const now = new Date();

    for (let w = weeks - 1; w >= 0; w--) {
      const cohortStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
      const cohortEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const cohortLabel = cohortStart.toISOString().split('T')[0];

      const registered = await this.appUserRepository
        .createQueryBuilder('u')
        .where('u.createdAt >= :start AND u.createdAt < :end', { start: cohortStart, end: cohortEnd })
        .getCount();

      const retained: number[] = [];
      for (let rw = 1; rw <= w; rw++) {
        const retStart = new Date(cohortStart.getTime() + rw * 7 * 24 * 60 * 60 * 1000);
        const retEnd = new Date(retStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const count = await this.appUserRepository
          .createQueryBuilder('u')
          .where('u.createdAt >= :cohortStart AND u.createdAt < :cohortEnd', { cohortStart: cohortStart, cohortEnd: cohortEnd })
          .andWhere('u.lastLoginAt >= :retStart AND u.lastLoginAt < :retEnd', { retStart, retEnd })
          .getCount();
        retained.push(count);
      }

      results.push({ cohort: cohortLabel, registered, retained });
    }

    return results;
  }
}
