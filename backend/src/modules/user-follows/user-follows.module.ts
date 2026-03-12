import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFollowsController } from './user-follows.controller';
import { UserFollowsService } from './user-follows.service';
import { UserFollow } from './entities/user-follow.entity';
import { UserContentFollow } from './entities/user-content-follow.entity';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFollow, UserContentFollow]),
    AppAuthModule,
  ],
  controllers: [UserFollowsController],
  providers: [UserFollowsService],
  exports: [UserFollowsService],
})
export class UserFollowsModule {}
