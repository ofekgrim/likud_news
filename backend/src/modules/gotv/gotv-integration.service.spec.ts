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

/**
 * Helper to set up the full "happy path" mocks for a push scenario.
 * Returns the repos for further customization.
 */
function setupHappyPath(
  gotvRepo: ReturnType<typeof mockRepository>,
  appUserRepo: ReturnType<typeof mockRepository>,
  pushTokenRepo: ReturnType<typeof mockRepository>,
  userIds: string[],
) {
  // Users with engagement
  gotvRepo.find.mockResolvedValue(
    userIds.map((id) => ({ appUserId: id, remindersEnabled: true })),
  );
  // All users have notifGotv enabled
  appUserRepo.find
    .mockResolvedValueOnce(userIds.map((id) => ({ id })))
    .mockResolvedValueOnce(
      userIds.map((id) => ({ id, quietHoursStart: null, quietHoursEnd: null })),
    );
  // All users have active push tokens
  pushTokenRepo.find.mockResolvedValue(
    userIds.map((id) => ({ userId: id, token: `tok-${id}`, isActive: true })),
  );
  // Query builder for notification recording
  const qb = mockQueryBuilder();
  gotvRepo.createQueryBuilder.mockReturnValue(qb);
}

describe('GotvPushService (integration)', () => {
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

    mockPushService.isInQuietHours.mockReturnValue(false);
    mockPushService.checkFrequencyCap.mockResolvedValue(true);
    mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

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

  // ---------------------------------------------------------------------------
  // Full push sequence: pre-election reminders
  // ---------------------------------------------------------------------------
  describe('full push sequence', () => {
    const election = {
      id: 'e-1',
      status: ElectionStatus.UPCOMING,
      isActive: true,
      electionDate: new Date('2026-03-25'),
    };

    beforeEach(() => {
      electionRepo.findOne
        .mockResolvedValueOnce(null) // no VOTING
        .mockResolvedValueOnce(election); // UPCOMING
    });

    it('should send 7-day pre-election reminder with correct message', async () => {
      setupHappyPath(gotvRepo, appUserRepo, pushTokenRepo, ['u-1', 'u-2']);
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

    it('should send 3-day pre-election reminder with correct message', async () => {
      // Reset election mock for this test
      electionRepo.findOne.mockReset();
      electionRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(election);

      setupHappyPath(gotvRepo, appUserRepo, pushTokenRepo, ['u-1']);
      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendPreElectionReminder(3);

      expect(result.sent).toBe(1);
      expect(mockPushService.sendToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'עוד 3 ימים לפריימריז',
          body: 'בדוק/י את תחנת ההצבעה שלך',
        }),
      );
    });

    it('should send 1-day pre-election reminder with correct message', async () => {
      electionRepo.findOne.mockReset();
      electionRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(election);

      setupHappyPath(gotvRepo, appUserRepo, pushTokenRepo, ['u-1']);
      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendPreElectionReminder(1);

      expect(result.sent).toBe(1);
      expect(mockPushService.sendToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'מחר הפריימריז!',
          body: 'הכנ/י תעודת זהות ובדוק/י שעות פתיחה',
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // sendPreElectionReminder audience targeting
  // ---------------------------------------------------------------------------
  describe('sendPreElectionReminder targeting', () => {
    it('should target users who are eligible but have no voting plan and have reminders enabled', async () => {
      const election = {
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        isActive: true,
        electionDate: new Date('2026-03-25'),
      };
      electionRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(election);

      setupHappyPath(gotvRepo, appUserRepo, pushTokenRepo, ['u-1']);
      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      await service.sendPreElectionReminder(7);

      // Verify gotvRepo.find was called (for getEligibleWithoutPlan)
      expect(gotvRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            electionId: 'e-1',
            remindersEnabled: true,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // sendElectionDayMorning
  // ---------------------------------------------------------------------------
  describe('sendElectionDayMorning', () => {
    it('should exclude already checked-in users', async () => {
      // getEligibleNonVoters returns users not checked in
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', stationCheckinAt: null, remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }])
        .mockResolvedValueOnce([{ id: 'u-1', quietHoursStart: null, quietHoursEnd: null }]);

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);
      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendElectionDayMorning('e-1');

      expect(result.sent).toBe(1);
      // Verify the query was for non-checked-in users
      expect(gotvRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            electionId: 'e-1',
            remindersEnabled: true,
          }),
        }),
      );
    });

    it('should return zero when all eligible members have already checked in', async () => {
      gotvRepo.find.mockResolvedValue([]);

      const result = await service.sendElectionDayMorning('e-1');

      expect(result).toEqual({ sent: 0, skipped: 0 });
      expect(mockPushService.sendToAll).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // sendElectionDayMidday
  // ---------------------------------------------------------------------------
  describe('sendElectionDayMidday', () => {
    it('should include turnout percentage in notification message', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }])
        .mockResolvedValueOnce([{ id: 'u-1', quietHoursStart: null, quietHoursEnd: null }]);

      // Turnout: 30 total, 12 checked in = 40%
      gotvRepo.count
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(12);

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
          body: expect.stringContaining('40%'),
        }),
      );
    });

    it('should return zero when no eligible non-voters', async () => {
      gotvRepo.find.mockResolvedValue([]);

      const result = await service.sendElectionDayMidday('e-1');

      expect(result).toEqual({ sent: 0, skipped: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // sendElectionDayFinal
  // ---------------------------------------------------------------------------
  describe('sendElectionDayFinal', () => {
    it('should send with higher urgency messaging', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }])
        .mockResolvedValueOnce([{ id: 'u-1', quietHoursStart: null, quietHoursEnd: null }]);

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
          data: expect.objectContaining({
            urgency: 'high',
            reminderType: 'final',
          }),
        }),
      );
    });

    it('should return zero when no non-voters remain', async () => {
      gotvRepo.find.mockResolvedValue([]);

      const result = await service.sendElectionDayFinal('e-1');

      expect(result).toEqual({ sent: 0, skipped: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // Notification preferences (notifGotv=false)
  // ---------------------------------------------------------------------------
  describe('notification preferences', () => {
    it('should skip users with notifGotv=false', async () => {
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
        { appUserId: 'u-3', remindersEnabled: true },
      ]);

      // Only u-1 has notifGotv enabled; u-2 and u-3 opted out
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

      const result = await service.sendPreElectionReminder(7);

      expect(result.sent).toBe(1);
    });

    it('should return skipped count when all users opted out', async () => {
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

      // No users have notifGotv enabled
      appUserRepo.find.mockResolvedValueOnce([]);

      const result = await service.sendPreElectionReminder(7);

      expect(result.sent).toBe(0);
      expect(result.skipped).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Quiet hours
  // ---------------------------------------------------------------------------
  describe('quiet hours respected', () => {
    it('should skip users in quiet hours', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
        { appUserId: 'u-2', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }, { id: 'u-2' }])
        .mockResolvedValueOnce([
          { id: 'u-1', quietHoursStart: null, quietHoursEnd: null },
          { id: 'u-2', quietHoursStart: '22:00', quietHoursEnd: '07:00' },
        ]);

      // u-2 is in quiet hours
      mockPushService.isInQuietHours.mockImplementation((user: any) => {
        return user.id === 'u-2';
      });

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);
      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendElectionDayMorning('e-1');

      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Frequency cap
  // ---------------------------------------------------------------------------
  describe('frequency cap respected', () => {
    it('should skip users who exceeded frequency cap', async () => {
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

      // u-2 exceeded frequency cap
      mockPushService.checkFrequencyCap.mockImplementation(async (userId: string) => {
        return userId !== 'u-2';
      });

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);
      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendElectionDayMorning('e-1');

      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Notification logging
  // ---------------------------------------------------------------------------
  describe('notification logged in gotv_engagement.notificationLog', () => {
    it('should record notification after sending morning reminder', async () => {
      gotvRepo.find.mockResolvedValue([
        { appUserId: 'u-1', remindersEnabled: true },
      ]);

      appUserRepo.find
        .mockResolvedValueOnce([{ id: 'u-1' }])
        .mockResolvedValueOnce([{ id: 'u-1', quietHoursStart: null, quietHoursEnd: null }]);

      pushTokenRepo.find.mockResolvedValue([
        { userId: 'u-1', token: 'tok-1', isActive: true },
      ]);

      const qb = mockQueryBuilder();
      gotvRepo.createQueryBuilder.mockReturnValue(qb);
      mockPushService.sendToAll.mockResolvedValue({ sent: 1, failed: 0 });

      await service.sendElectionDayMorning('e-1');

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

  // ---------------------------------------------------------------------------
  // No active election
  // ---------------------------------------------------------------------------
  describe('no active election', () => {
    it('should no-op gracefully when no active election for pre-election reminder', async () => {
      electionRepo.findOne.mockResolvedValue(null);

      const result = await service.sendPreElectionReminder(7);

      expect(result).toEqual({ sent: 0, skipped: 0 });
      expect(mockPushService.sendToAll).not.toHaveBeenCalled();
      expect(gotvRepo.find).not.toHaveBeenCalled();
    });
  });
});
