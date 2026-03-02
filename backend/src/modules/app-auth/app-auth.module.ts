import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppAuthController } from './app-auth.controller';
import { AppAuthService } from './app-auth.service';
import { OtpService } from './otp.service';
import { JwtAppStrategy } from './strategies/jwt-app.strategy';
import { AppAuthGuard } from './guards/app-auth.guard';
import { AppRolesGuard } from './guards/app-roles.guard';
import { AppUser } from '../app-users/entities/app-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OtpCode } from './entities/otp-code.entity';
import { EmailVerification } from './entities/email-verification.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
    TypeOrmModule.forFeature([AppUser, RefreshToken, OtpCode, EmailVerification]),
  ],
  controllers: [AppAuthController],
  providers: [
    AppAuthService,
    OtpService,
    JwtAppStrategy,
    AppAuthGuard,
    AppRolesGuard,
  ],
  exports: [AppAuthService, OtpService, JwtModule, AppAuthGuard, AppRolesGuard],
})
export class AppAuthModule {}
