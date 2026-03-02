import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsObject,
  IsNumber,
  IsBoolean,
  IsEmail,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateCandidateDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({ description: 'Candidate full name', maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  fullName: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  slug?: string;

  @ApiPropertyOptional({ description: 'Voting district', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  district?: string;

  @ApiPropertyOptional({ description: 'Political position/title', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  position?: string;

  @ApiPropertyOptional({ description: 'Photo URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Cover image URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Candidate biography' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Structured bio blocks (JSONB)' })
  @IsOptional()
  @IsArray()
  bioBlocks?: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'Quiz positions — questionId to position value',
  })
  @IsOptional()
  @IsObject()
  quizPositions?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Social media links — platform to URL',
  })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address', maxLength: 300 })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Website URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  website?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether candidate is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
