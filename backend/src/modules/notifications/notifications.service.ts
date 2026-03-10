import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PushService } from '../push/push.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationAudienceService } from './notification-audience.service';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationReceipt } from './entities/notification-receipt.entity';
import { NotificationLogStatus, NotificationReceiptStatus } from './enums/notification.enums';
import { SendAdvancedNotificationDto } from './dto/send-notification.dto';
import { QueryNotificationLogsDto } from './dto/query-notification-logs.dto';
import { AudienceRulesDto } from './dto/audience-rules.dto';
import { PushToken } from '../push/entities/push-token.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(NotificationReceipt)
    private readonly receiptRepo: Repository<NotificationReceipt>,
    private readonly pushService: PushService,
    private readonly templateService: NotificationTemplateService,
    private readonly audienceService: NotificationAudienceService,
  ) {}

  /**
   * Send a notification (immediately or scheduled).
   */
  async send(dto: SendAdvancedNotificationDto, sentById?: string): Promise<NotificationLog> {
    let title = dto.title;
    let body = dto.body;
    let imageUrl = dto.imageUrl;

    // If using a template, resolve it
    if (dto.templateId) {
      const template = await this.templateService.findOne(dto.templateId);
      const resolved = this.templateService.resolveTemplate(
        template,
        dto.variables || {},
      );
      title = title || resolved.title;
      body = body || resolved.body;
      imageUrl = imageUrl || resolved.imageUrl;
    }

    if (!title || !body) {
      throw new BadRequestException('Title and body are required');
    }

    // Create the log entry
    const log = this.logRepo.create({
      templateId: dto.templateId,
      title,
      body,
      imageUrl,
      contentType: dto.contentType || 'custom',
      contentId: dto.contentId,
      data: dto.data,
      audienceRules: dto.audience as unknown as Record<string, unknown>,
      sentById,
      status: dto.scheduledAt
        ? NotificationLogStatus.PENDING
        : NotificationLogStatus.SENDING,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });

    const savedLog = await this.logRepo.save(log);

    // If scheduled for later, just save the log and return
    if (dto.scheduledAt) {
      this.logger.log(`Notification ${savedLog.id} scheduled for ${dto.scheduledAt}`);
      return savedLog;
    }

    // Execute send immediately
    await this.executeSend(savedLog.id);
    return (await this.logRepo.findOne({ where: { id: savedLog.id } }))!;
  }

  /**
   * Execute the actual send for a notification log entry.
   */
  async executeSend(logId: string): Promise<void> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) return;

    try {
      log.status = NotificationLogStatus.SENDING;
      log.sentAt = new Date();
      await this.logRepo.save(log);

      const audienceRules = log.audienceRules as unknown as AudienceRulesDto;
      const tokens = await this.audienceService.resolveAudience(audienceRules);

      log.totalTargeted = tokens.length;

      if (tokens.length === 0) {
        log.status = NotificationLogStatus.SENT;
        log.completedAt = new Date();
        await this.logRepo.save(log);
        this.logger.log(`Notification ${logId}: no audience matched`);
        return;
      }

      // Send via PushService in batches
      const result = await this.sendToTokens(log, tokens);

      log.totalSent = result.sent;
      log.totalFailed = result.failed;
      log.status = NotificationLogStatus.SENT;
      log.completedAt = new Date();
      await this.logRepo.save(log);

      this.logger.log(
        `Notification ${logId}: sent=${result.sent}, failed=${result.failed}, targeted=${tokens.length}`,
      );
    } catch (error) {
      log.status = NotificationLogStatus.FAILED;
      log.errorMessage = error.message;
      log.completedAt = new Date();
      await this.logRepo.save(log);
      this.logger.error(`Notification ${logId} failed: ${error.message}`);
    }
  }

  /**
   * Send push to a specific set of tokens and create receipts.
   */
  private async sendToTokens(
    log: NotificationLog,
    tokens: PushToken[],
  ): Promise<{ sent: number; failed: number }> {
    const firebaseApp = (this.pushService as any).firebaseApp;
    if (!firebaseApp) {
      this.logger.warn('Firebase not configured — skipping push');
      return { sent: 0, failed: 0 };
    }

    const messaging = firebaseApp.messaging();
    let totalSent = 0;
    let totalFailed = 0;
    const BATCH_SIZE = 500;
    const receipts: Partial<NotificationReceipt>[] = [];
    const staleTokenIds: string[] = [];

    const logData = (log.data || {}) as Record<string, string>;
    const dataPayload: Record<string, string> = {
      ...logData,
      notificationLogId: log.id,
      contentType: log.contentType,
    };
    if (log.contentId) {
      dataPayload.contentId = log.contentId;
    }
    if (log.imageUrl) {
      dataPayload.imageUrl = log.imageUrl;
    }
    // Ensure camelCase keys for Flutter compatibility
    if (logData.article_slug) {
      dataPayload.articleSlug = logData.article_slug;
    }

    const analyticsLabel = `${log.contentType}_${new Date().toISOString().slice(0, 10)}`;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      // Delay between batches to avoid FCM rate limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const batch = tokens.slice(i, i + BATCH_SIZE);
      const tokenStrings = batch.map((t) => t.token);

      const message = {
        notification: {
          title: log.title,
          body: log.body,
          ...(log.imageUrl && { imageUrl: log.imageUrl }),
        },
        data: dataPayload,
        fcmOptions: { analyticsLabel },
        apns: {
          payload: { aps: { sound: 'default', badge: 1, 'mutable-content': 1 } },
          fcmOptions: { analyticsLabel },
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'breaking_news',
          },
        },
        tokens: tokenStrings,
      };

      try {
        const response = await this.sendBatchWithRetry(messaging, message);
        totalSent += response.successCount;
        totalFailed += response.failureCount;

        response.responses.forEach((resp: any, idx: number) => {
          if (resp.error) {
            const code = resp.error.code;
            // Detect stale/invalid tokens for deactivation
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              staleTokenIds.push(batch[idx].id);
            }
          }

          receipts.push({
            logId: log.id,
            pushTokenId: batch[idx].id,
            deviceId: batch[idx].deviceId,
            userId: batch[idx].userId,
            status: resp.error
              ? NotificationReceiptStatus.FAILED
              : NotificationReceiptStatus.SENT,
            failureReason: resp.error?.message,
          });
        });
      } catch (error) {
        this.logger.error(`Batch send failed entirely: ${error.message}`);
        totalFailed += batch.length;
        batch.forEach((t) => {
          receipts.push({
            logId: log.id,
            pushTokenId: t.id,
            deviceId: t.deviceId,
            userId: t.userId,
            status: NotificationReceiptStatus.FAILED,
            failureReason: error.message,
          });
        });
      }
    }

    // Bulk insert receipts
    if (receipts.length > 0) {
      await this.receiptRepo
        .createQueryBuilder()
        .insert()
        .into(NotificationReceipt)
        .values(receipts as any)
        .execute();
    }

    // Deactivate stale tokens
    if (staleTokenIds.length > 0) {
      await this.pushService['pushTokenRepository'].update(
        { id: In(staleTokenIds) },
        { isActive: false },
      );
      this.logger.log(`Deactivated ${staleTokenIds.length} stale push tokens`);
    }

    return { sent: totalSent, failed: totalFailed };
  }

  /**
   * Send a multicast batch with retry + exponential backoff for retryable errors.
   */
  private async sendBatchWithRetry(
    messaging: any,
    message: any,
    maxRetries = 2,
  ): Promise<any> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await messaging.sendEachForMulticast(message);
      } catch (error) {
        const code = error.code || '';
        const isRetryable =
          code === 'messaging/too-many-requests' ||
          code === 'messaging/internal-error' ||
          code === 'messaging/server-unavailable';

        if (isRetryable && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          this.logger.warn(
            `FCM ${code} — retrying batch in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Auto-trigger notifications from content events (e.g. article.published).
   */
  async triggerContentNotification(
    triggerEvent: string,
    contentType: string,
    contentId: string,
    context: Record<string, string>,
  ): Promise<void> {
    const templates = await this.templateService.findByTriggerEvent(triggerEvent);

    if (templates.length === 0) {
      this.logger.debug(`No auto-trigger templates for event "${triggerEvent}"`);
      return;
    }

    for (const template of templates) {
      const resolved = this.templateService.resolveTemplate(template, context);
      const audience = (template.defaultAudience || { type: 'all' }) as unknown as AudienceRulesDto;

      const log = this.logRepo.create({
        templateId: template.id,
        title: resolved.title,
        body: resolved.body,
        imageUrl: resolved.imageUrl,
        contentType,
        contentId,
        data: context as unknown as Record<string, unknown>,
        audienceRules: audience as unknown as Record<string, unknown>,
        status: NotificationLogStatus.SENDING,
        sentAt: new Date(),
      });

      const savedLog = await this.logRepo.save(log);
      // Fire and forget — don't block the content action
      this.executeSend(savedLog.id).catch((err) =>
        this.logger.error(`Auto-trigger send failed for ${savedLog.id}: ${err.message}`),
      );
    }
  }

  /**
   * Track that a user opened a notification.
   */
  async trackOpen(logId: string, deviceId: string): Promise<void> {
    const receipt = await this.receiptRepo.findOne({
      where: { logId, deviceId },
      order: { createdAt: 'DESC' },
    });

    if (receipt && receipt.status !== NotificationReceiptStatus.OPENED) {
      receipt.status = NotificationReceiptStatus.OPENED;
      receipt.openedAt = new Date();
      await this.receiptRepo.save(receipt);

      await this.logRepo
        .createQueryBuilder()
        .update(NotificationLog)
        .set({ totalOpened: () => '"totalOpened" + 1' })
        .where('id = :id', { id: logId })
        .execute();
    }
  }

  /**
   * Get unread notification count for a device.
   */
  async getUnreadCount(deviceId: string): Promise<{ count: number }> {
    const total = await this.logRepo.count({
      where: { status: NotificationLogStatus.SENT },
    });
    const opened = await this.receiptRepo.count({
      where: { deviceId, status: NotificationReceiptStatus.OPENED },
    });
    return { count: Math.max(0, total - opened) };
  }

  /**
   * Get notification inbox for a device (user-facing).
   * Returns all sent notifications with read status per device.
   */
  async getInbox(
    deviceId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: any[]; total: number }> {
    const [logs, total] = await this.logRepo
      .createQueryBuilder('log')
      .where('log.status = :status', { status: NotificationLogStatus.SENT })
      .orderBy('log."sentAt"', 'DESC', 'NULLS LAST')
      .addOrderBy('log."createdAt"', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Look up read status for this device
    const logIds = logs.map((l) => l.id);
    let openedMap: Record<string, Date> = {};

    if (logIds.length > 0) {
      const receipts = await this.receiptRepo.find({
        where: { deviceId, logId: In(logIds) },
        select: ['logId', 'status', 'openedAt'],
      });
      openedMap = receipts.reduce(
        (acc, r) => {
          if (r.openedAt) acc[r.logId] = r.openedAt;
          return acc;
        },
        {} as Record<string, Date>,
      );
    }

    const data = logs.map((log) => ({
      id: log.id,
      title: log.title,
      body: log.body,
      imageUrl: log.imageUrl,
      contentType: log.contentType,
      contentId: log.contentId,
      contentSlug: (log.data as any)?.article_slug || null,
      status: log.status,
      sentAt: log.sentAt,
      openedAt: openedMap[log.id] || null,
      createdAt: log.createdAt,
    }));

    return { data, total };
  }

  /**
   * Mark all notifications as read for a device.
   * Creates opened receipts for any logs that don't have one yet.
   */
  async markAllRead(deviceId: string): Promise<{ updated: number }> {
    const now = new Date();

    // Update existing receipts that haven't been opened
    const updateResult = await this.receiptRepo
      .createQueryBuilder()
      .update(NotificationReceipt)
      .set({ openedAt: now, status: NotificationReceiptStatus.OPENED })
      .where('"deviceId" = :deviceId', { deviceId })
      .andWhere('"openedAt" IS NULL')
      .execute();

    // Find all sent logs that don't have a receipt for this device
    const logsWithoutReceipt = await this.logRepo
      .createQueryBuilder('log')
      .where('log.status = :status', { status: NotificationLogStatus.SENT })
      .andWhere(
        `log.id NOT IN (SELECT "logId" FROM notification_receipts WHERE "deviceId" = :deviceId)`,
        { deviceId },
      )
      .getMany();

    // Create opened receipts for them
    if (logsWithoutReceipt.length > 0) {
      const newReceipts = logsWithoutReceipt.map((log) =>
        this.receiptRepo.create({
          logId: log.id,
          deviceId,
          status: NotificationReceiptStatus.OPENED,
          openedAt: now,
        }),
      );
      await this.receiptRepo.save(newReceipts);
    }

    return { updated: (updateResult.affected || 0) + logsWithoutReceipt.length };
  }

  /**
   * Hide a notification from the user's inbox by marking the receipt as opened.
   * Creates a receipt if one doesn't exist.
   */
  async dismissInboxItem(
    deviceId: string,
    logId: string,
  ): Promise<{ dismissed: boolean }> {
    let receipt = await this.receiptRepo.findOne({
      where: { deviceId, logId },
    });

    if (receipt) {
      // Mark as opened so it appears "read"
      receipt.openedAt = new Date();
      receipt.status = NotificationReceiptStatus.OPENED;
      await this.receiptRepo.save(receipt);
    } else {
      // Create a new receipt marked as opened
      receipt = this.receiptRepo.create({
        logId,
        deviceId,
        status: NotificationReceiptStatus.OPENED,
        openedAt: new Date(),
      });
      await this.receiptRepo.save(receipt);
    }

    return { dismissed: true };
  }

  /**
   * Get notification logs with pagination and filters (admin).
   */
  async findLogs(query: QueryNotificationLogsDto): Promise<{
    data: NotificationLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);

    const qb = this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.template', 'template')
      .leftJoinAndSelect('log.sentBy', 'sentBy');

    if (query.status) {
      qb.andWhere('log.status = :status', { status: query.status });
    }

    if (query.contentType) {
      qb.andWhere('log.contentType = :contentType', {
        contentType: query.contentType,
      });
    }

    if (query.from) {
      qb.andWhere('log.createdAt >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('log.createdAt <= :to', { to: query.to });
    }

    if (query.search) {
      qb.andWhere('(log.title ILIKE :search OR log.body ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single log with delivery stats.
   */
  async findLogDetail(id: string): Promise<NotificationLog & { deliveryStats: any }> {
    const log = await this.logRepo.findOne({
      where: { id },
      relations: ['template', 'sentBy'],
    });

    if (!log) throw new BadRequestException('Log not found');

    const deliveryStats = await this.receiptRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r."logId" = :logId', { logId: id })
      .groupBy('r.status')
      .getRawMany();

    return { ...log, deliveryStats };
  }

  /**
   * Preview audience count for a set of targeting rules.
   */
  async previewAudienceCount(audience: AudienceRulesDto): Promise<number> {
    return this.audienceService.countAudience(audience);
  }

  /**
   * Cancel a pending/scheduled notification.
   */
  async cancelNotification(logId: string): Promise<NotificationLog> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) throw new BadRequestException('Log not found');

    if (log.status !== NotificationLogStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending notifications');
    }

    log.status = NotificationLogStatus.CANCELLED;
    return this.logRepo.save(log);
  }
}
