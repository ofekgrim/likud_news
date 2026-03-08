import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationContentType } from '../enums/notification.enums';

export class TemplateVariableDto {
  @IsString()
  name: string;

  @IsBoolean()
  required: boolean;

  @IsString()
  description: string;
}

export class CreateNotificationTemplateDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(500)
  titleTemplate: string;

  @IsString()
  bodyTemplate: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrlTemplate?: string;

  @IsEnum(NotificationContentType)
  contentType: NotificationContentType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  triggerEvent?: string;

  @IsOptional()
  @IsBoolean()
  isAutoTrigger?: boolean;

  @IsOptional()
  @IsObject()
  defaultAudience?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateVariableDto)
  variables?: TemplateVariableDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
