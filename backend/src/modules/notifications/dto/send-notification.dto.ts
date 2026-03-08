import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AudienceRulesDto } from './audience-rules.dto';

export class SendAdvancedNotificationDto {
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ValidateNested()
  @Type(() => AudienceRulesDto)
  audience: AudienceRulesDto;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
