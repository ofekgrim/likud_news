import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreatePollingStationDto {
  @ApiProperty({ description: 'Station name', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @ApiProperty({ description: 'Station address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'City', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string;

  @ApiPropertyOptional({ description: 'District', maxLength: 200 })
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

  @ApiPropertyOptional({ description: 'Station capacity' })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ description: 'Whether the station is accessible', default: false })
  @IsOptional()
  @IsBoolean()
  isAccessible?: boolean;

  @ApiPropertyOptional({ description: 'Opening time (e.g. 07:00)', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  openingTime?: string;

  @ApiPropertyOptional({ description: 'Closing time (e.g. 22:00)', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  closingTime?: string;

  @ApiPropertyOptional({ description: 'Contact phone number', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Associated election UUID' })
  @IsOptional()
  @IsUUID()
  electionId?: string;
}
