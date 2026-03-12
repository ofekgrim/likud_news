import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateAdPlacement } from './entities/candidate-ad-placement.entity';
import { CompanyAdvertiser } from './entities/company-advertiser.entity';
import { CompanyAd } from './entities/company-ad.entity';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateAdPlacement, CompanyAdvertiser, CompanyAd]),
    AuthModule,
  ],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
