import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ShareContentType } from '../entities/share-link.entity';

export class CreateShareLinkDto {
  @ApiProperty({
    description: 'Type of content being shared',
    enum: ShareContentType,
    example: ShareContentType.ARTICLE,
  })
  @IsEnum(ShareContentType)
  contentType: ShareContentType;

  @ApiProperty({
    description: 'UUID of the content being shared',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  contentId: string;

  @ApiPropertyOptional({
    description: 'Open Graph title for social media previews',
    example: 'חדשות הליכוד - כותרת המאמר',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  ogTitle?: string;

  @ApiPropertyOptional({
    description: 'Open Graph description for social media previews',
    example: 'תקציר קצר של המאמר לתצוגה מקדימה ברשתות חברתיות',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ogDescription?: string;

  @ApiPropertyOptional({
    description: 'Open Graph image URL for social media previews',
    example: 'https://cdn.example.com/images/article-cover.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ogImageUrl?: string;

  @ApiPropertyOptional({
    description: 'UTM source parameter for tracking',
    example: 'whatsapp',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  @ApiPropertyOptional({
    description: 'UTM medium parameter for tracking',
    example: 'social',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  @ApiPropertyOptional({
    description: 'UTM campaign parameter for tracking',
    example: 'article-share-2024',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmCampaign?: string;
}
