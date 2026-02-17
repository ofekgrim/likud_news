import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
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
