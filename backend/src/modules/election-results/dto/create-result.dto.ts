import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateResultDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({ description: 'Candidate UUID' })
  @IsUUID()
  candidateId: string;

  @ApiPropertyOptional({ description: 'Polling station UUID (null for aggregate)' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiProperty({ description: 'Number of votes' })
  @IsNumber()
  voteCount: number;

  @ApiPropertyOptional({ description: 'Vote percentage' })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional({ description: 'Whether result is official', default: false })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;
}
