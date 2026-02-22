import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  /**
   * Submit a new comment on an article. Comments are auto-approved.
   */
  async submit(
    articleId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...dto,
      articleId,
      isApproved: true,
    });
    return this.commentRepository.save(comment);
  }

  /**
   * Get approved comments for a specific article (public).
   * Returns top-level comments with their replies, pinned first, then newest first.
   */
  async findByArticle(
    articleId: string,
    query: QueryCommentsDto,
  ): Promise<{
    data: Comment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.replies', 'reply', 'reply.isApproved = :approved', {
        approved: true,
      })
      .where('comment.articleId = :articleId', { articleId })
      .andWhere('comment.isApproved = :isApproved', { isApproved: true })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.isPinned', 'DESC')
      .addOrderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all comments for the admin moderation queue (paginated).
   * Can filter by approval status.
   */
  async findAllForAdmin(query: QueryCommentsDto): Promise<{
    data: Comment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, isApproved } = query;
    const skip = (page - 1) * limit;

    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.article', 'article')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (isApproved !== undefined) {
      qb.andWhere('comment.isApproved = :isApproved', { isApproved });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Approve a comment (set isApproved = true).
   */
  async approve(id: string): Promise<Comment> {
    const comment = await this.findOneOrFail(id);
    comment.isApproved = true;
    return this.commentRepository.save(comment);
  }

  /**
   * Reject (delete) a comment.
   */
  async reject(id: string): Promise<void> {
    const comment = await this.findOneOrFail(id);
    await this.commentRepository.remove(comment);
  }

  /**
   * Toggle the pinned status of a comment.
   */
  async pin(id: string): Promise<Comment> {
    const comment = await this.findOneOrFail(id);
    comment.isPinned = !comment.isPinned;
    return this.commentRepository.save(comment);
  }

  /**
   * Increment the like count of a comment.
   */
  async like(id: string): Promise<{ likesCount: number }> {
    const comment = await this.findOneOrFail(id);
    comment.likesCount = (comment.likesCount || 0) + 1;
    const saved = await this.commentRepository.save(comment);
    return { likesCount: saved.likesCount };
  }

  /**
   * Get approved comments for a specific story (public).
   * Returns top-level comments with their replies, pinned first, then newest first.
   */
  async findByStory(
    storyId: string,
    query: QueryCommentsDto,
  ): Promise<{
    data: Comment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.replies', 'reply', 'reply.isApproved = :approved', {
        approved: true,
      })
      .where('comment.storyId = :storyId', { storyId })
      .andWhere('comment.isApproved = :isApproved', { isApproved: true })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.isPinned', 'DESC')
      .addOrderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Submit a new comment on a story. Comments are auto-approved.
   */
  async submitForStory(storyId: string, dto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...dto,
      storyId,
      isApproved: true,
    });
    return this.commentRepository.save(comment);
  }

  /**
   * Count approved comments for a specific article.
   */
  async countByArticle(articleId: string): Promise<number> {
    return this.commentRepository.count({
      where: { articleId, isApproved: true },
    });
  }

  /**
   * Find a comment by ID or throw NotFoundException.
   */
  private async findOneOrFail(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id "${id}" not found`);
    }

    return comment;
  }
}
