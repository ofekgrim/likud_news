import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StoriesService } from './stories.service';
import { Story } from './entities/story.entity';
import { NotificationsService } from '../notifications/notifications.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
});

describe('StoriesService', () => {
  let service: StoriesService;
  let repository: jest.Mocked<Repository<Story>>;
  let notificationsService: { triggerContentNotification: jest.Mock };

  beforeEach(async () => {
    notificationsService = {
      triggerContentNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        { provide: getRepositoryToken(Story), useFactory: mockRepository },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    repository = module.get(getRepositoryToken(Story));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAllActive
  // ---------------------------------------------------------------------------
  describe('findAllActive', () => {
    it('should return active, non-expired stories ordered by sortOrder', async () => {
      const stories = [
        { id: 'story-1', title: 'Active Story', isActive: true, sortOrder: 0 },
        { id: 'story-2', title: 'Another Active', isActive: true, sortOrder: 1 },
      ] as Story[];

      const mockQb = mockQueryBuilder();
      mockQb.getMany.mockResolvedValue(stories);
      repository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.findAllActive();

      expect(result).toEqual(stories);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('story');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('story.article', 'article');
      expect(mockQb.where).toHaveBeenCalledWith('story.isActive = :isActive', { isActive: true });
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(story.expiresAt IS NULL OR story.expiresAt > :now)',
        expect.objectContaining({ now: expect.any(Date) }),
      );
      expect(mockQb.orderBy).toHaveBeenCalledWith('story.sortOrder', 'ASC');
      expect(mockQb.addOrderBy).toHaveBeenCalledWith('story.createdAt', 'DESC');
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all stories ordered by sortOrder', async () => {
      const stories = [
        { id: 'story-1', title: 'First', sortOrder: 0 },
        { id: 'story-2', title: 'Second', sortOrder: 1 },
      ] as Story[];

      repository.find.mockResolvedValue(stories);

      const result = await service.findAll();

      expect(result).toEqual(stories);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['article'],
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a story when found', async () => {
      const story = {
        id: 'story-1',
        title: 'Test Story',
        imageUrl: 'https://example.com/img.jpg',
      } as Story;

      repository.findOne.mockResolvedValue(story);

      const result = await service.findOne('story-1');

      expect(result).toEqual(story);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'story-1' },
        relations: ['article'],
      });
    });

    it('should throw NotFoundException when story not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create and save a story', async () => {
      const dto = {
        title: 'New Story',
        imageUrl: 'https://example.com/img.jpg',
        sortOrder: 0,
      } as any;

      const story = { id: 'story-new', ...dto, isActive: true } as Story;

      repository.create.mockReturnValue(story);
      repository.save.mockResolvedValue(story);

      const result = await service.create(dto);

      expect(result).toEqual(story);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(story);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update story fields and save', async () => {
      const existingStory = {
        id: 'story-1',
        title: 'Old Title',
        imageUrl: 'https://example.com/old.jpg',
        isActive: true,
      } as Story;

      const dto = { title: 'Updated Title' } as any;

      repository.findOne.mockResolvedValue(existingStory);
      repository.save.mockImplementation(async (s) => s as Story);

      const result = await service.update('story-1', dto);

      expect(result.title).toBe('Updated Title');
      expect(repository.save).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should delete a story', async () => {
      const story = {
        id: 'story-1',
        title: 'Story to remove',
      } as Story;

      repository.findOne.mockResolvedValue(story);
      repository.remove.mockResolvedValue(story);

      await service.remove('story-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'story-1' },
        relations: ['article'],
      });
      expect(repository.remove).toHaveBeenCalledWith(story);
    });
  });
});
