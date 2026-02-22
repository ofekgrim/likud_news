import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Story } from '../stories/entities/story.entity';
import { ArticleCommentsController, CommentsController, StoryCommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Story])],
  controllers: [ArticleCommentsController, CommentsController, StoryCommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
