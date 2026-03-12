import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donation } from './entities/donation.entity';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donation]),
    GamificationModule,
    AppAuthModule,
    AuthModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
