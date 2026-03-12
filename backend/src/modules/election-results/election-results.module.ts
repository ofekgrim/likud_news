import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionResult } from './entities/election-result.entity';
import { TurnoutSnapshot } from './entities/turnout-snapshot.entity';
import { KnessetListSlot } from './entities/knesset-list-slot.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PollingStation } from '../polling-stations/entities/polling-station.entity';
import { ElectionResultsService } from './election-results.service';
import { ElectionResultsController } from './election-results.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ElectionResult,
      TurnoutSnapshot,
      KnessetListSlot,
      PrimaryElection,
      Candidate,
      PollingStation,
    ]),
    AppAuthModule,
    AuthModule,
    SseModule,
  ],
  controllers: [ElectionResultsController],
  providers: [ElectionResultsService],
  exports: [ElectionResultsService],
})
export class ElectionResultsModule {}
