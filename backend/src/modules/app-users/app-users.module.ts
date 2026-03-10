import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUsersController } from './app-users.controller';
import { AppUsersService } from './app-users.service';
import { AppUser } from './entities/app-user.entity';
import { VotingEligibility } from './entities/voting-eligibility.entity';
import { AuthModule } from '../auth/auth.module';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppUser, VotingEligibility]),
    AuthModule,
    AppAuthModule,
  ],
  controllers: [AppUsersController],
  providers: [AppUsersService],
  exports: [AppUsersService],
})
export class AppUsersModule {}
