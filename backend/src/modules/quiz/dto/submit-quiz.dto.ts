import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsArray,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuizAnswerDto {
  @ApiProperty({ description: 'Question UUID' })
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Selected option value', example: 3 })
  @IsNumber()
  selectedValue: number;

  @ApiProperty({ description: 'Importance level (1-3)', example: 2 })
  @IsNumber()
  importance: number;
}

export class SubmitQuizDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  @IsNotEmpty()
  electionId: string;

  @ApiProperty({
    description: 'User answers',
    type: [QuizAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
