import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';

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
  @ApiOperation({ summary: 'Submit a comment on an article (pending moderation)' })
  @ApiParam({ name: 'articleId', description: 'Article UUID' })
  @ApiResponse({
    status: 201,
    description: 'Comment submitted successfully (pending moderation)',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  submit(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.submit(articleId, createCommentDto);
  }

  @Post(':articleId/comments/:commentId/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a comment' })
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
