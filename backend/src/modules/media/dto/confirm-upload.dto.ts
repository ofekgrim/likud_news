import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '../entities/media.entity';

export class ConfirmUploadDto {
  @ApiProperty({
    example: 'media/2026/02/photo.jpg',
    description: 'S3 object key',
  })
  @IsString()
  s3Key: string;

  @ApiProperty({ example: 'photo.jpg', description: 'Original filename' })
  @IsString()
  filename: string;

  @ApiProperty({
    enum: MediaType,
    example: MediaType.IMAGE,
    description: 'Media type',
  })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  @IsNumber()
  size: number;

  @ApiPropertyOptional({
    example: 1920,
    description: 'Image/video width in pixels',
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({
    example: 1080,
    description: 'Image/video height in pixels',
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    example: 120.5,
    description: 'Duration in seconds for audio/video',
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({
    example: 'A beautiful sunset',
    description: 'Media caption',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    example: 'Sunset over the sea',
    description: 'Alt text for accessibility',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'Associated article ID' })
  @IsOptional()
  @IsUUID()
  articleId?: string;
}
