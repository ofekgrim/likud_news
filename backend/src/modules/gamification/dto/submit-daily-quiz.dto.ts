import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray } from 'class-validator';

export class SubmitDailyQuizDto {
  @ApiProperty({ description: 'Quiz UUID' })
  @IsUUID()
  quizId: string;

  @ApiProperty({
    description: 'Array of selected option indexes (0-based) per question',
    example: [0, 2, 1],
  })
  @IsArray()
  answers: number[];
}
