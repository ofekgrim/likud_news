import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from './entities/user-follow.entity';
import {
  UserContentFollow,
  ContentFollowType,
} from './entities/user-content-follow.entity';

/**
 * Grouped user content follows, keyed by follow type.
 * Each set contains the target UUIDs that the user follows.
 */
export interface UserFollowsMap {
  categories: Set<string>;
  members: Set<string>;
  authors: Set<string>;
  tags: Set<string>;
}

@Injectable()
export class UserFollowsService {
  constructor(
    @InjectRepository(UserFollow)
    private readonly followRepository: Repository<UserFollow>,
    @InjectRepository(UserContentFollow)
    private readonly contentFollowRepository: Repository<UserContentFollow>,
  ) {}

  async follow(followerId: string, followeeId: string): Promise<UserFollow> {
    const existing = await this.followRepository.findOne({
      where: { followerId, followeeId },
    });

    if (existing) {
      throw new ConflictException('Already following this member');
    }

    const follow = this.followRepository.create({ followerId, followeeId });
    return this.followRepository.save(follow);
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    const existing = await this.followRepository.findOne({
      where: { followerId, followeeId },
    });

    if (!existing) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepository.remove(existing);
  }

  async getFollowing(
    followerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.followee', 'member')
      .where('follow.followerId = :followerId', { followerId })
      .orderBy('follow.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const count = await this.followRepository.count({
      where: { followerId, followeeId },
    });
    return count > 0;
  }

  async getFollowerCount(followeeId: string): Promise<number> {
    return this.followRepository.count({ where: { followeeId } });
  }

  // ─────────────────────────────────────────────────────────────────
  // Content follows (polymorphic: category, member, author, tag)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Follow a content entity (category, member, author, or tag).
   */
  async followContent(
    userId: string,
    type: ContentFollowType,
    targetId: string,
  ): Promise<UserContentFollow> {
    const existing = await this.contentFollowRepository.findOne({
      where: { userId, type, targetId },
    });
    if (existing) {
      throw new ConflictException(`Already following this ${type}`);
    }
    const follow = this.contentFollowRepository.create({ userId, type, targetId });
    return this.contentFollowRepository.save(follow);
  }

  /**
   * Unfollow a content entity.
   */
  async unfollowContent(
    userId: string,
    type: ContentFollowType,
    targetId: string,
  ): Promise<void> {
    const existing = await this.contentFollowRepository.findOne({
      where: { userId, type, targetId },
    });
    if (!existing) {
      throw new NotFoundException(`${type} follow not found`);
    }
    await this.contentFollowRepository.remove(existing);
  }

  /**
   * Get all content follows for a user, grouped by type.
   *
   * Returns a map with Sets of target IDs for each follow type,
   * including member follows from the legacy `user_follows` table.
   * This is the primary data source for the feed personalization algorithm.
   */
  async getUserFollowsMap(userId: string): Promise<UserFollowsMap> {
    // Fetch polymorphic content follows
    const contentFollows = await this.contentFollowRepository.find({
      where: { userId },
    });

    // Fetch legacy member follows (user_follows table) — the user is the follower
    const memberFollows = await this.followRepository.find({
      where: { followerId: userId },
    });

    const map: UserFollowsMap = {
      categories: new Set<string>(),
      members: new Set<string>(),
      authors: new Set<string>(),
      tags: new Set<string>(),
    };

    for (const follow of contentFollows) {
      switch (follow.type) {
        case ContentFollowType.CATEGORY:
          map.categories.add(follow.targetId);
          break;
        case ContentFollowType.MEMBER:
          map.members.add(follow.targetId);
          break;
        case ContentFollowType.AUTHOR:
          map.authors.add(follow.targetId);
          break;
        case ContentFollowType.TAG:
          map.tags.add(follow.targetId);
          break;
      }
    }

    // Merge legacy member follows into the members set
    for (const follow of memberFollows) {
      map.members.add(follow.followeeId);
    }

    return map;
  }
}
