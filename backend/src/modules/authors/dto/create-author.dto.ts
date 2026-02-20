import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsObject,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthorDto {
  @ApiProperty({ description: 'Author name (Hebrew)', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  nameHe: string;

  @ApiPropertyOptional({ description: 'Author name (English)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Role / title (Hebrew)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  roleHe?: string;

  @ApiPropertyOptional({ description: 'Role / title (English)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  roleEn?: string;

  @ApiPropertyOptional({ description: 'Biography (Hebrew)' })
  @IsOptional()
  @IsString()
  bioHe?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Avatar thumbnail URL',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  avatarThumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Email address', maxLength: 200 })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({
    description: 'Social media links as key-value pairs',
    example: { twitter: 'https://twitter.com/example', facebook: 'https://facebook.com/example' },
  })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Linked user ID (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Whether the author is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
