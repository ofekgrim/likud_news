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
  @ApiOperation({ summary: 'Get favorites by device ID' })
  @ApiQuery({ name: 'deviceId', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByDevice(
    @Query('deviceId') deviceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.favoritesService.findByDevice(deviceId, +page, +limit);
  }

  @Post()
  @ApiOperation({ summary: 'Add an article to favorites' })
  addFavorite(@Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.addFavorite(createFavoriteDto);
  }

  @Delete(':articleId')
  @ApiOperation({ summary: 'Remove an article from favorites' })
  @ApiQuery({ name: 'deviceId', required: true, type: String })
  removeFavorite(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query('deviceId') deviceId: string,
  ) {
    return this.favoritesService.removeFavorite(deviceId, articleId);
  }
}
