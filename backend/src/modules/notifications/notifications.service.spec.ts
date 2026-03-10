import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationReceipt } from './entities/notification-receipt.entity';
import { PushService } from '../push/push.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationAudienceService } from './notification-audience.service';
import {
  NotificationLogStatus,
  NotificationReceiptStatus,
} from './enums/notification.enums';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  increment: jest.fn(),
  createQueryBuilder: jest.fn(),
  findAndCount: jest.fn(),
});

const mockPushService = { sendToAll: jest.fn() };

const mockTemplateService = {
  findByTriggerEvent: jest.fn().mockResolvedValue([]),
  resolveTemplate: jest.fn(),
  findOne: jest.fn(),
};

const mockAudienceService = {
  resolveAudience: jest.fn().mockResolvedValue([]),
  countAudience: jest.fn().mockResolvedValue(0),
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let logRepo: jest.Mocked<Repository<NotificationLog>>;
  let receiptRepo: jest.Mocked<Repository<NotificationReceipt>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationLog),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(NotificationReceipt),
          useFactory: mockRepository,
        },
        { provide: PushService, useValue: mockPushService },
        { provide: NotificationTemplateService, useValue: mockTemplateService },
        { provide: NotificationAudienceService, useValue: mockAudienceService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    logRepo = module.get(getRepositoryToken(NotificationLog));
    receiptRepo = module.get(getRepositoryToken(NotificationReceipt));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------- send() ----------

  describe('send', () => {
    const baseDto = {
      title: 'Breaking News',
      body: 'Something happened',
      audience: { type: 'all' as const },
    };

    it('should create a log and call executeSend for immediate send', async () => {
      const savedLog = {
        id: 'log-1',
        ...baseDto,
        status: NotificationLogStatus.SENDING,
      } as unknown as NotificationLog;

      logRepo.create.mockReturnValue(savedLog);
      logRepo.save.mockResolvedValue(savedLog);
      logRepo.findOne.mockResolvedValue({
        ...savedLog,
        status: NotificationLogStatus.SENT,
      } as NotificationLog);

      // executeSend needs the log lookup + audience resolution
      mockAudienceService.resolveAudience.mockResolvedValue([]);

      const result = await service.send(baseDto);

      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Breaking News',
          body: 'Something happened',
          status: NotificationLogStatus.SENDING,
        }),
      );
      expect(logRepo.save).toHaveBeenCalled();
      // After executeSend, the returned log is re-fetched
      expect(result.status).toBe(NotificationLogStatus.SENT);
    });

    it('should set status to PENDING for scheduled notifications', async () => {
      const scheduledDto = {
        ...baseDto,
        scheduledAt: '2026-12-31T12:00:00Z',
      };

      const savedLog = {
        id: 'log-2',
        status: NotificationLogStatus.PENDING,
        scheduledAt: new Date('2026-12-31T12:00:00Z'),
      } as NotificationLog;

      logRepo.create.mockReturnValue(savedLog);
      logRepo.save.mockResolvedValue(savedLog);

      const result = await service.send(scheduledDto);

      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationLogStatus.PENDING,
        }),
      );
      expect(result.status).toBe(NotificationLogStatus.PENDING);
      // executeSend should NOT have been called — no extra findOne after save
      expect(logRepo.findOne).not.toHaveBeenCalled();
    });

    it('should resolve template when templateId is provided', async () => {
      const dto = {
        templateId: 'tpl-1',
        audience: { type: 'all' as const },
        variables: { headline: 'Big Event' },
      };

      const template = {
        id: 'tpl-1',
        titleTemplate: '{{headline}}',
        bodyTemplate: 'Details about {{headline}}',
      };
      mockTemplateService.findOne.mockResolvedValue(template);
      mockTemplateService.resolveTemplate.mockReturnValue({
        title: 'Big Event',
        body: 'Details about Big Event',
        imageUrl: undefined,
      });

      const savedLog = {
        id: 'log-3',
        title: 'Big Event',
        body: 'Details about Big Event',
        status: NotificationLogStatus.SENDING,
      } as unknown as NotificationLog;

      logRepo.create.mockReturnValue(savedLog);
      logRepo.save.mockResolvedValue(savedLog);
      logRepo.findOne.mockResolvedValue(savedLog);
      mockAudienceService.resolveAudience.mockResolvedValue([]);

      await service.send(dto);

      expect(mockTemplateService.findOne).toHaveBeenCalledWith('tpl-1');
      expect(mockTemplateService.resolveTemplate).toHaveBeenCalledWith(
        template,
        { headline: 'Big Event' },
      );
    });

    it('should throw BadRequestException when title and body are missing', async () => {
      const dto = {
        audience: { type: 'all' as const },
      };

      await expect(service.send(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------- executeSend() ----------

  describe('executeSend', () => {
    it('should return early when log is not found', async () => {
      logRepo.findOne.mockResolvedValue(null);

      await service.executeSend('nonexistent-id');

      expect(logRepo.save).not.toHaveBeenCalled();
    });

    it('should mark as SENT with zero targets when audience is empty', async () => {
      const log = {
        id: 'log-4',
        status: NotificationLogStatus.PENDING,
        audienceRules: { type: 'all' },
      } as unknown as NotificationLog;

      logRepo.findOne.mockResolvedValue(log);
      logRepo.save.mockResolvedValue(log);
      mockAudienceService.resolveAudience.mockResolvedValue([]);

      await service.executeSend('log-4');

      // save is called at least twice: status -> SENDING, then status -> SENT
      expect(logRepo.save).toHaveBeenCalled();
      const lastSaveCall = logRepo.save.mock.calls[logRepo.save.mock.calls.length - 1][0];
      expect(lastSaveCall.status).toBe(NotificationLogStatus.SENT);
      expect(lastSaveCall.totalTargeted).toBe(0);
    });
  });

  // ---------- triggerContentNotification() ----------

  describe('triggerContentNotification', () => {
    it('should be a no-op when no auto-trigger templates exist', async () => {
      mockTemplateService.findByTriggerEvent.mockResolvedValue([]);

      await service.triggerContentNotification(
        'article.published',
        'article',
        'article-1',
        { title: 'New Article' },
      );

      expect(mockTemplateService.findByTriggerEvent).toHaveBeenCalledWith(
        'article.published',
      );
      expect(logRepo.create).not.toHaveBeenCalled();
    });

    it('should create a log and fire-and-forget executeSend when templates exist', async () => {
      const template = {
        id: 'tpl-auto',
        titleTemplate: '{{title}}',
        bodyTemplate: 'Check it out',
        defaultAudience: { type: 'all' },
      };

      mockTemplateService.findByTriggerEvent.mockResolvedValue([template]);
      mockTemplateService.resolveTemplate.mockReturnValue({
        title: 'New Article',
        body: 'Check it out',
        imageUrl: undefined,
      });

      const savedLog = { id: 'auto-log-1' } as NotificationLog;
      logRepo.create.mockReturnValue(savedLog);
      logRepo.save.mockResolvedValue(savedLog);
      // executeSend will look up the log
      logRepo.findOne.mockResolvedValue({
        ...savedLog,
        audienceRules: { type: 'all' },
        status: NotificationLogStatus.SENDING,
      } as unknown as NotificationLog);
      mockAudienceService.resolveAudience.mockResolvedValue([]);

      await service.triggerContentNotification(
        'article.published',
        'article',
        'article-1',
        { title: 'New Article' },
      );

      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'tpl-auto',
          title: 'New Article',
          body: 'Check it out',
          contentType: 'article',
          contentId: 'article-1',
          status: NotificationLogStatus.SENDING,
        }),
      );
      expect(logRepo.save).toHaveBeenCalled();
    });
  });

  // ---------- trackOpen() ----------

  describe('trackOpen', () => {
    it('should update receipt to OPENED and increment totalOpened', async () => {
      const receipt = {
        logId: 'log-5',
        deviceId: 'device-1',
        status: NotificationReceiptStatus.SENT,
      } as NotificationReceipt;

      receiptRepo.findOne.mockResolvedValue(receipt);
      receiptRepo.save.mockResolvedValue(receipt);

      const mockQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      logRepo.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.trackOpen('log-5', 'device-1');

      expect(receipt.status).toBe(NotificationReceiptStatus.OPENED);
      expect(receipt.openedAt).toBeInstanceOf(Date);
      expect(receiptRepo.save).toHaveBeenCalledWith(receipt);
      expect(mockQb.execute).toHaveBeenCalled();
    });

    it('should not update when receipt is already OPENED', async () => {
      const receipt = {
        logId: 'log-5',
        deviceId: 'device-1',
        status: NotificationReceiptStatus.OPENED,
        openedAt: new Date(),
      } as NotificationReceipt;

      receiptRepo.findOne.mockResolvedValue(receipt);

      await service.trackOpen('log-5', 'device-1');

      expect(receiptRepo.save).not.toHaveBeenCalled();
    });

    it('should not update when no receipt exists', async () => {
      receiptRepo.findOne.mockResolvedValue(null);

      await service.trackOpen('log-5', 'device-1');

      expect(receiptRepo.save).not.toHaveBeenCalled();
    });
  });

  // ---------- getUnreadCount() ----------

  describe('getUnreadCount', () => {
    it('should return total SENT minus opened receipts', async () => {
      logRepo.count.mockResolvedValue(10);
      receiptRepo.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('device-1');

      expect(result).toEqual({ count: 7 });
      expect(logRepo.count).toHaveBeenCalledWith({
        where: { status: NotificationLogStatus.SENT },
      });
      expect(receiptRepo.count).toHaveBeenCalledWith({
        where: {
          deviceId: 'device-1',
          status: NotificationReceiptStatus.OPENED,
        },
      });
    });

    it('should not return negative count', async () => {
      logRepo.count.mockResolvedValue(2);
      receiptRepo.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('device-1');

      expect(result).toEqual({ count: 0 });
    });
  });

  // ---------- cancelNotification() ----------

  describe('cancelNotification', () => {
    it('should cancel a PENDING notification', async () => {
      const log = {
        id: 'log-cancel',
        status: NotificationLogStatus.PENDING,
      } as NotificationLog;

      logRepo.findOne.mockResolvedValue(log);
      logRepo.save.mockResolvedValue({
        ...log,
        status: NotificationLogStatus.CANCELLED,
      } as NotificationLog);

      const result = await service.cancelNotification('log-cancel');

      expect(log.status).toBe(NotificationLogStatus.CANCELLED);
      expect(logRepo.save).toHaveBeenCalledWith(log);
      expect(result.status).toBe(NotificationLogStatus.CANCELLED);
    });

    it('should throw BadRequestException when log is not found', async () => {
      logRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelNotification('nonexistent'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-PENDING status', async () => {
      const log = {
        id: 'log-sent',
        status: NotificationLogStatus.SENT,
      } as NotificationLog;

      logRepo.findOne.mockResolvedValue(log);

      await expect(
        service.cancelNotification('log-sent'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelNotification('log-sent'),
      ).rejects.toThrow('Can only cancel pending notifications');
    });
  });

  // ---------- previewAudienceCount() ----------

  describe('previewAudienceCount', () => {
    it('should delegate to audienceService.countAudience', async () => {
      const audience = { type: 'all' as const };
      mockAudienceService.countAudience.mockResolvedValue(42);

      const result = await service.previewAudienceCount(audience);

      expect(result).toBe(42);
      expect(mockAudienceService.countAudience).toHaveBeenCalledWith(audience);
    });
  });
});
