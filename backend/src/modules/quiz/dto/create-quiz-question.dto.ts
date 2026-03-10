import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';

export class CreateQuizQuestionDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  @IsOptional()
  electionId?: string;

  @ApiProperty({ description: 'Question text (Hebrew)' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiPropertyOptional({ description: 'Question text (English)' })
  @IsOptional()
  @IsString()
  questionTextEn?: string;

  @ApiProperty({
    description: 'Answer options',
    type: 'array',
    example: [
      { label: 'תומך בחום', value: 5 },
      { label: 'תומך', value: 4 },
      { label: 'ניטרלי', value: 3 },
      { label: 'מתנגד', value: 2 },
      { label: 'מתנגד בתוקף', value: 1 },
    ],
  })
  @IsArray()
  options: { label: string; labelEn?: string; value: number }[];

  @ApiPropertyOptional({
    description: 'Question importance level',
    default: 'medium',
  })
  @IsOptional()
  @IsString()
  importanceLevel?: string;

  @ApiPropertyOptional({ description: 'Question category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the question is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
