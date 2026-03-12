import { ApiProperty } from '@nestjs/swagger';
import { PolicyCategory } from '../entities/policy-statement.entity';

export class CandidateMatchDto {
  @ApiProperty({ description: 'Candidate UUID' })
  candidateId: string;

  @ApiProperty({ description: 'Candidate full name' })
  candidateName: string;

  @ApiProperty({ description: 'Candidate photo URL' })
  photoUrl: string;

  @ApiProperty({ description: 'Match percentage (0-100)' })
  matchPct: number;

  @ApiProperty({
    description: 'Breakdown by policy category',
    example: { security: 85.5, economy: 72.0 },
  })
  categoryBreakdown: Record<string, number>;
}

export class MatchResultResponseDto {
  @ApiProperty({ description: 'Election UUID' })
  electionId: string;

  @ApiProperty({ type: [CandidateMatchDto], description: 'Ranked match results' })
  matches: CandidateMatchDto[];

  @ApiProperty({ description: 'Total statements answered' })
  totalAnswered: number;

  @ApiProperty({ description: 'Total statements available' })
  totalStatements: number;

  @ApiProperty({ description: 'When the match was computed' })
  computedAt: string;
}
