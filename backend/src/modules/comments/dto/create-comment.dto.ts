import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment body text' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Display name for unauthenticated (guest) comments' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  guestName?: string;
}
