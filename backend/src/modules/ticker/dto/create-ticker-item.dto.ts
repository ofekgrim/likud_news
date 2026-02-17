import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTickerItemDto {
  @ApiProperty({ description: 'Ticker text', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  text: string;

  @ApiPropertyOptional({ description: 'Link URL', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'Related article ID (UUID)' })
  @IsOptional()
  @IsUUID()
  articleId?: string;

  @ApiPropertyOptional({ description: 'Display position', default: 0 })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiPropertyOptional({
    description: 'Whether the ticker item is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Expiration date/time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
