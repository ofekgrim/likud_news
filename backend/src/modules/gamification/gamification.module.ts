import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPoints } from './entities/user-points.entity';
import { UserBadge } from './entities/user-badge.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPoints, UserBadge, AppUser]),
    AppAuthModule,
    AuthModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
