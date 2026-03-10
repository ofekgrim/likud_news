import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get all active, non-expired stories (public endpoint for the app).
   */
  async findAllActive(): Promise<Story[]> {
    const now = new Date();
    return this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.article', 'article')
      .where('story.isActive = :isActive', { isActive: true })
      .andWhere(
        '(story.expiresAt IS NULL OR story.expiresAt > :now)',
        { now },
      )
      .orderBy('story.sortOrder', 'ASC')
      .addOrderBy('story.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get all stories (admin endpoint — includes inactive and expired).
   */
  async findAll(): Promise<Story[]> {
    return this.storyRepository.find({
      relations: ['article'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * Find a single story by ID.
   */
  async findOne(id: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id },
      relations: ['article'],
    });

    if (!story) {
      throw new NotFoundException(`Story with id "${id}" not found`);
    }

    return story;
  }

  /**
   * Create a new story.
   */
  async create(dto: CreateStoryDto): Promise<Story> {
    const { sendPushNotification, ...storyData } = dto;
    const story = this.storyRepository.create(storyData);
    const saved = await this.storyRepository.save(story);

    if (sendPushNotification && saved.isActive !== false) {
      // Reload with article relation for deep linking
      const full = saved.articleId
          ? await this.findOne(saved.id)
          : saved;
      this.triggerNotification(full).catch((err) =>
        this.logger.error(`Story notification failed: ${err.message}`),
      );
    }

    return saved;
  }

  /**
   * Update a story by ID.
   */
  async update(id: string, dto: UpdateStoryDto): Promise<Story> {
    const story = await this.findOne(id);
    Object.assign(story, dto);
    return this.storyRepository.save(story);
  }

  /**
   * Delete a story by ID.
   */
  async remove(id: string): Promise<void> {
    const story = await this.findOne(id);
    await this.storyRepository.remove(story);
  }

  /**
   * Trigger push notification for a new story.
   */
  private async triggerNotification(story: Story): Promise<void> {
    await this.notificationsService.triggerContentNotification(
      'story.created',
      'article', // Navigate to article if linked, otherwise general
      story.articleId || story.id,
      {
        story_title: story.title,
        story_image_url: story.imageUrl || '',
        article_slug: story.article?.slug || '',
      },
    );
  }
}
