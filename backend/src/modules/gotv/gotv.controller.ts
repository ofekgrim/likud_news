import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GotvService } from './gotv.service';
import { SaveVotingPlanDto } from './dto/save-voting-plan.dto';
import { RecordCheckinDto } from './dto/record-checkin.dto';
import { ClaimIVotedDto } from './dto/claim-i-voted.dto';
import { TriggerRemindersDto } from './dto/trigger-reminders.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('GOTV')
@Controller('gotv')
export class GotvController {
  constructor(private readonly gotvService: GotvService) {}

  // ─── App-user endpoints ─────────────────────────────────────

  @Post('plan')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Save voting plan (time + optional station)' })
  @ApiResponse({ status: 201, description: 'Voting plan saved' })
  saveVotingPlan(@Req() req, @Body() dto: SaveVotingPlanDto) {
    return this.gotvService.saveVotingPlan(
      req.user.id,
      dto.electionId,
      dto.plannedTime,
      dto.stationId,
    );
  }

  @Post('checkin')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Record GPS-verified check-in at polling station' })
  @ApiResponse({ status: 201, description: 'Check-in recorded' })
  @ApiResponse({
    status: 400,
    description: 'Too far from station or no station with GPS',
  })
  recordCheckin(@Req() req, @Body() dto: RecordCheckinDto) {
    return this.gotvService.recordCheckin(
      req.user.id,
      dto.electionId,
      dto.latitude,
      dto.longitude,
    );
  }

  @Post('i-voted')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Claim I Voted badge (requires prior check-in)' })
  @ApiResponse({ status: 201, description: 'Badge claimed, points awarded' })
  @ApiResponse({ status: 400, description: 'Must check in first' })
  @ApiResponse({ status: 409, description: 'Badge already claimed' })
  claimIVotedBadge(@Req() req, @Body() dto: ClaimIVotedDto) {
    return this.gotvService.claimIVotedBadge(req.user.id, dto.electionId);
  }

  @Get('status/:electionId')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get GOTV status for current user in an election' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'GOTV status' })
  getGotvStatus(
    @Req() req,
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ) {
    return this.gotvService.getGotvStatus(req.user.id, electionId);
  }

  // ─── Public endpoint ────────────────────────────────────────

  @Get('branch-turnout/:electionId')
  @ApiOperation({ summary: 'Branch turnout leaderboard (public)' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  @ApiResponse({ status: 200, description: 'Turnout per branch' })
  getBranchTurnout(
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ) {
    return this.gotvService.getBranchTurnout(electionId);
  }

  // ─── Admin endpoint ─────────────────────────────────────────

  @Post('admin/trigger-reminders')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin trigger for GOTV push reminder sequence' })
  @ApiResponse({ status: 201, description: 'Reminders sent' })
  triggerReminders(@Body() dto: TriggerRemindersDto) {
    return this.gotvService.triggerReminder(dto.electionId, dto.reminderType);
  }
}
