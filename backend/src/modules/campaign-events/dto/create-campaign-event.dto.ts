import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsUrl,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateCampaignEventDto {
  @ApiProperty({ description: 'Event title', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event image URL', maxLength: 2000 })
  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Event location address' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'City name', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string;

  @ApiPropertyOptional({ description: 'District name', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  district?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Event start time (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ description: 'Event end time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Associated candidate UUID' })
  @IsOptional()
  @IsUUID()
  candidateId?: string;

  @ApiPropertyOptional({ description: 'Associated election UUID' })
  @IsOptional()
  @IsUUID()
  electionId?: string;
}
