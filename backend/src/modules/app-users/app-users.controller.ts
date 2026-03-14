import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AppUsersService } from './app-users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { VerifyMembershipDto } from './dto/verify-membership.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AppAuthGuard } from '../app-auth/guards/app-auth.guard';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AppUserRole, MembershipStatus } from './entities/app-user.entity';

@ApiTags('App Users')
@Controller('app-users')
export class AppUsersController {
  constructor(private readonly appUsersService: AppUsersService) {}

  // ── Mobile Endpoints (App JWT) ──────────────────────────────────────

  @Get('me')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentAppUser('id') userId: string) {
    return this.appUsersService.getProfile(userId);
  }

  @Get('me/referral-code')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get or generate referral code for current user' })
  async getReferralCode(@CurrentAppUser('id') userId: string) {
    return this.appUsersService.getOrCreateReferralCode(userId);
  }

  @Post('me/claim-referral')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Claim a referral code (call once after registration)' })
  @ApiResponse({ status: 204, description: 'Referral claimed or silently ignored' })
  async claimReferral(
    @CurrentAppUser('id') userId: string,
    @Body() body: { code: string },
  ) {
    await this.appUsersService.claimReferralCode(userId, body.code);
  }

  @Put('me')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentAppUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.appUsersService.updateProfile(userId, dto);
  }

  @Post('me/avatar')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user avatar URL' })
  async updateAvatar(
    @CurrentAppUser('id') userId: string,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.appUsersService.updateAvatar(userId, dto.avatarUrl);
  }

  @Post('me/change-password')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentAppUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.appUsersService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Get('me/notification-preferences')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences returned' })
  async getNotificationPreferences(@CurrentAppUser('id') userId: string) {
    return this.appUsersService.getNotificationPreferences(userId);
  }

  @Patch('me/notification-preferences')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated' })
  async updateNotificationPreferences(
    @CurrentAppUser('id') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.appUsersService.updateNotificationPreferences(userId, dto);
  }

  @Post('me/verify-membership')
  @UseGuards(AppAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request membership verification' })
  async requestVerification(
    @CurrentAppUser('id') userId: string,
    @Body() dto: VerifyMembershipDto,
  ) {
    return this.appUsersService.requestMembershipVerification(userId, dto);
  }

  // ── Admin Endpoints (CMS JWT) ───────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all app users (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: AppUserRole })
  @ApiQuery({
    name: 'membershipStatus',
    required: false,
    enum: MembershipStatus,
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: AppUserRole,
    @Query('membershipStatus') membershipStatus?: MembershipStatus,
  ) {
    return this.appUsersService.findAll(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      search,
      role,
      membershipStatus,
    );
  }

  @Post('bulk-voting-eligibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk approve voting for multiple users' })
  bulkApproveVoting(
    @Body() body: { userIds: string[]; electionId: string; approvedBy?: string },
  ) {
    return this.appUsersService.bulkApproveVoting(body.userIds, body.electionId, body.approvedBy);
  }

  @Get('analytics/active-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get DAU/WAU/MAU metrics (admin)' })
  async getActiveUsers() {
    return this.appUsersService.getActiveUsers();
  }

  @Get('analytics/growth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get daily user registration trend (admin)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Default: 30' })
  async getGrowthTrend(@Query('days') days?: string) {
    return this.appUsersService.getUserGrowthTrend(days ? parseInt(days, 10) : 30);
  }

  @Get('analytics/segments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user segmentation by role and membership (admin)' })
  async getSegments() {
    return this.appUsersService.getUserSegments();
  }

  @Get('analytics/retention')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly retention cohorts (admin)' })
  @ApiQuery({ name: 'weeks', required: false, type: Number, description: 'Default: 8' })
  async getRetention(@Query('weeks') weeks?: string) {
    return this.appUsersService.getRetentionCohorts(weeks ? parseInt(weeks, 10) : 8);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get app user by ID (admin)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appUsersService.getProfile(id);
  }

  @Post(':id/approve-membership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve membership verification (admin)' })
  async approveMembership(@Param('id', ParseUUIDPipe) id: string) {
    return this.appUsersService.approveMembership(id);
  }

  @Post(':id/reject-membership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject membership verification (admin)' })
  async rejectMembership(@Param('id', ParseUUIDPipe) id: string) {
    return this.appUsersService.rejectMembership(id);
  }

  @Get(':id/voting-eligibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get voting eligibility for a user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  getVotingEligibility(@Param('id', ParseUUIDPipe) id: string) {
    return this.appUsersService.getVotingEligibility(id);
  }

  @Post(':id/voting-eligibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve voting for a specific election' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  approveVoting(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { electionId: string; approvedBy?: string },
  ) {
    return this.appUsersService.approveVotingForElection(id, body.electionId, body.approvedBy);
  }

  @Delete(':id/voting-eligibility/:electionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke voting for a specific election' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'electionId', description: 'Election UUID' })
  revokeVoting(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ) {
    return this.appUsersService.revokeVotingForElection(id, electionId);
  }

  @Post(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban/unban app user (admin)' })
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.appUsersService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete app user (super admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.appUsersService.deleteUser(id);
  }
}
