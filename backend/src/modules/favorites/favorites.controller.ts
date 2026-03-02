import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get favorites by device ID or user ID' })
  @ApiQuery({ name: 'deviceId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'folderId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findFavorites(
    @Query('deviceId') deviceId?: string,
    @Query('userId') userId?: string,
    @Query('folderId') folderId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    if (userId) {
      return this.favoritesService.findByUser(userId, +page, +limit, folderId);
    }
    return this.favoritesService.findByDevice(deviceId || '', +page, +limit);
  }

  @Post()
  @ApiOperation({ summary: 'Toggle favorite — adds if not exists, removes if exists' })
  toggleFavorite(@Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.toggleFavorite(createFavoriteDto);
  }

  @Delete(':articleId')
  @ApiOperation({ summary: 'Remove an article from favorites' })
  @ApiQuery({ name: 'deviceId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  removeFavorite(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query('deviceId') deviceId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.favoritesService.removeFavorite(deviceId || '', articleId, userId);
  }
}
