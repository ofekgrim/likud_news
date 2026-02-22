import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
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
    const story = this.storyRepository.create(dto);
    return this.storyRepository.save(story);
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
}
