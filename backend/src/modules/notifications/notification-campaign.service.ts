import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../app-users/entities/app-user.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationCampaignService {
  private readonly logger = new Logger(NotificationCampaignService.name);

  constructor(
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Daily at 10 AM Israel time — re-engage users inactive for 7+ days.
   * Only targets users with role != 'guest' and isActive = true.
   */
  @Cron('0 10 * * *', { timeZone: 'Asia/Jerusalem' })
  async sendInactiveUserReminders(): Promise<void> {
    this.logger.log('Running inactive user re-engagement campaign...');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get users inactive 7-30 days (don't bother with 30+ day inactive)
    const inactiveUsers = await this.appUserRepository
      .createQueryBuilder('u')
      .select('u.id')
      .where('u.lastLoginAt < :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('u.lastLoginAt > :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('u.isActive = true')
      .andWhere("u.role != 'guest'")
      .getMany();

    if (inactiveUsers.length === 0) {
      this.logger.log('No inactive users found for re-engagement');
      return;
    }

    const userIds = inactiveUsers.map((u) => u.id);
    this.logger.log(`Sending re-engagement to ${userIds.length} inactive users`);

    try {
      await this.notificationsService.send({
        title: 'חסר לנו! 🦁',
        body: 'יש חדשות חדשות שמחכות לך. חזור לקרוא ולצבור נקודות!',
        audience: {
          type: 'specific_users',
          userIds,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send inactive user campaign', error);
    }
  }

  /**
   * Daily at 8 AM Israel time — warn users whose streak is at risk.
   * Targets users who had activity 2 days ago but NOT yesterday,
   * with currentStreak > 0 and no freeze tokens left.
   */
  @Cron('0 8 * * *', { timeZone: 'Asia/Jerusalem' })
  async sendStreakAtRiskReminders(): Promise<void> {
    this.logger.log('Running streak at-risk campaign...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find users with active streaks who missed yesterday
    const atRiskUsers = await this.appUserRepository.manager
      .createQueryBuilder()
      .select('us."userId"')
      .from('user_streaks', 'us')
      .where('us."currentStreak" > 0')
      .andWhere('us."freezeTokens" = 0')
      .andWhere('us."lastActivityDate" < :yesterday', {
        yesterday: yesterdayStr,
      })
      .getRawMany();

    if (atRiskUsers.length === 0) {
      this.logger.log('No at-risk streaks found');
      return;
    }

    const userIds = atRiskUsers.map((r) => r.userId);
    this.logger.log(`Sending streak at-risk to ${userIds.length} users`);

    try {
      await this.notificationsService.send({
        title: 'הרצף שלך בסכנה! 🔥',
        body: 'פתח את האפליקציה היום כדי לשמור על הרצף שלך',
        audience: {
          type: 'specific_users',
          userIds,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send streak at-risk campaign', error);
    }
  }

  /**
   * Every Sunday at 8 PM Israel time — weekly digest with top articles.
   */
  @Cron('0 20 * * 0', { timeZone: 'Asia/Jerusalem' })
  async sendWeeklyDigest(): Promise<void> {
    this.logger.log('Running weekly digest campaign...');

    try {
      await this.notificationsService.send({
        title: 'סיכום שבועי 📰',
        body: 'הנה הכתבות הפופולריות ביותר מהשבוע האחרון. לחץ לקריאה!',
        audience: {
          type: 'all',
        },
      });
    } catch (error) {
      this.logger.error('Failed to send weekly digest campaign', error);
    }
  }
}
