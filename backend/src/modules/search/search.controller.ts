import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search articles and members' })
  search(@Query() searchQueryDto: SearchQueryDto) {
    return this.searchService.search(
      searchQueryDto.q,
      searchQueryDto.page,
      searchQueryDto.limit,
    );
  }
}
