import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumberString,
} from 'class-validator';
import { NotificationLogStatus } from '../enums/notification.enums';

export class QueryNotificationLogsDto {
  @IsOptional()
  @IsEnum(NotificationLogStatus)
  status?: NotificationLogStatus;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
