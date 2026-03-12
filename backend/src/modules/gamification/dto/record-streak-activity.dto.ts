import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum StreakActivityType {
  QUIZ_COMPLETE = 'quiz_complete',
  ARTICLE_READ = 'article_read',
  POLL_VOTE = 'poll_vote',
  SHARE_CONTENT = 'share_content',
  EVENT_RSVP = 'event_rsvp',
}

export const STREAK_ACTIVITY_XP: Record<StreakActivityType, number> = {
  [StreakActivityType.QUIZ_COMPLETE]: 20,
  [StreakActivityType.ARTICLE_READ]: 5,
  [StreakActivityType.POLL_VOTE]: 10,
  [StreakActivityType.SHARE_CONTENT]: 15,
  [StreakActivityType.EVENT_RSVP]: 25,
};

export class RecordStreakActivityDto {
  @ApiProperty({
    description: 'Type of qualifying streak activity',
    enum: StreakActivityType,
    example: StreakActivityType.QUIZ_COMPLETE,
  })
  @IsEnum(StreakActivityType)
  type: StreakActivityType;
}
