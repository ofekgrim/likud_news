import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsDateString,
  IsObject,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationScheduleType } from '../enums/notification.enums';
import { AudienceRulesDto } from './audience-rules.dto';

export class CreateNotificationScheduleDto {
  @IsUUID()
  templateId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsEnum(NotificationScheduleType)
  scheduleType: NotificationScheduleType;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cronExpression?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ValidateNested()
  @Type(() => AudienceRulesDto)
  audienceRules: AudienceRulesDto;

  @IsOptional()
  @IsObject()
  contextData?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
