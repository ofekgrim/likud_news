import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Author } from './entities/author.entity';
import { Article } from '../articles/entities/article.entity';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Author, Article])],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsModule {}
