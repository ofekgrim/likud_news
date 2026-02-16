import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavorite } from './entities/user-favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavorite)
    private readonly favoriteRepository: Repository<UserFavorite>,
  ) {}

  async addFavorite(createFavoriteDto: CreateFavoriteDto): Promise<UserFavorite> {
    const existing = await this.favoriteRepository.findOne({
      where: {
        deviceId: createFavoriteDto.deviceId,
        articleId: createFavoriteDto.articleId,
      },
    });

    if (existing) {
      throw new ConflictException('Article is already in favorites');
    }

    const favorite = this.favoriteRepository.create(createFavoriteDto);
    return this.favoriteRepository.save(favorite);
  }

  async removeFavorite(deviceId: string, articleId: string): Promise<void> {
    await this.favoriteRepository.delete({ deviceId, articleId });
  }

  async findByDevice(
    deviceId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: UserFavorite[]; total: number }> {
    const [data, total] = await this.favoriteRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.article', 'article')
      .where('favorite.deviceId = :deviceId', { deviceId })
      .orderBy('favorite.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }
}
