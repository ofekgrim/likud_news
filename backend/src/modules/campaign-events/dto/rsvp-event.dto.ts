import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RsvpStatus } from '../entities/event-rsvp.entity';

export class RsvpEventDto {
  @ApiProperty({
    description: 'RSVP status',
    enum: RsvpStatus,
    example: RsvpStatus.GOING,
  })
  @IsEnum(RsvpStatus)
  status: RsvpStatus;
}
