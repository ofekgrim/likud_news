import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { QueryFeedDto, FeedMode } from './dto/query-feed.dto';
import { FeedItemDto } from './dto/feed-item.dto';

/**
 * Feed controller - provides unified mixed-content feed endpoint.
 *
 * Merges articles, community polls, campaign events, election updates,
 * and quiz prompts into a single algorithmically-sorted feed.
 */
@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * Get unified mixed-content feed.
   *
   * Returns a paginated feed with articles, polls, events, election updates,
   * and quiz prompts sorted by priority algorithm and interleaved for diversity.
   *
   * Supports two modes:
   * - `latest`: Standard algorithm-priority sort (default for anonymous users)
   * - `personalized`: "For You" feed boosted by user follows (default for authenticated users)
   *
   * @example
   * GET /api/v1/feed?page=1&limit=20
   * GET /api/v1/feed?types=article,poll&categoryId=xyz
   * GET /api/v1/feed?deviceId=abc123&userId=user123
   * GET /api/v1/feed?userId=user123&mode=personalized
   */
  @Get()
  @ApiOperation({
    summary: 'Get unified feed',
    description:
      'Returns mixed-content feed with articles, polls, events, elections, and quizzes. ' +
      'Content is algorithmically sorted and interleaved for optimal diversity. ' +
      'Supports filtering by content types, category, and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Feed retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/FeedItemDto' },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 156 },
            totalPages: { type: 'number', example: 8 },
            articlesCount: { type: 'number', example: 50 },
            pollsCount: { type: 'number', example: 10 },
            eventsCount: { type: 'number', example: 10 },
            electionsCount: { type: 'number', example: 3 },
            quizzesCount: { type: 'number', example: 3 },
            mode: { type: 'string', enum: ['latest', 'personalized'], example: 'latest' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 50)',
    example: 20,
  })
  @ApiQuery({
    name: 'types',
    required: false,
    type: String,
    description: 'Comma-separated list of content types to include',
    example: 'article,poll,event',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter articles by category ID',
  })
  @ApiQuery({
    name: 'deviceId',
    required: false,
    type: String,
    description: 'Device ID for personalization (poll votes, RSVP status)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'User ID for personalization (authenticated users)',
  })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: FeedMode,
    description:
      'Feed mode: "latest" for chronological sort (default for anonymous), ' +
      '"personalized" for For You feed (default for authenticated users)',
  })
  async getFeed(
    @Query() query: QueryFeedDto,
  ): Promise<{
    data: FeedItemDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      articlesCount: number;
      pollsCount: number;
      eventsCount: number;
      electionsCount: number;
      quizzesCount: number;
      mode: FeedMode;
    };
  }> {
    return this.feedService.getFeed(query);
  }
}
