import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyStatement } from './entities/policy-statement.entity';
import { CandidatePosition } from './entities/candidate-position.entity';
import { MemberQuizResponse } from './entities/member-quiz-response.entity';
import { QuizMatchResult } from './entities/quiz-match-result.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { CandidateMatcherService } from './candidate-matcher.service';
import { MatcherAlgorithmService } from './matcher-algorithm.service';
import { CandidateMatcherController } from './candidate-matcher.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PolicyStatement,
      CandidatePosition,
      MemberQuizResponse,
      QuizMatchResult,
      Candidate,
      PrimaryElection,
    ]),
    AppAuthModule,
    AuthModule,
  ],
  controllers: [CandidateMatcherController],
  providers: [CandidateMatcherService, MatcherAlgorithmService],
  exports: [CandidateMatcherService, MatcherAlgorithmService],
})
export class CandidateMatcherModule {}
