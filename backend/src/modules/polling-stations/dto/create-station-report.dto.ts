import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateStationReportDto {
  @ApiProperty({ description: 'Polling station UUID' })
  @IsUUID()
  stationId: string;

  @ApiProperty({ description: 'Wait time in minutes', minimum: 0, maximum: 300 })
  @IsNumber()
  @Min(0)
  @Max(300)
  waitTimeMinutes: number;

  @ApiPropertyOptional({ description: 'Crowd level (low, moderate, high, extreme)' })
  @IsOptional()
  @IsString()
  crowdLevel?: string;

  @ApiPropertyOptional({ description: 'Additional note' })
  @IsOptional()
  @IsString()
  note?: string;
}
