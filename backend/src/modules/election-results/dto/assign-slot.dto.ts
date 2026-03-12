import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { KnessetSlotType } from '../entities/knesset-list-slot.entity';

export class AssignSlotDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({ description: 'Knesset seat position (1-120)', minimum: 1, maximum: 120 })
  @IsInt()
  @Min(1)
  @Max(120)
  slotNumber: number;

  @ApiProperty({ description: 'Candidate UUID' })
  @IsUUID()
  candidateId: string;

  @ApiProperty({ description: 'Slot type', enum: KnessetSlotType })
  @IsEnum(KnessetSlotType)
  slotType: KnessetSlotType;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
