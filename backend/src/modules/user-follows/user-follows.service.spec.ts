import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserFollowsService } from './user-follows.service';
import { UserFollow } from './entities/user-follow.entity';

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
  findOne: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

describe('UserFollowsService', () => {
  let service: UserFollowsService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFollowsService,
        {
          provide: getRepositoryToken(UserFollow),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserFollowsService>(UserFollowsService);
    repository = module.get(getRepositoryToken(UserFollow));
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
});
