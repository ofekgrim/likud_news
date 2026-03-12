import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizAnswer } from '../entities/member-quiz-response.entity';

export class ResponseItemDto {
  @ApiProperty({ description: 'Policy statement UUID' })
  @IsUUID()
  statementId: string;

  @ApiProperty({ enum: QuizAnswer, description: 'User answer' })
  @IsEnum(QuizAnswer)
  answer: QuizAnswer;

  @ApiPropertyOptional({
    description: 'Importance weight (0.5-3.0)',
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3.0)
  importanceWeight?: number;
}

export class SubmitResponsesDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({
    type: [ResponseItemDto],
    description: 'Array of answers to policy statements',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseItemDto)
  responses: ResponseItemDto[];
}
