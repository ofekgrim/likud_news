import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FeedItemType } from './feed-item.dto';

/**
 * Feed display mode.
 *
 * - `latest`: Chronological / algorithm-priority sort (default for anonymous users)
 * - `personalized`: Personalized "For You" feed using user follow data to boost relevant content
 */
export enum FeedMode {
  LATEST = 'latest',
  PERSONALIZED = 'personalized',
}

/**
 * Query parameters for the unified feed endpoint.
 *
 * Supports filtering by content types, pagination, and optional user context
 * for personalization (favorites, RSVP status, poll votes, etc.).
 */
export class QueryFeedDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by content types (comma-separated)',
    example: 'article,poll,event',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsIn(Object.values(FeedItemType), { each: true })
  types?: FeedItemType[];

  @ApiPropertyOptional({
    description: 'Device ID for personalization (voted polls, RSVP status)',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'User ID for personalization (if authenticated)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Category ID filter (applies to articles)',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description:
      'Feed mode: "latest" for chronological/priority sort (default for anonymous), ' +
      '"personalized" for For You feed boosted by user follows (default for authenticated users)',
    enum: FeedMode,
    default: FeedMode.LATEST,
  })
  @IsOptional()
  @IsIn(Object.values(FeedMode))
  mode?: FeedMode;
}
