import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsArray, IsOptional, IsNumber, Min } from 'class-validator';

export class DailyQuizQuestionDto {
  @ApiProperty({ description: 'Question text (Hebrew)' })
  questionText: string;

  @ApiPropertyOptional({ description: 'Question text (English)' })
  questionTextEn?: string;

  @ApiProperty({ description: 'Answer options' })
  options: Array<{
    label: string;
    isCorrect: boolean;
  }>;

  @ApiPropertyOptional({ description: 'Linked article UUID' })
  linkedArticleId?: string;

  @ApiPropertyOptional({ description: 'Linked article slug' })
  linkedArticleSlug?: string;
}

export class CreateDailyQuizDto {
  @ApiProperty({ description: 'Quiz date (YYYY-MM-DD)', example: '2026-03-08' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Quiz questions', type: [DailyQuizQuestionDto] })
  @IsArray()
  questions: DailyQuizQuestionDto[];

  @ApiPropertyOptional({ description: 'Points reward for completing', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pointsReward?: number;
}
