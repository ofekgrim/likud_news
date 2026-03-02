import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { AnalyticsEventType } from '../entities/article-analytics.entity';

export class TrackEventDto {
  @ApiProperty({ description: 'Article UUID' })
  @IsUUID()
  articleId: string;

  @ApiProperty({ description: 'Event type', enum: AnalyticsEventType })
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @ApiPropertyOptional({ description: 'Device ID for anonymous users' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Platform for share events' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description:
      'Referrer source (home_feed, category, search, push, deeplink)',
  })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional({ description: 'Time spent reading in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  readTimeSeconds?: number;

  @ApiPropertyOptional({ description: 'Scroll depth percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scrollDepthPercent?: number;
}
