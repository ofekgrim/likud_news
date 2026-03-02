import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

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
  @ApiOperation({ summary: 'Get current user badges' })
  @ApiResponse({ status: 200, description: 'List of user badges' })
  getUserBadges(@Req() req) {
    return this.gamificationService.getUserBadges(req.user.id);
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

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get the leaderboard (public)' })
  @ApiResponse({ status: 200, description: 'Paginated leaderboard' })
  getLeaderboard(@Query() query: QueryLeaderboardDto) {
    return this.gamificationService.getLeaderboard(query);
  }

  @Post('award')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually award points to a user (admin only)' })
  @ApiResponse({ status: 201, description: 'Points awarded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  awardPoints(@Body() dto: AwardPointsDto) {
    return this.gamificationService.awardPoints(dto);
  }
}
