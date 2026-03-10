import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleAnalytics } from './entities/article-analytics.entity';
import { Article } from '../articles/entities/article.entity';
import { ArticleAnalyticsService } from './article-analytics.service';
import { ArticleAnalyticsController } from './article-analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleAnalytics, Article])],
  controllers: [ArticleAnalyticsController],
  providers: [ArticleAnalyticsService],
  exports: [ArticleAnalyticsService],
})
export class ArticleAnalyticsModule {}
