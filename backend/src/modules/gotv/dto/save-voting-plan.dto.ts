import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveVotingPlanDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({ description: 'Planned voting time (ISO 8601)' })
  @IsDateString()
  plannedTime: string;

  @ApiPropertyOptional({ description: 'Preferred polling station UUID' })
  @IsOptional()
  @IsUUID()
  stationId?: string;
}
