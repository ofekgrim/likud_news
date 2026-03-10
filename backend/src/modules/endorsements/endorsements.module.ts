import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateEndorsement } from './entities/candidate-endorsement.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { EndorsementsService } from './endorsements.service';
import { EndorsementsController } from './endorsements.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateEndorsement, Candidate]),
    AppAuthModule,
    SseModule,
  ],
  controllers: [EndorsementsController],
  providers: [EndorsementsService],
  exports: [EndorsementsService],
})
export class EndorsementsModule {}
