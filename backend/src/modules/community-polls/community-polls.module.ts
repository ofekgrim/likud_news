import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityPoll } from './entities/community-poll.entity';
import { PollVote } from './entities/poll-vote.entity';
import { CommunityPollsService } from './community-polls.service';
import { CommunityPollsController } from './community-polls.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityPoll, PollVote]),
    AppAuthModule,
    AuthModule,
    NotificationsModule,
    GamificationModule,
  ],
  controllers: [CommunityPollsController],
  providers: [CommunityPollsService],
  exports: [CommunityPollsService],
})
export class CommunityPollsModule {}
