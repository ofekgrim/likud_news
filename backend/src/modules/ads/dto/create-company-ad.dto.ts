import {
  IsEnum,
  IsString,
  IsOptional,
  IsUrl,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { CompanyAdType } from '../entities/company-ad.entity';

export class CreateCompanyAdDto {
  @IsEnum(CompanyAdType)
  adType: CompanyAdType;

  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  contentHe?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  ctaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ctaLabelHe?: string;

  @IsNumber()
  @Min(0)
  dailyBudgetNis: number;

  @IsNumber()
  @Min(0)
  cpmNis: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
