import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as admin from 'firebase-admin';
import { PushToken } from './entities/push-token.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { FIREBASE_ADMIN } from './firebase-admin.provider';

/** Maximum non-breaking notifications per user per 24h */
const FREQUENCY_CAP = 3;
/** TTL for the frequency counter key — 24 hours in milliseconds */
const FREQUENCY_CAP_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly pushTokenRepository: Repository<PushToken>,
    @Inject(FIREBASE_ADMIN)
    private readonly firebaseApp: admin.app.App | null,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Check if a user is currently in quiet hours.
   * Compares against Israel time (Asia/Jerusalem).
   */
  isInQuietHours(user: AppUser): boolean {
    if (!user.quietHoursStart || !user.quietHoursEnd) {
      return false;
    }

    // Get current time in Israel
    const now = new Date();
    const israelTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }),
    );
    const currentMinutes = israelTime.getHours() * 60 + israelTime.getMinutes();

    const [startH, startM] = user.quietHoursStart.split(':').map(Number);
    const [endH, endM] = user.quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Same-day range (e.g. 09:00 – 17:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight range (e.g. 22:00 – 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Check if a user has exceeded the non-breaking notification frequency cap.
   * Returns true if the user can still receive notifications.
   */
  async checkFrequencyCap(userId: string): Promise<boolean> {
    const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const cacheKey = `notif_count:${userId}:${dateKey}`;

    const count = await this.cacheManager.get<number>(cacheKey);
    return (count ?? 0) < FREQUENCY_CAP;
  }

  /**
   * Increment the notification frequency counter for a user.
   */
  async incrementFrequencyCount(userId: string): Promise<void> {
    const dateKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `notif_count:${userId}:${dateKey}`;

    const current = (await this.cacheManager.get<number>(cacheKey)) ?? 0;
    await this.cacheManager.set(cacheKey, current + 1, FREQUENCY_CAP_TTL_MS);
  }

  async registerToken(dto: RegisterTokenDto): Promise<PushToken> {
    const existing = await this.pushTokenRepository.findOne({
      where: { deviceId: dto.deviceId },
    });

    if (existing) {
      existing.token = dto.token;
      existing.platform = dto.platform;
      existing.isActive = true;
      return this.pushTokenRepository.save(existing);
    }

    const pushToken = this.pushTokenRepository.create(dto);
    return this.pushTokenRepository.save(pushToken);
  }

  async sendToAll(
    dto: SendNotificationDto,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.firebaseApp) {
      this.logger.warn(
        'Firebase not configured — skipping push notification send',
      );
      return { sent: 0, failed: 0 };
    }

    const activeTokens = await this.pushTokenRepository.find({
      where: { isActive: true },
    });

    if (activeTokens.length === 0) {
      this.logger.log('No active tokens — nothing to send');
      return { sent: 0, failed: 0 };
    }

    this.logger.log(
      `Sending notification to ${activeTokens.length} devices: "${dto.title}"`,
    );

    const messaging = this.firebaseApp.messaging();
    let totalSent = 0;
    let totalFailed = 0;
    const staleTokenIds: string[] = [];

    const BATCH_SIZE = 500;

    for (let i = 0; i < activeTokens.length; i += BATCH_SIZE) {
      // Delay between batches to avoid FCM rate limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const batch = activeTokens.slice(i, i + BATCH_SIZE);
      const tokens = batch.map((t) => t.token);

      const dataPayload: Record<string, string> | undefined = dto.data
        ? Object.fromEntries(
            Object.entries(dto.data)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)]),
          )
        : undefined;

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: dto.title,
          body: dto.body,
          ...(dto.imageUrl && { imageUrl: dto.imageUrl }),
        },
        ...(dataPayload &&
          Object.keys(dataPayload).length > 0 && { data: dataPayload }),
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'breaking_news',
          },
        },
        tokens,
      };

      try {
        const response = await messaging.sendEachForMulticast(message);
        totalSent += response.successCount;
        totalFailed += response.failureCount;

        response.responses.forEach((resp, idx) => {
          if (resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              staleTokenIds.push(batch[idx].id);
            }
          }
        });
      } catch (error) {
        this.logger.error(`Batch send failed: ${error.message}`);
        totalFailed += batch.length;
      }
    }

    if (staleTokenIds.length > 0) {
      await this.pushTokenRepository.update(
        { id: In(staleTokenIds) },
        { isActive: false },
      );
      this.logger.log(`Deactivated ${staleTokenIds.length} stale push tokens`);
    }

    this.logger.log(
      `Push notification result: ${totalSent} sent, ${totalFailed} failed`,
    );
    return { sent: totalSent, failed: totalFailed };
  }

  async deactivateToken(deviceId: string): Promise<void> {
    await this.pushTokenRepository.update({ deviceId }, { isActive: false });
  }

  /**
   * Prune stale tokens that haven't been updated in the given number of days.
   * FCM best practice: remove tokens inactive for 30+ days.
   */
  async pruneStaleTokens(staleDays = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);

    const result = await this.pushTokenRepository
      .createQueryBuilder()
      .update(PushToken)
      .set({ isActive: false })
      .where('"isActive" = true')
      .andWhere('"updatedAt" < :cutoff', { cutoff })
      .execute();

    const pruned = result.affected || 0;
    if (pruned > 0) {
      this.logger.log(`Pruned ${pruned} stale push tokens (inactive > ${staleDays} days)`);
    }
    return pruned;
  }

  /**
   * Scheduled: runs daily at 03:00 to deactivate tokens inactive for 30+ days.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledTokenPrune(): Promise<void> {
    await this.pruneStaleTokens(30);
  }
}
