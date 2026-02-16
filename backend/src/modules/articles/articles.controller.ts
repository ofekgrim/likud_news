import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiQuery,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated article feed with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of articles' })
  findAll(@Query() query: QueryArticlesDto) {
    return this.articlesService.findAll(query);
  }

  @Get('hero')
  @ApiOperation({ summary: 'Get the current hero article' })
  @ApiResponse({ status: 200, description: 'The current hero article, or null' })
  findHero() {
    return this.articlesService.findHero();
  }

  @Get('breaking')
  @ApiOperation({ summary: 'Get breaking news articles' })
  @ApiResponse({ status: 200, description: 'List of breaking news articles' })
  findBreaking() {
    return this.articlesService.findBreaking();
  }

  @Get('most-read')
  @ApiOperation({ summary: 'Get the most-read articles' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of articles to return (default: 10)',
  })
  @ApiResponse({ status: 200, description: 'List of most viewed articles' })
  findMostRead(@Query('limit') limit?: number) {
    return this.articlesService.findMostRead(limit ? Number(limit) : 10);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single article by slug (increments view count)' })
  @ApiParam({ name: 'slug', description: 'Article URL slug' })
  @ApiResponse({ status: 200, description: 'The article' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an article' })
  @ApiParam({ name: 'id', description: 'Article UUID' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an article' })
  @ApiParam({ name: 'id', description: 'Article UUID' })
  @ApiResponse({ status: 204, description: 'Article soft-deleted successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.remove(id);
  }
}
