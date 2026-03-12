import { Test, TestingModule } from '@nestjs/testing';
import { GotvCronService } from './gotv-cron.service';
import { GotvPushService } from './gotv-push.service';
import { ElectionStatus } from '../elections/entities/primary-election.entity';

const mockGotvPushService = {
  getActiveElection: jest.fn(),
  sendPreElectionReminder: jest.fn().mockResolvedValue({ sent: 5, skipped: 0 }),
  sendElectionDayMorning: jest.fn().mockResolvedValue({ sent: 10, skipped: 2 }),
  sendElectionDayMidday: jest.fn().mockResolvedValue({ sent: 8, skipped: 4 }),
  sendElectionDayFinal: jest.fn().mockResolvedValue({ sent: 6, skipped: 3 }),
};

describe('GotvCronService', () => {
  let service: GotvCronService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GotvCronService,
        { provide: GotvPushService, useValue: mockGotvPushService },
      ],
    }).compile();

    service = module.get<GotvCronService>(GotvCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── handlePreElectionReminders ──────────────────────────────

  describe('handlePreElectionReminders', () => {
    it('should call sendPreElectionReminder(7) at 7 days before election', async () => {
      const electionDate = new Date();
      electionDate.setDate(electionDate.getDate() + 7);

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        electionDate,
      });

      await service.handlePreElectionReminders();

      expect(mockGotvPushService.sendPreElectionReminder).toHaveBeenCalledWith(7);
    });

    it('should call sendPreElectionReminder(3) at 3 days before election', async () => {
      const electionDate = new Date();
      electionDate.setDate(electionDate.getDate() + 3);

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        electionDate,
      });

      await service.handlePreElectionReminders();

      expect(mockGotvPushService.sendPreElectionReminder).toHaveBeenCalledWith(3);
    });

    it('should call sendPreElectionReminder(1) at 1 day before election', async () => {
      const electionDate = new Date();
      electionDate.setDate(electionDate.getDate() + 1);

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        electionDate,
      });

      await service.handlePreElectionReminders();

      expect(mockGotvPushService.sendPreElectionReminder).toHaveBeenCalledWith(1);
    });

    it('should do nothing if no active election', async () => {
      mockGotvPushService.getActiveElection.mockResolvedValue(null);

      await service.handlePreElectionReminders();

      expect(mockGotvPushService.sendPreElectionReminder).not.toHaveBeenCalled();
    });

    it('should do nothing if election is not at 7, 3, or 1 days away', async () => {
      const electionDate = new Date();
      electionDate.setDate(electionDate.getDate() + 5);

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        electionDate,
      });

      await service.handlePreElectionReminders();

      expect(mockGotvPushService.sendPreElectionReminder).not.toHaveBeenCalled();
    });
  });

  // ─── handleElectionDayMorning ────────────────────────────────

  describe('handleElectionDayMorning', () => {
    it('should call sendElectionDayMorning on election day', async () => {
      const today = new Date();

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.VOTING,
        electionDate: today,
      });

      await service.handleElectionDayMorning();

      expect(mockGotvPushService.sendElectionDayMorning).toHaveBeenCalledWith('e-1');
    });

    it('should not call sendElectionDayMorning if not election day', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        electionDate: tomorrow,
      });

      await service.handleElectionDayMorning();

      expect(mockGotvPushService.sendElectionDayMorning).not.toHaveBeenCalled();
    });

    it('should not call sendElectionDayMorning if no active election', async () => {
      mockGotvPushService.getActiveElection.mockResolvedValue(null);

      await service.handleElectionDayMorning();

      expect(mockGotvPushService.sendElectionDayMorning).not.toHaveBeenCalled();
    });
  });

  // ─── handleElectionDayMidday ─────────────────────────────────

  describe('handleElectionDayMidday', () => {
    it('should call sendElectionDayMidday on election day', async () => {
      const today = new Date();

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.VOTING,
        electionDate: today,
      });

      await service.handleElectionDayMidday();

      expect(mockGotvPushService.sendElectionDayMidday).toHaveBeenCalledWith('e-1');
    });

    it('should not call sendElectionDayMidday if not election day', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 2);

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.UPCOMING,
        electionDate: future,
      });

      await service.handleElectionDayMidday();

      expect(mockGotvPushService.sendElectionDayMidday).not.toHaveBeenCalled();
    });
  });

  // ─── handleElectionDayFinal ──────────────────────────────────

  describe('handleElectionDayFinal', () => {
    it('should call sendElectionDayFinal on election day', async () => {
      const today = new Date();

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.VOTING,
        electionDate: today,
      });

      await service.handleElectionDayFinal();

      expect(mockGotvPushService.sendElectionDayFinal).toHaveBeenCalledWith('e-1');
    });

    it('should not call sendElectionDayFinal if not election day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockGotvPushService.getActiveElection.mockResolvedValue({
        id: 'e-1',
        status: ElectionStatus.COMPLETED,
        electionDate: yesterday,
      });

      await service.handleElectionDayFinal();

      expect(mockGotvPushService.sendElectionDayFinal).not.toHaveBeenCalled();
    });

    it('should not call sendElectionDayFinal if no active election', async () => {
      mockGotvPushService.getActiveElection.mockResolvedValue(null);

      await service.handleElectionDayFinal();

      expect(mockGotvPushService.sendElectionDayFinal).not.toHaveBeenCalled();
    });
  });

  // ─── differenceInDays helper ─────────────────────────────────

  describe('differenceInDays', () => {
    it('should return positive for future dates', () => {
      const from = new Date('2026-03-10');
      const target = new Date('2026-03-17');
      expect(service.differenceInDays(target, from)).toBe(7);
    });

    it('should return 0 for same day', () => {
      const today = new Date();
      expect(service.differenceInDays(today, today)).toBe(0);
    });

    it('should return negative for past dates', () => {
      const from = new Date('2026-03-10');
      const target = new Date('2026-03-08');
      expect(service.differenceInDays(target, from)).toBe(-2);
    });
  });
});
