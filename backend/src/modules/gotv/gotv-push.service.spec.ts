import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GotvPushService } from './gotv-push.service';
import { GotvEngagement } from './entities/gotv-engagement.entity';
import {
  PrimaryElection,
  ElectionStatus,
} from '../elections/entities/primary-election.entity';
import { AppUser } from '../app-users/entities/app-user.entity';
import { PushToken } from '../push/entities/push-token.entity';
import { PushService } from '../push/push.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({ affected: 1 }),
});

const mockPushService = {
  isInQuietHours: jest.fn().mockReturnValue(false),
  checkFrequencyCap: jest.fn().mockResolvedValue(true),
  incrementFrequencyCount: jest.fn().mockResolvedValue(undefined),
  sendToAll: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
};

describe('GotvPushService', () => {
  let service: GotvPushService;
  let gotvRepo: ReturnType<typeof mockRepository>;
  let electionRepo: ReturnType<typeof mockRepository>;
  let appUserRepo: ReturnType<typeof mockRepository>;
  let pushTokenRepo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();

    gotvRepo = mockRepository();
    electionRepo = mockRepository();
    appUserRepo = mockRepository();
    pushTokenRepo = mockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GotvPushService,
        { provide: getRepositoryToken(GotvEngagement), useValue: gotvRepo },
        { provide: getRepositoryToken(PrimaryElection), useValue: electionRepo },
        { provide: getRepositoryToken(AppUser), useValue: appUserRepo },
        { provide: getRepositoryToken(PushToken), useValue: pushTokenRepo },
        { provide: PushService, useValue: mockPushService },
      ],
    }).compile();

    service = module.get<GotvPushService>(GotvPushService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getActiveElection ───────────────────────────────────────

  describe('getActiveElection', () => {
    it('should return VOTING election first', async () => {
      const votingElection = {
        id: 'e-1',
        status: ElectionStatus.VOTING,
        isActive: true,
        electionDate: new Date('2026-03-20'),
      };
      electionRepo.findOne.mockResolvedValueOnce(votingElection);

      const result = await service.getActiveElection();
      expect(result).toEqual(votingElection);
      expect(electionRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return UPCOMING election when no VOTING election', async () => {
      const upcomingElection = {
        id: 'e-2',
        status: ElectionStatus.UPCOMING,
        isActive: true,
        electionDate: new Date('2026-03-25'),
      };
      electionRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(upcomingElection);

      const result = await service.getActiveElection();
      expect(result).toEqual(upcomingElection);
      expect(electionRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return null when no active election', async () => {
      electionRepo.findOne.mockResolvedValue(null);

      const result = await service.getActiveElection();
      expect(result).toBeNull();
    });
  });

  // ─── getEligibleNonVoters ────────────────────────────────────

  describe('getEligibleNonVoters', () => {
    it('should return user IDs that have not checked in', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', stationCheckinAt: null, remindersEnabled: true },
        { appUserId: 'u-2', stationCheckinAt: null, remindersEnabled: true },
      ]);

      const result = await service.getEligibleNonVoters('e-1');
      expect(result).toEqual(['u-1', 'u-2']);
    });

    it('should filter out checked-in members (handled by repo query)', async () => {
      // The repository query filters stationCheckinAt: IsNull(),
      // so checked-in members won't be returned
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', stationCheckinAt: null, remindersEnabled: true },
      ]);

      const result = await service.getEligibleNonVoters('e-1');
      expect(result).toEqual(['u-1']);
      expect(result).not.toContain('u-3');
    });

    it('should return empty array when all members voted', async () => {
      gotvRepo.find.mockResolvedValue([]);

      const result = await service.getEligibleNonVoters('e-1');
      expect(result).toEqual([]);
    });
  });

  // ─── sendPreElectionReminder ─────────────────────────────────

  describe('sendPreElectionReminder', () => {
    it('should send to eligible users at 7 days', async () => {
      const election = {
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        isActive: true,
        electionDate: new Date('2026-03-25'),
      };
      electionRepo.findOne
        .mockResolvedValueOnce(null) // no VOTING
        .mockResolvedValueOnce(election); // UPCOMING

      // Users without plan
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
        { appUserId: 'u-2', remindersEnabled: true },
      ]);

      // Both users have notifGotv=true
      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }, { id: 'u-2' }]) // filterByGotvPreference
        .mockResolvedValueOnce([
          { id: 'u-1', quietHoursStart: null, quietHoursEnd: null },
          { id: 'u-2', quietHoursStart: null, quietHoursEnd: null },
        ]); // filterByQuietHoursAndCap

      // Active push tokens
      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
        { userId: 'u-2', token: 'tok-2', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);

      mockPushService.sendToAll.mockResolvedValue({ sent: 2, failed: 0 });

      const result = await service.sendPreElectionReminder(7);

      expect(result.sent).toBe(2);
      expect(mockPushService.sendToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'הפריימריז בעוד שבוע!',
          body: 'ודא/י שאת/ה זכאי/ת להצביע',
        }),
      );
    });

    it('should skip if no active election', async () => {
      electionRepo.findOne.mockResolvedValue(null);

      const result = await service.sendPreElectionReminder(7);

      expect(result).toEqual({ sent: 0, skipped: 0 });
      expect(mockPushService.sendToAll).not.toHaveBeenCalled();
    });

    it('should skip if no eligible users without plans', async () => {
      const election = {
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        isActive: true,
        electionDate: new Date('2026-03-25'),
      };
      electionRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(election);

      gotvRepo.find.mockResolvedValue([]);

      const result = await service.sendPreElectionReminder(7);

      expect(result).toEqual({ sent: 0, skipped: 0 });
      expect(mockPushService.sendToAll).not.toHaveBeenCalled();
    });

    it('should respect user notification preferences', async () => {
      const election = {
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        isActive: true,
        electionDate: new Date('2026-03-25'),
      };
      electionRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(election);

      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
        { appUserId: 'u-2', remindersEnabled: true },
      ]);

      // Only u-1 has notifGotv enabled
      appUserRepo.find.mockResolvedValueOnce([{ id: 'u-1' }]);
      appUserRepo.find.mockResolvedValueOnce([
        { id: 'u-1', quietHoursStart: null, quietHoursEnd: null },
      ]);

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);

      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendPreElectionReminder(3);

      expect(result.sent).toBe(1);
    });
  });

  // ─── sendElectionDayMorning ──────────────────────────────────

  describe('sendElectionDayMorning', () => {
    it('should send to non-checked-in members', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
        { appUserId: 'u-2', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }, { id: 'u-2' }])
        .mockResolvedValueOnce([
          { id: 'u-1', quietHoursStart: null, quietHoursEnd: null },
          { id: 'u-2', quietHoursStart: null, quietHoursEnd: null },
        ]);

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
        { userId: 'u-2', token: 'tok-2', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);

      mockPushService.sendToAll.mockResolvedValue({ sent: 2, failed: 0 });

      const result = await service.sendElectionDayMorning('e-1');

      expect(result.sent).toBe(2);
      expect(mockPushService.sendToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'הקלפיות נפתחו!',
        }),
      );
    });

    it('should return zero if no eligible non-voters', async () => {
      gotvRepo.find.mockResolvedValue([]);

      const result = await service.sendElectionDayMorning('e-1');

      expect(result).toEqual({ sent: 0, skipped: 0 });
    });
  });

  // ─── sendElectionDayMidday ───────────────────────────────────

  describe('sendElectionDayMidday', () => {
    it('should include turnout percentage in body', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }])
        .mockResolvedValueOnce([
          { id: 'u-1', quietHoursStart: null, quietHoursEnd: null },
        ]);

      // Turnout calculation: 30 total, 15 checked in = 50%
      gotvRepo.count
        .mockResolvedValueOnce(30) // total engaged
        .mockResolvedValueOnce(15); // checked in

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);

      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendElectionDayMidday('e-1');

      expect(result.sent).toBe(1);
      expect(mockPushService.sendToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('50%'),
        }),
      );
    });
  });

  // ─── sendElectionDayFinal ────────────────────────────────────

  describe('sendElectionDayFinal', () => {
    it('should send with urgency to non-checked-in members', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }])
        .mockResolvedValueOnce([
          { id: 'u-1', quietHoursStart: null, quietHoursEnd: null },
        ]);

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);

      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendElectionDayFinal('e-1');

      expect(result.sent).toBe(1);
      expect(mockPushService.sendToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'נותרו 2.5 שעות!',
          body: 'אם טרם הצבעת, עכשיו הזמן',
          data: expect.objectContaining({ urgency: 'high' }),
        }),
      );
    });

    it('should return zero when no non-voters', async () => {
      gotvRepo.find.mockResolvedValue([]);

      const result = await service.sendElectionDayFinal('e-1');

      expect(result).toEqual({ sent: 0, skipped: 0 });
    });
  });

  // ─── Notifications recorded in gotv_engagement ───────────────

  describe('notification recording', () => {
    it('should record notification in gotv_engagement after sending', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }])
        .mockResolvedValueOnce([
          { id: 'u-1', quietHoursStart: null, quietHoursEnd: null },
        ]);

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);

      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      await service.sendElectionDayMorning('e-1');

      // Verify createQueryBuilder was called for updating notification log
      expect(gotvRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qb.update).toHaveBeenCalled();
      expect(qb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationsSent: expect.any(Function),
          notificationLog: expect.any(Function),
        }),
      );
      expect(qb.execute).toHaveBeenCalled();
    });
  });
});
