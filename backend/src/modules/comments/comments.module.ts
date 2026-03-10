import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Story } from '../stories/entities/story.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { ArticleCommentsController, CommentsController, StoryCommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Story, AppUser]), AppAuthModule],
  controllers: [ArticleCommentsController, CommentsController, StoryCommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
