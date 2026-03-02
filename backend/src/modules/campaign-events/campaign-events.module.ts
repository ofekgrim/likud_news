import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignEvent } from './entities/campaign-event.entity';
import { EventRsvp } from './entities/event-rsvp.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { CampaignEventsService } from './campaign-events.service';
import { CampaignEventsController } from './campaign-events.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignEvent, EventRsvp, Candidate, PrimaryElection]),
    AppAuthModule,
    AuthModule,
  ],
  controllers: [CampaignEventsController],
  providers: [CampaignEventsService],
  exports: [CampaignEventsService],
})
export class CampaignEventsModule {}
