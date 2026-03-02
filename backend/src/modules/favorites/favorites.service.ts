import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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

  async toggleFavorite(
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<{ isFavorite: boolean }> {
    // Check for existing: use userId if available, otherwise deviceId
    const whereClause = createFavoriteDto.userId
      ? { userId: createFavoriteDto.userId, articleId: createFavoriteDto.articleId }
      : { deviceId: createFavoriteDto.deviceId, articleId: createFavoriteDto.articleId };

    const existing = await this.favoriteRepository.findOne({
      where: whereClause,
    });

    if (existing) {
      await this.favoriteRepository.remove(existing);
      return { isFavorite: false };
    }

    const favorite = this.favoriteRepository.create(createFavoriteDto);
    await this.favoriteRepository.save(favorite);
    return { isFavorite: true };
  }

  async removeFavorite(
    deviceId: string,
    articleId: string,
    userId?: string,
  ): Promise<void> {
    if (userId) {
      await this.favoriteRepository.delete({ userId, articleId });
    } else {
      await this.favoriteRepository.delete({ deviceId, articleId });
    }
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

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
    folderId?: string,
  ): Promise<{ data: UserFavorite[]; total: number }> {
    const qb = this.favoriteRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.article', 'article')
      .leftJoinAndSelect('favorite.folder', 'folder')
      .where('favorite.userId = :userId', { userId });

    if (folderId) {
      qb.andWhere('favorite.folderId = :folderId', { folderId });
    }

    const [data, total] = await qb
      .orderBy('favorite.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async updateNote(
    userId: string,
    articleId: string,
    note: string,
  ): Promise<UserFavorite> {
    const fav = await this.favoriteRepository.findOne({
      where: { userId, articleId },
    });
    if (!fav) {
      throw new ConflictException('Favorite not found');
    }
    fav.note = note;
    return this.favoriteRepository.save(fav);
  }

  async moveToFolder(
    userId: string,
    articleId: string,
    folderId?: string,
  ): Promise<UserFavorite> {
    const fav = await this.favoriteRepository.findOne({
      where: { userId, articleId },
    });
    if (!fav) {
      throw new ConflictException('Favorite not found');
    }
    fav.folderId = folderId;
    return this.favoriteRepository.save(fav);
  }
}
