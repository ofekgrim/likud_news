import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationAnalyticsService } from './notification-analytics.service';
import { SendAdvancedNotificationDto } from './dto/send-notification.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { CreateNotificationScheduleDto } from './dto/create-notification-schedule.dto';
import { UpdateNotificationScheduleDto } from './dto/update-notification-schedule.dto';
import { QueryNotificationLogsDto } from './dto/query-notification-logs.dto';
import { AudienceRulesDto } from './dto/audience-rules.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly templateService: NotificationTemplateService,
    private readonly schedulerService: NotificationSchedulerService,
    private readonly analyticsService: NotificationAnalyticsService,
  ) {}

  // ── Send ─────────────────────────────────────────────────────────────

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async send(@Body() dto: SendAdvancedNotificationDto, @Req() req: any) {
    return this.notificationsService.send(dto, req.user.id);
  }

  @Post('send/preview-audience')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async previewAudience(@Body() audience: AudienceRulesDto) {
    const count = await this.notificationsService.previewAudienceCount(audience);
    return { count };
  }

  // ── Templates ────────────────────────────────────────────────────────

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listTemplates() {
    return this.templateService.findAll();
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createTemplate(
    @Body() dto: CreateNotificationTemplateDto,
    @Req() req: any,
  ) {
    return this.templateService.create(dto, req.user.id);
  }

  @Put('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.templateService.update(id, dto);
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteTemplate(@Param('id') id: string) {
    await this.templateService.remove(id);
    return { deleted: true };
  }

  // ── Schedules ────────────────────────────────────────────────────────

  @Get('schedules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listSchedules() {
    return this.schedulerService.findAll();
  }

  @Post('schedules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createSchedule(
    @Body() dto: CreateNotificationScheduleDto,
    @Req() req: any,
  ) {
    return this.schedulerService.create(dto as any, req.user.id);
  }

  @Put('schedules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationScheduleDto,
  ) {
    return this.schedulerService.update(id, dto as any);
  }

  @Patch('schedules/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleSchedule(@Param('id') id: string) {
    return this.schedulerService.toggleActive(id);
  }

  @Delete('schedules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteSchedule(@Param('id') id: string) {
    await this.schedulerService.remove(id);
    return { deleted: true };
  }

  // ── Logs ─────────────────────────────────────────────────────────────

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async listLogs(@Query() query: QueryNotificationLogsDto) {
    return this.notificationsService.findLogs(query);
  }

  @Get('logs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getLogDetail(@Param('id') id: string) {
    return this.notificationsService.findLogDetail(id);
  }

  @Patch('logs/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancelLog(@Param('id') id: string) {
    return this.notificationsService.cancelNotification(id);
  }

  // ── Analytics ────────────────────────────────────────────────────────

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAnalytics(@Query('days') days?: string) {
    return this.analyticsService.getAnalytics(days ? parseInt(days, 10) : 30);
  }

  // ── Public endpoints ─────────────────────────────────────────────────

  @Post('track-open')
  async trackOpen(
    @Body() body: { logId: string; deviceId: string },
  ) {
    await this.notificationsService.trackOpen(body.logId, body.deviceId);
    return { tracked: true };
  }

  @Post('inbox/read-all')
  async markAllRead(@Body() body: { deviceId: string }) {
    return this.notificationsService.markAllRead(body.deviceId);
  }

  @Get('inbox/unread-count')
  async getUnreadCount(@Query('deviceId') deviceId: string) {
    return this.notificationsService.getUnreadCount(deviceId);
  }

  @Delete('inbox/:logId')
  async dismissInboxItem(
    @Param('logId') logId: string,
    @Query('deviceId') deviceId: string,
  ) {
    return this.notificationsService.dismissInboxItem(deviceId, logId);
  }

  @Get('inbox')
  async getInbox(
    @Query('deviceId') deviceId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getInbox(
      deviceId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
