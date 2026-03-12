import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Branch } from './entities/branch.entity';
import { BranchWeeklyScore } from './entities/branch-weekly-score.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { UserPoints } from '../gamification/entities/user-points.entity';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, BranchWeeklyScore, AppUser, UserPoints]),
    ScheduleModule.forRoot(),
    AppAuthModule,
    AuthModule,
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
