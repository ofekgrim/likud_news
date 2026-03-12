import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserPoints } from './entities/user-points.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserStreak } from './entities/user-streak.entity';
import { StreakMilestone } from './entities/streak-milestone.entity';
import { DailyQuiz } from './entities/daily-quiz.entity';
import { DailyQuizAttempt } from './entities/daily-quiz-attempt.entity';
import { DailyMission } from './entities/daily-mission.entity';
import { UserDailyMission } from './entities/user-daily-mission.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { GamificationService } from './gamification.service';
import { DailyQuizService } from './daily-quiz.service';
import { DailyMissionService } from './daily-mission.service';
import { GamificationController } from './gamification.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPoints,
      UserBadge,
      UserStreak,
      StreakMilestone,
      DailyQuiz,
      DailyQuizAttempt,
      DailyMission,
      UserDailyMission,
      AppUser,
    ]),
    ScheduleModule.forRoot(),
    AppAuthModule,
    AuthModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService, DailyQuizService, DailyMissionService],
  exports: [GamificationService, DailyQuizService, DailyMissionService],
})
export class GamificationModule {}
