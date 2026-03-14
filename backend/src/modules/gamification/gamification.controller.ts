import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
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
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { DailyQuizService } from './daily-quiz.service';
import { DailyMissionService } from './daily-mission.service';
import { CreateDailyQuizDto } from './dto/create-daily-quiz.dto';
import { SubmitDailyQuizDto } from './dto/submit-daily-quiz.dto';
import { AwardPointsDto } from './dto/award-points.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';
import { RecordStreakActivityDto } from './dto/record-streak-activity.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { OptionalAppAuthGuard } from '../app-auth/guards/optional-app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly dailyQuizService: DailyQuizService,
    private readonly dailyMissionService: DailyMissionService,
  ) {}

  // ─── User Profile ─────────────────────────────────────────

  @Get('me')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get full gamification profile (points, streak, badges, rank)' })
  @ApiResponse({ status: 200, description: 'User gamification profile' })
  getMyProfile(@Req() req) {
    return this.gamificationService.getMyProfile(req.user.id);
  }

  @Get('me/points')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get current user total points' })
  @ApiResponse({ status: 200, description: 'User total points' })
  getUserPoints(@Req() req) {
    return this.gamificationService.getUserPoints(req.user.id);
  }

  @Get('me/points/history')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get current user points history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated points history' })
  getUserPointsHistory(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.gamificationService.getUserPointsHistory(req.user.id, +page, +limit);
  }

  @Get('me/badges')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get current user badges with progress' })
  @ApiResponse({ status: 200, description: 'Badges with progress info' })
  getUserBadges(@Req() req) {
    return this.gamificationService.getUserBadgesWithProgress(req.user.id);
  }

  @Get('me/streak')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get full streak state (current, longest, freezeTokens, tier, milestones, atRisk)' })
  @ApiResponse({ status: 200, description: 'Full streak state' })
  getUserStreak(@Req() req) {
    return this.gamificationService.getFullStreakState(req.user.id);
  }

  @Get('me/rank')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get current user rank in leaderboard' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['weekly', 'monthly', 'all_time'],
  })
  @ApiResponse({ status: 200, description: 'User rank and total points' })
  getUserRank(
    @Req() req,
    @Query('period') period: string = 'all_time',
  ) {
    return this.gamificationService.getUserRank(req.user.id, period);
  }

  @Get('me/tier')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get current user tier info (tier, progress, features)' })
  @ApiResponse({ status: 200, description: 'User tier info with progress and feature gates' })
  getUserTier(@Req() req) {
    return this.gamificationService.getTierInfo(req.user.id);
  }

  // ─── Track Actions ────────────────────────────────────────

  @Post('track')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Track a user action (awards points)' })
  @ApiResponse({ status: 201, description: 'Points awarded' })
  trackAction(@Req() req, @Body() dto: AwardPointsDto) {
    return this.gamificationService.trackAction(
      req.user.id,
      dto.action,
      dto.metadata,
    );
  }

  // ─── Streak Activities ──────────────────────────────────────

  @Post('streak/activity')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Record a qualifying streak activity (awards XP and updates streak)' })
  @ApiResponse({ status: 201, description: 'Activity recorded, streak updated' })
  recordStreakActivity(@Req() req, @Body() dto: RecordStreakActivityDto) {
    return this.gamificationService.recordStreakActivity(req.user.id, dto.type);
  }

  @Post('streak/freeze')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Manually spend a freeze token to protect current streak' })
  @ApiResponse({ status: 201, description: 'Freeze token used successfully' })
  @ApiResponse({ status: 400, description: 'No freeze tokens available or no active streak' })
  useStreakFreeze(@Req() req) {
    return this.gamificationService.useFreeze(req.user.id);
  }

  // ─── Leaderboard ──────────────────────────────────────────

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get the leaderboard (public)' })
  @ApiResponse({ status: 200, description: 'Paginated leaderboard' })
  getLeaderboard(@Query() query: QueryLeaderboardDto) {
    return this.gamificationService.getLeaderboard(query);
  }

  // ─── Daily Missions ──────────────────────────────────────────

  @Get('missions/today')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Get today\'s daily missions with completion status' })
  @ApiResponse({ status: 200, description: 'Today\'s missions with user progress' })
  getTodayMissions(@Req() req) {
    return this.dailyMissionService.getTodayMissions(req.user.id);
  }

  @Post('missions/:missionId/complete')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Manually complete a daily mission' })
  @ApiParam({ name: 'missionId', description: 'Mission UUID' })
  @ApiResponse({ status: 201, description: 'Mission completed, points awarded' })
  @ApiResponse({ status: 400, description: 'Mission already completed or action not performed' })
  @ApiResponse({ status: 404, description: 'Mission not found or not part of today\'s missions' })
  completeMission(
    @Req() req,
    @Param('missionId', ParseUUIDPipe) missionId: string,
  ) {
    return this.dailyMissionService.completeMission(req.user.id, missionId);
  }

  // ─── Daily Quiz ───────────────────────────────────────────

  @Get('daily-quiz/today')
  @UseGuards(OptionalAppAuthGuard)
  @ApiOperation({ summary: 'Get today\'s daily quiz' })
  @ApiResponse({ status: 200, description: 'Today\'s quiz or null' })
  getTodayQuiz(@Req() req) {
    return this.dailyQuizService.getTodayQuiz(req.user?.id);
  }

  @Post('daily-quiz/submit')
  @UseGuards(AppAuthGuard)
  @ApiOperation({ summary: 'Submit daily quiz answers' })
  @ApiResponse({ status: 201, description: 'Quiz result with score and points' })
  @ApiResponse({ status: 409, description: 'Quiz already completed' })
  submitDailyQuiz(@Req() req, @Body() dto: SubmitDailyQuizDto) {
    return this.dailyQuizService.submitAttempt(req.user.id, dto);
  }

  // ─── Admin ────────────────────────────────────────────────

  @Post('admin/recalculate-scores')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Trigger engagement score recalculation for all users' })
  async recalculateScores() {
    await this.gamificationService.recalculateAllEngagementScores();
    return { message: 'Engagement scores recalculated' };
  }

  @Post('award')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually award points to a user (admin only)' })
  @ApiResponse({ status: 201, description: 'Points awarded successfully' })
  awardPoints(@Body() dto: AwardPointsDto) {
    return this.gamificationService.awardPoints(dto);
  }

  @Post('admin/daily-quiz')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a daily quiz (admin only)' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  createDailyQuiz(@Body() dto: CreateDailyQuizDto) {
    return this.dailyQuizService.createQuiz(dto);
  }

  @Put('admin/daily-quiz/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a daily quiz (admin only)' })
  @ApiParam({ name: 'id', description: 'Quiz UUID' })
  updateDailyQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDailyQuizDto,
  ) {
    return this.dailyQuizService.updateQuiz(id, dto);
  }

  @Delete('admin/daily-quiz/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a daily quiz (admin only)' })
  @ApiParam({ name: 'id', description: 'Quiz UUID' })
  deleteDailyQuiz(@Param('id', ParseUUIDPipe) id: string) {
    return this.dailyQuizService.deleteQuiz(id);
  }

  @Get('admin/daily-quiz')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List daily quizzes with stats (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listDailyQuizzes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.dailyQuizService.listQuizzes(+page, +limit);
  }
}
