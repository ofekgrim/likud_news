import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { GotvService } from './gotv.service';
import { GotvEngagement } from './entities/gotv-engagement.entity';
import { PollingStation } from '../polling-stations/entities/polling-station.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { PushToken } from '../push/entities/push-token.entity';
import { VotingEligibility } from '../app-users/entities/voting-eligibility.entity';
import { UserBadge, BadgeType } from '../gamification/entities/user-badge.entity';
import { GamificationService } from '../gamification/gamification.service';
import { PointAction } from '../gamification/entities/user-points.entity';
import { PushService } from '../push/push.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
});

const mockGamificationService = {
  awardPoints: jest.fn(),
};

const mockPushService = {
  sendToAll: jest.fn(),
};

describe('GotvService', () => {
  let service: GotvService;
  let gotvRepo: jest.Mocked<Repository<GotvEngagement>>;
  let stationRepo: jest.Mocked<Repository<PollingStation>>;
  let electionRepo: jest.Mocked<Repository<PrimaryElection>>;
  let userBadgeRepo: jest.Mocked<Repository<UserBadge>>;
  let eligibilityRepo: jest.Mocked<Repository<VotingEligibility>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GotvService,
        { provide: getRepositoryToken(GotvEngagement), useFactory: mockRepository },
        { provide: getRepositoryToken(PollingStation), useFactory: mockRepository },
        { provide: getRepositoryToken(PrimaryElection), useFactory: mockRepository },
        { provide: getRepositoryToken(PushToken), useFactory: mockRepository },
        { provide: getRepositoryToken(VotingEligibility), useFactory: mockRepository },
        { provide: getRepositoryToken(UserBadge), useFactory: mockRepository },
        { provide: GamificationService, useValue: mockGamificationService },
        { provide: PushService, useValue: mockPushService },
      ],
    }).compile();

    service = module.get<GotvService>(GotvService);
    gotvRepo = module.get(getRepositoryToken(GotvEngagement));
    stationRepo = module.get(getRepositoryToken(PollingStation));
    electionRepo = module.get(getRepositoryToken(PrimaryElection));
    userBadgeRepo = module.get(getRepositoryToken(UserBadge));
    eligibilityRepo = module.get(getRepositoryToken(VotingEligibility));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // saveVotingPlan
  // ---------------------------------------------------------------------------
  describe('saveVotingPlan', () => {
    it('should create a new engagement when none exists', async () => {
      electionRepo.findOne.mockResolvedValue({ id: 'election-1' } as PrimaryElection);
      gotvRepo.findOne.mockResolvedValue(null);

      const created = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        votingPlanTime: new Date('2026-03-15T10:00:00Z'),
      } as GotvEngagement;

      gotvRepo.create.mockReturnValue(created);
      gotvRepo.save.mockResolvedValue(created);

      const result = await service.saveVotingPlan(
        'user-1',
        'election-1',
        '2026-03-15T10:00:00Z',
      );

      expect(result).toEqual(created);
      expect(gotvRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appUserId: 'user-1',
          electionId: 'election-1',
        }),
      );
      expect(gotvRepo.save).toHaveBeenCalled();
    });

    it('should update existing engagement when one exists', async () => {
      electionRepo.findOne.mockResolvedValue({ id: 'election-1' } as PrimaryElection);
      stationRepo.findOne.mockResolvedValue({ id: 'station-1' } as PollingStation);

      const existing = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        votingPlanTime: new Date('2026-03-15T08:00:00Z'),
        plannedStationId: null,
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(existing);
      gotvRepo.save.mockImplementation(async (e) => e as GotvEngagement);

      const result = await service.saveVotingPlan(
        'user-1',
        'election-1',
        '2026-03-15T14:00:00Z',
        'station-1',
      );

      expect(result.plannedStationId).toBe('station-1');
      expect(gotvRepo.create).not.toHaveBeenCalled();
      expect(gotvRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when election does not exist', async () => {
      electionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.saveVotingPlan('user-1', 'nonexistent', '2026-03-15T10:00:00Z'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when station does not exist', async () => {
      electionRepo.findOne.mockResolvedValue({ id: 'election-1' } as PrimaryElection);
      stationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.saveVotingPlan('user-1', 'election-1', '2026-03-15T10:00:00Z', 'bad-station'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // recordCheckin
  // ---------------------------------------------------------------------------
  describe('recordCheckin', () => {
    // Tel Aviv station coordinates
    const stationLat = 32.0853;
    const stationLon = 34.7818;

    // A point ~100m from station (within 500m)
    const nearbyLat = 32.0862;
    const nearbyLon = 34.7818;

    // A point ~2km from station (outside 500m)
    const farLat = 32.1050;
    const farLon = 34.7818;

    it('should succeed when user is within 500m of station', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        stationCheckinAt: null,
        plannedStationId: 'station-1',
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);
      stationRepo.find.mockResolvedValue([
        {
          id: 'station-1',
          electionId: 'election-1',
          isActive: true,
          latitude: stationLat,
          longitude: stationLon,
        } as any,
      ]);
      gotvRepo.save.mockImplementation(async (e) => e as GotvEngagement);

      const result = await service.recordCheckin(
        'user-1',
        'election-1',
        nearbyLat,
        nearbyLon,
      );

      expect(result.stationCheckinAt).toBeDefined();
      expect(gotvRepo.save).toHaveBeenCalled();
    });

    it('should fail when user is more than 500m from station', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        stationCheckinAt: null,
        plannedStationId: 'station-1',
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);
      stationRepo.find.mockResolvedValue([
        {
          id: 'station-1',
          electionId: 'election-1',
          isActive: true,
          latitude: stationLat,
          longitude: stationLon,
        } as any,
      ]);

      await expect(
        service.recordCheckin('user-1', 'election-1', farLat, farLon),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no voting plan exists', async () => {
      gotvRepo.findOne.mockResolvedValue(null);

      await expect(
        service.recordCheckin('user-1', 'election-1', nearbyLat, nearbyLon),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already checked in', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        stationCheckinAt: new Date(),
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);

      await expect(
        service.recordCheckin('user-1', 'election-1', nearbyLat, nearbyLon),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when no stations exist for election', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        stationCheckinAt: null,
        plannedStationId: null,
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);
      stationRepo.find.mockResolvedValue([]);

      await expect(
        service.recordCheckin('user-1', 'election-1', nearbyLat, nearbyLon),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // claimIVotedBadge
  // ---------------------------------------------------------------------------
  describe('claimIVotedBadge', () => {
    it('should award badge and points when user has checked in', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        stationCheckinAt: new Date(),
        votedBadgeClaimedAt: null,
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);
      gotvRepo.save.mockImplementation(async (e) => e as GotvEngagement);
      mockGamificationService.awardPoints.mockResolvedValue({});
      userBadgeRepo.create.mockReturnValue({} as UserBadge);
      userBadgeRepo.save.mockResolvedValue({} as UserBadge);

      const result = await service.claimIVotedBadge('user-1', 'election-1');

      expect(result.votedBadgeClaimedAt).toBeDefined();
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith({
        userId: 'user-1',
        action: PointAction.PROFILE_COMPLETE,
        points: 50,
        metadata: { source: 'gotv_i_voted', electionId: 'election-1' },
      });
      expect(userBadgeRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        badgeType: BadgeType.I_VOTED,
      });
      expect(userBadgeRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has not checked in', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        stationCheckinAt: null,
        votedBadgeClaimedAt: null,
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);

      await expect(
        service.claimIVotedBadge('user-1', 'election-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no engagement exists', async () => {
      gotvRepo.findOne.mockResolvedValue(null);

      await expect(
        service.claimIVotedBadge('user-1', 'election-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when badge already claimed', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        stationCheckinAt: new Date(),
        votedBadgeClaimedAt: new Date(),
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);

      await expect(
        service.claimIVotedBadge('user-1', 'election-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // getGotvStatus
  // ---------------------------------------------------------------------------
  describe('getGotvStatus', () => {
    it('should return full state when engagement exists', async () => {
      const engagement = {
        id: 'eng-1',
        appUserId: 'user-1',
        electionId: 'election-1',
        votingPlanTime: new Date('2026-03-15T10:00:00Z'),
        plannedStationId: 'station-1',
        stationCheckinAt: new Date('2026-03-15T10:30:00Z'),
        votedBadgeClaimedAt: new Date('2026-03-15T11:00:00Z'),
        notificationsSent: 3,
        remindersSnoozed: ['pre_election_7d'],
      } as GotvEngagement;

      gotvRepo.findOne.mockResolvedValue(engagement);

      const result = await service.getGotvStatus('user-1', 'election-1');

      expect(result).toEqual({
        hasPlan: true,
        votingPlanTime: engagement.votingPlanTime,
        plannedStationId: 'station-1',
        hasCheckedIn: true,
        stationCheckinAt: engagement.stationCheckinAt,
        hasBadge: true,
        votedBadgeClaimedAt: engagement.votedBadgeClaimedAt,
        notificationsSent: 3,
        remindersSnoozed: ['pre_election_7d'],
      });
    });

    it('should return default empty state when no engagement exists', async () => {
      gotvRepo.findOne.mockResolvedValue(null);

      const result = await service.getGotvStatus('user-1', 'election-1');

      expect(result).toEqual({
        hasPlan: false,
        votingPlanTime: null,
        plannedStationId: null,
        hasCheckedIn: false,
        stationCheckinAt: null,
        hasBadge: false,
        votedBadgeClaimedAt: null,
        notificationsSent: 0,
        remindersSnoozed: [],
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getBranchTurnout
  // ---------------------------------------------------------------------------
  describe('getBranchTurnout', () => {
    it('should return district data sorted by turnout descending', async () => {
      const eligibleQb = mockQueryBuilder();
      eligibleQb.getRawMany.mockResolvedValue([
        { branch: 'Tel Aviv', eligibleCount: '100' },
        { branch: 'Haifa', eligibleCount: '50' },
      ]);
      eligibilityRepo.createQueryBuilder.mockReturnValue(eligibleQb as any);

      const checkedInQb = mockQueryBuilder();
      checkedInQb.getRawMany.mockResolvedValue([
        { branch: 'Tel Aviv', checkedInCount: '30' },
        { branch: 'Haifa', checkedInCount: '40' },
      ]);
      gotvRepo.createQueryBuilder.mockReturnValue(checkedInQb as any);

      const result = await service.getBranchTurnout('election-1');

      expect(result).toHaveLength(2);
      // Haifa: 40/50 = 80% should come first
      expect(result[0].branch).toBe('Haifa');
      expect(result[0].eligibleCount).toBe(50);
      expect(result[0].checkedInCount).toBe(40);
      expect(result[0].turnoutPercent).toBe(80);
      // Tel Aviv: 30/100 = 30%
      expect(result[1].branch).toBe('Tel Aviv');
      expect(result[1].turnoutPercent).toBe(30);
    });

    it('should handle branches with zero eligible users', async () => {
      const eligibleQb = mockQueryBuilder();
      eligibleQb.getRawMany.mockResolvedValue([
        { branch: 'Empty City', eligibleCount: '0' },
      ]);
      eligibilityRepo.createQueryBuilder.mockReturnValue(eligibleQb as any);

      const checkedInQb = mockQueryBuilder();
      checkedInQb.getRawMany.mockResolvedValue([]);
      gotvRepo.createQueryBuilder.mockReturnValue(checkedInQb as any);

      const result = await service.getBranchTurnout('election-1');

      expect(result[0].turnoutPercent).toBe(0);
      expect(result[0].checkedInCount).toBe(0);
    });
  });
});
