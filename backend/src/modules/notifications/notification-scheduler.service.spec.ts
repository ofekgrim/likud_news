import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationSchedule } from './entities/notification-schedule.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationScheduleType } from './enums/notification.enums';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
});

const mockTemplateService = () => ({
  resolveTemplate: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  interpolate: jest.fn(),
});

describe('NotificationSchedulerService', () => {
  let service: NotificationSchedulerService;
  let scheduleRepo: jest.Mocked<Repository<NotificationSchedule>>;
  let logRepo: jest.Mocked<Repository<NotificationLog>>;
  let templateService: jest.Mocked<NotificationTemplateService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSchedulerService,
        { provide: getRepositoryToken(NotificationSchedule), useFactory: mockRepository },
        { provide: getRepositoryToken(NotificationLog), useFactory: mockRepository },
        { provide: NotificationTemplateService, useFactory: mockTemplateService },
      ],
    }).compile();

    service = module.get<NotificationSchedulerService>(NotificationSchedulerService);
    scheduleRepo = module.get(getRepositoryToken(NotificationSchedule));
    logRepo = module.get(getRepositoryToken(NotificationLog));
    templateService = module.get(NotificationTemplateService) as jest.Mocked<NotificationTemplateService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all schedules ordered by createdAt DESC', async () => {
      const schedules = [
        { id: 'sched-1', name: 'Daily Digest' },
        { id: 'sched-2', name: 'Weekly Recap' },
      ] as NotificationSchedule[];

      scheduleRepo.find.mockResolvedValue(schedules);

      const result = await service.findAll();

      expect(scheduleRepo.find).toHaveBeenCalledWith({
        relations: ['template', 'createdBy'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(schedules);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      const schedule = {
        id: 'sched-1',
        name: 'Daily Digest',
      } as NotificationSchedule;

      scheduleRepo.findOne.mockResolvedValue(schedule);

      const result = await service.findOne('sched-1');

      expect(scheduleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sched-1' },
        relations: ['template', 'createdBy'],
      });
      expect(result).toEqual(schedule);
    });

    it('should throw when schedule not found', async () => {
      scheduleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('Schedule not found');
    });
  });

  describe('create', () => {
    it('should create a schedule with createdById and compute nextRunAt for recurring', async () => {
      const data = {
        name: 'Daily News',
        scheduleType: NotificationScheduleType.RECURRING,
        cronExpression: '0 9 * * *',
      } as Partial<NotificationSchedule>;

      const created = {
        id: 'sched-new',
        ...data,
        createdById: 'admin-1',
      } as NotificationSchedule;

      scheduleRepo.create.mockReturnValue(created);
      scheduleRepo.save.mockResolvedValue(created);

      const result = await service.create(data, 'admin-1');

      expect(scheduleRepo.create).toHaveBeenCalledWith({
        ...data,
        createdById: 'admin-1',
      });
      expect(scheduleRepo.save).toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('should set nextRunAt to scheduledAt for one-time schedules', async () => {
      const scheduledAt = new Date('2026-04-01T10:00:00Z');
      const data = {
        name: 'One-time Alert',
        scheduleType: NotificationScheduleType.ONCE,
        scheduledAt,
      } as Partial<NotificationSchedule>;

      const created = {
        id: 'sched-once',
        ...data,
      } as NotificationSchedule;

      scheduleRepo.create.mockReturnValue(created);
      scheduleRepo.save.mockResolvedValue(created);

      await service.create(data);

      expect(created.nextRunAt).toEqual(scheduledAt);
      expect(scheduleRepo.save).toHaveBeenCalledWith(created);
    });
  });

  describe('update', () => {
    it('should update schedule and recompute nextRunAt when cron changes', async () => {
      const existing = {
        id: 'sched-1',
        name: 'Daily Digest',
        scheduleType: NotificationScheduleType.RECURRING,
        cronExpression: '0 9 * * *',
        isActive: true,
        nextRunAt: new Date(),
      } as NotificationSchedule;

      scheduleRepo.findOne.mockResolvedValue(existing);
      scheduleRepo.save.mockResolvedValue(existing);

      const updateData = { cronExpression: '0 18 * * *' } as Partial<NotificationSchedule>;

      const result = await service.update('sched-1', updateData);

      expect(scheduleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sched-1' },
        relations: ['template', 'createdBy'],
      });
      expect(scheduleRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should find and remove a schedule', async () => {
      const schedule = { id: 'sched-1', name: 'Old Schedule' } as NotificationSchedule;

      scheduleRepo.findOne.mockResolvedValue(schedule);
      scheduleRepo.remove.mockResolvedValue(schedule);

      await service.remove('sched-1');

      expect(scheduleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sched-1' },
        relations: ['template', 'createdBy'],
      });
      expect(scheduleRepo.remove).toHaveBeenCalledWith(schedule);
    });
  });

  describe('toggleActive', () => {
    it('should flip isActive from true to false', async () => {
      const schedule = {
        id: 'sched-1',
        isActive: true,
        cronExpression: '0 9 * * *',
      } as NotificationSchedule;

      scheduleRepo.findOne.mockResolvedValue(schedule);
      scheduleRepo.save.mockResolvedValue({ ...schedule, isActive: false } as NotificationSchedule);

      const result = await service.toggleActive('sched-1');

      expect(schedule.isActive).toBe(false);
      expect(scheduleRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should flip isActive from false to true and recompute nextRunAt', async () => {
      const schedule = {
        id: 'sched-2',
        isActive: false,
        cronExpression: '30 8 * * *',
        scheduleType: NotificationScheduleType.RECURRING,
      } as NotificationSchedule;

      scheduleRepo.findOne.mockResolvedValue(schedule);
      scheduleRepo.save.mockImplementation(async (s) => s as NotificationSchedule);

      await service.toggleActive('sched-2');

      expect(schedule.isActive).toBe(true);
      expect(schedule.nextRunAt).toBeDefined();
      expect(scheduleRepo.save).toHaveBeenCalledWith(schedule);
    });
  });

  describe('computeNextRun', () => {
    it('should return null for one-time schedules', () => {
      const schedule = {
        scheduleType: NotificationScheduleType.ONCE,
      } as NotificationSchedule;

      const result = service.computeNextRun(schedule);

      expect(result).toBeNull();
    });

    it('should return null when no cron expression is set', () => {
      const schedule = {
        scheduleType: NotificationScheduleType.RECURRING,
        cronExpression: null,
      } as NotificationSchedule;

      const result = service.computeNextRun(schedule);

      expect(result).toBeNull();
    });

    it('should compute next day for daily cron pattern (M H * * *)', () => {
      const schedule = {
        scheduleType: NotificationScheduleType.RECURRING,
        cronExpression: '0 9 * * *',
      } as NotificationSchedule;

      const result = service.computeNextRun(schedule);

      expect(result).toBeInstanceOf(Date);
      expect(result!.getHours()).toBe(9);
      expect(result!.getMinutes()).toBe(0);
      expect(result!.getSeconds()).toBe(0);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result!.getDate()).toBe(tomorrow.getDate());
    });

    it('should compute next week for weekly cron pattern (M H * * D)', () => {
      const schedule = {
        scheduleType: NotificationScheduleType.RECURRING,
        cronExpression: '30 14 * * 1',
      } as NotificationSchedule;

      const result = service.computeNextRun(schedule);

      expect(result).toBeInstanceOf(Date);
      expect(result!.getHours()).toBe(14);
      expect(result!.getMinutes()).toBe(30);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      expect(result!.getDate()).toBe(nextWeek.getDate());
    });
  });
});
