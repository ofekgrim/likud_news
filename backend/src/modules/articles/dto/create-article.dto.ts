import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsUUID,
  IsDateString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ArticleStatus } from '../entities/article.entity';

export class CreateArticleDto {
  @ApiProperty({ description: 'Article title (Hebrew)', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({
    description: 'Article title (English)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Article subtitle', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  subtitle?: string;

  @ApiProperty({ description: 'Article content (HTML)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Article content in English (HTML)' })
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional({ description: 'Hero image URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  heroImageUrl?: string;

  @ApiPropertyOptional({ description: 'Hero image caption', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroImageCaption?: string;

  @ApiPropertyOptional({ description: 'Author name', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional({
    description: 'Hashtags associated with the article',
    type: [String],
    example: ['politics', 'economy'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    description: 'Article status',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({
    description: 'Whether this is the hero article',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isHero?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is breaking news',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean;

  @ApiProperty({
    description: 'URL-friendly slug (must be unique)',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  slug: string;

  @ApiPropertyOptional({ description: 'Publish date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Member UUIDs to associate with this article',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
