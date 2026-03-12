import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { GotvEngagement } from './entities/gotv-engagement.entity';
import { PollingStation } from '../polling-stations/entities/polling-station.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { PushToken } from '../push/entities/push-token.entity';
import { VotingEligibility } from '../app-users/entities/voting-eligibility.entity';
import { UserBadge } from '../gamification/entities/user-badge.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { GotvController } from './gotv.controller';
import { GotvService } from './gotv.service';
import { GotvPushService } from './gotv-push.service';
import { GotvCronService } from './gotv-cron.service';
import { GamificationModule } from '../gamification/gamification.module';
import { PushModule } from '../push/push.module';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GotvEngagement,
      PollingStation,
      PrimaryElection,
      PushToken,
      VotingEligibility,
      UserBadge,
      AppUser,
    ]),
    ScheduleModule.forRoot(),
    GamificationModule,
    PushModule,
    AppAuthModule,
    AuthModule,
  ],
  controllers: [GotvController],
  providers: [GotvService, GotvPushService, GotvCronService],
  exports: [GotvService, GotvPushService],
})
export class GotvModule {}
