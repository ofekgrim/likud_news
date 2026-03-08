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
import { CreateDailyQuizDto } from './dto/create-daily-quiz.dto';
import { SubmitDailyQuizDto } from './dto/submit-daily-quiz.dto';
import { AwardPointsDto } from './dto/award-points.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';
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
  @ApiOperation({ summary: 'Get current user streak' })
  @ApiResponse({ status: 200, description: 'User streak data' })
  getUserStreak(@Req() req) {
    return this.gamificationService.getStreak(req.user.id);
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

  // ─── Leaderboard ──────────────────────────────────────────

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get the leaderboard (public)' })
  @ApiResponse({ status: 200, description: 'Paginated leaderboard' })
  getLeaderboard(@Query() query: QueryLeaderboardDto) {
    return this.gamificationService.getLeaderboard(query);
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
