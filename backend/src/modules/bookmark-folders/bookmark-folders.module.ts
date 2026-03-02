import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarkFoldersController } from './bookmark-folders.controller';
import { BookmarkFoldersService } from './bookmark-folders.service';
import { BookmarkFolder } from './entities/bookmark-folder.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookmarkFolder, UserFavorite]),
    AppAuthModule,
  ],
  controllers: [BookmarkFoldersController],
  providers: [BookmarkFoldersService],
  exports: [BookmarkFoldersService],
})
export class BookmarkFoldersModule {}
