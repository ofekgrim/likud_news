import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppAuthService } from './app-auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { AppRefreshTokenDto } from './dto/app-refresh-token.dto';
import { AppLogoutDto } from './dto/app-logout.dto';
import { RequestPhoneChangeDto } from './dto/request-phone-change.dto';
import { VerifyPhoneChangeDto } from './dto/verify-phone-change.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { VerifyEmailChangeDto } from './dto/verify-email-change.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { AppAuthGuard } from './guards/app-auth.guard';
import { CurrentAppUser } from './decorators/current-app-user.decorator';

@ApiTags('App Auth')
@Controller('app-auth')
export class AppAuthController {
  constructor(private readonly appAuthService: AppAuthService) {}

  @Post('otp/request')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP code for phone login' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.appAuthService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and get JWT tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.appAuthService.verifyOtp(
      dto.phone,
      dto.code,
      dto.deviceId,
      dto.platform,
    );
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register with email and password' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async registerEmail(@Body() dto: RegisterEmailDto) {
    return this.appAuthService.registerEmail(
      dto.email,
      dto.password,
      dto.deviceId,
      dto.displayName,
      dto.phone,
      dto.platform,
    );
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginEmail(@Body() dto: LoginEmailDto) {
    return this.appAuthService.loginEmail(
      dto.email,
      dto.password,
      dto.deviceId,
      dto.platform,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: AppRefreshTokenDto) {
    return this.appAuthService.refreshTokens(dto.refreshToken, dto.deviceId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentAppUser('id') userId: string,
    @Body() dto: AppLogoutDto,
  ) {
    await this.appAuthService.logout(userId, dto.deviceId);
    return { message: 'Logged out successfully' };
  }

  // ── Phone Change ──────────────────────────────────────────────────

  @Post('phone-change/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request OTP to change phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent to new phone' })
  @ApiResponse({ status: 409, description: 'Phone already in use' })
  async requestPhoneChange(
    @CurrentAppUser('id') userId: string,
    @Body() dto: RequestPhoneChangeDto,
  ) {
    return this.appAuthService.requestPhoneChange(userId, dto.phone);
  }

  @Post('phone-change/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify OTP and update phone number' })
  @ApiResponse({ status: 200, description: 'Phone updated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async verifyPhoneChange(
    @CurrentAppUser('id') userId: string,
    @Body() dto: VerifyPhoneChangeDto,
  ) {
    return this.appAuthService.verifyPhoneChange(userId, dto.phone, dto.code);
  }

  // ── Email Change ──────────────────────────────────────────────────

  @Post('email-change/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify password and send code to new email' })
  @ApiResponse({ status: 200, description: 'Verification code sent to new email' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async requestEmailChange(
    @CurrentAppUser('id') userId: string,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.appAuthService.requestEmailChange(
      userId,
      dto.email,
      dto.currentPassword,
    );
  }

  @Post('email-change/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify code and update email address' })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async verifyEmailChange(
    @CurrentAppUser('id') userId: string,
    @Body() dto: VerifyEmailChangeDto,
  ) {
    return this.appAuthService.verifyEmailChange(userId, dto.email, dto.code);
  }

  // ── Account Deletion ────────────────────────────────────────────────

  @Post('delete-account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete own account (requires password)' })
  @ApiResponse({ status: 204, description: 'Account deleted permanently' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async deleteAccount(
    @CurrentAppUser('id') userId: string,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.appAuthService.deleteMyAccount(userId, dto.password);
  }

  // ── Device Migration ────────────────────────────────────────────────

  @Post('migrate-device')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Migrate anonymous device data to user account' })
  @ApiResponse({ status: 200, description: 'Device data migrated' })
  async migrateDevice(
    @CurrentAppUser('id') userId: string,
    @Body('deviceId') deviceId: string,
  ) {
    return this.appAuthService.migrateDeviceData(userId, deviceId);
  }
}
