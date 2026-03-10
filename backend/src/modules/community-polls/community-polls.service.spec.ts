import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommunityPollsService } from './community-polls.service';
import { CommunityPoll } from './entities/community-poll.entity';
import { PollVote } from './entities/poll-vote.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { GamificationService } from '../gamification/gamification.service';

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
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  clone: jest.fn(),
});

describe('CommunityPollsService', () => {
  let service: CommunityPollsService;
  let pollRepository: jest.Mocked<Repository<CommunityPoll>>;
  let voteRepository: jest.Mocked<Repository<PollVote>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityPollsService,
        { provide: getRepositoryToken(CommunityPoll), useFactory: mockRepository },
        { provide: getRepositoryToken(PollVote), useFactory: mockRepository },
        { provide: NotificationsService, useValue: { triggerContentNotification: jest.fn().mockResolvedValue(undefined) } },
        { provide: GamificationService, useValue: { awardPoints: jest.fn().mockResolvedValue(undefined), trackAction: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<CommunityPollsService>(CommunityPollsService);
    pollRepository = module.get(getRepositoryToken(CommunityPoll));
    voteRepository = module.get(getRepositoryToken(PollVote));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all polls ordered by isPinned DESC, createdAt DESC', async () => {
      const polls = [
        { id: 'poll-1', question: 'Q1', isPinned: true },
        { id: 'poll-2', question: 'Q2', isPinned: false },
      ] as CommunityPoll[];

      const mockQb = mockQueryBuilder();
      mockQb.getMany.mockResolvedValue(polls);
      pollRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findAll();

      expect(result).toEqual(polls);
      expect(pollRepository.createQueryBuilder).toHaveBeenCalledWith('poll');
      expect(mockQb.orderBy).toHaveBeenCalledWith('poll.isPinned', 'DESC');
      expect(mockQb.addOrderBy).toHaveBeenCalledWith('poll.createdAt', 'DESC');
      expect(mockQb.where).not.toHaveBeenCalled();
    });

    it('should filter by isActive when provided', async () => {
      const activePolls = [
        { id: 'poll-1', question: 'Q1', isActive: true },
      ] as CommunityPoll[];

      const mockQb = mockQueryBuilder();
      mockQb.getMany.mockResolvedValue(activePolls);
      pollRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findAll(true);

      expect(result).toEqual(activePolls);
      expect(mockQb.where).toHaveBeenCalledWith('poll.isActive = :isActive', {
        isActive: true,
      });
    });

    it('should filter by isActive=false when explicitly false', async () => {
      const mockQb = mockQueryBuilder();
      mockQb.getMany.mockResolvedValue([]);
      pollRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.findAll(false);

      expect(mockQb.where).toHaveBeenCalledWith('poll.isActive = :isActive', {
        isActive: false,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a poll by id', async () => {
      const poll = {
        id: 'poll-1',
        question: 'Best PM?',
        options: [{ label: 'A', voteCount: 0 }],
        totalVotes: 0,
        isActive: true,
      } as CommunityPoll;

      pollRepository.findOne.mockResolvedValue(poll);

      const result = await service.findOne('poll-1');

      expect(result).toEqual(poll);
      expect(pollRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'poll-1' },
      });
    });

    it('should throw NotFoundException when poll not found', async () => {
      pollRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a poll with options initialized to voteCount 0', async () => {
      const dto = {
        question: 'Best PM?',
        description: 'Vote for the best PM',
        options: [{ label: 'Bibi' }, { label: 'Gantz' }, { label: 'Lapid' }],
        isPinned: true,
      } as any;

      const createdPoll = {
        id: 'poll-1',
        question: 'Best PM?',
        description: 'Vote for the best PM',
        options: [
          { label: 'Bibi', voteCount: 0 },
          { label: 'Gantz', voteCount: 0 },
          { label: 'Lapid', voteCount: 0 },
        ],
        isPinned: true,
        totalVotes: 0,
        isActive: true,
      } as CommunityPoll;

      pollRepository.create.mockReturnValue(createdPoll);
      pollRepository.save.mockResolvedValue(createdPoll);

      const result = await service.create(dto);

      expect(result).toEqual(createdPoll);
      expect(pollRepository.create).toHaveBeenCalledWith({
        question: 'Best PM?',
        description: 'Vote for the best PM',
        options: [
          { label: 'Bibi', voteCount: 0 },
          { label: 'Gantz', voteCount: 0 },
          { label: 'Lapid', voteCount: 0 },
        ],
        isPinned: true,
      });
      expect(pollRepository.save).toHaveBeenCalledWith(createdPoll);
    });

    it('should default isPinned to false when not provided', async () => {
      const dto = {
        question: 'Question?',
        options: [{ label: 'Yes' }, { label: 'No' }],
      } as any;

      const createdPoll = {
        id: 'poll-2',
        question: 'Question?',
        options: [
          { label: 'Yes', voteCount: 0 },
          { label: 'No', voteCount: 0 },
        ],
        isPinned: false,
      } as CommunityPoll;

      pollRepository.create.mockReturnValue(createdPoll);
      pollRepository.save.mockResolvedValue(createdPoll);

      await service.create(dto);

      expect(pollRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPinned: false }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update poll fields and save', async () => {
      const existingPoll = {
        id: 'poll-1',
        question: 'Old question?',
        isPinned: false,
        isActive: true,
      } as CommunityPoll;

      const dto = { question: 'New question?', isPinned: true } as any;

      pollRepository.findOne.mockResolvedValue(existingPoll);
      pollRepository.save.mockResolvedValue({
        ...existingPoll,
        ...dto,
      } as CommunityPoll);

      const result = await service.update('poll-1', dto);

      expect(result.question).toBe('New question?');
      expect(result.isPinned).toBe(true);
      expect(pollRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a nonexistent poll', async () => {
      pollRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // closePoll
  // ---------------------------------------------------------------------------
  describe('closePoll', () => {
    it('should set closedAt and isActive=false', async () => {
      const poll = {
        id: 'poll-1',
        isActive: true,
        closedAt: null,
      } as CommunityPoll;

      pollRepository.findOne.mockResolvedValue(poll);
      pollRepository.save.mockImplementation(async (p) => p as CommunityPoll);

      const result = await service.closePoll('poll-1');

      expect(result.isActive).toBe(false);
      expect(result.closedAt).toBeInstanceOf(Date);
      expect(pollRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when closing a nonexistent poll', async () => {
      pollRepository.findOne.mockResolvedValue(null);

      await expect(service.closePoll('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // vote
  // ---------------------------------------------------------------------------
  describe('vote', () => {
    const activePoll = {
      id: 'poll-1',
      question: 'Best PM?',
      options: [
        { label: 'Bibi', voteCount: 5 },
        { label: 'Gantz', voteCount: 3 },
      ],
      totalVotes: 8,
      isActive: true,
      closedAt: null,
    } as CommunityPoll;

    it('should successfully cast a vote and increment counts', async () => {
      pollRepository.findOne.mockResolvedValue({ ...activePoll });
      voteRepository.findOne.mockResolvedValue(null);

      const createdVote = {
        id: 'vote-1',
        pollId: 'poll-1',
        userId: 'user-1',
        optionIndex: 0,
      } as PollVote;
      voteRepository.create.mockReturnValue(createdVote);
      voteRepository.save.mockResolvedValue(createdVote);

      pollRepository.save.mockImplementation(async (p) => p as CommunityPoll);

      const result = await service.vote('user-1', 'poll-1', { optionIndex: 0 });

      expect(result.totalVotes).toBe(9);
      expect(result.options[0].voteCount).toBe(6);
      expect(result.options[1].voteCount).toBe(3);
      expect(voteRepository.create).toHaveBeenCalledWith({
        pollId: 'poll-1',
        userId: 'user-1',
        optionIndex: 0,
      });
      expect(voteRepository.save).toHaveBeenCalledWith(createdVote);
      expect(pollRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when poll is inactive', async () => {
      const inactivePoll = { ...activePoll, isActive: false };
      pollRepository.findOne.mockResolvedValue(inactivePoll);

      await expect(
        service.vote('user-1', 'poll-1', { optionIndex: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when poll is closed', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const closedPoll = { ...activePoll, closedAt: pastDate };
      pollRepository.findOne.mockResolvedValue(closedPoll);

      await expect(
        service.vote('user-1', 'poll-1', { optionIndex: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid option index (negative)', async () => {
      pollRepository.findOne.mockResolvedValue({ ...activePoll });

      await expect(
        service.vote('user-1', 'poll-1', { optionIndex: -1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid option index (out of bounds)', async () => {
      pollRepository.findOne.mockResolvedValue({ ...activePoll });

      await expect(
        service.vote('user-1', 'poll-1', { optionIndex: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when user has already voted', async () => {
      pollRepository.findOne.mockResolvedValue({ ...activePoll });
      voteRepository.findOne.mockResolvedValue({
        id: 'existing-vote',
        pollId: 'poll-1',
        userId: 'user-1',
        optionIndex: 1,
      } as PollVote);

      await expect(
        service.vote('user-1', 'poll-1', { optionIndex: 0 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // getUserVote
  // ---------------------------------------------------------------------------
  describe('getUserVote', () => {
    it('should return voted=true with optionIndex when user has voted', async () => {
      voteRepository.findOne.mockResolvedValue({
        id: 'vote-1',
        pollId: 'poll-1',
        userId: 'user-1',
        optionIndex: 2,
      } as PollVote);

      const result = await service.getUserVote('user-1', 'poll-1');

      expect(result).toEqual({ voted: true, optionIndex: 2 });
      expect(voteRepository.findOne).toHaveBeenCalledWith({
        where: { pollId: 'poll-1', userId: 'user-1' },
      });
    });

    it('should return voted=false with optionIndex=null when user has not voted', async () => {
      voteRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserVote('user-1', 'poll-1');

      expect(result).toEqual({ voted: false, optionIndex: null });
    });
  });

  // ---------------------------------------------------------------------------
  // getResults
  // ---------------------------------------------------------------------------
  describe('getResults', () => {
    it('should calculate percentages correctly', async () => {
      const poll = {
        id: 'poll-1',
        question: 'Best PM?',
        options: [
          { label: 'Bibi', voteCount: 60 },
          { label: 'Gantz', voteCount: 30 },
          { label: 'Lapid', voteCount: 10 },
        ],
        totalVotes: 100,
      } as CommunityPoll;

      pollRepository.findOne.mockResolvedValue(poll);

      const result = await service.getResults('poll-1');

      expect(result.poll).toEqual(poll);
      expect(result.results).toEqual([
        { label: 'Bibi', voteCount: 60, percentage: 60 },
        { label: 'Gantz', voteCount: 30, percentage: 30 },
        { label: 'Lapid', voteCount: 10, percentage: 10 },
      ]);
    });

    it('should return 0% for all options when totalVotes is 0', async () => {
      const poll = {
        id: 'poll-2',
        question: 'New poll?',
        options: [
          { label: 'Yes', voteCount: 0 },
          { label: 'No', voteCount: 0 },
        ],
        totalVotes: 0,
      } as CommunityPoll;

      pollRepository.findOne.mockResolvedValue(poll);

      const result = await service.getResults('poll-2');

      expect(result.results).toEqual([
        { label: 'Yes', voteCount: 0, percentage: 0 },
        { label: 'No', voteCount: 0, percentage: 0 },
      ]);
    });

    it('should calculate non-trivial percentages with decimal precision', async () => {
      const poll = {
        id: 'poll-3',
        question: 'Favorite color?',
        options: [
          { label: 'Blue', voteCount: 1 },
          { label: 'Red', voteCount: 2 },
        ],
        totalVotes: 3,
      } as CommunityPoll;

      pollRepository.findOne.mockResolvedValue(poll);

      const result = await service.getResults('poll-3');

      expect(result.results[0].percentage).toBe(33.33);
      expect(result.results[1].percentage).toBe(66.67);
    });

    it('should throw NotFoundException when poll does not exist', async () => {
      pollRepository.findOne.mockResolvedValue(null);

      await expect(service.getResults('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
