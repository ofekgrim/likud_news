import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoints } from './entities/user-points.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserStreak } from './entities/user-streak.entity';
import { DailyQuiz } from './entities/daily-quiz.entity';
import { DailyQuizAttempt } from './entities/daily-quiz-attempt.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { GamificationService } from './gamification.service';
import { DailyQuizService } from './daily-quiz.service';
import { GamificationController } from './gamification.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPoints,
      UserBadge,
      UserStreak,
      DailyQuiz,
      DailyQuizAttempt,
      AppUser,
    ]),
    AppAuthModule,
    AuthModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService, DailyQuizService],
  exports: [GamificationService, DailyQuizService],
})
export class GamificationModule {}
