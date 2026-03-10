import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationLogStatus } from './enums/notification.enums';
import { AudienceRulesDto } from './dto/audience-rules.dto';

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectRepository(NotificationSchedule)
    private readonly scheduleRepo: Repository<NotificationSchedule>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    private readonly templateService: NotificationTemplateService,
  ) {}

  onModuleInit() {
    this.logger.log('NotificationSchedulerService initialized');
  }

  /**
   * Runs every 60 seconds to check for due scheduled notifications.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();

    // Find due schedules
    const dueSchedules = await this.scheduleRepo.find({
      where: {
        isActive: true,
        nextRunAt: LessThanOrEqual(now),
      },
      relations: ['template'],
    });

    if (dueSchedules.length === 0) return;

    this.logger.log(`Processing ${dueSchedules.length} due schedules`);

    for (const schedule of dueSchedules) {
      try {
        await this.executeSchedule(schedule);
      } catch (error) {
        this.logger.error(
          `Failed to execute schedule ${schedule.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Also process pending logs that were scheduled for a past time.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledLogs(): Promise<void> {
    const now = new Date();

    const pendingLogs = await this.logRepo.find({
      where: {
        status: NotificationLogStatus.PENDING,
        scheduledAt: LessThanOrEqual(now),
      },
    });

    if (pendingLogs.length === 0) return;

    this.logger.log(`Processing ${pendingLogs.length} pending scheduled logs`);

    for (const log of pendingLogs) {
      log.status = NotificationLogStatus.SENDING;
      await this.logRepo.save(log);
    }
  }

  private async executeSchedule(schedule: NotificationSchedule): Promise<void> {
    const template = schedule.template;
    if (!template) {
      this.logger.warn(`Schedule ${schedule.id} has no template — skipping`);
      return;
    }

    const resolved = this.templateService.resolveTemplate(
      template,
      schedule.contextData || {},
    );

    // Create a notification log for this scheduled run
    const log = this.logRepo.create({
      templateId: template.id,
      title: resolved.title,
      body: resolved.body,
      imageUrl: resolved.imageUrl,
      contentType: template.contentType,
      audienceRules: schedule.audienceRules,
      status: NotificationLogStatus.SENDING,
      sentAt: new Date(),
    });

    await this.logRepo.save(log);

    // Update schedule timestamps
    schedule.lastRunAt = new Date();
    schedule.nextRunAt = this.computeNextRun(schedule);

    // Deactivate one-time schedules
    if (schedule.scheduleType === 'once') {
      schedule.isActive = false;
    }

    await this.scheduleRepo.save(schedule);

    this.logger.log(
      `Schedule ${schedule.id} executed — log ${log.id} created`,
    );
  }

  /**
   * Compute the next run time based on cron expression or deactivation.
   */
  computeNextRun(schedule: NotificationSchedule): Date | null {
    if (schedule.scheduleType === 'once') {
      return null;
    }

    if (!schedule.cronExpression) {
      return null;
    }

    try {
      // Simple cron parsing — for production use a library like cron-parser
      // For now, add a fixed interval based on common patterns
      const now = new Date();
      const parts = schedule.cronExpression.split(' ');

      if (parts.length >= 5) {
        const minute = parts[0];
        const hour = parts[1];

        // Daily pattern: "M H * * *"
        if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
          const next = new Date(now);
          next.setDate(next.getDate() + 1);
          if (hour !== '*') next.setHours(parseInt(hour, 10));
          if (minute !== '*') next.setMinutes(parseInt(minute, 10));
          next.setSeconds(0);
          next.setMilliseconds(0);
          return next;
        }

        // Weekly pattern: "M H * * D"
        if (parts[2] === '*' && parts[3] === '*' && parts[4] !== '*') {
          const next = new Date(now);
          next.setDate(next.getDate() + 7);
          if (hour !== '*') next.setHours(parseInt(hour, 10));
          if (minute !== '*') next.setMinutes(parseInt(minute, 10));
          next.setSeconds(0);
          next.setMilliseconds(0);
          return next;
        }
      }

      // Default: next day
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      return next;
    } catch {
      return null;
    }
  }

  // ── CRUD for schedules ──────────────────────────────────────────────

  async findAll(): Promise<NotificationSchedule[]> {
    return this.scheduleRepo.find({
      relations: ['template', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<NotificationSchedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['template', 'createdBy'],
    });
    if (!schedule) throw new Error('Schedule not found');
    return schedule;
  }

  async create(data: Partial<NotificationSchedule>, userId?: string): Promise<NotificationSchedule> {
    const schedule = this.scheduleRepo.create({
      ...data,
      createdById: userId,
    });

    // Set initial nextRunAt
    if (schedule.scheduleType === 'once' && schedule.scheduledAt) {
      schedule.nextRunAt = schedule.scheduledAt;
    } else if (schedule.cronExpression) {
      schedule.nextRunAt = this.computeNextRun(schedule);
    }

    return this.scheduleRepo.save(schedule);
  }

  async update(id: string, data: Partial<NotificationSchedule>): Promise<NotificationSchedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, data);

    // Recompute nextRunAt if schedule params changed
    if (data.scheduledAt || data.cronExpression || data.scheduleType) {
      if (schedule.scheduleType === 'once' && schedule.scheduledAt) {
        schedule.nextRunAt = schedule.scheduledAt;
      } else if (schedule.cronExpression) {
        schedule.nextRunAt = this.computeNextRun(schedule);
      }
    }

    return this.scheduleRepo.save(schedule);
  }

  async toggleActive(id: string): Promise<NotificationSchedule> {
    const schedule = await this.findOne(id);
    schedule.isActive = !schedule.isActive;

    if (schedule.isActive && schedule.cronExpression) {
      schedule.nextRunAt = this.computeNextRun(schedule);
    }

    return this.scheduleRepo.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepo.remove(schedule);
  }
}
