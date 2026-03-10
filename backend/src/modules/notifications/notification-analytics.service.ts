import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationReceipt } from './entities/notification-receipt.entity';
import { NotificationLogStatus } from './enums/notification.enums';

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalFailed: number;
  openRate: number;
  deliveryRate: number;
  byContentType: { contentType: string; count: number }[];
  byDay: { date: string; count: number }[];
  recentLogs: NotificationLog[];
}

@Injectable()
export class NotificationAnalyticsService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(NotificationReceipt)
    private readonly receiptRepo: Repository<NotificationReceipt>,
  ) {}

  async getAnalytics(days = 30): Promise<NotificationAnalytics> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    // Aggregate totals
    const totals = await this.logRepo
      .createQueryBuilder('log')
      .select('SUM(log."totalSent")', 'totalSent')
      .addSelect('SUM(log."totalFailed")', 'totalFailed')
      .addSelect('SUM(log."totalOpened")', 'totalOpened')
      .addSelect('SUM(log."totalTargeted")', 'totalTargeted')
      .where('log."sentAt" >= :since', { since: sinceStr })
      .andWhere('log.status IN (:...statuses)', {
        statuses: [NotificationLogStatus.SENT, NotificationLogStatus.SENDING],
      })
      .getRawOne();

    const totalSent = parseInt(totals?.totalSent || '0', 10);
    const totalFailed = parseInt(totals?.totalFailed || '0', 10);
    const totalOpened = parseInt(totals?.totalOpened || '0', 10);
    const totalTargeted = parseInt(totals?.totalTargeted || '0', 10);

    // By content type
    const byContentType = await this.logRepo
      .createQueryBuilder('log')
      .select('log."contentType"', 'contentType')
      .addSelect('COUNT(*)', 'count')
      .where('log."sentAt" >= :since', { since: sinceStr })
      .groupBy('log."contentType"')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Daily send counts
    const byDay = await this.logRepo
      .createQueryBuilder('log')
      .select("TO_CHAR(log.\"sentAt\", 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log."sentAt" >= :since', { since: sinceStr })
      .andWhere('log."sentAt" IS NOT NULL')
      .groupBy("TO_CHAR(log.\"sentAt\", 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Recent logs
    const recentLogs = await this.logRepo.find({
      where: { status: NotificationLogStatus.SENT },
      order: { sentAt: 'DESC' },
      take: 10,
      relations: ['template'],
    });

    return {
      totalSent,
      totalDelivered: totalSent - totalFailed,
      totalOpened,
      totalFailed,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      deliveryRate: totalTargeted > 0 ? ((totalSent / totalTargeted) * 100) : 0,
      byContentType,
      byDay,
      recentLogs,
    };
  }
}
