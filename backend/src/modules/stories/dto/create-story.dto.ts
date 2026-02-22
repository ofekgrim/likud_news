import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsUrl,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({ description: 'Story title (Hebrew)', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Full-size image URL' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Thumbnail image URL for circle preview' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'External link URL (for non-article stories)' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'Linked article UUID' })
  @IsOptional()
  @IsUUID()
  articleId?: string;

  @ApiPropertyOptional({ description: 'Video URL (for video stories)' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds (1-60)', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Media type: image or video', default: 'image' })
  @IsOptional()
  @IsString()
  mediaType?: string;

  @ApiPropertyOptional({ description: 'Sort order (lower = first)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the story is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
