import {
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyCategory } from '../entities/policy-statement.entity';

export class CreatePolicyStatementDto {
  @ApiProperty({ description: 'Statement text in Hebrew' })
  @IsString()
  textHe: string;

  @ApiPropertyOptional({ description: 'Statement text in English' })
  @IsOptional()
  @IsString()
  textEn?: string;

  @ApiProperty({ enum: PolicyCategory, description: 'Policy category' })
  @IsEnum(PolicyCategory)
  category: PolicyCategory;

  @ApiPropertyOptional({
    description: 'Default importance weight (0.5-3.0)',
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3.0)
  defaultWeight?: number;

  @ApiPropertyOptional({ description: 'Whether statement is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;
}

export class UpdatePolicyStatementDto {
  @ApiPropertyOptional({ description: 'Statement text in Hebrew' })
  @IsOptional()
  @IsString()
  textHe?: string;

  @ApiPropertyOptional({ description: 'Statement text in English' })
  @IsOptional()
  @IsString()
  textEn?: string;

  @ApiPropertyOptional({ enum: PolicyCategory, description: 'Policy category' })
  @IsOptional()
  @IsEnum(PolicyCategory)
  category?: PolicyCategory;

  @ApiPropertyOptional({
    description: 'Default importance weight (0.5-3.0)',
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3.0)
  defaultWeight?: number;

  @ApiPropertyOptional({ description: 'Whether statement is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
