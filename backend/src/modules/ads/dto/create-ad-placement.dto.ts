import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsObject,
  IsUrl,
  IsIn,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { AdPlacementType } from '../entities/candidate-ad-placement.entity';

export class CreateAdPlacementDto {
  @IsEnum(AdPlacementType)
  placementType: AdPlacementType;

  @IsString()
  title: string;

  @IsString()
  contentHe: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  targetingRules?: Record<string, unknown>;

  @IsNumber()
  @Min(1)
  dailyBudgetNis: number;

  @IsNumber()
  @Min(0.01)
  cpmNis: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(['article', 'poll', 'event', 'candidate', 'external'])
  linkedContentType?: string;

  @IsOptional()
  @IsUUID()
  linkedContentId?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  ctaUrl?: string;
}
