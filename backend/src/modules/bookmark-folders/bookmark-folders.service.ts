import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { BookmarkFolder } from './entities/bookmark-folder.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class BookmarkFoldersService {
  constructor(
    @InjectRepository(BookmarkFolder)
    private readonly folderRepository: Repository<BookmarkFolder>,
    @InjectRepository(UserFavorite)
    private readonly favoriteRepository: Repository<UserFavorite>,
  ) {}

  async findAllByUser(userId: string): Promise<BookmarkFolder[]> {
    return this.folderRepository.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<BookmarkFolder> {
    const folder = await this.folderRepository.findOne({ where: { id } });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    if (folder.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return folder;
  }

  async findByShareToken(shareToken: string): Promise<BookmarkFolder> {
    const folder = await this.folderRepository.findOne({
      where: { shareToken, isPublic: true },
    });
    if (!folder) {
      throw new NotFoundException('Shared folder not found');
    }
    return folder;
  }

  async create(userId: string, dto: CreateFolderDto): Promise<BookmarkFolder> {
    const maxSort = await this.folderRepository
      .createQueryBuilder('f')
      .select('MAX(f.sortOrder)', 'max')
      .where('f.userId = :userId', { userId })
      .getRawOne();

    const folder = this.folderRepository.create({
      userId,
      name: dto.name,
      color: dto.color,
      sortOrder: (maxSort?.max ?? -1) + 1,
    });

    return this.folderRepository.save(folder);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateFolderDto,
  ): Promise<BookmarkFolder> {
    const folder = await this.findOne(id, userId);

    if (dto.name !== undefined) folder.name = dto.name;
    if (dto.color !== undefined) folder.color = dto.color;
    if (dto.sortOrder !== undefined) folder.sortOrder = dto.sortOrder;
    if (dto.isPublic !== undefined) {
      folder.isPublic = dto.isPublic;
      if (dto.isPublic && !folder.shareToken) {
        folder.shareToken = crypto.randomBytes(16).toString('hex');
      }
      if (!dto.isPublic) {
        folder.shareToken = undefined;
      }
    }

    return this.folderRepository.save(folder);
  }

  async remove(id: string, userId: string): Promise<void> {
    const folder = await this.findOne(id, userId);

    // Unlink favorites from this folder (don't delete them)
    await this.favoriteRepository
      .createQueryBuilder()
      .update()
      .set({ folderId: () => 'NULL' })
      .where('folderId = :folderId', { folderId: folder.id })
      .execute();

    await this.folderRepository.remove(folder);
  }

  async getFolderFavorites(
    folderId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Verify ownership
    await this.findOne(folderId, userId);

    const [data, total] = await this.favoriteRepository
      .createQueryBuilder('fav')
      .leftJoinAndSelect('fav.article', 'article')
      .where('fav.folderId = :folderId', { folderId })
      .andWhere('fav.userId = :userId', { userId })
      .orderBy('fav.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }
}
