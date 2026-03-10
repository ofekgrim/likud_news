import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockUser = {
  id: 'user-uuid-1',
  email: 'admin@likud.org.il',
  name: 'Test Admin',
  role: 'admin',
  isActive: true,
  passwordHash: 'hashed-password-123',
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear bcrypt mock between tests (module-level mock persists)
    (bcrypt.compare as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin@likud.org.il', 'password123');

      expect(usersService.findByEmail).toHaveBeenCalledWith('admin@likud.org.il');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password-123');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('unknown@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.findByEmail).toHaveBeenCalledWith('unknown@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is deactivated', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      usersService.findByEmail.mockResolvedValue(deactivatedUser as any);

      await expect(
        service.validateUser('admin@likud.org.il', 'password123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('admin@likud.org.il', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password-123');
    });
  });

  describe('login', () => {
    it('should return access token, refresh token, and user data', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign
        .mockReturnValueOnce('access-token-xyz')
        .mockReturnValueOnce('refresh-token-xyz');
      configService.get
        .mockReturnValueOnce('refresh-secret-key')
        .mockReturnValueOnce('7d');

      const result = await service.login({
        email: 'admin@likud.org.il',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(1, {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(jwtService.sign).toHaveBeenNthCalledWith(2,
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { secret: 'refresh-secret-key', expiresIn: '7d' },
      );
      expect(result).toEqual({
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-xyz',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new access and refresh tokens for valid refresh token', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };

      jwtService.verify.mockReturnValue(payload as any);
      usersService.findOne.mockResolvedValue(mockUser as any);
      configService.get
        .mockReturnValueOnce('refresh-secret-key')
        .mockReturnValueOnce('refresh-secret-key')
        .mockReturnValueOnce('7d');
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret-key',
      });
      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });
      configService.get.mockReturnValue('refresh-secret-key');

      await expect(
        service.refreshToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is deactivated', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };
      const deactivatedUser = { ...mockUser, isActive: false };

      jwtService.verify.mockReturnValue(payload as any);
      usersService.findOne.mockResolvedValue(deactivatedUser as any);
      configService.get.mockReturnValue('refresh-secret-key');

      await expect(
        service.refreshToken('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
