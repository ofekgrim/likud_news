import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';

export class SubmitQuestionDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  questionText: string;
}
