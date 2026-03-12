import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch name (unique)', example: 'סניף תל אביב מרכז' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'District name', example: 'תל אביב' })
  @IsString()
  @MaxLength(100)
  district: string;

  @ApiPropertyOptional({ description: 'City name', example: 'תל אביב-יפו' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Initial member count', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  memberCount?: number;

  @ApiPropertyOptional({ description: 'Is branch active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
