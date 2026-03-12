import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ description: 'Breaking news notifications', required: false })
  @IsOptional()
  @IsBoolean()
  notifBreakingNews?: boolean;

  @ApiProperty({ description: 'Primaries updates notifications', required: false })
  @IsOptional()
  @IsBoolean()
  notifPrimariesUpdates?: boolean;

  @ApiProperty({ description: 'Daily quiz reminder notifications', required: false })
  @IsOptional()
  @IsBoolean()
  notifDailyQuizReminder?: boolean;

  @ApiProperty({ description: 'Streak & achievements notifications', required: false })
  @IsOptional()
  @IsBoolean()
  notifStreakAchievements?: boolean;

  @ApiProperty({ description: 'Events & RSVP notifications', required: false })
  @IsOptional()
  @IsBoolean()
  notifEvents?: boolean;

  @ApiProperty({
    description: 'GOTV notifications (cannot be permanently disabled, only snoozed)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notifGotv?: boolean;

  @ApiProperty({ description: 'AMA session notifications', required: false })
  @IsOptional()
  @IsBoolean()
  notifAmaSessions?: boolean;

  @ApiProperty({
    description: 'Quiet hours start in HH:mm format (e.g. "22:00")',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursStart must be in HH:mm format (e.g. "22:00")',
  })
  quietHoursStart?: string | null;

  @ApiProperty({
    description: 'Quiet hours end in HH:mm format (e.g. "07:00")',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursEnd must be in HH:mm format (e.g. "07:00")',
  })
  quietHoursEnd?: string | null;
}

export class NotificationPreferencesResponseDto {
  notifBreakingNews: boolean;
  notifPrimariesUpdates: boolean;
  notifDailyQuizReminder: boolean;
  notifStreakAchievements: boolean;
  notifEvents: boolean;
  notifGotv: boolean;
  notifAmaSessions: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}
