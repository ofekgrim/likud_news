import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
} from '@nestjs/swagger';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { QueryElectionsDto } from './dto/query-elections.dto';
import { ElectionStatus } from './entities/primary-election.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ElectionResultsService } from '../election-results/election-results.service';

@ApiTags('Elections')
@Controller('elections')
export class ElectionsController {
  constructor(
    private readonly electionsService: ElectionsService,
    private readonly electionResultsService: ElectionResultsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated elections with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of elections' })
  findAll(@Query() query: QueryElectionsDto) {
    return this.electionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single election by ID' })
  @ApiParam({ name: 'id', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'The election' })
  @ApiResponse({ status: 404, description: 'Election not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.electionsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new election (admin only)' })
  @ApiResponse({ status: 201, description: 'Election created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateElectionDto) {
    return this.electionsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an election (admin only)' })
  @ApiParam({ name: 'id', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Election updated successfully' })
  @ApiResponse({ status: 404, description: 'Election not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateElectionDto,
  ) {
    return this.electionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft-delete an election (admin only)' })
  @ApiParam({ name: 'id', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Election soft-deleted' })
  @ApiResponse({ status: 404, description: 'Election not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.electionsService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update election status (admin only)' })
  @ApiParam({ name: 'id', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Election status updated' })
  @ApiResponse({ status: 404, description: 'Election not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ElectionStatus,
  ) {
    return this.electionsService.updateStatus(id, status);
  }

  @Get(':id/turnout')
  @ApiOperation({ summary: 'Get latest turnout snapshots for an election' })
  @ApiParam({ name: 'id', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Turnout snapshots' })
  getTurnout(@Param('id', ParseUUIDPipe) electionId: string) {
    return this.electionResultsService.getTurnout(electionId);
  }
}
