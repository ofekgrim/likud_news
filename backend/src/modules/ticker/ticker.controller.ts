import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TickerService } from './ticker.service';
import { CreateTickerItemDto } from './dto/create-ticker-item.dto';
import { UpdateTickerItemDto } from './dto/update-ticker-item.dto';

@ApiTags('Ticker')
@Controller('ticker')
export class TickerController {
  constructor(private readonly tickerService: TickerService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all active ticker items (non-expired, ordered by position)',
  })
  findActive() {
    return this.tickerService.findActive();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticker item' })
  create(@Body() createTickerItemDto: CreateTickerItemDto) {
    return this.tickerService.create(createTickerItemDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a ticker item' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTickerItemDto: UpdateTickerItemDto,
  ) {
    return this.tickerService.update(id, updateTickerItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticker item' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tickerService.remove(id);
  }
}
