import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EndorsementsService } from './endorsements.service';
import { EndorseCandidateDto } from './dto/endorse-candidate.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { AppRolesGuard } from '../app-auth/guards/app-roles.guard';
import { AppRoles } from '../app-auth/decorators/app-roles.decorator';
import { AppUserRole } from '../app-users/entities/app-user.entity';

@ApiTags('Endorsements')
@Controller('endorsements')
export class EndorsementsController {
  constructor(private readonly endorsementsService: EndorsementsService) {}

  // ── Admin / listing routes ──────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all endorsements (admin, with optional filters)' })
  @ApiQuery({ name: 'electionId', required: false, type: String })
  @ApiQuery({ name: 'candidateId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'All endorsements' })
  findAll(
    @Query('electionId') electionId?: string,
    @Query('candidateId') candidateId?: string,
  ) {
    return this.endorsementsService.findAll(electionId, candidateId);
  }

  // ── Static routes ─────────────────────────────────────────────────

  @Post()
  @UseGuards(AppAuthGuard, AppRolesGuard)
  @AppRoles(AppUserRole.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endorse a candidate (requires MEMBER role)' })
  @ApiResponse({ status: 201, description: 'Endorsement created' })
  @ApiResponse({ status: 403, description: 'Requires MEMBER role' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  endorse(@Req() req, @Body() dto: EndorseCandidateDto) {
    return this.endorsementsService.endorse(req.user.id, dto);
  }

  @Get('me/election/:electionId')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's endorsement for an election" })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: "User's endorsement or null" })
  getUserEndorsement(
    @Req() req,
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ) {
    return this.endorsementsService.getUserEndorsement(req.user.id, electionId);
  }

  // ── Dynamic routes ───────────────────────────────────────────────────

  @Get('candidate/:candidateId')
  @ApiOperation({ summary: 'Get endorsements for a candidate (paginated)' })
  @ApiParam({ name: 'candidateId', description: 'Candidate UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated endorsements' })
  getEndorsementsByCandidate(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.endorsementsService.getEndorsementsByCandidate(
      candidateId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('election/:electionId')
  @ApiOperation({ summary: 'Get endorsement counts per candidate for an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Endorsement counts by candidate' })
  getEndorsementsByElection(
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ) {
    return this.endorsementsService.getEndorsementsByElection(electionId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an endorsement by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Endorsement UUID' })
  @ApiResponse({ status: 200, description: 'Endorsement deleted' })
  @ApiResponse({ status: 404, description: 'Endorsement not found' })
  async deleteById(@Param('id', ParseUUIDPipe) id: string) {
    await this.endorsementsService.deleteById(id);
    return { success: true };
  }

  @Delete('election/:electionId')
  @UseGuards(AppAuthGuard, AppRolesGuard)
  @AppRoles(AppUserRole.MEMBER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove endorsement for an election (requires MEMBER role)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 204, description: 'Endorsement removed' })
  @ApiResponse({ status: 404, description: 'Endorsement not found' })
  removeEndorsement(
    @Req() req,
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ) {
    return this.endorsementsService.removeEndorsement(req.user.id, electionId);
  }
}
