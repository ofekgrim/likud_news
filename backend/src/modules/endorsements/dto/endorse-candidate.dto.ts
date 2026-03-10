import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class EndorseCandidateDto {
  @ApiProperty({ description: 'Candidate UUID to endorse' })
  @IsUUID()
  @IsNotEmpty()
  candidateId: string;

  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  @IsNotEmpty()
  electionId: string;
}
