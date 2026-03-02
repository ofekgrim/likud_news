import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppAuthService } from './app-auth.service';
import { AppUser, AppUserRole, MembershipStatus } from '../app-users/entities/app-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpService } from './otp.service';
import { OtpPurpose } from './entities/otp-code.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'mock-refresh-token' }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('hashed-token'),
    }),
  }),
}));

const mockAppUserRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  query: jest.fn(),
});

const mockRefreshTokenRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

describe('AppAuthService', () => {
  let service: AppAuthService;
  let appUserRepository: ReturnType<typeof mockAppUserRepository>;
  let refreshTokenRepository: ReturnType<typeof mockRefreshTokenRepository>;
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };
  let otpService: { generateOtp: jest.Mock; verifyOtp: jest.Mock };

  beforeEach(async () => {
    jwtService = { sign: jest.fn().mockReturnValue('mock-access-token') };
    configService = { get: jest.fn().mockReturnValue('test-secret') };
    otpService = {
      generateOtp: jest.fn().mockResolvedValue('123456'),
      verifyOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppAuthService,
        { provide: getRepositoryToken(AppUser), useFactory: mockAppUserRepository },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRefreshTokenRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: OtpService, useValue: otpService },
      ],
    }).compile();

    service = module.get<AppAuthService>(AppAuthService);
    appUserRepository = module.get(getRepositoryToken(AppUser));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── Helper: mock user and token generation ──────────────────────────

  const mockUser = (overrides: Partial<AppUser> = {}): AppUser =>
    ({
      id: 'user-uuid-1',
      deviceId: 'device-123',
      phone: '+972501234567',
      email: undefined,
      passwordHash: undefined,
      displayName: undefined,
      avatarUrl: undefined,
      role: AppUserRole.MEMBER,
      membershipStatus: MembershipStatus.UNVERIFIED,
      isActive: true,
      lastLoginAt: undefined,
      ...overrides,
    }) as AppUser;

  /**
   * Sets up mocks for the private generateTokens flow so that
   * any method calling generateTokens will succeed.
   */
  const setupGenerateTokensMocks = (user: AppUser) => {
    refreshTokenRepository.update.mockResolvedValue({ affected: 1 });
    const storedToken = { id: 'token-uuid', tokenHash: 'hashed-token', userId: user.id };
    refreshTokenRepository.create.mockReturnValue(storedToken);
    refreshTokenRepository.save.mockResolvedValue(storedToken);
  };

  // ── requestOtp ──────────────────────────────────────────────────────

  describe('requestOtp', () => {
    it('should call otpService.generateOtp and return success message', async () => {
      appUserRepository.findOne.mockResolvedValue(mockUser({ phone: '+972501234567' }));

      const result = await service.requestOtp('+972501234567');

      expect(appUserRepository.findOne).toHaveBeenCalledWith({ where: { phone: '+972501234567' } });
      expect(otpService.generateOtp).toHaveBeenCalledWith('+972501234567', OtpPurpose.LOGIN);
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should throw NotFoundException when phone is not registered', async () => {
      appUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestOtp('+972500000000'),
      ).rejects.toThrow(NotFoundException);

      expect(otpService.generateOtp).not.toHaveBeenCalled();
    });
  });

  // ── verifyOtp ───────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException when OTP is invalid', async () => {
      otpService.verifyOtp.mockResolvedValue(false);

      await expect(
        service.verifyOtp('+972501234567', '999999', 'device-123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        '+972501234567',
        '999999',
        OtpPurpose.LOGIN,
      );
    });

    it('should update lastLoginAt and generate tokens for existing user', async () => {
      const user = mockUser();
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne.mockResolvedValueOnce(user); // find by phone
      appUserRepository.save.mockResolvedValue(user);
      setupGenerateTokensMocks(user);

      const result = await service.verifyOtp('+972501234567', '123456', 'device-123');

      expect(appUserRepository.findOne).toHaveBeenCalledWith({ where: { phone: '+972501234567' } });
      expect(appUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          tokens: expect.objectContaining({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          }),
          user: expect.objectContaining({ id: 'user-uuid-1' }),
        }),
      );
    });

    it('should upgrade guest user to member when phone not found but deviceId matches', async () => {
      const guestUser = mockUser({ role: AppUserRole.GUEST, phone: undefined });
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne
        .mockResolvedValueOnce(null) // no user by phone
        .mockResolvedValueOnce(guestUser); // guest user by deviceId
      appUserRepository.save.mockResolvedValue({
        ...guestUser,
        phone: '+972501234567',
        role: AppUserRole.MEMBER,
      });
      setupGenerateTokensMocks(guestUser);

      const result = await service.verifyOtp('+972501234567', '123456', 'device-123');

      expect(appUserRepository.findOne).toHaveBeenCalledWith({ where: { phone: '+972501234567' } });
      expect(appUserRepository.findOne).toHaveBeenCalledWith({ where: { deviceId: 'device-123' } });
      expect(appUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+972501234567',
          role: AppUserRole.MEMBER,
        }),
      );
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('should create a new user when no user found by phone or deviceId', async () => {
      const newUser = mockUser({ id: 'new-user-uuid' });
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne
        .mockResolvedValueOnce(null) // no user by phone
        .mockResolvedValueOnce(null); // no user by deviceId
      appUserRepository.create.mockReturnValue(newUser);
      appUserRepository.save.mockResolvedValue(newUser);
      setupGenerateTokensMocks(newUser);

      const result = await service.verifyOtp('+972501234567', '123456', 'device-123');

      expect(appUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+972501234567',
          deviceId: 'device-123',
          role: AppUserRole.MEMBER,
          lastLoginAt: expect.any(Date),
        }),
      );
      expect(appUserRepository.save).toHaveBeenCalledWith(newUser);
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('should update deviceId when existing user has a different deviceId', async () => {
      const user = mockUser({ deviceId: 'old-device' });
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne.mockResolvedValueOnce(user); // found by phone
      appUserRepository.save.mockResolvedValue({ ...user, deviceId: 'new-device' });
      setupGenerateTokensMocks(user);

      await service.verifyOtp('+972501234567', '123456', 'new-device');

      expect(user.deviceId).toBe('new-device');
      expect(appUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'new-device' }),
      );
    });
  });

  // ── registerEmail ───────────────────────────────────────────────────

  describe('registerEmail', () => {
    it('should throw ConflictException when email already exists', async () => {
      appUserRepository.findOne.mockResolvedValueOnce(mockUser({ email: 'test@test.com' }));

      await expect(
        service.registerEmail('test@test.com', 'password123', 'device-123'),
      ).rejects.toThrow(ConflictException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should upgrade guest user with email and password when deviceId matches', async () => {
      const guestUser = mockUser({ role: AppUserRole.GUEST, email: undefined, passwordHash: undefined });
      appUserRepository.findOne
        .mockResolvedValueOnce(null) // no user by email
        .mockResolvedValueOnce(guestUser); // guest by deviceId
      appUserRepository.save.mockResolvedValue({
        ...guestUser,
        email: 'new@test.com',
        passwordHash: '$2b$10$hashedpassword',
        role: AppUserRole.MEMBER,
      });
      setupGenerateTokensMocks(guestUser);

      const result = await service.registerEmail(
        'new@test.com',
        'password123',
        'device-123',
        'John',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(appUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@test.com',
          passwordHash: '$2b$10$hashedpassword',
          role: AppUserRole.MEMBER,
          displayName: 'John',
        }),
      );
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('should create a new user when no existing user found', async () => {
      const newUser = mockUser({ id: 'new-uuid', email: 'fresh@test.com' });
      appUserRepository.findOne
        .mockResolvedValueOnce(null) // no user by email
        .mockResolvedValueOnce(null); // no user by deviceId
      appUserRepository.create.mockReturnValue(newUser);
      appUserRepository.save.mockResolvedValue(newUser);
      setupGenerateTokensMocks(newUser);

      const result = await service.registerEmail(
        'fresh@test.com',
        'password123',
        'device-456',
        'Fresh User',
      );

      expect(appUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'fresh@test.com',
          passwordHash: '$2b$10$hashedpassword',
          deviceId: 'device-456',
          displayName: 'Fresh User',
          role: AppUserRole.MEMBER,
          lastLoginAt: expect.any(Date),
        }),
      );
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
    });

    it('should keep existing displayName when upgrading guest and no displayName provided', async () => {
      const guestUser = mockUser({
        role: AppUserRole.GUEST,
        displayName: 'Existing Name',
      });
      appUserRepository.findOne
        .mockResolvedValueOnce(null) // no user by email
        .mockResolvedValueOnce(guestUser); // guest by deviceId
      appUserRepository.save.mockResolvedValue(guestUser);
      setupGenerateTokensMocks(guestUser);

      await service.registerEmail('new@test.com', 'password123', 'device-123');

      expect(appUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Existing Name' }),
      );
    });
  });

  // ── loginEmail ──────────────────────────────────────────────────────

  describe('loginEmail', () => {
    it('should throw NotFoundException when user is not found', async () => {
      appUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.loginEmail('nonexistent@test.com', 'password', 'device-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user has no passwordHash', async () => {
      const user = mockUser({ email: 'otp-only@test.com', passwordHash: undefined });
      appUserRepository.findOne.mockResolvedValue(user);

      await expect(
        service.loginEmail('otp-only@test.com', 'password', 'device-123'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is deactivated', async () => {
      const user = mockUser({
        email: 'inactive@test.com',
        passwordHash: '$2b$10$hashedpassword',
        isActive: false,
      });
      appUserRepository.findOne.mockResolvedValue(user);

      await expect(
        service.loginEmail('inactive@test.com', 'password', 'device-123'),
      ).rejects.toThrow(new UnauthorizedException('Account is deactivated'));
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const user = mockUser({
        email: 'valid@test.com',
        passwordHash: '$2b$10$hashedpassword',
      });
      appUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.loginEmail('valid@test.com', 'wrong-password', 'device-123'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', '$2b$10$hashedpassword');
    });

    it('should update lastLoginAt and generate tokens on successful login', async () => {
      const user = mockUser({
        email: 'valid@test.com',
        passwordHash: '$2b$10$hashedpassword',
      });
      appUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      appUserRepository.save.mockResolvedValue(user);
      setupGenerateTokensMocks(user);

      const result = await service.loginEmail('valid@test.com', 'password123', 'device-123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedpassword');
      expect(appUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          tokens: expect.objectContaining({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          }),
          user: expect.objectContaining({
            id: 'user-uuid-1',
            role: AppUserRole.MEMBER,
          }),
        }),
      );
    });

    it('should update deviceId when user logs in from a different device', async () => {
      const user = mockUser({
        email: 'valid@test.com',
        passwordHash: '$2b$10$hashedpassword',
        deviceId: 'old-device',
      });
      appUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      appUserRepository.save.mockResolvedValue(user);
      setupGenerateTokensMocks(user);

      await service.loginEmail('valid@test.com', 'password123', 'new-device');

      expect(user.deviceId).toBe('new-device');
      expect(appUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'new-device' }),
      );
    });
  });

  // ── refreshTokens ──────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException when token is not found', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refreshTokens('invalid-token', 'device-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const expiredToken = {
        id: 'token-uuid',
        tokenHash: 'hashed-token',
        deviceId: 'device-123',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000), // expired
        user: mockUser(),
      };
      refreshTokenRepository.findOne.mockResolvedValue(expiredToken);

      await expect(
        service.refreshTokens('some-token', 'device-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is deactivated', async () => {
      const storedToken = {
        id: 'token-uuid',
        tokenHash: 'hashed-token',
        deviceId: 'device-123',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000), // valid for 1 day
        user: mockUser({ isActive: false }),
      };
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);

      await expect(
        service.refreshTokens('some-token', 'device-123'),
      ).rejects.toThrow(new UnauthorizedException('User account is deactivated'));
    });

    it('should throw UnauthorizedException when user is null', async () => {
      const storedToken = {
        id: 'token-uuid',
        tokenHash: 'hashed-token',
        deviceId: 'device-123',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: null,
      };
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);

      await expect(
        service.refreshTokens('some-token', 'device-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke old token and generate new tokens on success', async () => {
      const user = mockUser();
      const storedToken = {
        id: 'token-uuid',
        tokenHash: 'hashed-token',
        deviceId: 'device-123',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000), // valid for 1 day
        platform: 'ios',
        user,
      };
      refreshTokenRepository.findOne.mockResolvedValue(storedToken);
      refreshTokenRepository.save.mockResolvedValue(storedToken);
      setupGenerateTokensMocks(user);

      const result = await service.refreshTokens('valid-refresh-token', 'device-123');

      // Old token should be revoked
      expect(storedToken.isRevoked).toBe(true);
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isRevoked: true }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          tokens: expect.objectContaining({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          }),
          user: expect.objectContaining({ id: 'user-uuid-1' }),
        }),
      );
    });

    it('should look up token with correct where clause and relations', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refreshTokens('some-token', 'device-123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { tokenHash: 'hashed-token', deviceId: 'device-123', isRevoked: false },
        relations: ['user'],
      });
    });
  });

  // ── logout ──────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should revoke all refresh tokens for the user and device', async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 2 });

      await service.logout('user-uuid-1', 'device-123');

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: 'user-uuid-1', deviceId: 'device-123', isRevoked: false },
        { isRevoked: true },
      );
    });

    it('should succeed even when no tokens exist to revoke', async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.logout('user-uuid-1', 'device-123'),
      ).resolves.toBeUndefined();

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: 'user-uuid-1', deviceId: 'device-123', isRevoked: false },
        { isRevoked: true },
      );
    });
  });

  // ── migrateDeviceData ───────────────────────────────────────────────

  describe('migrateDeviceData', () => {
    it('should throw BadRequestException when user is not found', async () => {
      appUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.migrateDeviceData('nonexistent-user', 'old-device'),
      ).rejects.toThrow(BadRequestException);

      expect(appUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-user' },
      });
    });

    it('should run 3 SQL updates and return migration counts on success', async () => {
      const user = mockUser();
      appUserRepository.findOne.mockResolvedValue(user);
      appUserRepository.query
        .mockResolvedValueOnce([[], 3]) // favorites
        .mockResolvedValueOnce([[], 5]) // history
        .mockResolvedValueOnce([[], 1]); // push tokens

      const result = await service.migrateDeviceData('user-uuid-1', 'old-device');

      expect(appUserRepository.query).toHaveBeenCalledTimes(3);
      expect(appUserRepository.query).toHaveBeenCalledWith(
        `UPDATE "user_favorites" SET "userId" = $1 WHERE "deviceId" = $2 AND "userId" IS NULL`,
        ['user-uuid-1', 'old-device'],
      );
      expect(appUserRepository.query).toHaveBeenCalledWith(
        `UPDATE "reading_history" SET "userId" = $1 WHERE "deviceId" = $2 AND "userId" IS NULL`,
        ['user-uuid-1', 'old-device'],
      );
      expect(appUserRepository.query).toHaveBeenCalledWith(
        `UPDATE "push_tokens" SET "userId" = $1 WHERE "deviceId" = $2 AND "userId" IS NULL`,
        ['user-uuid-1', 'old-device'],
      );

      expect(result).toEqual({
        migrated: {
          favorites: 3,
          history: 5,
          pushTokens: 1,
        },
      });
    });

    it('should return zero counts when no rows are migrated', async () => {
      const user = mockUser();
      appUserRepository.findOne.mockResolvedValue(user);
      appUserRepository.query
        .mockResolvedValueOnce([[], 0]) // favorites
        .mockResolvedValueOnce([[], 0]) // history
        .mockResolvedValueOnce([[], 0]); // push tokens

      const result = await service.migrateDeviceData('user-uuid-1', 'old-device');

      expect(result).toEqual({
        migrated: {
          favorites: 0,
          history: 0,
          pushTokens: 0,
        },
      });
    });

    it('should handle undefined affected rows by defaulting to 0', async () => {
      const user = mockUser();
      appUserRepository.findOne.mockResolvedValue(user);
      appUserRepository.query
        .mockResolvedValueOnce([[]]) // no [1] element → undefined
        .mockResolvedValueOnce([[]]) // no [1] element → undefined
        .mockResolvedValueOnce([[]]); // no [1] element → undefined

      const result = await service.migrateDeviceData('user-uuid-1', 'old-device');

      expect(result).toEqual({
        migrated: {
          favorites: 0,
          history: 0,
          pushTokens: 0,
        },
      });
    });
  });

  // ── generateTokens (tested indirectly) ──────────────────────────────

  describe('generateTokens (via verifyOtp)', () => {
    it('should sign JWT with correct payload', async () => {
      const user = mockUser();
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne.mockResolvedValueOnce(user);
      appUserRepository.save.mockResolvedValue(user);
      setupGenerateTokensMocks(user);

      await service.verifyOtp('+972501234567', '123456', 'device-123', 'android');

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'user-uuid-1',
          deviceId: 'device-123',
          role: AppUserRole.MEMBER,
          type: 'app',
        },
        { expiresIn: '15m' },
      );
    });

    it('should revoke existing tokens for user+device before creating new ones', async () => {
      const user = mockUser();
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne.mockResolvedValueOnce(user);
      appUserRepository.save.mockResolvedValue(user);
      setupGenerateTokensMocks(user);

      await service.verifyOtp('+972501234567', '123456', 'device-123');

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: 'user-uuid-1', deviceId: 'device-123', isRevoked: false },
        { isRevoked: true },
      );
    });

    it('should create and save a new refresh token entity', async () => {
      const user = mockUser();
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne.mockResolvedValueOnce(user);
      appUserRepository.save.mockResolvedValue(user);
      setupGenerateTokensMocks(user);

      await service.verifyOtp('+972501234567', '123456', 'device-123', 'ios');

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          tokenHash: 'hashed-token',
          deviceId: 'device-123',
          platform: 'ios',
          expiresAt: expect.any(Date),
        }),
      );
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });

    it('should return user profile data in the response', async () => {
      const user = mockUser({
        email: 'test@test.com',
        displayName: 'Test User',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        membershipStatus: MembershipStatus.VERIFIED,
      });
      otpService.verifyOtp.mockResolvedValue(true);
      appUserRepository.findOne.mockResolvedValueOnce(user);
      appUserRepository.save.mockResolvedValue(user);
      setupGenerateTokensMocks(user);

      const result = await service.verifyOtp('+972501234567', '123456', 'device-123');

      expect(result.user).toEqual({
        id: 'user-uuid-1',
        phone: '+972501234567',
        email: 'test@test.com',
        displayName: 'Test User',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        role: AppUserRole.MEMBER,
        membershipStatus: MembershipStatus.VERIFIED,
      });
    });
  });
});
