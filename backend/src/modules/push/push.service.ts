import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { PushToken } from './entities/push-token.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { FIREBASE_ADMIN } from './firebase-admin.provider';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly pushTokenRepository: Repository<PushToken>,
    @Inject(FIREBASE_ADMIN)
    private readonly firebaseApp: admin.app.App | null,
  ) {}

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
}
