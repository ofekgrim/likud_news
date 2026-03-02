import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Tag } from '../tags/entities/tag.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { Comment } from '../comments/entities/comment.entity';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { SseModule } from '../sse/sse.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Tag, UserFavorite, Comment]),
    SseModule,
    PushModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
