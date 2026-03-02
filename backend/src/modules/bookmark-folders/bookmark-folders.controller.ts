import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BookmarkFoldersService } from './bookmark-folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';

@ApiTags('Bookmark Folders')
@Controller('app-users/me/folders')
@UseGuards(AppAuthGuard)
@ApiBearerAuth()
export class BookmarkFoldersController {
  constructor(
    private readonly bookmarkFoldersService: BookmarkFoldersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all bookmark folders for current user' })
  findAll(@CurrentAppUser('id') userId: string) {
    return this.bookmarkFoldersService.findAllByUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bookmark folder' })
  create(
    @CurrentAppUser('id') userId: string,
    @Body() dto: CreateFolderDto,
  ) {
    return this.bookmarkFoldersService.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bookmark folder by ID' })
  findOne(
    @CurrentAppUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookmarkFoldersService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a bookmark folder' })
  update(
    @CurrentAppUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.bookmarkFoldersService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark folder' })
  remove(
    @CurrentAppUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookmarkFoldersService.remove(id, userId);
  }

  @Get(':id/favorites')
  @ApiOperation({ summary: 'Get favorites in a specific folder' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFolderFavorites(
    @CurrentAppUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarkFoldersService.getFolderFavorites(
      id,
      userId,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }
}
