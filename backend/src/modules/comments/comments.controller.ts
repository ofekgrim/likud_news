import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { OptionalAppAuthGuard } from '../app-auth/guards/optional-app-auth.guard';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

/**
 * Public-facing controller for article comments.
 * Handles GET/POST under /articles/:articleId/comments
 */
@ApiTags('comments')
@Controller('articles')
export class ArticleCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':articleId/comments')
  @ApiOperation({ summary: 'Get approved comments for an article' })
  @ApiParam({ name: 'articleId', description: 'Article UUID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of approved comments',
  })
  findByArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query() query: QueryCommentsDto,
  ) {
    return this.commentsService.findByArticle(articleId, query);
  }

  @Post(':articleId/comments')
  @UseGuards(OptionalAppAuthGuard)
  @ApiOperation({ summary: 'Submit a comment on an article (auth optional — guests use guestName)' })
  @ApiParam({ name: 'articleId', description: 'Article UUID' })
  @ApiResponse({ status: 201, description: 'Comment submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  submit(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.submit(articleId, createCommentDto, req.user?.id ?? null);
  }

  @Post(':articleId/comments/:commentId/like')
  @UseGuards(AppAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a comment (requires login)' })
  @ApiParam({ name: 'articleId', description: 'Article UUID' })
  @ApiParam({ name: 'commentId', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Like recorded' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  like(
    @Param('articleId', ParseUUIDPipe) _articleId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.like(commentId);
  }
}

/**
 * Admin controller for comment moderation.
 * Handles routes under /comments
 */
@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all comments for moderation' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of all comments',
  })
  findAll(@Query() query: QueryCommentsDto) {
    return this.commentsService.findAllForAdmin(query);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment approved' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.approve(id);
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin status of a comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment pin status toggled' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  pin(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.pin(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.reject(id);
  }
}

/**
 * Public-facing controller for story comments.
 * Handles GET/POST under /stories/:storyId/comments
 */
@ApiTags('comments')
@Controller('stories')
export class StoryCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':storyId/comments')
  @ApiOperation({ summary: 'Get approved comments for a story' })
  @ApiParam({ name: 'storyId', description: 'Story UUID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of approved comments',
  })
  findByStory(
    @Param('storyId', ParseUUIDPipe) storyId: string,
    @Query() query: QueryCommentsDto,
  ) {
    return this.commentsService.findByStory(storyId, query);
  }

  @Post(':storyId/comments')
  @UseGuards(OptionalAppAuthGuard)
  @ApiOperation({ summary: 'Submit a comment on a story (auth optional — guests use guestName)' })
  @ApiParam({ name: 'storyId', description: 'Story UUID' })
  @ApiResponse({ status: 201, description: 'Comment submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  submit(
    @Param('storyId', ParseUUIDPipe) storyId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.submitForStory(storyId, createCommentDto, req.user?.id ?? null);
  }

  @Post(':storyId/comments/:commentId/like')
  @UseGuards(AppAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a comment on a story (requires login)' })
  @ApiParam({ name: 'storyId', description: 'Story UUID' })
  @ApiParam({ name: 'commentId', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Like recorded' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  like(
    @Param('storyId', ParseUUIDPipe) _storyId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.like(commentId);
  }
}
