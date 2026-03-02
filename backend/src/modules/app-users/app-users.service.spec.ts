import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AppUsersService } from './app-users.service';
import {
  AppUser,
  AppUserRole,
  MembershipStatus,
} from './entities/app-user.entity';

const mockQueryBuilder = {
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

describe('AppUsersService', () => {
  let service: AppUsersService;
  let repository: ReturnType<typeof mockRepository>;

  const mockUser: Partial<AppUser> = {
    id: 'uuid-user-1',
    deviceId: 'device-abc-123',
    phone: '+972501234567',
    email: 'user@example.com',
    displayName: 'ישראל ישראלי',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    bio: 'חבר ליכוד',
    role: AppUserRole.GUEST,
    membershipId: null,
    membershipStatus: MembershipStatus.UNVERIFIED,
    membershipVerifiedAt: null,
    preferredCategories: [],
    notificationPrefs: {},
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppUsersService,
        {
          provide: getRepositoryToken(AppUser),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AppUsersService>(AppUsersService);
    repository = module.get(getRepositoryToken(AppUser));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findById ────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a user when found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-user-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findByDeviceId ──────────────────────────────────────────────────

  describe('findByDeviceId', () => {
    it('should return a user when found by deviceId', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByDeviceId('device-abc-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: 'device-abc-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByDeviceId('unknown-device');

      expect(result).toBeNull();
    });
  });

  // ── findOrCreateByDeviceId ──────────────────────────────────────────

  describe('findOrCreateByDeviceId', () => {
    it('should return existing user if found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOrCreateByDeviceId('device-abc-123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: 'device-abc-123' },
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should create a new guest user when none found', async () => {
      const newUser = {
        ...mockUser,
        id: 'uuid-new',
        deviceId: 'new-device',
        role: AppUserRole.GUEST,
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue(newUser);

      const result = await service.findOrCreateByDeviceId('new-device');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: 'new-device' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        deviceId: 'new-device',
        role: AppUserRole.GUEST,
      });
      expect(repository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });
  });

  // ── updateProfile ───────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('should update displayName and bio', async () => {
      const user = { ...mockUser };
      const updatedUser = {
        ...user,
        displayName: 'שם חדש',
        bio: 'ביוגרפיה חדשה',
      };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('uuid-user-1', {
        displayName: 'שם חדש',
        bio: 'ביוגרפיה חדשה',
      });

      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should update preferredCategories and notificationPrefs', async () => {
      const user = { ...mockUser };
      const updatedUser = {
        ...user,
        preferredCategories: ['cat-1', 'cat-2'],
        notificationPrefs: { breaking: true, daily: false },
      };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('uuid-user-1', {
        preferredCategories: ['cat-1', 'cat-2'],
        notificationPrefs: { breaking: true, daily: false },
      });

      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { displayName: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateAvatar ────────────────────────────────────────────────────

  describe('updateAvatar', () => {
    it('should update the avatar URL', async () => {
      const user = { ...mockUser };
      const newAvatarUrl = 'https://cdn.example.com/new-avatar.jpg';
      const updatedUser = { ...user, avatarUrl: newAvatarUrl };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.updateAvatar('uuid-user-1', newAvatarUrl);

      expect(user.avatarUrl).toBe(newAvatarUrl);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: newAvatarUrl }),
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAvatar('nonexistent', 'https://cdn.example.com/img.jpg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── requestMembershipVerification ───────────────────────────────────

  describe('requestMembershipVerification', () => {
    it('should set membership to PENDING with membershipId', async () => {
      const user = {
        ...mockUser,
        membershipStatus: MembershipStatus.UNVERIFIED,
      };
      const updatedUser = {
        ...user,
        membershipId: 'LK-12345',
        membershipStatus: MembershipStatus.PENDING,
      };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.requestMembershipVerification(
        'uuid-user-1',
        { membershipId: 'LK-12345' },
      );

      expect(user.membershipId).toBe('LK-12345');
      expect(user.membershipStatus).toBe(MembershipStatus.PENDING);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should update displayName if fullName is provided', async () => {
      const user = {
        ...mockUser,
        membershipStatus: MembershipStatus.UNVERIFIED,
      };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(user);

      await service.requestMembershipVerification('uuid-user-1', {
        membershipId: 'LK-12345',
        fullName: 'ישראל כהן',
      });

      expect(user.displayName).toBe('ישראל כהן');
    });

    it('should throw BadRequestException if membership is already verified', async () => {
      const user = {
        ...mockUser,
        membershipStatus: MembershipStatus.VERIFIED,
      };

      repository.findOne.mockResolvedValue(user);

      await expect(
        service.requestMembershipVerification('uuid-user-1', {
          membershipId: 'LK-12345',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.requestMembershipVerification('nonexistent', {
          membershipId: 'LK-12345',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── approveMembership ───────────────────────────────────────────────

  describe('approveMembership', () => {
    it('should set status to VERIFIED and role to VERIFIED_MEMBER', async () => {
      const user = {
        ...mockUser,
        membershipStatus: MembershipStatus.PENDING,
        role: AppUserRole.GUEST,
      };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(user);

      const result = await service.approveMembership('uuid-user-1');

      expect(user.membershipStatus).toBe(MembershipStatus.VERIFIED);
      expect(user.role).toBe(AppUserRole.VERIFIED_MEMBER);
      expect(user.membershipVerifiedAt).toBeInstanceOf(Date);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          membershipStatus: MembershipStatus.VERIFIED,
          role: AppUserRole.VERIFIED_MEMBER,
        }),
      );
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.approveMembership('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── rejectMembership ────────────────────────────────────────────────

  describe('rejectMembership', () => {
    it('should set membership status to UNVERIFIED', async () => {
      const user = {
        ...mockUser,
        membershipStatus: MembershipStatus.PENDING,
      };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(user);

      const result = await service.rejectMembership('uuid-user-1');

      expect(user.membershipStatus).toBe(MembershipStatus.UNVERIFIED);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          membershipStatus: MembershipStatus.UNVERIFIED,
        }),
      );
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.rejectMembership('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getProfile ──────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('should return a profile object with expected fields', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('uuid-user-1');

      expect(result).toEqual({
        id: mockUser.id,
        phone: mockUser.phone,
        email: mockUser.email,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        bio: mockUser.bio,
        role: mockUser.role,
        membershipId: mockUser.membershipId,
        membershipStatus: mockUser.membershipStatus,
        membershipVerifiedAt: mockUser.membershipVerifiedAt,
        preferredCategories: mockUser.preferredCategories,
        notificationPrefs: mockUser.notificationPrefs,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findAll (Admin) ─────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const users = [mockUser];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll();

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        data: users,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply search filter across multiple fields', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, 20, 'ישראל');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.displayName ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search OR user.membershipId ILIKE :search)',
        { search: '%ישראל%' },
      );
    });

    it('should apply role filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, 20, undefined, AppUserRole.VERIFIED_MEMBER);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.role = :role',
        { role: AppUserRole.VERIFIED_MEMBER },
      );
    });

    it('should apply membershipStatus filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(
        1,
        20,
        undefined,
        undefined,
        MembershipStatus.PENDING,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.membershipStatus = :membershipStatus',
        { membershipStatus: MembershipStatus.PENDING },
      );
    });

    it('should calculate correct skip for page 3', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(3, 10);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should calculate totalPages correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 45]);

      const result = await service.findAll(1, 20);

      expect(result.totalPages).toBe(3);
    });
  });

  // ── toggleActive ────────────────────────────────────────────────────

  describe('toggleActive', () => {
    it('should toggle isActive from true to false', async () => {
      const user = { ...mockUser, isActive: true };
      const toggledUser = { ...user, isActive: false };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(toggledUser);

      const result = await service.toggleActive('uuid-user-1');

      expect(user.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(result).toEqual(toggledUser);
    });

    it('should toggle isActive from false to true', async () => {
      const user = { ...mockUser, isActive: false };
      const toggledUser = { ...user, isActive: true };

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(toggledUser);

      const result = await service.toggleActive('uuid-user-1');

      expect(user.isActive).toBe(true);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(toggledUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.toggleActive('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
