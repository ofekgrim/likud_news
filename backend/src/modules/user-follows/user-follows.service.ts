import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from './entities/user-follow.entity';

@Injectable()
export class UserFollowsService {
  constructor(
    @InjectRepository(UserFollow)
    private readonly followRepository: Repository<UserFollow>,
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
}
