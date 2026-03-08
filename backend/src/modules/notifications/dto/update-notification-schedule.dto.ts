import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationScheduleDto } from './create-notification-schedule.dto';

export class UpdateNotificationScheduleDto extends PartialType(
  CreateNotificationScheduleDto,
) {}
