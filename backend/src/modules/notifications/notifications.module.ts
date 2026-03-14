import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { NotificationReceipt } from './entities/notification-receipt.entity';
import { PushToken } from '../push/entities/push-token.entity';
import { PushModule } from '../push/push.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationAudienceService } from './notification-audience.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationAnalyticsService } from './notification-analytics.service';
import { NotificationCampaignService } from './notification-campaign.service';
import { AppUser } from '../app-users/entities/app-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationTemplate,
      NotificationLog,
      NotificationSchedule,
      NotificationReceipt,
      PushToken,
      AppUser,
    ]),
    ScheduleModule.forRoot(),
    PushModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTemplateService,
    NotificationAudienceService,
    NotificationSchedulerService,
    NotificationAnalyticsService,
    NotificationCampaignService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
