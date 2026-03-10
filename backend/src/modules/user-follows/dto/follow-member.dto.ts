import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FollowMemberDto {
  @ApiProperty({ description: 'Member UUID to follow' })
  @IsUUID()
  memberId: string;
}
