import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { ElectionsQuizController } from './elections-quiz.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizQuestion, QuizResponse, Candidate, PrimaryElection]),
    AppAuthModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [QuizController, ElectionsQuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
