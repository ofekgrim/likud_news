import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PositionValue } from '../entities/candidate-position.entity';

export class PositionItemDto {
  @ApiProperty({ description: 'Candidate UUID' })
  @IsUUID()
  candidateId: string;

  @ApiProperty({ description: 'Policy statement UUID' })
  @IsUUID()
  statementId: string;

  @ApiProperty({ enum: PositionValue, description: 'Candidate position' })
  @IsEnum(PositionValue)
  position: PositionValue;

  @ApiPropertyOptional({ description: 'Justification text in Hebrew' })
  @IsOptional()
  @IsString()
  justificationHe?: string;
}

export class BulkUpsertPositionsDto {
  @ApiProperty({
    type: [PositionItemDto],
    description: 'Array of candidate positions to upsert',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionItemDto)
  positions: PositionItemDto[];
}
