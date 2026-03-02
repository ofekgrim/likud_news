import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsString,
  IsNumberString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStationsDto {
  @ApiPropertyOptional({ description: 'Filter by election UUID' })
  @IsOptional()
  @IsUUID()
  electionId?: string;

  @ApiPropertyOptional({ description: 'Filter by district' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Latitude for proximity search' })
  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude for proximity search' })
  @IsOptional()
  @IsNumberString()
  longitude?: string;

  @ApiPropertyOptional({ description: 'Radius in km for proximity search (default 5)', default: '5' })
  @IsOptional()
  @IsNumberString()
  radius?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
