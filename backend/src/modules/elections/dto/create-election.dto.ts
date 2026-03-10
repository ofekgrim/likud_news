import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUrl,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ElectionStatus } from '../entities/primary-election.entity';

export class CreateElectionDto {
  @ApiProperty({ description: 'Election title', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: 'Election subtitle' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Election description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Election date (ISO 8601)' })
  @IsDateString()
  electionDate: string;

  @ApiPropertyOptional({ description: 'Registration deadline (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ description: 'Cover image URL', maxLength: 2000 })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Election status',
    enum: ElectionStatus,
    default: ElectionStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ElectionStatus)
  status?: ElectionStatus;
}
