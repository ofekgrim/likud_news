import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  AppUser,
  AppUserRole,
  MembershipStatus,
} from './entities/app-user.entity';
import { VotingEligibility } from './entities/voting-eligibility.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyMembershipDto } from './dto/verify-membership.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AppUsersService {
  constructor(
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(VotingEligibility)
    private readonly votingEligibilityRepository: Repository<VotingEligibility>,
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
}
