import { Controller, Post, Get, Body, Param, Query, Headers, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ArticleAnalyticsService } from './article-analytics.service';
import { TrackEventDto } from './dto/track-event.dto';

@ApiTags('article-analytics')
@Controller('article-analytics')
export class ArticleAnalyticsController {
  constructor(private readonly analyticsService: ArticleAnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an article analytics event' })
  track(
    @Body() dto: TrackEventDto,
    @Headers('x-device-id') headerDeviceId?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    // Prefer header deviceId, fallback to body deviceId (for backward compatibility)
    const deviceId = headerDeviceId || dto.deviceId;
    return this.analyticsService.trackEvent(dto, deviceId, userId);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get overview stats across all articles (admin)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getOverview(
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    return this.analyticsService.getOverviewStats(dateFrom, dateTo);
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top articles by event type (admin)' })
  @ApiQuery({ name: 'eventType', required: false, description: 'Default: view' })
  @ApiQuery({ name: 'period', required: false, description: 'weekly | monthly | all_time' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopArticles(
    @Query('eventType') eventType?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopArticles(
      eventType || 'view',
      period || 'all_time',
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('referrers')
  @ApiOperation({ summary: 'Get referrer breakdown (admin)' })
  @ApiQuery({ name: 'articleId', required: false })
  getReferrers(@Query('articleId') articleId?: string) {
    return this.analyticsService.getReferrerBreakdown(articleId);
  }

  @Get('article/:id')
  @ApiOperation({ summary: 'Get stats for a single article (admin)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getArticleStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    return this.analyticsService.getArticleStats(id, dateFrom, dateTo);
  }

  @Get('article/:id/trend')
  @ApiOperation({ summary: 'Get daily trend for an article (admin)' })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getArticleTrend(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('eventType') eventType?: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getDailyTrend(
      id,
      eventType || 'view',
      days ? parseInt(days, 10) : 30,
    );
  }
}
