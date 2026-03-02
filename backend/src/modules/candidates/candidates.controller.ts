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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { QueryCandidatesDto } from './dto/query-candidates.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated candidates with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of candidates' })
  findAll(@Query() query: QueryCandidatesDto) {
    return this.candidatesService.findAll(query);
  }

  @Get('election/:electionId')
  @ApiOperation({ summary: 'Get all active candidates for an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'List of candidates for the election' })
  findByElection(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.candidatesService.findByElection(electionId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a candidate by slug' })
  @ApiParam({ name: 'slug', description: 'Candidate URL slug' })
  @ApiResponse({ status: 200, description: 'The candidate' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.candidatesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single candidate by ID' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiResponse({ status: 200, description: 'The candidate' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.candidatesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new candidate (admin only)' })
  @ApiResponse({ status: 201, description: 'Candidate created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateCandidateDto) {
    return this.candidatesService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a candidate (admin only)' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiResponse({ status: 200, description: 'Candidate updated successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a candidate (admin only)' })
  @ApiParam({ name: 'id', description: 'Candidate UUID' })
  @ApiResponse({ status: 200, description: 'Candidate soft-deleted' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.candidatesService.remove(id);
  }
}
