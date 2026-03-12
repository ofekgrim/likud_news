import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserFollowsService } from './user-follows.service';
import { UserFollow } from './entities/user-follow.entity';
import {
  UserContentFollow,
  ContentFollowType,
} from './entities/user-content-follow.entity';

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

describe('UserFollowsService', () => {
  let service: UserFollowsService;
  let repository: ReturnType<typeof mockRepository>;
  let contentFollowRepository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFollowsService,
        {
          provide: getRepositoryToken(UserFollow),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(UserContentFollow),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserFollowsService>(UserFollowsService);
    repository = module.get(getRepositoryToken(UserFollow));
    contentFollowRepository = module.get(getRepositoryToken(UserContentFollow));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('follow', () => {
    const followerId = 'user-uuid-1';
    const followeeId = 'member-uuid-1';

    it('should create a new follow relationship', async () => {
      const follow = { id: 'follow-uuid', followerId, followeeId, createdAt: new Date() };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(follow);
      repository.save.mockResolvedValue(follow);

      const result = await service.follow(followerId, followeeId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { followerId, followeeId },
      });
      expect(repository.create).toHaveBeenCalledWith({ followerId, followeeId });
      expect(repository.save).toHaveBeenCalledWith(follow);
      expect(result).toEqual(follow);
    });

    it('should throw ConflictException when already following', async () => {
      const existing = { id: 'follow-uuid', followerId, followeeId };
      repository.findOne.mockResolvedValue(existing);

      await expect(service.follow(followerId, followeeId)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    const followerId = 'user-uuid-1';
    const followeeId = 'member-uuid-1';

    it('should remove an existing follow relationship', async () => {
      const existing = { id: 'follow-uuid', followerId, followeeId };
      repository.findOne.mockResolvedValue(existing);
      repository.remove.mockResolvedValue(existing);

      await service.unfollow(followerId, followeeId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { followerId, followeeId },
      });
      expect(repository.remove).toHaveBeenCalledWith(existing);
    });

    it('should throw NotFoundException when follow relationship does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.unfollow(followerId, followeeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isFollowing', () => {
    it('should return true when follow relationship exists', async () => {
      repository.count.mockResolvedValue(1);

      const result = await service.isFollowing('user-uuid-1', 'member-uuid-1');

      expect(repository.count).toHaveBeenCalledWith({
        where: { followerId: 'user-uuid-1', followeeId: 'member-uuid-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false when follow relationship does not exist', async () => {
      repository.count.mockResolvedValue(0);

      const result = await service.isFollowing('user-uuid-1', 'member-uuid-2');

      expect(result).toBe(false);
    });
  });

  describe('getFollowerCount', () => {
    it('should return the number of followers for a member', async () => {
      repository.count.mockResolvedValue(42);

      const result = await service.getFollowerCount('member-uuid-1');

      expect(repository.count).toHaveBeenCalledWith({
        where: { followeeId: 'member-uuid-1' },
      });
      expect(result).toBe(42);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getUserFollowsMap
  // ─────────────────────────────────────────────────────────────────
  describe('getUserFollowsMap', () => {
    const userId = 'user-uuid-1';

    it('should return empty sets when user has no follows', async () => {
      contentFollowRepository.find.mockResolvedValue([]);
      repository.find.mockResolvedValue([]);

      const result = await service.getUserFollowsMap(userId);

      expect(result.categories.size).toBe(0);
      expect(result.members.size).toBe(0);
      expect(result.authors.size).toBe(0);
      expect(result.tags.size).toBe(0);
    });

    it('should group content follows by type', async () => {
      contentFollowRepository.find.mockResolvedValue([
        { userId, type: ContentFollowType.CATEGORY, targetId: 'cat-1' },
        { userId, type: ContentFollowType.CATEGORY, targetId: 'cat-2' },
        { userId, type: ContentFollowType.AUTHOR, targetId: 'author-1' },
        { userId, type: ContentFollowType.TAG, targetId: 'tag-1' },
        { userId, type: ContentFollowType.TAG, targetId: 'tag-2' },
        { userId, type: ContentFollowType.TAG, targetId: 'tag-3' },
        { userId, type: ContentFollowType.MEMBER, targetId: 'member-1' },
      ]);
      repository.find.mockResolvedValue([]);

      const result = await service.getUserFollowsMap(userId);

      expect(result.categories).toEqual(new Set(['cat-1', 'cat-2']));
      expect(result.members).toEqual(new Set(['member-1']));
      expect(result.authors).toEqual(new Set(['author-1']));
      expect(result.tags).toEqual(new Set(['tag-1', 'tag-2', 'tag-3']));
    });

    it('should merge legacy member follows into members set', async () => {
      contentFollowRepository.find.mockResolvedValue([
        { userId, type: ContentFollowType.MEMBER, targetId: 'member-1' },
      ]);
      // Legacy user_follows table entries
      repository.find.mockResolvedValue([
        { followerId: userId, followeeId: 'member-2' },
        { followerId: userId, followeeId: 'member-3' },
      ]);

      const result = await service.getUserFollowsMap(userId);

      // Should contain both content follow member and legacy follow members
      expect(result.members).toEqual(new Set(['member-1', 'member-2', 'member-3']));
    });

    it('should deduplicate when same member exists in both tables', async () => {
      contentFollowRepository.find.mockResolvedValue([
        { userId, type: ContentFollowType.MEMBER, targetId: 'member-1' },
      ]);
      repository.find.mockResolvedValue([
        { followerId: userId, followeeId: 'member-1' }, // same as content follow
      ]);

      const result = await service.getUserFollowsMap(userId);

      expect(result.members.size).toBe(1);
      expect(result.members.has('member-1')).toBe(true);
    });

    it('should query content follows with correct userId', async () => {
      contentFollowRepository.find.mockResolvedValue([]);
      repository.find.mockResolvedValue([]);

      await service.getUserFollowsMap(userId);

      expect(contentFollowRepository.find).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(repository.find).toHaveBeenCalledWith({
        where: { followerId: userId },
      });
    });
  });
});
