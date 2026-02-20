import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TagType } from '../entities/tag.entity';

export class CreateTagDto {
  @ApiProperty({ description: 'Tag name (Hebrew)', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  nameHe: string;

  @ApiPropertyOptional({ description: 'Tag name (English)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiProperty({
    description: 'URL-friendly slug (lowercase, hyphens, no spaces)',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be a valid URL-friendly slug (lowercase letters, numbers, and hyphens)',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Tag type',
    enum: TagType,
    default: TagType.TOPIC,
  })
  @IsOptional()
  @IsEnum(TagType)
  tagType?: TagType;
}
