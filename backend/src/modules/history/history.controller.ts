import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get reading history by device ID' })
  @ApiQuery({ name: 'deviceId', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByDevice(
    @Query('deviceId') deviceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.historyService.findByDevice(deviceId, +page, +limit);
  }

  @Post()
  @ApiOperation({ summary: 'Record an article read event' })
  recordRead(@Body() createHistoryDto: CreateHistoryDto) {
    return this.historyService.recordRead(createHistoryDto);
  }
}
