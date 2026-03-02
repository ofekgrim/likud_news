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
  UseGuards,
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
import { ElectionResultsService } from './election-results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { PublishResultsDto } from './dto/publish-results.dto';
import { CreateTurnoutDto } from './dto/create-turnout.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Election Results')
@Controller('election-results')
export class ElectionResultsController {
  constructor(
    private readonly electionResultsService: ElectionResultsService,
  ) {}

  @Get('election/:electionId')
  @ApiOperation({ summary: 'Get all results for an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Election results sorted by vote count' })
  getResults(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.electionResultsService.getResults(electionId);
  }

  @Get('election/:electionId/station/:stationId')
  @ApiOperation({ summary: 'Get results for a specific station in an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiParam({ name: 'stationId', description: 'Polling station UUID' })
  @ApiResponse({ status: 200, description: 'Station-level election results' })
  getResultsByStation(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Param('stationId', ParseUUIDPipe) stationId: string,
  ) {
    return this.electionResultsService.getResultsByStation(
      electionId,
      stationId,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add or update an election result (admin only)' })
  @ApiResponse({ status: 201, description: 'Result added/updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  addResult(@Body() dto: CreateResultDto) {
    return this.electionResultsService.addResult(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a single election result (admin only)' })
  @ApiParam({ name: 'id', description: 'Election result UUID' })
  @ApiResponse({ status: 200, description: 'Result updated successfully' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  updateResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateResultDto>,
  ) {
    return this.electionResultsService.updateResult(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a single election result (admin only)' })
  @ApiParam({ name: 'id', description: 'Election result UUID' })
  @ApiResponse({ status: 200, description: 'Result deleted successfully' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  deleteResult(@Param('id', ParseUUIDPipe) id: string) {
    return this.electionResultsService.deleteResult(id);
  }

  @Post('publish')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish election results and emit SSE event (admin only)' })
  @ApiResponse({ status: 201, description: 'Results published successfully' })
  publishResults(@Body() dto: PublishResultsDto) {
    return this.electionResultsService.publishResults(
      dto.electionId,
      dto.isOfficial ?? false,
    );
  }

  @Post('bulk-import')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk import election results (admin only)' })
  @ApiResponse({ status: 201, description: 'Results imported successfully' })
  bulkImportResults(@Body() results: CreateResultDto[]) {
    return this.electionResultsService.bulkImportResults(results);
  }

  @Get('turnout/:electionId')
  @ApiOperation({ summary: 'Get latest turnout snapshots for an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Turnout snapshots grouped by district' })
  getTurnout(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.electionResultsService.getTurnout(electionId);
  }

  @Post('turnout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a turnout snapshot and emit SSE event (admin only)' })
  @ApiResponse({ status: 201, description: 'Turnout snapshot added successfully' })
  addTurnoutSnapshot(@Body() dto: CreateTurnoutDto) {
    return this.electionResultsService.addTurnoutSnapshot(dto);
  }

  @Get('turnout/:electionId/timeline')
  @ApiOperation({ summary: 'Get turnout time-series data for an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiQuery({ name: 'district', required: false, type: String, description: 'Filter by district' })
  @ApiResponse({ status: 200, description: 'Turnout timeline data' })
  getTurnoutTimeline(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Query('district') district?: string,
  ) {
    return this.electionResultsService.getTurnoutTimeline(
      electionId,
      district,
    );
  }
}
