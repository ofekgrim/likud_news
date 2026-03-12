import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Headers,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { CandidateMatcherService } from './candidate-matcher.service';
import { SubmitResponsesDto } from './dto/submit-responses.dto';
import {
  CreatePolicyStatementDto,
  UpdatePolicyStatementDto,
} from './dto/create-policy-statement.dto';
import { BulkUpsertPositionsDto } from './dto/bulk-upsert-positions.dto';
import { OptionalAppAuthGuard } from '../app-auth/guards/optional-app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PolicyCategory } from './entities/policy-statement.entity';

@ApiTags('Candidate Matcher')
@Controller('primaries/matcher')
export class CandidateMatcherController {
  constructor(
    private readonly candidateMatcherService: CandidateMatcherService,
  ) {}

  // ─── Public Endpoints ─────────────────────────────────────
  // Static routes MUST come before dynamic :param routes

  // ─── Admin Endpoints (static routes first) ────────────────

  @Post('admin/statements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a policy statement (admin only)' })
  @ApiResponse({ status: 201, description: 'Statement created' })
  createStatement(@Body() dto: CreatePolicyStatementDto) {
    return this.candidateMatcherService.createStatement(dto);
  }

  @Patch('admin/statements/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a policy statement (admin only)' })
  @ApiParam({ name: 'id', description: 'Statement UUID' })
  @ApiResponse({ status: 200, description: 'Statement updated' })
  updateStatement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyStatementDto,
  ) {
    return this.candidateMatcherService.updateStatement(id, dto);
  }

  @Post('admin/positions/bulk')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk upsert candidate positions (admin only)' })
  @ApiResponse({ status: 201, description: 'Positions upserted' })
  bulkUpsertPositions(@Body() dto: BulkUpsertPositionsDto) {
    return this.candidateMatcherService.bulkUpsertPositions(dto);
  }

  // ─── Response Submission ──────────────────────────────────

  @Post('responses')
  @UseGuards(OptionalAppAuthGuard)
  @ApiOperation({
    summary:
      'Submit quiz responses (authenticated or anonymous via device_id header)',
  })
  @ApiHeader({
    name: 'x-device-id',
    required: false,
    description: 'Device ID for anonymous users',
  })
  @ApiResponse({ status: 201, description: 'Responses saved' })
  submitResponses(
    @Body() dto: SubmitResponsesDto,
    @Req() req,
    @Headers('x-device-id') deviceId?: string,
  ) {
    const appUserId = req.user?.id || null;
    return this.candidateMatcherService.submitResponses(
      dto,
      appUserId,
      deviceId,
    );
  }

  // ─── Public: Statements by Election ───────────────────────

  @Get('statements/:electionId')
  @ApiOperation({
    summary: 'Get policy statements for an election (public)',
  })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: PolicyCategory,
    description: 'Filter by policy category',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated policy statements' })
  getStatements(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Query('category') category?: PolicyCategory,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.candidateMatcherService.getStatements(electionId, {
      category,
      page: +page,
      limit: +limit,
    });
  }

  // ─── Public: Compute Match ────────────────────────────────

  @Get('match/:electionId')
  @UseGuards(OptionalAppAuthGuard)
  @ApiOperation({
    summary:
      'Compute candidate matches for the user (authenticated or anonymous)',
  })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiHeader({
    name: 'x-device-id',
    required: false,
    description: 'Device ID for anonymous users',
  })
  @ApiResponse({ status: 200, description: 'Match results with rankings' })
  computeMatches(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Req() req,
    @Headers('x-device-id') deviceId?: string,
  ) {
    const appUserId = req.user?.id || null;
    return this.candidateMatcherService.computeMatches(
      electionId,
      appUserId,
      deviceId,
    );
  }

  // ─── Public: Candidate Positions ──────────────────────────

  @Get('candidates/:candidateId/positions')
  @ApiOperation({
    summary: 'Get all positions for a candidate (public)',
  })
  @ApiParam({ name: 'candidateId', description: 'Candidate UUID' })
  @ApiResponse({ status: 200, description: 'Candidate positions' })
  getCandidatePositions(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.candidateMatcherService.getCandidatePositions(candidateId);
  }
}
