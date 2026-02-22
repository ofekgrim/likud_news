import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get active stories (public, for app)' })
  @ApiResponse({ status: 200, description: 'List of active, non-expired stories' })
  findAllActive() {
    return this.storiesService.findAllActive();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all stories (admin, includes inactive/expired)' })
  @ApiResponse({ status: 200, description: 'All stories' })
  findAll() {
    return this.storiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a story by ID' })
  @ApiParam({ name: 'id', description: 'Story UUID' })
  @ApiResponse({ status: 200, description: 'The story' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiResponse({ status: 201, description: 'Story created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateStoryDto) {
    return this.storiesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a story' })
  @ApiParam({ name: 'id', description: 'Story UUID' })
  @ApiResponse({ status: 200, description: 'Story updated' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a story' })
  @ApiParam({ name: 'id', description: 'Story UUID' })
  @ApiResponse({ status: 204, description: 'Story deleted' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storiesService.remove(id);
  }
}
