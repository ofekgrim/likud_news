import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberDto {
  @ApiProperty({ description: 'Member name (Hebrew)', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Member name (English)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Title / role (Hebrew)', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({
    description: 'Title / role (English)',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Biography (Hebrew)' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Biography (English)' })
  @IsOptional()
  @IsString()
  bioEn?: string;

  @ApiPropertyOptional({
    description: 'Rich biography content blocks (block editor)',
    type: 'array',
    default: [],
  })
  @IsOptional()
  @IsArray()
  bioBlocks?: any[];

  @ApiPropertyOptional({ description: 'Photo URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Twitter/X profile URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  socialTwitter?: string;

  @ApiPropertyOptional({ description: 'Facebook profile URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  socialFacebook?: string;

  @ApiPropertyOptional({ description: 'Instagram profile URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  socialInstagram?: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ description: 'Office / position description', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  office?: string;

  @ApiPropertyOptional({ description: 'Contact phone number', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email address', maxLength: 300 })
  @IsOptional()
  @IsEmail({}, { always: false })
  @MaxLength(300)
  email?: string;

  @ApiPropertyOptional({ description: 'Personal website URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ description: 'Cover / banner image URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Rich HTML content for personal page' })
  @IsOptional()
  @IsString()
  personalPageHtml?: string;

  @ApiPropertyOptional({
    description: 'Whether the member is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
