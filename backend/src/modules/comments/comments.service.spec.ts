import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { AppUser } from '../app-users/entities/app-user.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
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
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
});

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: jest.Mocked<Repository<Comment>>;
  let appUserRepository: jest.Mocked<Repository<AppUser>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useFactory: mockRepository },
        { provide: getRepositoryToken(AppUser), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepository = module.get(getRepositoryToken(Comment));
    appUserRepository = module.get(getRepositoryToken(AppUser));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit', () => {
    it('should create a comment with user info', async () => {
      const user = {
        id: 'user-1',
        displayName: 'Yossi Cohen',
        email: 'yossi@example.com',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        role: 'member',
      } as unknown as AppUser;

      const dto = { body: 'Great article!', parentId: undefined };
      const savedComment = {
        id: 'comment-1',
        body: 'Great article!',
        articleId: 'article-1',
        userId: 'user-1',
        authorName: 'Yossi Cohen',
        authorEmail: 'yossi@example.com',
        authorAvatarUrl: 'https://cdn.example.com/avatar.jpg',
        authorRole: 'member',
        isApproved: true,
      } as unknown as Comment;

      appUserRepository.findOne.mockResolvedValue(user);
      commentRepository.create.mockReturnValue(savedComment);
      commentRepository.save.mockResolvedValue(savedComment);

      const result = await service.submit('article-1', dto, 'user-1');

      expect(appUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(commentRepository.create).toHaveBeenCalledWith({
        body: 'Great article!',
        parentId: undefined,
        articleId: 'article-1',
        userId: 'user-1',
        authorName: 'Yossi Cohen',
        authorEmail: 'yossi@example.com',
        authorAvatarUrl: 'https://cdn.example.com/avatar.jpg',
        authorRole: 'member',
        isApproved: true,
      });
      expect(commentRepository.save).toHaveBeenCalledWith(savedComment);
      expect(result).toEqual(savedComment);
    });

    it('should fall back to "Member" when user has no displayName', async () => {
      const user = {
        id: 'user-2',
        displayName: null,
        email: null,
        avatarUrl: null,
        role: 'guest',
      } as unknown as AppUser;

      const dto = { body: 'Nice post' };
      const savedComment = {
        id: 'comment-2',
        authorName: 'Member',
      } as unknown as Comment;

      appUserRepository.findOne.mockResolvedValue(user);
      commentRepository.create.mockReturnValue(savedComment);
      commentRepository.save.mockResolvedValue(savedComment);

      await service.submit('article-1', dto, 'user-2');

      expect(commentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ authorName: 'Member' }),
      );
    });

    it('should fall back to "Member" and role "guest" when user is not found', async () => {
      const dto = { body: 'Anonymous comment' };
      const savedComment = {
        id: 'comment-3',
        authorName: 'Member',
        authorRole: 'guest',
      } as unknown as Comment;

      appUserRepository.findOne.mockResolvedValue(null);
      commentRepository.create.mockReturnValue(savedComment);
      commentRepository.save.mockResolvedValue(savedComment);

      await service.submit('article-1', dto, 'user-unknown');

      expect(commentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          authorName: 'Member',
          authorRole: 'guest',
        }),
      );
    });
  });

  describe('findByArticle', () => {
    it('should return paginated approved comments', async () => {
      const comments = [
        { id: 'c1', body: 'First', isPinned: true },
        { id: 'c2', body: 'Second', isPinned: false },
      ] as unknown as Comment[];

      const qb = mockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([comments, 2]);
      commentRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findByArticle('article-1', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual(comments);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(qb.where).toHaveBeenCalledWith(
        'comment.articleId = :articleId',
        { articleId: 'article-1' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'comment.isApproved = :isApproved',
        { isApproved: true },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('comment.parentId IS NULL');
      expect(qb.orderBy).toHaveBeenCalledWith('comment.isPinned', 'DESC');
      expect(qb.addOrderBy).toHaveBeenCalledWith(
        'comment.createdAt',
        'DESC',
      );
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findAllForAdmin', () => {
    it('should return paginated comments with optional isApproved filter', async () => {
      const comments = [{ id: 'c1' }] as unknown as Comment[];
      const qb = mockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([comments, 1]);
      commentRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findAllForAdmin({
        page: 1,
        limit: 10,
        isApproved: false,
      });

      expect(result.data).toEqual(comments);
      expect(result.total).toBe(1);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'comment.isApproved = :isApproved',
        { isApproved: false },
      );
    });
  });

  describe('approve', () => {
    it('should set isApproved to true', async () => {
      const comment = {
        id: 'comment-1',
        isApproved: false,
      } as unknown as Comment;

      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.save.mockResolvedValue({
        ...comment,
        isApproved: true,
      } as Comment);

      const result = await service.approve('comment-1');

      expect(comment.isApproved).toBe(true);
      expect(commentRepository.save).toHaveBeenCalledWith(comment);
      expect(result.isApproved).toBe(true);
    });

    it('should throw NotFoundException when comment not found', async () => {
      commentRepository.findOne.mockResolvedValue(null);

      await expect(service.approve('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('should hard delete the comment', async () => {
      const comment = { id: 'comment-1' } as Comment;

      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.remove.mockResolvedValue(comment);

      await service.reject('comment-1');

      expect(commentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
      expect(commentRepository.remove).toHaveBeenCalledWith(comment);
    });

    it('should throw NotFoundException when comment not found', async () => {
      commentRepository.findOne.mockResolvedValue(null);

      await expect(service.reject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('pin', () => {
    it('should toggle isPinned from false to true', async () => {
      const comment = {
        id: 'comment-1',
        isPinned: false,
      } as unknown as Comment;

      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.save.mockResolvedValue({
        ...comment,
        isPinned: true,
      } as Comment);

      const result = await service.pin('comment-1');

      expect(comment.isPinned).toBe(true);
      expect(commentRepository.save).toHaveBeenCalledWith(comment);
      expect(result.isPinned).toBe(true);
    });

    it('should toggle isPinned from true to false', async () => {
      const comment = {
        id: 'comment-2',
        isPinned: true,
      } as unknown as Comment;

      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.save.mockResolvedValue({
        ...comment,
        isPinned: false,
      } as Comment);

      const result = await service.pin('comment-2');

      expect(comment.isPinned).toBe(false);
      expect(result.isPinned).toBe(false);
    });
  });

  describe('like', () => {
    it('should increment likesCount', async () => {
      const comment = {
        id: 'comment-1',
        likesCount: 5,
      } as unknown as Comment;

      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.save.mockResolvedValue({
        ...comment,
        likesCount: 6,
      } as Comment);

      const result = await service.like('comment-1');

      expect(comment.likesCount).toBe(6);
      expect(result).toEqual({ likesCount: 6 });
    });

    it('should handle likesCount starting at 0', async () => {
      const comment = {
        id: 'comment-1',
        likesCount: 0,
      } as unknown as Comment;

      commentRepository.findOne.mockResolvedValue(comment);
      commentRepository.save.mockResolvedValue({
        ...comment,
        likesCount: 1,
      } as Comment);

      const result = await service.like('comment-1');

      expect(comment.likesCount).toBe(1);
      expect(result).toEqual({ likesCount: 1 });
    });
  });

  describe('countByArticle', () => {
    it('should count only approved comments', async () => {
      commentRepository.count.mockResolvedValue(7);

      const result = await service.countByArticle('article-1');

      expect(result).toBe(7);
      expect(commentRepository.count).toHaveBeenCalledWith({
        where: { articleId: 'article-1', isApproved: true },
      });
    });
  });

  describe('submitForStory', () => {
    it('should create a comment linked to a story', async () => {
      const user = {
        id: 'user-1',
        displayName: 'Avi Levi',
        email: 'avi@example.com',
        avatarUrl: null,
        role: 'member',
      } as unknown as AppUser;

      const dto = { body: 'Great story!' };
      const savedComment = {
        id: 'comment-s1',
        body: 'Great story!',
        storyId: 'story-1',
        userId: 'user-1',
        authorName: 'Avi Levi',
        isApproved: true,
      } as unknown as Comment;

      appUserRepository.findOne.mockResolvedValue(user);
      commentRepository.create.mockReturnValue(savedComment);
      commentRepository.save.mockResolvedValue(savedComment);

      const result = await service.submitForStory('story-1', dto, 'user-1');

      expect(commentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storyId: 'story-1',
          authorName: 'Avi Levi',
          isApproved: true,
        }),
      );
      expect(result).toEqual(savedComment);
    });
  });

  describe('findByStory', () => {
    it('should return paginated approved comments for a story', async () => {
      const comments = [{ id: 'c1', body: 'Story comment' }] as unknown as Comment[];

      const qb = mockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([comments, 1]);
      commentRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findByStory('story-1', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual(comments);
      expect(result.total).toBe(1);
      expect(qb.where).toHaveBeenCalledWith(
        'comment.storyId = :storyId',
        { storyId: 'story-1' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'comment.isApproved = :isApproved',
        { isApproved: true },
      );
    });
  });
});
