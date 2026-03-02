import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class CreateTurnoutDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiPropertyOptional({ description: 'District name', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  district?: string;

  @ApiProperty({ description: 'Number of eligible voters' })
  @IsNumber()
  eligibleVoters: number;

  @ApiProperty({ description: 'Number of actual voters' })
  @IsNumber()
  actualVoters: number;
}
