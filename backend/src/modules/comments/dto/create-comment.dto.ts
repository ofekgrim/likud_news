import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsEmail,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Author display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  authorName: string;

  @ApiPropertyOptional({ description: 'Author email (for moderation)' })
  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @ApiProperty({ description: 'Comment body text' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
