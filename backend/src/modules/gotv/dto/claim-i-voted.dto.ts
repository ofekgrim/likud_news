import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimIVotedDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;
}
