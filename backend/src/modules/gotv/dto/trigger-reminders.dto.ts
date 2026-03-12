import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GotvReminderType {
  PRE_ELECTION_7D = 'pre_election_7d',
  PRE_ELECTION_3D = 'pre_election_3d',
  PRE_ELECTION_1D = 'pre_election_1d',
  ELECTION_DAY_MORNING = 'election_day_morning',
  ELECTION_DAY_NOON = 'election_day_noon',
  ELECTION_DAY_AFTERNOON = 'election_day_afternoon',
  POST_VOTE_THANK_YOU = 'post_vote_thank_you',
}

export class TriggerRemindersDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({
    description: 'Reminder type to trigger',
    enum: GotvReminderType,
  })
  @IsEnum(GotvReminderType)
  reminderType: GotvReminderType;
}
