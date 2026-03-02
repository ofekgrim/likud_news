import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpCode, OtpPurpose } from './entities/otp-code.entity';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 3;

  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
  ) {}

  async generateOtp(
    identifier: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<string> {
    // Invalidate existing unused OTPs for this identifier+purpose
    await this.otpRepository.update(
      { identifier, purpose, isUsed: false },
      { isUsed: true },
    );

    const code = this.generateRandomCode();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + OtpService.OTP_EXPIRY_MINUTES,
    );

    const otp = this.otpRepository.create({
      identifier,
      codeHash,
      purpose,
      expiresAt,
    });

    await this.otpRepository.save(otp);

    // In production, send SMS via Twilio/MessageBird or email via SES.
    // For development, log the code.
    this.logger.log(`OTP for ${identifier}: ${code} (dev mode)`);

    return code;
  }

  async verifyOtp(
    identifier: string,
    code: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        identifier,
        purpose,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      return false;
    }

    if (otp.attempts >= OtpService.MAX_ATTEMPTS) {
      otp.isUsed = true;
      await this.otpRepository.save(otp);
      return false;
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);

    if (isValid) {
      otp.isUsed = true;
      await this.otpRepository.save(otp);
      return true;
    }

    otp.attempts += 1;
    await this.otpRepository.save(otp);
    return false;
  }

  private generateRandomCode(): string {
    const min = Math.pow(10, OtpService.OTP_LENGTH - 1);
    const max = Math.pow(10, OtpService.OTP_LENGTH) - 1;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code.toString();
  }
}
