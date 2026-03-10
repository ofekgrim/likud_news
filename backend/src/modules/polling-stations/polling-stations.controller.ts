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
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PollingStationsService } from './polling-stations.service';
import { CreatePollingStationDto } from './dto/create-polling-station.dto';
import { UpdatePollingStationDto } from './dto/update-polling-station.dto';
import { CreateStationReportDto } from './dto/create-station-report.dto';
import { QueryStationsDto } from './dto/query-stations.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Polling Stations')
@Controller('polling-stations')
export class PollingStationsController {
  constructor(
    private readonly pollingStationsService: PollingStationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated polling stations with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of polling stations' })
  findAll(@Query() query: QueryStationsDto) {
    return this.pollingStationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single polling station by ID' })
  @ApiParam({ name: 'id', description: 'Polling station UUID' })
  @ApiResponse({ status: 200, description: 'The polling station' })
  @ApiResponse({ status: 404, description: 'Polling station not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pollingStationsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new polling station (admin only)' })
  @ApiResponse({ status: 201, description: 'Polling station created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreatePollingStationDto) {
    return this.pollingStationsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a polling station (admin only)' })
  @ApiParam({ name: 'id', description: 'Polling station UUID' })
  @ApiResponse({ status: 200, description: 'Polling station updated successfully' })
  @ApiResponse({ status: 404, description: 'Polling station not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePollingStationDto,
  ) {
    return this.pollingStationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a polling station (admin only)' })
  @ApiParam({ name: 'id', description: 'Polling station UUID' })
  @ApiResponse({ status: 200, description: 'Polling station soft-deleted' })
  @ApiResponse({ status: 404, description: 'Polling station not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pollingStationsService.remove(id);
  }

  @Post(':id/report')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a wait-time report for a station (app user)' })
  @ApiParam({ name: 'id', description: 'Polling station UUID' })
  @ApiResponse({ status: 201, description: 'Report submitted successfully' })
  @ApiResponse({ status: 404, description: 'Polling station not found' })
  addReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStationReportDto,
    @Req() req: any,
  ) {
    dto.stationId = id;
    return this.pollingStationsService.addReport(req.user.id, dto);
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'Get latest reports for a polling station' })
  @ApiParam({ name: 'id', description: 'Polling station UUID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of reports (default: 10)' })
  @ApiResponse({ status: 200, description: 'List of station reports' })
  getReports(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    return this.pollingStationsService.getReports(
      id,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('bulk-import')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk import polling stations (admin only)' })
  @ApiResponse({ status: 201, description: 'Stations imported successfully' })
  bulkImport(@Body() stations: CreatePollingStationDto[]) {
    return this.pollingStationsService.bulkImport(stations);
  }
}
