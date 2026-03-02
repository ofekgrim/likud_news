import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AppUser, AppUserRole } from '../app-users/entities/app-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpService } from './otp.service';
import { OtpPurpose } from './entities/otp-code.entity';
import { AppJwtPayload } from './strategies/jwt-app.strategy';

@Injectable()
export class AppAuthService {
  private readonly logger = new Logger(AppAuthService.name);

  constructor(
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  // ── OTP Flow ────────────────────────────────────────────────────────

  async requestOtp(phone: string): Promise<{ message: string }> {
    const user = await this.appUserRepository.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException('No account found with this phone number');
    }
    await this.otpService.generateOtp(phone, OtpPurpose.LOGIN);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    phone: string,
    code: string,
    deviceId: string,
    platform?: string,
  ) {
    const isValid = await this.otpService.verifyOtp(
      phone,
      code,
      OtpPurpose.LOGIN,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find or create user by phone
    let user = await this.appUserRepository.findOne({ where: { phone } });

    if (!user) {
      // Check if a guest user exists with this deviceId
      user = await this.appUserRepository.findOne({ where: { deviceId } });

      if (user) {
        // Upgrade existing guest to member with phone
        user.phone = phone;
        user.role =
          user.role === AppUserRole.GUEST ? AppUserRole.MEMBER : user.role;
        user.lastLoginAt = new Date();
        user = await this.appUserRepository.save(user);
      } else {
        // Create new user
        user = this.appUserRepository.create({
          phone,
          deviceId,
          role: AppUserRole.MEMBER,
          lastLoginAt: new Date(),
        });
        user = await this.appUserRepository.save(user);
      }
    } else {
      user.lastLoginAt = new Date();
      if (user.deviceId !== deviceId) {
        user.deviceId = deviceId;
      }
      user = await this.appUserRepository.save(user);
    }

    return this.generateTokens(user, deviceId, platform);
  }

  // ── Email+Password Flow ─────────────────────────────────────────────

  async registerEmail(
    email: string,
    password: string,
    deviceId: string,
    displayName?: string,
    phone?: string,
    platform?: string,
  ) {
    const existing = await this.appUserRepository.findOne({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Check if a guest user exists with this deviceId
    let user = await this.appUserRepository.findOne({ where: { deviceId } });

    if (user) {
      user.email = email;
      user.passwordHash = passwordHash;
      user.displayName = displayName || user.displayName;
      if (phone) user.phone = phone;
      user.role =
        user.role === AppUserRole.GUEST ? AppUserRole.MEMBER : user.role;
      user.lastLoginAt = new Date();
      user = await this.appUserRepository.save(user);
    } else {
      user = this.appUserRepository.create({
        email,
        passwordHash,
        deviceId,
        displayName,
        phone,
        role: AppUserRole.MEMBER,
        lastLoginAt: new Date(),
      });
      user = await this.appUserRepository.save(user);
    }

    return this.generateTokens(user, deviceId, platform);
  }

  async loginEmail(
    email: string,
    password: string,
    deviceId: string,
    platform?: string,
  ) {
    const user = await this.appUserRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('No account found with this email');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    if (user.deviceId !== deviceId) {
      user.deviceId = deviceId;
    }
    await this.appUserRepository.save(user);

    return this.generateTokens(user, deviceId, platform);
  }

  // ── Phone Change ──────────────────────────────────────────────────

  async requestPhoneChange(
    userId: string,
    newPhone: string,
  ): Promise<{ message: string }> {
    const existing = await this.appUserRepository.findOne({
      where: { phone: newPhone },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Phone number is already in use');
    }

    await this.otpService.generateOtp(newPhone, OtpPurpose.PHONE_CHANGE);
    return { message: 'Verification code sent to new phone' };
  }

  async verifyPhoneChange(userId: string, newPhone: string, code: string) {
    const isValid = await this.otpService.verifyOtp(
      newPhone,
      code,
      OtpPurpose.PHONE_CHANGE,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const user = await this.appUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.phone = newPhone;
    const saved = await this.appUserRepository.save(user);

    return {
      user: {
        id: saved.id,
        phone: saved.phone,
        email: saved.email,
        displayName: saved.displayName,
        avatarUrl: saved.avatarUrl,
        role: saved.role,
        membershipStatus: saved.membershipStatus,
      },
    };
  }

  // ── Email Change ──────────────────────────────────────────────────

  async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.appUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('No password set on this account');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const existing = await this.appUserRepository.findOne({
      where: { email: newEmail },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email is already in use');
    }

    await this.otpService.generateOtp(newEmail, OtpPurpose.EMAIL_CHANGE);
    return { message: 'Verification code sent to new email' };
  }

  async verifyEmailChange(userId: string, newEmail: string, code: string) {
    const isValid = await this.otpService.verifyOtp(
      newEmail,
      code,
      OtpPurpose.EMAIL_CHANGE,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const user = await this.appUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.email = newEmail;
    const saved = await this.appUserRepository.save(user);

    return {
      user: {
        id: saved.id,
        phone: saved.phone,
        email: saved.email,
        displayName: saved.displayName,
        avatarUrl: saved.avatarUrl,
        role: saved.role,
        membershipStatus: saved.membershipStatus,
      },
    };
  }

  // ── Account Deletion ──────────────────────────────────────────────

  async deleteMyAccount(userId: string, password: string): Promise<void> {
    const user = await this.appUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('No password set on this account');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Revoke all refresh tokens for this user
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    // Hard delete the user
    await this.appUserRepository.remove(user);
  }

  // ── Token Management ────────────────────────────────────────────────

  async refreshTokens(refreshToken: string, deviceId: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, deviceId, isRevoked: false },
      relations: ['user'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user || !storedToken.user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Revoke old refresh token (rotation)
    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    return this.generateTokens(
      storedToken.user,
      deviceId,
      storedToken.platform,
    );
  }

  async logout(userId: string, deviceId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, deviceId, isRevoked: false },
      { isRevoked: true },
    );
  }

  // ── Device Migration ────────────────────────────────────────────────

  async migrateDeviceData(
    userId: string,
    oldDeviceId: string,
  ): Promise<{
    migrated: { favorites: number; history: number; pushTokens: number };
  }> {
    const user = await this.appUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const favResult = await this.appUserRepository.query(
      `UPDATE "user_favorites" SET "userId" = $1 WHERE "deviceId" = $2 AND "userId" IS NULL`,
      [userId, oldDeviceId],
    );

    const histResult = await this.appUserRepository.query(
      `UPDATE "reading_history" SET "userId" = $1 WHERE "deviceId" = $2 AND "userId" IS NULL`,
      [userId, oldDeviceId],
    );

    const pushResult = await this.appUserRepository.query(
      `UPDATE "push_tokens" SET "userId" = $1 WHERE "deviceId" = $2 AND "userId" IS NULL`,
      [userId, oldDeviceId],
    );

    return {
      migrated: {
        favorites: favResult[1] || 0,
        history: histResult[1] || 0,
        pushTokens: pushResult[1] || 0,
      },
    };
  }

  // ── Private Helpers ─────────────────────────────────────────────────

  private async generateTokens(
    user: AppUser,
    deviceId: string,
    platform?: string,
  ) {
    const payload: AppJwtPayload = {
      sub: user.id,
      deviceId: user.deviceId,
      role: user.role,
      type: 'app',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Revoke existing tokens for this user+device
    await this.refreshTokenRepository.update(
      { userId: user.id, deviceId, isRevoked: false },
      { isRevoked: true },
    );

    const storedToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      deviceId,
      platform,
      expiresAt,
    });
    await this.refreshTokenRepository.save(storedToken);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        membershipStatus: user.membershipStatus,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
