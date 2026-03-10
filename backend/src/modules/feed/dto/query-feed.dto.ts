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
}
